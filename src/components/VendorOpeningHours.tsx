import { useState } from "react";
import { Clock, CheckCircle2, XCircle, ChevronDown } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";

interface DayHours {
  open: string;
  close: string;
  closed?: boolean;
}

interface VendorOpeningHoursProps {
  openingHours: Record<string, DayHours>;
}

const DAYS_ORDER = ["lundi", "mardi", "mercredi", "jeudi", "vendredi", "samedi", "dimanche"];

const DAYS_DISPLAY: Record<string, string> = {
  lundi: "Lun",
  mardi: "Mar",
  mercredi: "Mer",
  jeudi: "Jeu",
  vendredi: "Ven",
  samedi: "Sam",
  dimanche: "Dim",
};

const DAYS_DISPLAY_FULL: Record<string, string> = {
  lundi: "Lundi",
  mardi: "Mardi",
  mercredi: "Mercredi",
  jeudi: "Jeudi",
  vendredi: "Vendredi",
  samedi: "Samedi",
  dimanche: "Dimanche",
};

function getCurrentDayFrench(): string {
  const days = ["dimanche", "lundi", "mardi", "mercredi", "jeudi", "vendredi", "samedi"];
  return days[new Date().getDay()];
}

function getCurrentTime(): string {
  const now = new Date();
  return `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
}

function isOpenNow(openingHours: Record<string, DayHours>): boolean {
  const currentDay = getCurrentDayFrench();
  const dayHours = openingHours[currentDay];
  
  if (!dayHours || dayHours.closed) {
    return false;
  }
  
  const currentTime = getCurrentTime();
  return currentTime >= dayHours.open && currentTime <= dayHours.close;
}

export function VendorOpeningHours({ openingHours }: VendorOpeningHoursProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const currentDay = getCurrentDayFrench();
  const isOpen = isOpenNow(openingHours);
  const currentDayHours = openingHours[currentDay];

  // Check if we have any valid hours data
  const hasValidHours = DAYS_ORDER.some(day => openingHours[day]);

  if (!hasValidHours) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Clock className="h-5 w-5 text-primary" />
            Horaires
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Horaires non renseignés</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-base">
              <Clock className="h-5 w-5 text-primary" />
              Horaires
            </CardTitle>
            <Badge 
              variant={isOpen ? "default" : "secondary"}
              className={cn(
                "flex items-center gap-1",
                isOpen ? "bg-green-600 hover:bg-green-700" : "bg-muted text-muted-foreground"
              )}
            >
              {isOpen ? (
                <>
                  <CheckCircle2 className="h-3 w-3" />
                  Ouvert
                </>
              ) : (
                <>
                  <XCircle className="h-3 w-3" />
                  Fermé
                </>
              )}
            </Badge>
          </div>
        </CardHeader>
        
        <CardContent className="pt-0">
          {/* Current Day Highlight - Always visible */}
          <div className="flex items-center justify-between py-2 px-3 rounded-lg bg-primary/10 border border-primary/20 mb-2">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
              <span className="font-semibold text-sm">Aujourd'hui</span>
              <span className="text-xs text-muted-foreground">({DAYS_DISPLAY_FULL[currentDay]})</span>
            </div>
            <span className="text-sm font-semibold">
              {!currentDayHours ? "—" : currentDayHours.closed ? "Fermé" : `${currentDayHours.open} - ${currentDayHours.close}`}
            </span>
          </div>

          {/* Expand/Collapse Trigger */}
          <CollapsibleTrigger className="w-full flex items-center justify-center gap-2 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors cursor-pointer">
            <span>{isExpanded ? "Masquer" : "Voir tous les horaires"}</span>
            <ChevronDown className={cn(
              "h-4 w-4 transition-transform duration-200",
              isExpanded && "rotate-180"
            )} />
          </CollapsibleTrigger>

          {/* Full Schedule */}
          <CollapsibleContent>
            <div className="space-y-1 pt-2 border-t border-border/50">
              {DAYS_ORDER.map(day => {
                const dayHours = openingHours[day];
                const isCurrentDay = day === currentDay;
                
                if (isCurrentDay) return null; // Already shown above
                
                return (
                  <div
                    key={day}
                    className="flex items-center justify-between py-1.5 px-2 rounded-md text-sm"
                  >
                    <span className="text-muted-foreground">{DAYS_DISPLAY_FULL[day]}</span>
                    <span className={cn(
                      "text-muted-foreground",
                      dayHours?.closed && "text-muted-foreground/60"
                    )}>
                      {!dayHours ? "—" : dayHours.closed ? "Fermé" : `${dayHours.open} - ${dayHours.close}`}
                    </span>
                  </div>
                );
              })}
            </div>
          </CollapsibleContent>
        </CardContent>
      </Collapsible>
    </Card>
  );
}
