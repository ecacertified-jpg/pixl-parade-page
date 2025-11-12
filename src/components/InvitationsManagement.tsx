import { useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useInvitations } from "@/hooks/useInvitations";
import { Skeleton } from "@/components/ui/skeleton";
import { Mail, Clock, CheckCircle, XCircle, RefreshCw, Trash2, Users } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";

export function InvitationsManagement() {
  const { invitations, loading, fetchInvitations, resendInvitation, deleteInvitation } = useInvitations();

  useEffect(() => {
    fetchInvitations();
  }, []);

  if (loading && invitations.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            Mes invitations
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center justify-between p-3 border rounded-lg">
              <Skeleton className="h-4 w-48" />
              <Skeleton className="h-8 w-24" />
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  if (invitations.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            Mes invitations
          </CardTitle>
          <CardDescription>
            Vous n'avez pas encore envoyé d'invitations
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <Mail className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>Invitez vos amis à rejoindre Joie de Vivre !</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return (
          <Badge variant="outline" className="gap-1">
            <Clock className="w-3 h-3" />
            En attente
          </Badge>
        );
      case "accepted":
        return (
          <Badge variant="default" className="gap-1 bg-green-500">
            <CheckCircle className="w-3 h-3" />
            Acceptée
          </Badge>
        );
      case "expired":
        return (
          <Badge variant="destructive" className="gap-1">
            <XCircle className="w-3 h-3" />
            Expirée
          </Badge>
        );
      default:
        return null;
    }
  };

  const pendingCount = invitations.filter((i) => i.status === "pending").length;
  const acceptedCount = invitations.filter((i) => i.status === "accepted").length;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="w-5 h-5" />
          Mes invitations
        </CardTitle>
        <CardDescription>
          {acceptedCount} acceptée{acceptedCount > 1 ? "s" : ""} • {pendingCount} en attente
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {invitations.map((invitation) => {
            const isExpired = new Date(invitation.expires_at) < new Date();
            const isPending = invitation.status === "pending" && !isExpired;

            return (
              <div
                key={invitation.id}
                className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <Mail className="w-4 h-4 text-muted-foreground shrink-0" />
                    <p className="font-medium truncate">{invitation.invitee_email}</p>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    {getStatusBadge(invitation.status)}
                    <span>•</span>
                    <span>
                      Envoyée{" "}
                      {formatDistanceToNow(new Date(invitation.invited_at), {
                        addSuffix: true,
                        locale: fr,
                      })}
                    </span>
                  </div>
                  {invitation.message && (
                    <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                      Message: "{invitation.message}"
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-2 ml-4">
                  {isPending && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => resendInvitation(invitation.id)}
                      disabled={loading}
                    >
                      <RefreshCw className="w-4 h-4 mr-1" />
                      Renvoyer
                    </Button>
                  )}
                  {(isPending || isExpired) && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => deleteInvitation(invitation.id)}
                      disabled={loading}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
