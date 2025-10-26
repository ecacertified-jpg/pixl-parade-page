import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import valueImage from "@/assets/value-proposition-contribution.jpg";

interface ValuePropositionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onContinue: () => void;
  fundTitle: string;
  beneficiaryName: string;
}

export function ValuePropositionModal({ 
  isOpen, 
  onClose, 
  onContinue,
  fundTitle,
  beneficiaryName
}: ValuePropositionModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto p-0 gap-0 bg-gradient-to-br from-purple-600 to-pink-500 border-0">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 z-10 rounded-full bg-white/20 p-2 backdrop-blur-sm hover:bg-white/30 transition-colors"
          aria-label="Fermer"
        >
          <X className="h-5 w-5 text-white" />
        </button>

        {/* Content */}
        <div className="relative">
          {/* Image cliquable avec les 4 valeurs */}
          <div 
            className="relative w-full bg-gradient-to-br from-purple-600 to-pink-500 cursor-pointer hover:opacity-95 transition-opacity"
            onClick={() => {
              onClose();
              onContinue();
            }}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                onClose();
                onContinue();
              }
            }}
          >
            <img 
              src={valueImage} 
              alt="La valeur de votre contribution - Cliquez pour contribuer" 
              className="w-full max-h-[60vh] object-contain"
            />
          </div>

          {/* Bottom Section with Buttons */}
          <div className="p-6 space-y-4 bg-white/10 backdrop-blur-sm">
            {/* Title */}
            <div className="text-center space-y-2">
              <h3 className="text-xl font-bold text-white whitespace-nowrap overflow-hidden text-ellipsis">
                Offrir à {beneficiaryName}
              </h3>
              <p className="text-white/90 text-sm">
                {fundTitle}
              </p>
            </div>

            {/* Buttons */}
            <div className="flex gap-3">
              <Button
                onClick={onClose}
                variant="outline"
                className="flex-1 bg-white/20 backdrop-blur-sm border-white/30 text-white hover:bg-white/30 hover:text-white"
              >
                Plus tard
              </Button>
              <Button
                onClick={() => {
                  onClose();
                  onContinue();
                }}
                className="flex-1 bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 text-white font-semibold shadow-lg"
              >
                Crée de la joie
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
