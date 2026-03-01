import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Gift, Users, Plus, Loader2, Clock, Eye } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { useSearchPublicFunds, PublicFundResult } from '@/hooks/useSearchPublicFunds';
import { useAuth } from '@/contexts/AuthContext';
import { differenceInDays, parseISO } from 'date-fns';

const OCCASION_FILTERS = [
  { value: 'birthday', label: 'Anniversaire' },
  { value: 'wedding', label: 'Mariage' },
  { value: 'promotion', label: 'Promotion' },
  { value: 'graduation', label: 'Diplôme' },
  { value: 'other', label: 'Autre' },
];

interface SearchExistingFundsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateNew: () => void;
}

export function SearchExistingFundsModal({ isOpen, onClose, onCreateNew }: SearchExistingFundsModalProps) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [query, setQuery] = useState('');
  const [selectedOccasion, setSelectedOccasion] = useState<string | undefined>();
  const { results, loading, searchFunds, clearResults } = useSearchPublicFunds(user?.id);

  const handleQueryChange = (value: string) => {
    setQuery(value);
    searchFunds(value, selectedOccasion);
  };

  const handleOccasionToggle = (occasion: string) => {
    const next = selectedOccasion === occasion ? undefined : occasion;
    setSelectedOccasion(next);
    searchFunds(query, next);
  };

  const handleContribute = (fund: PublicFundResult) => {
    onClose();
    navigate(`/collective-fund/${fund.id}`);
  };

  const handleCreateNew = () => {
    onClose();
    clearResults();
    setQuery('');
    setSelectedOccasion(undefined);
    onCreateNew();
  };

  const handleClose = () => {
    clearResults();
    setQuery('');
    setSelectedOccasion(undefined);
    onClose();
  };

  const progressPercent = (fund: PublicFundResult) => {
    if (!fund.target_amount || fund.target_amount === 0) return 0;
    return Math.min(100, Math.round((fund.current_amount / fund.target_amount) * 100));
  };

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('fr-FR').format(amount);
  };

  const getDaysRemaining = (deadline: string | null) => {
    if (!deadline) return null;
    const days = differenceInDays(parseISO(deadline), new Date());
    if (days < 0) return null;
    if (days === 0) return "Expire aujourd'hui";
    if (days === 1) return '1 jour restant';
    return `${days} jours restants`;
  };

  const hasSearched = query.trim().length >= 2 || !!selectedOccasion;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="sm:max-w-md max-h-[85vh] flex flex-col p-0">
        <DialogHeader className="px-6 pt-6 pb-2">
          <DialogTitle className="text-xl font-poppins">
            Rejoindre ou créer une cagnotte
          </DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground">
            Recherchez une cagnotte existante ou créez-en une nouvelle
          </DialogDescription>
        </DialogHeader>

        {/* Search Input */}
        <div className="px-6 pb-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Nom du bénéficiaire ou titre..."
              value={query}
              onChange={(e) => handleQueryChange(e.target.value)}
              className="pl-10"
              autoFocus
            />
          </div>
        </div>

        {/* Occasion filter chips */}
        <div className="px-6 pb-3 flex flex-wrap gap-1.5">
          {OCCASION_FILTERS.map((occ) => (
            <Badge
              key={occ.value}
              variant={selectedOccasion === occ.value ? 'default' : 'outline'}
              className="cursor-pointer text-xs select-none transition-colors"
              onClick={() => handleOccasionToggle(occ.value)}
            >
              {occ.label}
            </Badge>
          ))}
        </div>

        {/* Results Area */}
        <div className="flex-1 overflow-y-auto px-6 min-h-[200px]">
          {!hasSearched && (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <div className="p-4 rounded-full bg-primary/10 mb-4">
                <Gift className="h-8 w-8 text-primary" />
              </div>
              <p className="text-sm text-muted-foreground max-w-[280px]">
                Cherchez par nom de bénéficiaire ou titre de cagnotte, ou filtrez par occasion
              </p>
            </div>
          )}

          {loading && (
            <div className="flex items-center justify-center py-10">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          )}

          {hasSearched && !loading && results.length === 0 && (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <p className="text-sm text-muted-foreground mb-1">
                Aucune cagnotte trouvée
              </p>
              <p className="text-xs text-muted-foreground/70">
                Vous pouvez en créer une nouvelle ci-dessous
              </p>
            </div>
          )}

          {!loading && results.length > 0 && (
            <div className="space-y-3 pb-2">
              {results.map((fund) => {
                const daysRemaining = getDaysRemaining(fund.deadline_date);
                return (
                  <div
                    key={fund.id}
                    className="border border-border/60 rounded-xl p-3 hover:border-primary/30 transition-colors"
                  >
                    <div className="flex gap-3">
                      {fund.product_image_url ? (
                        <img
                          src={fund.product_image_url}
                          alt={fund.product_name || fund.title}
                          className="w-14 h-14 rounded-lg object-cover shrink-0"
                        />
                      ) : (
                        <div className="w-14 h-14 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                          <Gift className="h-6 w-6 text-primary" />
                        </div>
                      )}

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <h4 className="font-medium text-sm truncate">{fund.title}</h4>
                          {fund.isOwn && (
                            <Badge variant="secondary" className="text-[10px] shrink-0">
                              Votre cagnotte
                            </Badge>
                          )}
                        </div>
                        {fund.beneficiary_name && (
                          <p className="text-xs text-muted-foreground truncate">
                            Pour {fund.beneficiary_name}
                          </p>
                        )}
                        <div className="flex items-center gap-1.5 mt-1">
                          {fund.occasion && (
                            <Badge variant="secondary" className="text-[10px]">
                              {fund.occasion}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Progress */}
                    <div className="mt-3">
                      <div className="flex justify-between text-xs text-muted-foreground mb-1">
                        <span>{formatAmount(fund.current_amount)} / {formatAmount(fund.target_amount)} XOF</span>
                        <span>{progressPercent(fund)}%</span>
                      </div>
                      <Progress value={progressPercent(fund)} className="h-2" />
                      {daysRemaining && (
                        <div className="flex items-center gap-1 mt-1 text-[11px] text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          <span>{daysRemaining}</span>
                        </div>
                      )}
                    </div>

                    {/* Footer */}
                    <div className="flex items-center justify-between mt-3">
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Avatar className="h-5 w-5">
                          {fund.creator_avatar_url && (
                            <AvatarImage src={fund.creator_avatar_url} />
                          )}
                          <AvatarFallback className="text-[8px]">
                            {(fund.creator_first_name?.[0] || '') + (fund.creator_last_name?.[0] || '')}
                          </AvatarFallback>
                        </Avatar>
                        <span className="truncate max-w-[100px]">
                          {fund.creator_first_name} {fund.creator_last_name?.[0]}.
                        </span>
                        <span className="flex items-center gap-0.5">
                          <Users className="h-3 w-3" />
                          {fund.contributions_count}
                        </span>
                      </div>
                      <Button
                        size="sm"
                        className="h-7 text-xs"
                        variant={fund.isOwn ? 'outline' : 'default'}
                        onClick={() => handleContribute(fund)}
                      >
                        {fund.isOwn ? (
                          <>
                            <Eye className="h-3 w-3 mr-1" />
                            Voir
                          </>
                        ) : (
                          'Contribuer'
                        )}
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Fixed bottom button */}
        <div className="border-t px-6 py-4">
          <Button
            variant="outline"
            className="w-full gap-2"
            onClick={handleCreateNew}
          >
            <Plus className="h-4 w-4" />
            Créer une nouvelle cagnotte
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
