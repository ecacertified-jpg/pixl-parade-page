import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Loader2, Check, X, HelpCircle, PartyPopper, Heart } from 'lucide-react';
import { toast } from 'sonner';
import confetti from 'canvas-confetti';
import { CountdownWidget } from '@/components/event/CountdownWidget';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

type Rsvp = {
  guest_id: string;
  guest_name: string;
  rsvp_response: 'yes' | 'no' | 'maybe' | null;
  rsvp_plus_ones: number;
  rsvp_message: string | null;
  page_type: 'event' | 'birthday';
  page_id: string;
  event_title: string;
  event_date: string | null;
  event_slug: string;
  event_occasion: string;
  cover_image_url: string | null;
  dietary_preference: string | null;
  plus_one_names: string[] | null;
};

const occasionEmoji: Record<string, string> = {
  wedding: '💍', mariage_traditionnel: '💍', mariage_religieux: '⛪', mariage_civil: '📜',
  baptism: '👶', engagement: '💑', graduation: '🎓', promotion: '💼',
  birthday: '🎂', other: '🎊',
};

const DIETARY_OPTIONS = [
  { value: 'none', label: 'Aucune restriction' },
  { value: 'vegetarien', label: '🥗 Végétarien' },
  { value: 'vegan', label: '🌱 Vegan' },
  { value: 'sans_porc', label: '🚫🐖 Sans porc' },
  { value: 'halal', label: '☪️ Halal' },
  { value: 'sans_gluten', label: '🌾 Sans gluten' },
  { value: 'autre', label: '✍️ Autre (précisez)' },
];

