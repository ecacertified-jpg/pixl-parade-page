import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { Loader2, ArrowLeft, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import confetti from "canvas-confetti";

const occasions = [
  { key: 'birthday', emoji: '🎂', label: "Anniversaire d'un proche" },
  { key: 'wedding', emoji: '💍', label: 'Mariage' },
  { key: 'mariage_traditionnel', emoji: '💍', label: 'Mariage traditionnel' },
  { key: 'mariage_religieux', emoji: '⛪', label: 'Mariage religieux' },
  { key: 'mariage_civil', emoji: '📜', label: 'Mariage civil' },
  { key: 'baptism', emoji: '👶', label: 'Baptême' },
  { key: 'engagement', emoji: '💑', label: 'Fiançailles' },
  { key: 'graduation', emoji: '🎓', label: 'Diplôme' },
  { key: 'promotion', emoji: '💼', label: 'Promotion' },
  { key: 'reussite_academique', emoji: '🎓', label: 'Réussite académique' },
  { key: 'reussite_scolaire', emoji: '📚', label: 'Réussite scolaire' },
  { key: 'promotion_pro', emoji: '🏆', label: 'Promotion pro' },
  { key: 'other', emoji: '🎊', label: 'Autre' },
];

const CreateEventPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [occasion, setOccasion] = useState(searchParams.get('occasion') || 'wedding');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [eventDate, setEventDate] = useState('');
  const [spouseFirstName, setSpouseFirstName] = useState('');
  const [creating, setCreating] = useState(false);

  const isWedding = occasion.includes('mariage') || occasion === 'wedding';

  useEffect(() => {
    if (!user) navigate('/auth?redirect=/event/create');
  }, [user]);

  const handleCreate = async () => {
    if (!user || !title.trim()) { toast.error('Le titre est obligatoire'); return; }
    setCreating(true);
    try {
      const slug = `${occasion}-${user.id.slice(0, 8)}-${Date.now().toString(36)}`;
      const { data, error } = await supabase.from('event_pages').insert({
        creator_id: user.id,
        occasion,
        title: title.trim(),
        description: description.trim() || null,
        slug,
        event_date: eventDate || null,
        is_active: true,
        spouse_first_name: isWedding && spouseFirstName.trim() ? spouseFirstName.trim() : null,
      }).select('slug').single();

      if (error) throw error;

      confetti({ particleCount: 80, spread: 100, origin: { y: 0.5 }, colors: ['#a855f7', '#ec4899', '#f97316', '#22c55e'] });
      toast.success('Page créée ! 🎉');
      navigate(`/event/${data.slug}`);
    } catch (err) {
      console.error(err);
      toast.error("Erreur lors de la création");
    } finally { setCreating(false); }
  };

  const selectedOccasion = occasions.find(o => o.key === occasion);

  return (
    <div className="min-h-screen bg-gradient-to-b from-secondary/30 via-background to-background">
      <div className="max-w-lg mx-auto px-4 py-8">
        <Button variant="ghost" size="sm" className="mb-4" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-4 w-4 mr-1" /> Retour
        </Button>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="text-center mb-6">
            <div className="text-5xl mb-3">{selectedOccasion?.emoji || '🎊'}</div>
            <h1 className="text-2xl font-bold font-poppins">Crée ta page événement</h1>
            <p className="text-muted-foreground font-nunito mt-1">Célèbre chaque moment avec tes proches !</p>
          </div>

          <Card className="p-6 space-y-5">
            {/* Occasion selector */}
            <div>
              <label className="text-sm font-medium mb-2 block">Type d'événement</label>
              <div className="flex flex-wrap gap-2">
                {occasions.map(o => (
                  <button
                    key={o.key}
                    onClick={() => setOccasion(o.key)}
                    className={cn(
                      "px-3 py-2 rounded-full text-sm font-medium transition-all border",
                      occasion === o.key
                        ? "bg-primary text-primary-foreground border-primary shadow-md scale-105"
                        : "bg-muted text-muted-foreground border-transparent hover:bg-muted/80"
                    )}
                  >
                    {o.emoji} {o.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Title */}
            <div>
              <label className="text-sm font-medium mb-2 block">Titre de la page *</label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder={occasion === 'wedding' ? 'Mariage de Aya & Koffi' : occasion === 'graduation' ? 'Diplôme de Aminata' : 'Mon événement'}
                maxLength={100}
              />
            </div>

            {/* Description */}
            <div>
              <label className="text-sm font-medium mb-2 block">Description (optionnel)</label>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Décris ton événement..."
                className="resize-none"
                maxLength={500}
              />
            </div>

            {/* Date */}
            <div>
              <label className="text-sm font-medium mb-2 block">Date de l'événement (optionnel)</label>
              <Input type="date" value={eventDate} onChange={(e) => setEventDate(e.target.value)} />
            </div>

            {isWedding && (
              <div>
                <label className="text-sm font-medium mb-2 block">Prénom du/de la conjoint(e) (optionnel)</label>
                <Input
                  value={spouseFirstName}
                  onChange={(e) => setSpouseFirstName(e.target.value)}
                  placeholder="Ex : Aya"
                  maxLength={50}
                />
                <p className="text-xs text-muted-foreground mt-1">Affichera 2 prénoms sur la page de mariage.</p>
              </div>
            )}

            <Button className="w-full" size="lg" disabled={!title.trim() || creating} onClick={handleCreate}>
              {creating ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Sparkles className="h-4 w-4 mr-2" />}
              Créer la page
            </Button>
          </Card>
        </motion.div>
      </div>
    </div>
  );
};

export default CreateEventPage;
