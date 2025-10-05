import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Heart, TrendingUp, Gift, PartyPopper, ChevronRight } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface SmartNotificationCardProps {
  notification: {
    id: string;
    title: string;
    message: string;
    smart_notification_category: string;
    priority_score: number;
    action_data: {
      action_type: string;
      friend_id?: string;
      friend_name?: string;
      contact_id?: string;
      contact_name?: string;
      fund_id?: string;
      [key: string]: any;
    };
    created_at: string;
  };
  onAction?: () => void;
}

export const SmartNotificationCard = ({ notification, onAction }: SmartNotificationCardProps) => {
  const navigate = useNavigate();

  const getCategoryConfig = (category: string) => {
    switch (category) {
      case 'balance_alert':
        return {
          icon: Heart,
          color: 'text-pink-500',
          bgColor: 'bg-pink-50 dark:bg-pink-950/20',
          borderColor: 'border-pink-200 dark:border-pink-800'
        };
      case 'domino_effect':
        return {
          icon: TrendingUp,
          color: 'text-green-500',
          bgColor: 'bg-green-50 dark:bg-green-950/20',
          borderColor: 'border-green-200 dark:border-green-800'
        };
      case 'gentle_reminder':
        return {
          icon: Gift,
          color: 'text-blue-500',
          bgColor: 'bg-blue-50 dark:bg-blue-950/20',
          borderColor: 'border-blue-200 dark:border-blue-800'
        };
      case 'collective_celebration':
        return {
          icon: PartyPopper,
          color: 'text-purple-500',
          bgColor: 'bg-purple-50 dark:bg-purple-950/20',
          borderColor: 'border-purple-200 dark:border-purple-800'
        };
      default:
        return {
          icon: Gift,
          color: 'text-primary',
          bgColor: 'bg-primary/5',
          borderColor: 'border-primary/20'
        };
    }
  };

  const config = getCategoryConfig(notification.smart_notification_category);
  const Icon = config.icon;

  const handleAction = () => {
    const { action_type, fund_id, contact_id } = notification.action_data;

    switch (action_type) {
      case 'view_friend_occasions':
        // Naviguer vers la page des occasions de l'ami
        navigate('/gifts');
        break;
      case 'create_fund':
        // Ouvrir le modal de création de cagnotte avec le contact pré-sélectionné
        // TODO: Implémenter l'ouverture du modal avec contact_id
        navigate('/gifts');
        break;
      case 'view_fund':
        // Naviguer vers les détails de la cagnotte
        navigate('/gifts');
        break;
      default:
        navigate('/gifts');
    }

    onAction?.();
  };

  const getPriorityLabel = (score: number): { label: string; color: 'default' | 'destructive' | 'secondary' } => {
    if (score >= 90) return { label: 'Très important', color: 'destructive' };
    if (score >= 70) return { label: 'Important', color: 'default' };
    return { label: 'Suggéré', color: 'secondary' };
  };

  const priority = getPriorityLabel(notification.priority_score);

  return (
    <Card className={`p-4 ${config.bgColor} border-2 ${config.borderColor} hover:shadow-md transition-shadow`}>
      <div className="flex items-start gap-3">
        {/* Icône */}
        <div className={`p-2 rounded-full ${config.bgColor}`}>
          <Icon className={`h-5 w-5 ${config.color}`} />
        </div>

        {/* Contenu */}
        <div className="flex-1 space-y-2">
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-semibold text-sm leading-tight">{notification.title}</h3>
            <Badge variant={priority.color} className="text-xs shrink-0">
              {priority.label}
            </Badge>
          </div>

          <p className="text-sm text-muted-foreground leading-relaxed">
            {notification.message}
          </p>

          {/* Métadonnées supplémentaires selon le type */}
          {notification.smart_notification_category === 'balance_alert' && notification.action_data.received_count && (
            <div className="text-xs text-muted-foreground">
              {notification.action_data.received_count} cadeau{notification.action_data.received_count > 1 ? 'x' : ''} reçu{notification.action_data.received_count > 1 ? 's' : ''}
            </div>
          )}

          {notification.smart_notification_category === 'gentle_reminder' && notification.action_data.days_until && (
            <div className="text-xs text-muted-foreground">
              Dans {notification.action_data.days_until} jour{notification.action_data.days_until > 1 ? 's' : ''}
            </div>
          )}

          {/* Bouton d'action */}
          <Button
            onClick={handleAction}
            size="sm"
            className="w-full mt-2"
            variant={notification.priority_score >= 70 ? "default" : "outline"}
          >
            <span className="flex-1 text-left">
              {notification.action_data.action_type === 'create_fund' && 'Créer une cagnotte'}
              {notification.action_data.action_type === 'view_friend_occasions' && 'Voir les occasions'}
              {notification.action_data.action_type === 'view_fund' && 'Voir la cagnotte'}
            </span>
            <ChevronRight className="h-4 w-4 ml-2" />
          </Button>
        </div>
      </div>
    </Card>
  );
};
