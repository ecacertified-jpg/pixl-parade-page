import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.0';
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';
import { PDFDocument, StandardFonts, rgb } from 'https://esm.sh/pdf-lib@1.17.1';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SERVICE_ROLE = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const BUCKET = 'souvenir-books';

async function ensureBucket(admin: ReturnType<typeof createClient>) {
  const { data: list } = await admin.storage.listBuckets();
  if (!list?.some((b) => b.name === BUCKET)) {
    await admin.storage.createBucket(BUCKET, {
      public: false,
      fileSizeLimit: 52428800,
      allowedMimeTypes: ['application/pdf'],
    });
  }
}

async function fetchImage(url: string): Promise<Uint8Array | null> {
  try {
    const r = await fetch(url);
    if (!r.ok) return null;
    return new Uint8Array(await r.arrayBuffer());
  } catch {
    return null;
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) return new Response(JSON.stringify({ error: 'unauthorized' }), { status: 401, headers: corsHeaders });
    const token = authHeader.replace('Bearer ', '');
    const userClient = createClient(SUPABASE_URL, SERVICE_ROLE, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: userData } = await userClient.auth.getUser(token);
    const user = userData?.user;
    if (!user) return new Response(JSON.stringify({ error: 'unauthorized' }), { status: 401, headers: corsHeaders });

    const body = await req.json().catch(() => ({}));
    const year = Number(body.year ?? new Date().getFullYear());
    if (!Number.isInteger(year) || year < 2000 || year > 2100) {
      return new Response(JSON.stringify({ error: 'invalid_year' }), { status: 400, headers: corsHeaders });
    }

    const admin = createClient(SUPABASE_URL, SERVICE_ROLE);
    await ensureBucket(admin);

    // Mark book row as generating
    const { data: existing } = await admin
      .from('souvenir_books')
      .select('*')
      .eq('user_id', user.id)
      .eq('year', year)
      .maybeSingle();

    const bookId = existing?.id;
    if (existing && existing.status === 'generating') {
      return new Response(JSON.stringify({ id: existing.id, status: 'generating' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    if (existing) {
      await admin.from('souvenir_books').update({ status: 'generating', error_message: null }).eq('id', existing.id);
    } else {
      const ins = await admin
        .from('souvenir_books')
        .insert({ user_id: user.id, year, status: 'generating' })
        .select('id')
        .single();
      if (ins.error) throw ins.error;
    }

    // Fetch user's memories for the year (birthday + event photos owned by user)
    const yearStart = `${year}-01-01`;
    const yearEnd = `${year + 1}-01-01`;

    const { data: bdPages } = await admin
      .from('birthday_pages')
      .select('id, title, celebration_year')
      .eq('user_id', user.id);
    const bdIds = (bdPages ?? []).map((p: any) => p.id);
    const bdTitles = new Map((bdPages ?? []).map((p: any) => [p.id, p.title]));

    const { data: bdPhotos } = bdIds.length
      ? await admin
          .from('birthday_page_photos')
          .select('id, birthday_page_id, image_url, caption, created_at')
          .in('birthday_page_id', bdIds)
          .gte('created_at', yearStart)
          .lt('created_at', yearEnd)
      : { data: [] as any[] };

    const { data: evPages } = await admin
      .from('event_pages')
      .select('id, title')
      .eq('user_id', user.id);
    const evIds = (evPages ?? []).map((p: any) => p.id);
    const evTitles = new Map((evPages ?? []).map((p: any) => [p.id, p.title]));

    const { data: evPhotos } = evIds.length
      ? await admin
          .from('event_page_photos')
          .select('id, event_page_id, image_url, caption, created_at')
          .in('event_page_id', evIds)
          .gte('created_at', yearStart)
          .lt('created_at', yearEnd)
      : { data: [] as any[] };

    type Mem = { url: string; caption: string | null; title: string; createdAt: string };
    const memories: Mem[] = [
      ...(bdPhotos ?? [])
        .filter((p: any) => !!p.image_url)
        .map((p: any) => ({
          url: p.image_url,
          caption: p.caption,
          title: bdTitles.get(p.birthday_page_id) ?? 'Anniversaire',
          createdAt: p.created_at,
        })),
      ...(evPhotos ?? [])
        .filter((p: any) => !!p.image_url)
        .map((p: any) => ({
          url: p.image_url,
          caption: p.caption,
          title: evTitles.get(p.event_page_id) ?? 'Événement',
          createdAt: p.created_at,
        })),
    ].sort((a, b) => a.createdAt.localeCompare(b.createdAt));

    // Build PDF
    const pdf = await PDFDocument.create();
    const font = await pdf.embedFont(StandardFonts.HelveticaBold);
    const fontReg = await pdf.embedFont(StandardFonts.Helvetica);

    // Cover
    const cover = pdf.addPage([595, 842]);
    cover.drawRectangle({ x: 0, y: 0, width: 595, height: 842, color: rgb(0.93, 0.88, 0.96) });
    cover.drawText('Mon Livre Souvenir', { x: 60, y: 600, size: 36, font, color: rgb(0.3, 0.18, 0.55) });
    cover.drawText(String(year), { x: 60, y: 540, size: 72, font, color: rgb(0.48, 0.36, 0.78) });
    cover.drawText(`${memories.length} souvenir${memories.length > 1 ? 's' : ''}`, {
      x: 60, y: 480, size: 18, font: fontReg, color: rgb(0.3, 0.3, 0.3),
    });
    cover.drawText('JOIE DE VIVRE', { x: 60, y: 60, size: 10, font, color: rgb(0.5, 0.5, 0.5) });

    // One memory per page (max 50 to keep it reasonable)
    const pageCount = Math.min(memories.length, 50);
    for (let i = 0; i < pageCount; i++) {
      const mem = memories[i];
      const page = pdf.addPage([595, 842]);
      page.drawText(mem.title, { x: 50, y: 790, size: 14, font, color: rgb(0.3, 0.18, 0.55) });
      page.drawText(new Date(mem.createdAt).toLocaleDateString('fr-FR'), {
        x: 50, y: 770, size: 10, font: fontReg, color: rgb(0.45, 0.45, 0.45),
      });

      const bytes = await fetchImage(mem.url);
      if (bytes) {
        try {
          const isPng = mem.url.toLowerCase().includes('.png');
          const img = isPng ? await pdf.embedPng(bytes) : await pdf.embedJpg(bytes);
          const maxW = 495, maxH = 550;
          const ratio = Math.min(maxW / img.width, maxH / img.height);
          const w = img.width * ratio;
          const h = img.height * ratio;
          page.drawImage(img, { x: (595 - w) / 2, y: 180, width: w, height: h });
        } catch {
          // skip embed errors
        }
      }

      if (mem.caption) {
        const cap = mem.caption.slice(0, 200);
        page.drawText(cap, { x: 50, y: 140, size: 11, font: fontReg, color: rgb(0.2, 0.2, 0.2), maxWidth: 495, lineHeight: 14 });
      }
    }

    const pdfBytes = await pdf.save();
    const path = `${user.id}/livre-${year}.pdf`;
    const up = await admin.storage.from(BUCKET).upload(path, pdfBytes, {
      contentType: 'application/pdf',
      upsert: true,
    });
    if (up.error) throw up.error;

    const { data: signed } = await admin.storage.from(BUCKET).createSignedUrl(path, 60 * 60 * 24 * 365);

    await admin
      .from('souvenir_books')
      .update({
        status: 'ready',
        pdf_url: signed?.signedUrl ?? null,
        page_count: pageCount + 1,
        memory_count: memories.length,
        generated_at: new Date().toISOString(),
      })
      .eq('user_id', user.id)
      .eq('year', year);

    return new Response(JSON.stringify({ ok: true, pdf_url: signed?.signedUrl }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (e: any) {
    console.error('generate-souvenir-book error', e);
    try {
      const body = await req.clone().json().catch(() => ({}));
      const year = Number(body.year ?? new Date().getFullYear());
      const admin = createClient(SUPABASE_URL, SERVICE_ROLE);
      const authHeader = req.headers.get('Authorization') ?? '';
      const { data: userData } = await createClient(SUPABASE_URL, SERVICE_ROLE).auth.getUser(authHeader.replace('Bearer ', ''));
      if (userData?.user) {
        await admin
          .from('souvenir_books')
          .update({ status: 'failed', error_message: String(e?.message ?? e).slice(0, 500) })
          .eq('user_id', userData.user.id)
          .eq('year', year);
      }
    } catch {/* ignore */}
    return new Response(JSON.stringify({ error: e?.message ?? 'internal' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});