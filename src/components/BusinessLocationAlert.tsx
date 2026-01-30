import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { MapPin, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";

interface BusinessLocationAlertProps {
  latitude?: number | null;
  longitude?: number | null;
}

export const BusinessLocationAlert = ({ 
  latitude, 
  longitude
}: BusinessLocationAlertProps) => {
  const navigate = useNavigate();
  
  // Vérifier si la localisation GPS est définie
  const hasGpsLocation = latitude !== null && 
                         latitude !== undefined && 
                         longitude !== null && 
                         longitude !== undefined;
  
  // Ne pas afficher si la localisation est définie
  if (hasGpsLocation) return null;
  
  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="mb-4"
    >
      <Alert className="border-orange-500/50 bg-orange-50 dark:bg-orange-950/30">
        <MapPin className="h-4 w-4 text-orange-600" />
        <AlertTitle className="text-orange-800 dark:text-orange-300">
          Localisation GPS manquante
        </AlertTitle>
        <AlertDescription className="text-orange-700 dark:text-orange-400">
          <p className="mb-3">
            Ajoutez la position GPS de votre boutique pour apparaître dans les 
            recherches par proximité et faciliter les livraisons.
          </p>
          <Button 
            size="sm" 
            variant="outline"
            className="border-orange-500 text-orange-700 hover:bg-orange-100 dark:border-orange-600 dark:text-orange-300 dark:hover:bg-orange-900/30"
            onClick={() => navigate('/business-profile-settings')}
          >
            Définir ma localisation
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        </AlertDescription>
      </Alert>
    </motion.div>
  );
};
