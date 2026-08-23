import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { CheckCircle2, Circle, HelpCircle } from 'lucide-react';
import { buildWhyPanel, type CrmComputed, type WhyRule } from '@/lib/crmCore';

function RuleRow({ rule }: { rule: WhyRule }) {
  const Icon = rule.applied ? CheckCircle2 : Circle;
  return (
    <li
      className={`rounded-lg border p-2 text-xs ${
        rule.applied ? 'border-primary/40 bg-primary/5' : 'border-border/60'
      }`}
    >
      <div className="flex items-start gap-2">
        <Icon className={`mt-0.5 h-3.5 w-3.5 shrink-0 ${rule.applied ? 'text-primary' : 'text-muted-foreground'}`} />
        <div className="min-w-0 space-y-1 break-words">
          <p className={rule.applied ? 'font-medium' : 'text-muted-foreground'}>{rule.rule}</p>
          <p className="text-muted-foreground">Valeurs observées : {rule.observed}</p>
          <div className="flex flex-wrap gap-1">
            {rule.fields.map((f) => (
              <Badge key={f} variant="outline" className="font-mono text-[10px]">{f}</Badge>
            ))}
          </div>
          {rule.applied && <Badge className="text-[10px]">Règle appliquée</Badge>}
        </div>
      </div>
    </li>
  );
}

function Section({ title, conclusion, rules }: { title: string; conclusion: string; rules: WhyRule[] }) {
  return (
    <AccordionItem value={title}>
      <AccordionTrigger className="text-sm">{title}</AccordionTrigger>
      <AccordionContent className="space-y-2">
        <p className="rounded-md bg-muted/50 p-2 text-xs font-medium">{conclusion}</p>
        {rules.length === 0 ? (
          <p className="text-xs text-muted-foreground">Aucune règle appliquée.</p>
        ) : (
          <ul className="space-y-1.5">
            {rules.map((r, i) => <RuleRow key={i} rule={r} />)}
          </ul>
        )}
      </AccordionContent>
    </AccordionItem>
  );
}

export function CrmWhyPanel({ record }: { record: CrmComputed }) {
  const why = buildWhyPanel(record);

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
          <HelpCircle className="h-4 w-4 text-primary" />
          Pourquoi ce segment, ce score et cette priorité ?
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <Accordion type="multiple" defaultValue={['Segmentation']} className="w-full">
          <Section title="Segmentation" conclusion={why.segment.conclusion} rules={why.segment.rules} />
          <Section title="Score de réactivation" conclusion={why.score.conclusion} rules={why.score.rules} />
          <Section title="Priorité" conclusion={why.priority.conclusion} rules={why.priority.rules} />
          <Section title="Activité, parcours et blocage" conclusion={why.activity.conclusion} rules={why.activity.rules} />
          <AccordionItem value="fields">
            <AccordionTrigger className="text-sm">Champs CRM utilisés</AccordionTrigger>
            <AccordionContent>
              <div className="grid gap-1 sm:grid-cols-2">
                {why.fields_used.map((f) => (
                  <div key={f.field} className="flex items-center justify-between gap-2 rounded-md border px-2 py-1 text-xs">
                    <span className="font-mono text-[10px] text-muted-foreground">{f.field}</span>
                    <span className="text-right font-medium">{f.value}</span>
                  </div>
                ))}
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </CardContent>
    </Card>
  );
}
