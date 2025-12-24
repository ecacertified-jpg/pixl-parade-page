import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAdminReportPreferences, ReportType } from '@/hooks/useAdminReportPreferences';
import { useAuth } from '@/contexts/AuthContext';
import { 
  Loader2, 
  Mail, 
  Clock, 
  Calendar, 
  CalendarDays, 
  CheckCircle2, 
  XCircle, 
  AlertCircle,
  Send,
  History
} from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

export function AdminReportSettings() {
  const { user } = useAuth();
  const { 
    preferences, 
    logs, 
    loading, 
    saving, 
    sendingTest,
    savePreferences, 
    sendTestReport 
  } = useAdminReportPreferences();

  const [reportTypes, setReportTypes] = useState<ReportType[]>([]);
  const [emailOverride, setEmailOverride] = useState('');
  const [useCustomEmail, setUseCustomEmail] = useState(false);
  const [includeKpis, setIncludeKpis] = useState(true);
  const [includeChartsSummary, setIncludeChartsSummary] = useState(true);
  const [includeAlerts, setIncludeAlerts] = useState(true);
  const [includeTopPerformers, setIncludeTopPerformers] = useState(true);
  const [isActive, setIsActive] = useState(true);
  const [testReportType, setTestReportType] = useState<ReportType>('daily');
  const [testEmail, setTestEmail] = useState('');

  // Load preferences when available
  useEffect(() => {
    if (preferences) {
      setReportTypes(preferences.report_types || []);
      setEmailOverride(preferences.email_override || '');
      setUseCustomEmail(!!preferences.email_override);
      setIncludeKpis(preferences.include_kpis);
      setIncludeChartsSummary(preferences.include_charts_summary);
      setIncludeAlerts(preferences.include_alerts);
      setIncludeTopPerformers(preferences.include_top_performers);
      setIsActive(preferences.is_active);
    }
    if (user?.email) {
      setTestEmail(user.email);
    }
  }, [preferences, user]);

  const handleToggleReportType = (type: ReportType) => {
    setReportTypes(prev => 
      prev.includes(type) 
        ? prev.filter(t => t !== type)
        : [...prev, type]
    );
  };

  const handleSave = () => {
    savePreferences({
      report_types: reportTypes,
      email_override: useCustomEmail ? emailOverride : null,
      include_kpis: includeKpis,
      include_charts_summary: includeChartsSummary,
      include_alerts: includeAlerts,
      include_top_performers: includeTopPerformers,
      is_active: isActive
    });
  };

  const handleSendTest = () => {
    if (testEmail) {
      sendTestReport(testReportType, testEmail);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'sent':
        return <Badge className="bg-green-100 text-green-800"><CheckCircle2 className="w-3 h-3 mr-1" />Envoyé</Badge>;
      case 'partial':
        return <Badge className="bg-yellow-100 text-yellow-800"><AlertCircle className="w-3 h-3 mr-1" />Partiel</Badge>;
      case 'failed':
        return <Badge className="bg-red-100 text-red-800"><XCircle className="w-3 h-3 mr-1" />Échoué</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getReportTypeLabel = (type: string) => {
    switch (type) {
      case 'daily': return 'Quotidien';
      case 'weekly': return 'Hebdomadaire';
      case 'monthly': return 'Mensuel';
      default: return type;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-48">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Subscription Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Abonnement aux rapports
          </CardTitle>
          <CardDescription>
            Choisissez les rapports que vous souhaitez recevoir par email
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Active Toggle */}
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Activer les rapports automatiques</Label>
              <p className="text-sm text-muted-foreground">
                Recevoir les rapports par email selon la fréquence choisie
              </p>
            </div>
            <Switch checked={isActive} onCheckedChange={setIsActive} />
          </div>

          <Separator />

          {/* Report Types */}
          <div className="space-y-4">
            <Label>Fréquence des rapports</Label>
            
            <div className="flex items-center space-x-3 p-3 rounded-lg border">
              <Checkbox 
                id="daily"
                checked={reportTypes.includes('daily')}
                onCheckedChange={() => handleToggleReportType('daily')}
              />
              <div className="flex items-center gap-2 flex-1">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <div>
                  <Label htmlFor="daily" className="cursor-pointer">Rapport quotidien</Label>
                  <p className="text-xs text-muted-foreground">Envoyé chaque jour à 8h00</p>
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-3 p-3 rounded-lg border">
              <Checkbox 
                id="weekly"
                checked={reportTypes.includes('weekly')}
                onCheckedChange={() => handleToggleReportType('weekly')}
              />
              <div className="flex items-center gap-2 flex-1">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <div>
                  <Label htmlFor="weekly" className="cursor-pointer">Rapport hebdomadaire</Label>
                  <p className="text-xs text-muted-foreground">Envoyé chaque lundi à 9h00</p>
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-3 p-3 rounded-lg border">
              <Checkbox 
                id="monthly"
                checked={reportTypes.includes('monthly')}
                onCheckedChange={() => handleToggleReportType('monthly')}
              />
              <div className="flex items-center gap-2 flex-1">
                <CalendarDays className="h-4 w-4 text-muted-foreground" />
                <div>
                  <Label htmlFor="monthly" className="cursor-pointer">Rapport mensuel</Label>
                  <p className="text-xs text-muted-foreground">Envoyé le 1er du mois à 10h00</p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Content Section */}
      <Card>
        <CardHeader>
          <CardTitle>Contenu des rapports</CardTitle>
          <CardDescription>
            Personnalisez les sections incluses dans vos rapports
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Indicateurs clés (KPIs)</Label>
              <p className="text-sm text-muted-foreground">
                Utilisateurs, cagnottes, montants, commandes
              </p>
            </div>
            <Switch checked={includeKpis} onCheckedChange={setIncludeKpis} />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Alertes actives</Label>
              <p className="text-sm text-muted-foreground">
                Alertes de croissance et performance
              </p>
            </div>
            <Switch checked={includeAlerts} onCheckedChange={setIncludeAlerts} />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Top prestataires</Label>
              <p className="text-sm text-muted-foreground">
                Classement des meilleurs vendeurs (hebdo/mensuel)
              </p>
            </div>
            <Switch checked={includeTopPerformers} onCheckedChange={setIncludeTopPerformers} />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Résumé graphique</Label>
              <p className="text-sm text-muted-foreground">
                Tendances et évolutions (mensuel)
              </p>
            </div>
            <Switch checked={includeChartsSummary} onCheckedChange={setIncludeChartsSummary} />
          </div>
        </CardContent>
      </Card>

      {/* Email Section */}
      <Card>
        <CardHeader>
          <CardTitle>Email de réception</CardTitle>
          <CardDescription>
            Par défaut, les rapports sont envoyés à l'email de votre compte
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Utiliser un email personnalisé</Label>
              <p className="text-sm text-muted-foreground">
                Email du compte: {user?.email}
              </p>
            </div>
            <Switch checked={useCustomEmail} onCheckedChange={setUseCustomEmail} />
          </div>

          {useCustomEmail && (
            <div className="space-y-2">
              <Label htmlFor="email-override">Email personnalisé</Label>
              <Input
                id="email-override"
                type="email"
                value={emailOverride}
                onChange={(e) => setEmailOverride(e.target.value)}
                placeholder="admin@joiedevivre.ci"
              />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Save Button */}
      <Button onClick={handleSave} disabled={saving} className="w-full">
        {saving ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Enregistrement...
          </>
        ) : (
          'Enregistrer les préférences'
        )}
      </Button>

      {/* Test Report Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Send className="h-5 w-5" />
            Envoyer un rapport de test
          </CardTitle>
          <CardDescription>
            Testez le format du rapport avant de configurer l'envoi automatique
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Type de rapport</Label>
              <Select 
                value={testReportType} 
                onValueChange={(v) => setTestReportType(v as ReportType)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily">Quotidien</SelectItem>
                  <SelectItem value="weekly">Hebdomadaire</SelectItem>
                  <SelectItem value="monthly">Mensuel</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Email de test</Label>
              <Input
                type="email"
                value={testEmail}
                onChange={(e) => setTestEmail(e.target.value)}
                placeholder="votre@email.com"
              />
            </div>
          </div>
          <Button 
            onClick={handleSendTest} 
            disabled={sendingTest || !testEmail}
            variant="outline"
            className="w-full"
          >
            {sendingTest ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Envoi en cours...
              </>
            ) : (
              <>
                <Send className="mr-2 h-4 w-4" />
                Envoyer le rapport de test
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Logs Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            Historique des rapports
          </CardTitle>
          <CardDescription>
            Derniers rapports envoyés à tous les administrateurs
          </CardDescription>
        </CardHeader>
        <CardContent>
          {logs.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              Aucun rapport envoyé pour le moment
            </p>
          ) : (
            <div className="space-y-3">
              {logs.map((log) => (
                <div 
                  key={log.id} 
                  className="flex items-center justify-between p-3 rounded-lg border"
                >
                  <div className="flex items-center gap-3">
                    <Badge variant="outline">
                      {getReportTypeLabel(log.report_type)}
                    </Badge>
                    <span className="text-sm text-muted-foreground">
                      {format(new Date(log.sent_at), 'dd MMM yyyy à HH:mm', { locale: fr })}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-muted-foreground">
                      {log.recipients_count} destinataire(s)
                    </span>
                    {getStatusBadge(log.status)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
