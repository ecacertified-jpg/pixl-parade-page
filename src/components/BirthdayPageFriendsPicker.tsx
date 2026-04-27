import { useEffect, useMemo, useState } from 'react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card } from '@/components/ui/card';
import { Info, Loader2, Search, MessageCircle, UserPlus } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { AddFriendModal } from '@/components/AddFriendModal';
import {
  getStoredFriendSelection,
  setStoredFriendSelection,
} from '@/hooks/useBirthdayPageBuilderStatus';

interface BirthdayPageFriendsPickerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pageId?: string | null;
  onSaved?: () => void;
}

interface ContactRow {
  id: string;
  name: string;
  phone: string | null;
  avatar_url: string | null;
}

export function BirthdayPageFriendsPicker({
  open,
  onOpenChange,
  pageId,
  onSaved,
}: BirthdayPageFriendsPickerProps) {
  const { user } = useAuth();
  const [contacts, setContacts] = useState<ContactRow[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showAddFriendModal, setShowAddFriendModal] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  // Load contacts + initial selection
  useEffect(() => {
    if (!open || !user?.id) return;
    let cancelled = false;
    setLoading(true);

    (async () => {
      // All user's contacts (book de contacts personnel)
      const { data: contactsData } = await supabase
        .from('contacts')
        .select('id, name, phone, avatar_url')
        .eq('user_id', user.id)
        .order('name', { ascending: true });

      if (cancelled) return;
      setContacts((contactsData || []) as ContactRow[]);

      // Initial selection: prefer DB if pageId, else localStorage
      let initial: string[] = [];
      if (pageId) {
        const { data: linked } = await supabase
          .from('birthday_page_friends')
          .select('contact_id')
          .eq('page_id', pageId);
        initial = (linked || [])
          .map((r: any) => r.contact_id)
          .filter(Boolean) as string[];
      }
      if (initial.length === 0) {
        initial = getStoredFriendSelection(user.id);
      }
      if (!cancelled) setSelected(initial);
      if (!cancelled) setLoading(false);
    })();

    return () => {
      cancelled = true;
    };
  }, [open, user?.id, pageId, refreshKey]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return contacts;
    return contacts.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        (c.phone || '').toLowerCase().includes(q),
    );
  }, [contacts, search]);

  const toggle = (id: string) => {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  };

  const handleSave = async () => {
    if (!user?.id) return;
    setSaving(true);
    try {
      // Always persist locally (for steps before publish)
      setStoredFriendSelection(user.id, selected);

      // If page exists, sync to DB
      if (pageId) {
        // Wipe and re-insert (simple, owner-only via RLS)
        await supabase
          .from('birthday_page_friends')
          .delete()
          .eq('page_id', pageId);

        if (selected.length > 0) {
          const rows = selected.map((cid) => ({
            page_id: pageId,
            contact_id: cid,
            added_by: user.id,
          }));
          const { error } = await supabase
            .from('birthday_page_friends')
            .insert(rows);
          if (error) throw error;
        }
      }

      toast.success(
        selected.length > 0
          ? `${selected.length} ami${selected.length > 1 ? 's' : ''} associé${selected.length > 1 ? 's' : ''} ✨`
          : 'Sélection enregistrée',
      );
      onSaved?.();
      onOpenChange(false);
    } catch (e: any) {
      console.error(e);
      toast.error("Impossible d'enregistrer la sélection");
    } finally {
      setSaving(false);
    }
  };

  const handleAddFriend = async (newFriend: {
    name: string;
    phone: string;
    relation: string;
    location: string;
    birthday: Date;
  }) => {
    if (!user?.id) return;
    try {
      // 1. Look up existing user by phone to create relationship
      const { data: existingUser } = await supabase
        .from('profiles')
        .select('user_id')
        .eq('phone', newFriend.phone)
        .maybeSingle();

      if (existingUser?.user_id && existingUser.user_id !== user.id) {
        await supabase.from('contact_relationships').insert({
          user_a: user.id,
          user_b: existingUser.user_id,
          can_see_funds: true,
          relationship_type: 'friend',
        });
      }

      // 2. Insert the contact
      const birthdayStr = (() => {
        const d =
          newFriend.birthday instanceof Date
            ? newFriend.birthday
            : new Date(newFriend.birthday);
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      })();

      const { data: insertedContact, error } = await supabase
        .from('contacts')
        .insert({
          user_id: user.id,
          name: newFriend.name,
          phone: newFriend.phone,
          relationship: newFriend.relation,
          notes: newFriend.location,
          birthday: birthdayStr,
        })
        .select('id')
        .single();

      if (error) throw error;

      // 3. Pre-select the new contact and refresh list
      if (insertedContact?.id) {
        setSelected((prev) =>
          prev.includes(insertedContact.id) ? prev : [...prev, insertedContact.id],
        );
      }
      setRefreshKey((k) => k + 1);
      setShowAddFriendModal(false);
      toast.success(`${newFriend.name} ajouté à ton cercle ✨`);
    } catch (e: any) {
      console.error(e);
      toast.error("Impossible d'ajouter cet ami");
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className="rounded-t-3xl p-0 h-[90vh] max-h-[700px] flex flex-col"
      >
        <SheetHeader className="px-5 pt-5 pb-3 border-b border-border/40">
          <div className="flex items-start justify-between gap-3 pr-6">
            <SheetTitle className="text-left">Associer mes amis à ma page</SheetTitle>
            <Button
              size="sm"
              variant="outline"
              className="gap-1.5 h-8 text-xs shrink-0"
              onClick={() => setShowAddFriendModal(true)}
            >
              <UserPlus className="h-3.5 w-3.5" />
              Ajouter
            </Button>
          </div>
          <SheetDescription className="text-xs text-left">
            Sélectionne les personnes que tu veux associer à ta page
            d'anniversaire.
          </SheetDescription>
        </SheetHeader>

        <div className="px-5 pt-4 space-y-3">
          <Card className="p-3 bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-900/40">
            <div className="flex gap-2">
              <Info className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
              <p className="text-xs text-amber-900 dark:text-amber-200 leading-relaxed">
                Les amis associés recevront automatiquement une notification
                <span className="inline-flex items-center gap-1 mx-1 font-medium">
                  <MessageCircle className="h-3 w-3" /> WhatsApp
                </span>
                pour ton anniversaire et des rappels J-7, J-3 et le jour J.
              </p>
            </div>
          </Card>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Rechercher un ami…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 h-10"
            />
          </div>
        </div>

        <ScrollArea className="flex-1 px-5 py-3">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-10 px-4">
              <p className="text-sm text-muted-foreground">
                {contacts.length === 0
                  ? "Tu n'as pas encore de contacts. Ajoute des amis depuis ton dashboard pour les associer ici."
                  : 'Aucun contact ne correspond à ta recherche.'}
              </p>
            </div>
          ) : (
            <div className="space-y-1.5 pb-2">
              {filtered.map((c) => {
                const isSelected = selected.includes(c.id);
                const initial = c.name.charAt(0).toUpperCase();
                const hasWhatsApp = !!c.phone;
                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => toggle(c.id)}
                    className={`w-full flex items-center gap-3 p-2.5 rounded-xl border transition-colors text-left ${
                      isSelected
                        ? 'border-primary bg-primary/5'
                        : 'border-border/50 hover:bg-muted/40'
                    }`}
                  >
                    <Checkbox checked={isSelected} className="pointer-events-none" />
                    <Avatar className="h-9 w-9">
                      <AvatarImage src={c.avatar_url || undefined} />
                      <AvatarFallback className="bg-primary/10 text-primary text-xs font-medium">
                        {initial}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{c.name}</p>
                      {c.phone && (
                        <p className="text-[11px] text-muted-foreground truncate">
                          {c.phone}
                        </p>
                      )}
                    </div>
                    {hasWhatsApp && (
                      <Badge
                        variant="secondary"
                        className="text-[10px] gap-0.5 bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300"
                      >
                        <MessageCircle className="h-2.5 w-2.5" />
                        WhatsApp
                      </Badge>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </ScrollArea>

        <div className="px-5 py-3 border-t border-border/40 bg-background">
          <Button
            className="w-full h-11"
            onClick={handleSave}
            disabled={saving || loading}
          >
            {saving ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : null}
            Enregistrer ({selected.length} sélectionné
            {selected.length > 1 ? 's' : ''})
          </Button>
        </div>

        <AddFriendModal
          isOpen={showAddFriendModal}
          onClose={() => setShowAddFriendModal(false)}
          onAddFriend={handleAddFriend}
          existingPhones={contacts.map((c) => c.phone || '').filter(Boolean)}
        />
      </SheetContent>
    </Sheet>
  );
}