const RsvpPage = () => {
  const { token } = useParams<{ token: string }>();
  const [data, setData] = useState<Rsvp | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [response, setResponse] = useState<'yes' | 'no' | 'maybe' | null>(null);
  const [plusOnes, setPlusOnes] = useState(0);
  const [message, setMessage] = useState('');
  const [dietaryKey, setDietaryKey] = useState<string>('none');
  const [dietaryCustom, setDietaryCustom] = useState('');
  const [plusOneNames, setPlusOneNames] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (!token) return;
    (async () => {
      const { data: rows, error } = await (supabase as any).rpc('get_rsvp_by_token', { _token: token });
      if (error || !rows || rows.length === 0) {
        setNotFound(true);
      } else {
        const r = rows[0] as Rsvp;
        setData(r);
        setResponse(r.rsvp_response);
        setPlusOnes(r.rsvp_plus_ones || 0);
        setMessage(r.rsvp_message || '');
        setPlusOneNames(r.plus_one_names || []);
        const diet = r.dietary_preference || '';
        const match = DIETARY_OPTIONS.find((o) => o.value === diet);
        if (match) { setDietaryKey(diet); setDietaryCustom(''); }
        else if (diet) { setDietaryKey('autre'); setDietaryCustom(diet); }
        else { setDietaryKey('none'); setDietaryCustom(''); }
      }
      setLoading(false);
    })();
  }, [token]);

  // Keep plusOneNames length in sync with plusOnes
  useEffect(() => {
    setPlusOneNames((prev) => {
      const next = [...prev];
      while (next.length < plusOnes) next.push('');
      next.length = plusOnes;
      return next;
    });
  }, [plusOnes]);

  const submit = async () => {
    if (!response || !token) return;
    setSubmitting(true);
    const dietary =
      response === 'yes'
        ? dietaryKey === 'none'
          ? null
          : dietaryKey === 'autre'
            ? dietaryCustom.trim() || null
            : dietaryKey
        : null;
    const names =
      response === 'yes'
        ? plusOneNames.map((n) => n.trim()).filter(Boolean)
        : [];
    const { data: ok, error } = await (supabase as any).rpc('submit_rsvp_by_token', {
      _token: token,
      _response: response,
      _plus_ones: plusOnes,
      _message: message.trim() || null,
      _dietary: dietary,
      _plus_one_names: names,
    });
    setSubmitting(false);
    if (error || !ok) {
      toast.error("Impossible d'enregistrer ta réponse");
      return;
    }
    setDone(true);
    if (response === 'yes') {
      confetti({ particleCount: 100, spread: 90, origin: { y: 0.5 }, colors: ['#a855f7', '#ec4899', '#f97316'] });
    }
    toast.success('Réponse enregistrée 💛');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-secondary/30 to-background">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  if (notFound || !data) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-6 text-center gap-4">
        <p className="text-5xl">🔍</p>
        <h1 className="font-poppins text-xl font-semibold">Invitation introuvable</h1>
        <p className="text-sm text-muted-foreground">Le lien est invalide ou expiré.</p>
        <Button asChild variant="outline"><Link to="/">Retour à l'accueil</Link></Button>
      </div>
    );
  }

  const eventUrl = data.page_type === 'event' ? `/event/${data.event_slug}` : `/birthday/${data.event_slug}`;
  const emoji = occasionEmoji[data.event_occasion] || '🎊';

  return (
    <div className="min-h-screen bg-gradient-to-b from-secondary/30 via-background to-background">
      <div className="max-w-md mx-auto px-4 py-8 space-y-5">
        <div className="text-center">
          <div className="text-5xl mb-2">{emoji}</div>
          <p className="text-xs uppercase tracking-wide text-muted-foreground font-nunito">Tu es invité(e)</p>
          <h1 className="font-poppins text-2xl font-bold mt-1">{data.event_title}</h1>
          <p className="text-sm text-muted-foreground font-nunito mt-1">
            Hé {data.guest_name.split(' ')[0]} 👋, ta présence compte pour nous.
          </p>
        </div>

        <CountdownWidget eventDate={data.event_date} occasionEmoji={emoji} />

        {done ? (
          <Card className="rounded-2xl p-6 text-center space-y-3">
            <PartyPopper className="h-10 w-10 text-primary mx-auto" />
            <h2 className="font-poppins text-lg font-semibold">Merci pour ta réponse !</h2>
            <p className="text-sm text-muted-foreground">
              {response === 'yes' && 'On a hâte de te voir ! 💛'}
              {response === 'maybe' && 'On te tient une place au chaud.'}
              {response === 'no' && 'Merci de nous avoir prévenus, on pense fort à toi.'}
            </p>
            <Button asChild variant="outline" className="w-full">
              <Link to={eventUrl}>Voir la page de l'événement</Link>
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setDone(false)}>
              Modifier ma réponse
            </Button>
          </Card>
        ) : (
          <Card className="rounded-2xl p-5 space-y-4">
            <div>
              <p className="text-sm font-medium mb-2">Seras-tu présent(e) ?</p>
              <div className="grid grid-cols-3 gap-2">
                <Button
                  variant={response === 'yes' ? 'default' : 'outline'}
                  onClick={() => setResponse('yes')}
                  className="flex-col h-auto py-3"
                >
                  <Check className="h-5 w-5 mb-1" /> Oui
                </Button>
                <Button
                  variant={response === 'maybe' ? 'default' : 'outline'}
                  onClick={() => setResponse('maybe')}
                  className="flex-col h-auto py-3"
                >
                  <HelpCircle className="h-5 w-5 mb-1" /> Peut-être
                </Button>
                <Button
                  variant={response === 'no' ? 'default' : 'outline'}
                  onClick={() => setResponse('no')}
                  className="flex-col h-auto py-3"
                >
                  <X className="h-5 w-5 mb-1" /> Non
                </Button>
              </div>
            </div>

            {response === 'yes' && (
              <div>
                <label className="text-sm font-medium block mb-1">
                  Tu viens accompagné(e) ?
                </label>
                <Input
                  type="number"
                  min={0}
                  max={10}
                  value={plusOnes}
                  onChange={(e) => setPlusOnes(Math.max(0, Math.min(10, parseInt(e.target.value || '0', 10))))}
                />
                <p className="text-xs text-muted-foreground mt-1">Nombre de personnes en plus de toi.</p>
              </div>
            )}

            {response === 'yes' && plusOnes > 0 && (
              <div className="space-y-2">
                <label className="text-sm font-medium block">
                  Prénoms des accompagnant(e)s
                </label>
                {plusOneNames.map((n, i) => (
                  <Input
                    key={i}
                    value={n}
                    maxLength={60}
                    placeholder={`Accompagnant ${i + 1}`}
                    onChange={(e) => {
                      const next = [...plusOneNames];
                      next[i] = e.target.value;
                      setPlusOneNames(next);
                    }}
                  />
                ))}
              </div>
            )}

            {response === 'yes' && (
              <div>
                <label className="text-sm font-medium block mb-1">
                  Régime alimentaire 🍽️
                </label>
                <Select value={dietaryKey} onValueChange={setDietaryKey}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {DIETARY_OPTIONS.map((o) => (
                      <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {dietaryKey === 'autre' && (
                  <Input
                    className="mt-2"
                    placeholder="Précisez (allergie, intolérance…)"
                    maxLength={120}
                    value={dietaryCustom}
                    onChange={(e) => setDietaryCustom(e.target.value)}
                  />
                )}
              </div>
            )}

            <div>
              <label className="text-sm font-medium block mb-1">
                Petit mot (optionnel) <Heart className="inline h-3 w-3 text-rose-500" />
              </label>
              <Textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Un petit message pour les organisateurs…"
                maxLength={500}
                className="resize-none"
              />
            </div>

            <Button
              size="lg"
              className="w-full"
              onClick={submit}
              disabled={!response || submitting}
            >
              {submitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Envoyer ma réponse
            </Button>
          </Card>
        )}

        <p className="text-center text-xs text-muted-foreground">
          Propulsé par <Link to="/" className="text-primary font-medium">JOIE DE VIVRE</Link>
        </p>
      </div>
    </div>
  );
};

export default RsvpPage;