import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Palette, Ruler, AlertCircle, DollarSign, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useUserPreferences } from "@/hooks/useUserPreferences";
import { SizesSection } from "@/components/preferences/SizesSection";
import { AllergiesSection } from "@/components/preferences/AllergiesSection";
import { ColorsSection } from "@/components/preferences/ColorsSection";
import { BudgetRangesSection } from "@/components/preferences/BudgetRangesSection";
import { PrivacySection } from "@/components/preferences/PrivacySection";
import { Progress } from "@/components/ui/progress";

const Preferences = () => {
  const navigate = useNavigate();
  const { preferences, loading, updatePreferences, completionScore } = useUserPreferences();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 via-pink-50 to-purple-50">
        <div className="text-center space-y-4">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-muted-foreground">Chargement de vos préférences...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-pink-50 to-purple-50 pb-20">
      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="container max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate(-1)}
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-orange-500 to-pink-500 bg-clip-text text-transparent">
                  Mes Préférences
                </h1>
                <p className="text-sm text-muted-foreground">
                  Aidez vos amis à mieux vous connaître
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-right">
                <p className="text-xs text-muted-foreground">Profil complété</p>
                <p className="text-lg font-bold text-primary">{completionScore}%</p>
              </div>
              <Progress value={completionScore} className="w-20" />
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container max-w-6xl mx-auto px-4 py-6">
        <Tabs defaultValue="sizes" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5 bg-white">
            <TabsTrigger value="sizes" className="flex gap-1 text-xs">
              <Ruler className="h-3 w-3" aria-hidden />
              <span className="hidden sm:inline">Tailles</span>
            </TabsTrigger>
            <TabsTrigger value="allergies" className="flex gap-1 text-xs">
              <AlertCircle className="h-3 w-3" aria-hidden />
              <span className="hidden sm:inline">Allergies</span>
            </TabsTrigger>
            <TabsTrigger value="colors" className="flex gap-1 text-xs">
              <Palette className="h-3 w-3" aria-hidden />
              <span className="hidden sm:inline">Couleurs</span>
            </TabsTrigger>
            <TabsTrigger value="budget" className="flex gap-1 text-xs">
              <DollarSign className="h-3 w-3" aria-hidden />
              <span className="hidden sm:inline">Budgets</span>
            </TabsTrigger>
            <TabsTrigger value="privacy" className="flex gap-1 text-xs">
              <Lock className="h-3 w-3" aria-hidden />
              <span className="hidden sm:inline">Confidentialité</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="sizes" className="mt-6">
            <SizesSection preferences={preferences} onUpdate={updatePreferences} />
          </TabsContent>

          <TabsContent value="allergies" className="mt-6">
            <AllergiesSection preferences={preferences} onUpdate={updatePreferences} />
          </TabsContent>

          <TabsContent value="colors" className="mt-6">
            <ColorsSection preferences={preferences} onUpdate={updatePreferences} />
          </TabsContent>

          <TabsContent value="budget" className="mt-6">
            <BudgetRangesSection preferences={preferences} onUpdate={updatePreferences} />
          </TabsContent>

          <TabsContent value="privacy" className="mt-6">
            <PrivacySection preferences={preferences} onUpdate={updatePreferences} />
          </TabsContent>
        </Tabs>

        {/* Conseil */}
        {completionScore < 100 && (
          <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-800">
              💡 <strong>Conseil :</strong> Plus votre profil est complet, plus vos amis pourront vous offrir des cadeaux qui vous plairont vraiment !
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Preferences;
