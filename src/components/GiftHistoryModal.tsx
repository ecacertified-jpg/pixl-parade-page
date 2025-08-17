import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Gift, Users } from "lucide-react";

interface GiftHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function GiftHistoryModal({ isOpen, onClose }: GiftHistoryModalProps) {
  const giftHistory = [
    {
      id: "1",
      name: "Bracelet Doré Élégance",
      occasion: "Promotion professionnelle",
      date: "31/07/2025",
      amount: 15000,
      type: "received",
      contributors: [
        { name: "Fatou Bamba", amount: 8000 },
        { name: "Kofi Asante", amount: 7000 }
      ]
    },
    {
      id: "2",
      name: "Parfum Roses de Yamoussoukro",
      occasion: "Anniversaire",
      date: "18/07/2025",
      amount: 28000,
      type: "given",
      recipient: "Fatou Bamba"
    },
    {
      id: "3",
      name: "Livre sur l'entrepreneuriat",
      occasion: "Réussite universitaire",
      date: "10/06/2025",
      amount: 12000,
      type: "received",
      contributors: [
        { name: "Maman", amount: 12000 }
      ]
    },
    {
      id: "4",
      name: "Montre connectée",
      occasion: "Anniversaire",
      date: "25/04/2025",
      amount: 45000,
      type: "given",
      recipient: "Kofi Asante"
    }
  ];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-center">
            <span className="text-xl">🎁</span> Historique des Cadeaux
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-3">
          {giftHistory.map((gift) => (
            <Card 
              key={gift.id} 
              className={`p-4 ${
                gift.type === 'received' 
                  ? 'border-green-200 bg-green-50' 
                  : 'border-blue-200 bg-blue-50'
              }`}
            >
              <div className="flex items-center gap-3 mb-3">
                <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                  gift.type === 'received' 
                    ? 'bg-green-100' 
                    : 'bg-blue-100'
                }`}>
                  <Gift className={`h-6 w-6 ${
                    gift.type === 'received' 
                      ? 'text-green-600' 
                      : 'text-blue-600'
                  }`} />
                </div>
                <div className="flex-1">
                  <div className="font-medium">{gift.name}</div>
                  <div className="text-xs text-muted-foreground">{gift.occasion}</div>
                  <div className="text-xs text-muted-foreground">{gift.date}</div>
                </div>
                <div className="text-right">
                  <div className={`font-semibold ${
                    gift.type === 'received' 
                      ? 'text-green-600' 
                      : 'text-blue-600'
                  }`}>
                    {gift.amount.toLocaleString()} F
                  </div>
                </div>
              </div>
              
              <div className="border-t pt-3">
                <div className="flex items-center gap-2 mb-2">
                  {gift.type === 'received' ? (
                    <>
                      <Gift className="h-4 w-4 text-green-600" />
                      <span className="text-sm font-medium text-green-600">Reçu de :</span>
                    </>
                  ) : (
                    <>
                      <Gift className="h-4 w-4 text-orange-500" />
                      <span className="text-sm font-medium text-orange-600">Offert à :</span>
                    </>
                  )}
                </div>
                
                {gift.type === 'received' && gift.contributors ? (
                  <div className="space-y-2">
                    {gift.contributors.map((contributor, index) => (
                      <div key={index} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 bg-pink-500 rounded-full flex items-center justify-center text-xs text-white">
                            {contributor.name.charAt(0)}
                          </div>
                          <span className="text-sm">{contributor.name}</span>
                        </div>
                        <span className="text-sm font-medium">{contributor.amount.toLocaleString()} F</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 bg-pink-500 rounded-full flex items-center justify-center text-xs text-white">
                      {gift.recipient?.charAt(0)}
                    </div>
                    <span className="text-sm">{gift.recipient}</span>
                  </div>
                )}
              </div>
            </Card>
          ))}
        </div>

        <div className="text-center pt-4">
          <Button variant="outline" onClick={onClose} className="w-full">
            Fermer
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}