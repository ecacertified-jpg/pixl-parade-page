import { Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
export function CollaborativeOfferSection() {
  return <Card className="p-6 mb-6 bg-gradient-to-r from-orange-400 via-pink-500 to-purple-600 text-white border-0 shadow-lg">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
            <Users className="h-6 w-6 text-white" />
          </div>
          <div>
            <h3 className="font-bold mb-1 py-0 mx-px px-0 text-lg">Offre collaborative !</h3>
            <p className="text-white/90 text-sm">
              Cotisez à plusieurs pour offrir ensemble
            </p>
          </div>
        </div>
        
        <Button variant="secondary" className="bg-white text-gray-900 hover:bg-gray-100 font-medium">
          Découvrir
        </Button>
      </div>
    </Card>;
}