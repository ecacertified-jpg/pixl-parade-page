import { Clock, CheckCircle2, XCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
  const currentDay = getCurrentDayFrench();
  const isOpen = isOpenNow(openingHours);

  // Check if we have any valid hours data
  const hasValidHours = DAYS_ORDER.some(day => openingHours[day]);

  if (!hasValidHours) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Clock className="h-5 w-5 text-primary" />
            Horaires d'ouverture
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
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            <Clock className="h-5 w-5 text-primary" />
            Horaires d'ouverture
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
      <CardContent className="space-y-2">
        {DAYS_ORDER.map(day => {
          const dayHours = openingHours[day];
          const isCurrentDay = day === currentDay;
          
          return (
            <div
              key={day}
              className={cn(
                "flex items-center justify-between py-1.5 px-2 rounded-md transition-colors",
                isCurrentDay && "bg-primary/10 border border-primary/20"
              )}
            >
              <div className="flex items-center gap-2">
                {isCurrentDay && (
                  <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                )}
                <span className={cn(
                  "text-sm",
                  isCurrentDay ? "font-semibold text-foreground" : "text-muted-foreground"
                )}>
                  {DAYS_DISPLAY[day]}
                </span>
              </div>
              <span className={cn(
                "text-sm",
                isCurrentDay ? "font-semibold" : "text-muted-foreground",
                dayHours?.closed && "text-muted-foreground/60"
              )}>
                {!dayHours ? (
                  "—"
                ) : dayHours.closed ? (
                  "Fermé"
                ) : (
                  `${dayHours.open} - ${dayHours.close}`
                )}
              </span>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
