import { Dialog, DialogContent } from "@/components/ui/dialog";
import { X } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import confetti from "canvas-confetti";
import { motion } from "framer-motion";
import valueImage from "@/assets/value-proposition-collective-gift.jpg";

interface ValueModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ValueModal({ isOpen, onClose }: ValueModalProps) {
  const navigate = useNavigate();
  const [dontShowAgain, setDontShowAgain] = useState(false);

  const handleProceedToShop = () => {
    // Animation confettis
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 }
    });

    // Marquer comme vu
    localStorage.setItem('jdv_value_modal_seen', 'true');
    
    // Sauvegarder la préférence "Ne plus afficher"
    if (dontShowAgain) {
      localStorage.setItem('jdv_value_modal_dont_show', 'true');
    }

    // Fermer et rediriger
    onClose();
    setTimeout(() => {
      navigate("/shop");
    }, 300);
  };

  const handleClose = () => {
    localStorage.setItem('jdv_value_modal_seen', 'true');
    if (dontShowAgain) {
      localStorage.setItem('jdv_value_modal_dont_show', 'true');
    }
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl p-0 gap-0 bg-transparent border-0 max-h-[90vh] overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          transition={{ duration: 0.3 }}
          className="relative"
        >
          {/* Bouton de fermeture */}
          <button
            onClick={handleClose}
            className="absolute top-4 right-4 z-20 bg-white/90 hover:bg-white rounded-full p-2 shadow-lg transition-all duration-200 hover:scale-110"
          >
            <X className="h-5 w-5 text-gray-700" />
          </button>

          {/* Image cliquable */}
          <div 
            className="relative cursor-pointer group"
            onClick={handleProceedToShop}
          >
            <img 
              src={valueImage} 
              alt="Crée de la joie - Générosité récompensée" 
              className="w-full h-auto rounded-t-lg shadow-2xl transition-transform duration-300 group-hover:scale-[1.02]"
            />
            
            {/* Overlay hover pour indiquer que c'est cliquable */}
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors duration-300 rounded-t-lg" />
          </div>

          {/* Checkbox "Ne plus afficher" */}
          <div className="bg-white rounded-b-lg px-6 py-4 flex items-center gap-3 sticky bottom-0">
            <Checkbox
              id="dont-show-again"
              checked={dontShowAgain}
              onCheckedChange={(checked) => setDontShowAgain(checked === true)}
              className="border-2"
            />
            <label
              htmlFor="dont-show-again"
              className="text-sm font-medium text-gray-700 cursor-pointer select-none"
            >
              Ne plus afficher ce message
            </label>
          </div>
        </motion.div>
      </DialogContent>
    </Dialog>
  );
}
