import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Users, ArrowRight, Scale } from 'lucide-react';
import { ReciprocityRelation } from '@/hooks/useReciprocityHistory';

interface ReciprocityRelationsSectionProps {
  relations: ReciprocityRelation[];
}

export function ReciprocityRelationsSection({ relations }: ReciprocityRelationsSectionProps) {
  const getRelationColor = (type: string) => {
    switch (type) {
      case 'balanced':
        return 'bg-green-500';
      case 'mostly_giving':
        return 'bg-blue-500';
      case 'mostly_receiving':
        return 'bg-orange-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getRelationLabel = (type: string) => {
    switch (type) {
      case 'balanced':
        return 'Équilibré';
      case 'mostly_giving':
        return 'Vous donnez plus';
      case 'mostly_receiving':
        return 'Vous recevez plus';
      default:
        return 'Inconnu';
    }
  };

  const getBalancePercentage = (relation: ReciprocityRelation) => {
    const total = relation.given_amount + relation.received_amount;
    if (total === 0) return 50;
    return (relation.given_amount / total) * 100;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          Relations d'Échange
        </CardTitle>
        <CardDescription>
          Analyse de vos interactions avec votre réseau
        </CardDescription>
      </CardHeader>

      <CardContent>
        <ScrollArea className="h-[500px] pr-4">
          {relations.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Users className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>Aucune relation d'échange pour le moment</p>
              <p className="text-sm mt-1">
                Commencez à contribuer pour voir vos relations
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {relations.map((relation) => (
                <div
                  key={relation.user_id}
                  className="border rounded-lg p-4 space-y-3 hover:bg-muted/50 transition-colors"
                >
                  {/* User Info */}
                  <div className="flex items-center gap-3">
                    <Avatar>
                      <AvatarImage src={relation.avatar_url || undefined} />
                      <AvatarFallback>
                        {relation.user_name.split(' ').map(n => n[0]).join('').toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold truncate">{relation.user_name}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge
                          variant="outline"
                          className={`${getRelationColor(relation.relationship_type)} text-white border-0`}
                        >
                          {getRelationLabel(relation.relationship_type)}
                        </Badge>
                        <Scale className="h-3 w-3 text-muted-foreground" />
                      </div>
                    </div>
                  </div>

                  {/* Balance Visualization */}
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <div className="text-muted-foreground">
                        Donné: <span className="font-semibold text-foreground">
                          {relation.given_amount.toLocaleString()} XOF
                        </span>
                      </div>
                      <div className="text-muted-foreground">
                        Reçu: <span className="font-semibold text-foreground">
                          {relation.received_amount.toLocaleString()} XOF
                        </span>
                      </div>
                    </div>
                    <Progress value={getBalancePercentage(relation)} className="h-2" />
                  </div>

                  {/* Stats */}
                  <div className="grid grid-cols-2 gap-3 pt-2 border-t">
                    <div className="text-center">
                      <p className="text-xs text-muted-foreground">Contributions données</p>
                      <p className="text-lg font-bold text-primary">{relation.given_count}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-xs text-muted-foreground">Contributions reçues</p>
                      <p className="text-lg font-bold text-green-600 dark:text-green-400">
                        {relation.received_count}
                      </p>
                    </div>
                  </div>

                  {/* Balance Amount */}
                  {Math.abs(relation.balance) > 0 && (
                    <div className="text-center pt-2 border-t">
                      <p className="text-xs text-muted-foreground mb-1">
                        {relation.balance > 0 ? 'Vous avez donné' : 'Vous avez reçu'} en plus
                      </p>
                      <p className={`text-lg font-bold ${
                        relation.balance > 0 
                          ? 'text-blue-600 dark:text-blue-400' 
                          : 'text-orange-600 dark:text-orange-400'
                      }`}>
                        {Math.abs(relation.balance).toLocaleString()} XOF
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
