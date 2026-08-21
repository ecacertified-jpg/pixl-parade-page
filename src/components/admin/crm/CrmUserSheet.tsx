import { useState } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Download, ExternalLink, Loader2 } from 'lucide-react';
import {
  DUPLICATE_STATUSES, REACTIVATION_STATUSES, useCrmDetail, useCrmMutations, type CrmRecord,
} from '@/hooks/useJdvCrm';
import { CRM_EXPORT_COLUMNS } from './crmExportColumns';
import { CrmWhyPanel } from './CrmWhyPanel';
import { exportToCSV } from '@/utils/exportUtils';

const NA = 'Non disponible';

function fmtDate(value?: string | null) {
  if (!value) return NA;
  return new Date(value).toLocaleDateString('fr-FR');
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 py-1 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-right font-medium">{value}</span>
    </div>
  );
}

const YesNo = ({ value }: { value: boolean }) => (
  <span className={value ? 'text-primary' : 'text-muted-foreground'}>{value ? 'Oui' : 'Non'}</span>
);

interface Props {
  userId: string | null;
  onClose: () => void;
}

export function CrmUserSheet({ userId, onClose }: Props) {
  const { data, isLoading } = useCrmDetail(userId);
  const { setStatus, addHistory } = useCrmMutations();
  const [entry, setEntry] = useState({ canal: 'WhatsApp', campagne: '', message: '', statut: '', reponse: '', action_suivante: '', resultat: '' });

  const record: CrmRecord | undefined = data?.record;

  const handleExportOne = () => {
    if (!record) return;
    exportToCSV([record], CRM_EXPORT_COLUMNS, `crm_${record.crm_id ?? record.user_id}`);
  };

  return (
    <Sheet open={!!userId} onOpenChange={(open) => !open && onClose()}>
      <SheetContent side="right" className="w-full sm:max-w-2xl overflow-y-auto">
        {isLoading || !record ? (
          <div className="flex h-full items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : (
          <>
            <SheetHeader className="mb-4">
              <SheetTitle className="flex flex-wrap items-center gap-2">
                {record.first_name ?? 'Sans prénom'} {record.last_name ?? ''}
                <Badge variant="outline">{record.crm_id ?? NA}</Badge>
              </SheetTitle>
              <div className="flex flex-wrap items-center gap-2">
                <Badge>{record.segment} · {record.segment_label}</Badge>
                <Badge variant="secondary">Priorité : {record.priority}</Badge>
                <Badge variant="outline">Score {record.score}/100</Badge>
              </div>
            </SheetHeader>

            <div className="space-y-4">
              <Card>
                <CardHeader className="pb-2"><CardTitle className="text-base">Identité</CardTitle></CardHeader>
                <CardContent className="pt-0">
                  <Row label="CRM ID" value={record.crm_id ?? NA} />
                  <Row label="User ID JDV" value={<span className="font-mono text-xs">{record.user_id}</span>} />
                  <Row label="Prénom" value={record.first_name ?? NA} />
                  <Row label="Nom" value={record.last_name ?? NA} />
                  <Row label="Téléphone" value={record.phone ?? NA} />
                  <Row label="Email" value={record.email ?? NA} />
                  <Row label="Pays" value={record.country_code ?? NA} />
                  <Row label="Ville" value={record.city ?? NA} />
                  <Row label="Date d'inscription" value={fmtDate(record.signup_date)} />
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2"><CardTitle className="text-base">Anniversaire / Événement</CardTitle></CardHeader>
                <CardContent className="pt-0">
                  <Row label="Date d'anniversaire" value={record.birthday ? fmtDate(record.birthday) : 'Date inconnue'} />
                  <Row label="Prochain anniversaire" value={record.next_birthday ? fmtDate(record.next_birthday) : 'Date inconnue'} />
                  <Row label="Jours avant l'anniversaire" value={record.days_to_birthday ?? NA} />
                  <Row label="Type d'événement" value={record.event_page_occasion ?? NA} />
                  <Row label="Page anniversaire créée" value={<YesNo value={record.has_birthday_page} />} />
                  <Row label="Page événement créée" value={<YesNo value={record.has_event_page} />} />
                  <Row label="Date de création de la page" value={fmtDate(record.birthday_page_created_at)} />
                  <Row label="Statut de la page" value={record.page_status ?? NA} />
                  <Row
                    label="URL de la page"
                    value={record.page_url ? (
                      <a href={record.page_url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-primary underline">
                        Ouvrir <ExternalLink className="h-3 w-3" />
                      </a>
                    ) : NA}
                  />
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2"><CardTitle className="text-base">Comportement JDV</CardTitle></CardHeader>
                <CardContent className="pt-0">
                  <Row label="Compte actif" value={<YesNo value={record.account_active} />} />
                  <Row label="Dernière connexion" value={fmtDate(record.last_sign_in_at)} />
                  <Row label="Dernière activité" value={fmtDate(record.last_activity_at)} />
                  <Row label="Jours depuis dernière activité" value={record.days_since_activity ?? NA} />
                  <Row label="Nombre de sessions" value={record.sessions_count} />
                  <Separator className="my-2" />
                  <Row label="Page publiée" value={<YesNo value={record.page_published} />} />
                  <Row label="Vues (photos de la page)" value={record.page_views ?? NA} />
                  <Separator className="my-2" />
                  <Row label="Cagnotte créée" value={<YesNo value={record.has_fund} />} />
                  <Row label="Date de création de la cagnotte" value={fmtDate(record.first_fund_created_at)} />
                  <Row label="Cagnotte active" value={<YesNo value={record.fund_active} />} />
                  <Row label="Nombre de contributions" value={record.contributions_count} />
                  <Row label="Montant collecté" value={`${record.total_collected.toLocaleString('fr-FR')} XOF`} />
                  <Separator className="my-2" />
                  <Row label="Page partagée" value={<YesNo value={record.has_shared} />} />
                  <Row label="Dernier partage" value={fmtDate(record.last_share_at)} />
                  <Row label="Nombre de partages" value={record.shares_count} />
                  <Row label="Canaux de partage" value={record.share_channels?.join(', ') || NA} />
                  <Row label="Messages reçus" value={record.messages_received} />
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2"><CardTitle className="text-base">Activité JDV</CardTitle></CardHeader>
                <CardContent className="pt-0">
                  <Row
                    label="Niveau d’activité"
                    value={<Badge variant={record.niveau_activite === 'Actif' ? 'default' : 'secondary'}>{record.niveau_activite}</Badge>}
                  />
                  <Row label="Dernière activité réelle" value={fmtDate(record.date_derniere_activite)} />
                  <Row
                    label="Jours depuis la dernière activité"
                    value={record.jours_depuis_derniere_activite ?? NA}
                  />
                  <Row label="Dernière connexion" value={fmtDate(record.date_derniere_connexion)} />
                  <Row label="Nombre de sessions" value={record.sessions_count} />
                  <p className="pt-2 text-xs text-muted-foreground">
                    L’activité repose uniquement sur les connexions et sessions réelles ; la date d’inscription
                    n’est jamais comptée comme une activité.
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2"><CardTitle className="text-base">Parcours de conversion</CardTitle></CardHeader>
                <CardContent className="pt-0 space-y-2">
                  <div className="flex flex-wrap items-center gap-1">
                    {record.journey.map((step, i) => (
                      <span key={step.label} className="flex items-center gap-1">
                        <Badge variant={step.done ? 'default' : 'outline'} className={step.done ? '' : 'text-muted-foreground'}>
                          {step.label}
                        </Badge>
                        {i < record.journey.length - 1 && <span className="text-muted-foreground">›</span>}
                      </span>
                    ))}
                  </div>
                  <Row label="Étape atteinte" value={record.etape_parcours} />
                  <Row label="Blocage principal" value={record.blocage_principal} />
                </CardContent>
              </Card>

              <Card>

                <CardHeader className="pb-2"><CardTitle className="text-base">Score de réactivation : {record.score}/100</CardTitle></CardHeader>
                <CardContent className="pt-0 space-y-1">
                  {record.score_details.length === 0 && <p className="text-sm text-muted-foreground">Aucun facteur applicable.</p>}
                  {record.score_details.map((d) => (
                    <div key={d.key} className="flex justify-between text-sm">
                      <span className="text-muted-foreground">{d.label}</span>
                      <span className={d.points >= 0 ? 'font-medium text-primary' : 'font-medium text-destructive'}>
                        {d.points > 0 ? `+${d.points}` : d.points}
                      </span>
                    </div>
                  ))}
                  <Separator className="my-2" />
                  <Row label="Priorité" value={record.priority} />
                  <div className="pt-1 text-xs text-muted-foreground">
                    {record.priority_reasons.map((reason, i) => <p key={i}>• {reason}</p>)}
                  </div>
                  <Separator className="my-2" />
                  <Row label="Prochaine action recommandée" value={record.next_action} />

                </CardContent>
              </Card>

              <CrmWhyPanel record={record} />

              <Card>
                <CardHeader className="pb-2"><CardTitle className="text-base">Suivi</CardTitle></CardHeader>
                <CardContent className="pt-0 space-y-3">
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div>
                      <Label className="text-xs">Statut de réactivation</Label>
                      <Select
                        value={record.statut_reactivation}
                        onValueChange={(v) => setStatus.mutate({ user_id: record.user_id, statut_reactivation: v })}
                      >
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {REACTIVATION_STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="text-xs">Statut de doublon</Label>
                      <Select
                        value={record.statut_doublon}
                        onValueChange={(v) => setStatus.mutate({ user_id: record.user_id, statut_doublon: v })}
                      >
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {DUPLICATE_STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {data?.duplicates && data.duplicates.length > 0 && (
                    <div className="rounded-lg border border-destructive/40 bg-destructive/5 p-3">
                      <p className="mb-1 text-sm font-medium">Doublons potentiels détectés ({data.duplicates.length})</p>
                      <p className="mb-2 text-xs text-muted-foreground">
                        Aucune suppression automatique : validation humaine requise.
                      </p>
                      <ul className="space-y-1 text-xs">
                        {data.duplicates.map((d) => (
                          <li key={d.user_id} className="flex justify-between gap-2">
                            <span>{d.crm_id} · {d.first_name} {d.last_name}</span>
                            <span className="text-muted-foreground">{d.phone ?? d.email ?? ''}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2"><CardTitle className="text-base">Historique de réactivation</CardTitle></CardHeader>
                <CardContent className="pt-0 space-y-3">
                  {(data?.history ?? []).length === 0 && (
                    <p className="text-sm text-muted-foreground">Aucune action enregistrée.</p>
                  )}
                  {(data?.history ?? []).map((h) => (
                    <div key={h.id} className="rounded-lg border p-2 text-xs">
                      <div className="flex justify-between font-medium">
                        <span>{new Date(h.occurred_at).toLocaleString('fr-FR')}</span>
                        <span>{h.canal ?? '—'}</span>
                      </div>
                      {h.campagne && <p>Campagne : {h.campagne}</p>}
                      {h.message && <p className="text-muted-foreground">{h.message}</p>}
                      {h.statut && <p>Statut : {h.statut}</p>}
                      {h.reponse && <p>Réponse : {h.reponse}</p>}
                      {h.action_suivante && <p>Action suivante : {h.action_suivante}</p>}
                      {h.resultat && <p>Résultat : {h.resultat}</p>}
                    </div>
                  ))}

                  <Separator />
                  <div className="grid gap-2 sm:grid-cols-2">
                    <div>
                      <Label className="text-xs">Canal</Label>
                      <Input value={entry.canal} onChange={(e) => setEntry({ ...entry, canal: e.target.value })} />
                    </div>
                    <div>
                      <Label className="text-xs">Campagne</Label>
                      <Input value={entry.campagne} onChange={(e) => setEntry({ ...entry, campagne: e.target.value })} />
                    </div>
                  </div>
                  <div>
                    <Label className="text-xs">Message / cause du contact</Label>
                    <Textarea rows={2} value={entry.message} onChange={(e) => setEntry({ ...entry, message: e.target.value })} />
                  </div>
                  <div className="grid gap-2 sm:grid-cols-2">
                    <div>
                      <Label className="text-xs">Statut</Label>
                      <Select value={entry.statut} onValueChange={(v) => setEntry({ ...entry, statut: v })}>
                        <SelectTrigger><SelectValue placeholder="Choisir" /></SelectTrigger>
                        <SelectContent>
                          {REACTIVATION_STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="text-xs">Résultat</Label>
                      <Input value={entry.resultat} onChange={(e) => setEntry({ ...entry, resultat: e.target.value })} />
                    </div>
                  </div>
                  <div className="grid gap-2 sm:grid-cols-2">
                    <div>
                      <Label className="text-xs">Réponse</Label>
                      <Input value={entry.reponse} onChange={(e) => setEntry({ ...entry, reponse: e.target.value })} />
                    </div>
                    <div>
                      <Label className="text-xs">Action suivante</Label>
                      <Input value={entry.action_suivante} onChange={(e) => setEntry({ ...entry, action_suivante: e.target.value })} />
                    </div>
                  </div>
                  <Button
                    className="w-full"
                    disabled={addHistory.isPending}
                    onClick={() => addHistory.mutate(
                      { user_id: record.user_id, ...entry },
                      { onSuccess: () => setEntry({ canal: 'WhatsApp', campagne: '', message: '', statut: '', reponse: '', action_suivante: '', resultat: '' }) },
                    )}
                  >
                    {addHistory.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                    Enregistrer l'action
                  </Button>
                </CardContent>
              </Card>

              <Button variant="outline" className="w-full" onClick={handleExportOne}>
                <Download className="mr-2 h-4 w-4" /> Exporter cette fiche en CSV
              </Button>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
