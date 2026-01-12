import { useState } from 'react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import {
  Users,
  Building2,
  Phone,
  Calendar,
  User,
  ChevronDown,
  ChevronUp,
  Merge,
  X,
  Eye,
  BookOpen,
  ShoppingBag,
  Heart,
  FileText,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { DuplicateGroup, DuplicateAccount } from '@/hooks/useDuplicateAccountsDashboard';

interface DuplicateGroupCardProps {
  group: DuplicateGroup;
  onMerge: (group: DuplicateGroup) => void;
  onDismiss: (groupId: string) => void;
  onView: (group: DuplicateGroup) => void;
}

const matchCriteriaLabels: Record<string, { label: string; icon: React.ReactNode }> = {
  phone: { label: 'Téléphone', icon: <Phone className="h-3 w-3" /> },
  first_name: { label: 'Prénom', icon: <User className="h-3 w-3" /> },
  birthday: { label: 'Anniversaire', icon: <Calendar className="h-3 w-3" /> },
  business_name: { label: 'Nom business', icon: <Building2 className="h-3 w-3" /> },
};

const confidenceColors: Record<string, string> = {
  high: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
  medium: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
  low: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
};

const confidenceLabels: Record<string, string> = {
  high: 'Haute',
  medium: 'Moyenne',
  low: 'Basse',
};

export function DuplicateGroupCard({ group, onMerge, onDismiss, onView }: DuplicateGroupCardProps) {
  const [expanded, setExpanded] = useState(false);
  const accounts = group.metadata?.accounts || [];

  const getTotalData = (account: DuplicateAccount) => {
    return Object.values(account.data_counts || {}).reduce((sum, n) => sum + (n || 0), 0);
  };

  const isPrimary = (userId: string) => userId === group.primary_user_id;

  return (
    <Card className="overflow-hidden">
      <CardContent className="p-4">
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${group.type === 'client' ? 'bg-primary/10' : 'bg-orange-100 dark:bg-orange-900/30'}`}>
              {group.type === 'client' ? (
                <Users className="h-5 w-5 text-primary" />
              ) : (
                <Building2 className="h-5 w-5 text-orange-600" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-medium">
                  {group.type === 'client' ? 'Clients' : 'Prestataires'}
                </span>
                <Badge variant="secondary" className="text-xs">
                  {accounts.length} comptes
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                {accounts.slice(0, 2).map(a => a.name).join(', ')}
                {accounts.length > 2 && `, +${accounts.length - 2}`}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Badge className={confidenceColors[group.confidence]}>
              {confidenceLabels[group.confidence]}
            </Badge>
          </div>
        </div>

        {/* Match criteria */}
        <div className="flex flex-wrap gap-1 mt-3">
          {group.match_criteria.map((criteria) => {
            const info = matchCriteriaLabels[criteria];
            return (
              <Badge key={criteria} variant="outline" className="text-xs gap-1">
                {info?.icon}
                {info?.label || criteria}
              </Badge>
            );
          })}
          <span className="text-xs text-muted-foreground ml-2">
            Détecté le {format(new Date(group.detected_at), 'dd MMM yyyy', { locale: fr })}
          </span>
        </div>

        {/* Expanded accounts list */}
        {expanded && (
          <div className="mt-4 space-y-2 border-t pt-4">
            {accounts.map((account) => (
              <div
                key={account.user_id}
                className={`flex items-center justify-between p-3 rounded-lg ${
                  isPrimary(account.user_id)
                    ? 'bg-primary/10 border border-primary/20'
                    : 'bg-muted/50'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="text-xs">
                      {account.name.slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm">{account.name}</span>
                      {isPrimary(account.user_id) && (
                        <Badge variant="default" className="text-xs">
                          Recommandé
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      {account.phone && (
                        <span className="flex items-center gap-1">
                          <Phone className="h-3 w-3" />
                          {account.phone}
                        </span>
                      )}
                      <span>
                        Créé le {format(new Date(account.created_at), 'dd/MM/yyyy')}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Data counts */}
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  {account.data_counts.contacts !== undefined && (
                    <span className="flex items-center gap-1" title="Contacts">
                      <BookOpen className="h-3 w-3" />
                      {account.data_counts.contacts}
                    </span>
                  )}
                  {account.data_counts.funds !== undefined && (
                    <span className="flex items-center gap-1" title="Cagnottes">
                      <Heart className="h-3 w-3" />
                      {account.data_counts.funds}
                    </span>
                  )}
                  {account.data_counts.posts !== undefined && (
                    <span className="flex items-center gap-1" title="Publications">
                      <FileText className="h-3 w-3" />
                      {account.data_counts.posts}
                    </span>
                  )}
                  {account.data_counts.products !== undefined && (
                    <span className="flex items-center gap-1" title="Produits">
                      <ShoppingBag className="h-3 w-3" />
                      {account.data_counts.products}
                    </span>
                  )}
                  {account.data_counts.orders !== undefined && (
                    <span className="flex items-center gap-1" title="Commandes">
                      <ShoppingBag className="h-3 w-3" />
                      {account.data_counts.orders}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-between mt-4 pt-3 border-t">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setExpanded(!expanded)}
            className="text-muted-foreground"
          >
            {expanded ? (
              <>
                <ChevronUp className="h-4 w-4 mr-1" />
                Réduire
              </>
            ) : (
              <>
                <ChevronDown className="h-4 w-4 mr-1" />
                Voir les comptes
              </>
            )}
          </Button>

          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onDismiss(group.id)}
            >
              <X className="h-4 w-4 mr-1" />
              Ignorer
            </Button>
            <Button
              variant="default"
              size="sm"
              onClick={() => onMerge(group)}
            >
              <Merge className="h-4 w-4 mr-1" />
              Fusionner
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
