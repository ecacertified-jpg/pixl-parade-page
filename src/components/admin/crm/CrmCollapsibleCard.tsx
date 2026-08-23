import { useState, type ReactNode } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown } from 'lucide-react';

interface CrmCollapsibleCardProps {
  title: ReactNode;
  subtitle?: ReactNode;
  actions?: ReactNode;
  defaultOpen?: boolean;
  contentClassName?: string;
  children: ReactNode;
}

export function CrmCollapsibleCard({
  title,
  subtitle,
  actions,
  defaultOpen = true,
  contentClassName,
  children,
}: CrmCollapsibleCardProps) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <Card>
      <Collapsible open={open} onOpenChange={setOpen}>
        <CardHeader className="pb-3">
          <div className="flex flex-col items-stretch gap-2 sm:flex-row sm:items-start sm:justify-between">
            <CollapsibleTrigger className="flex min-w-0 flex-1 items-start gap-2 text-left">
              <ChevronDown
                className={`mt-0.5 h-4 w-4 shrink-0 text-muted-foreground transition-transform ${open ? '' : '-rotate-90'}`}
              />
              <div className="min-w-0 flex-1">
                <div className="text-sm font-semibold leading-none tracking-tight md:text-base">{title}</div>
                {subtitle && <div className="mt-1">{subtitle}</div>}
              </div>
            </CollapsibleTrigger>
            {actions && <div className="shrink-0">{actions}</div>}
          </div>
        </CardHeader>
        <CollapsibleContent>
          <CardContent className={contentClassName}>{children}</CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}
