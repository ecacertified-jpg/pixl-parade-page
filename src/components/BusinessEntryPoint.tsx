import { Store, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useNavigate } from 'react-router-dom';
import { useBusinessAccount } from '@/hooks/useBusinessAccount';

export const BusinessEntryPoint = () => {
  const navigate = useNavigate();
  const { hasBusinessAccount, businessAccount, loading } = useBusinessAccount();

  if (loading) {
    return null;
  }

  return (
    <Card className="mb-6 bg-gradient-to-br from-primary/5 to-secondary/5 border-primary/20">
      <CardHeader className="pb-4">
        <div className="flex items-center gap-2">
          <Store className="h-5 w-5 text-primary" />
          <CardTitle className="text-lg">
            {hasBusinessAccount ? 'Mon Espace Business' : 'Devenez Vendeur'}
          </CardTitle>
        </div>
        <CardDescription>
          {hasBusinessAccount 
            ? 'Accédez à votre tableau de bord et gérez votre activité'
            : 'Vendez vos produits sur JOIE DE VIVRE et atteignez plus de clients'
          }
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-0">
        <Button 
          onClick={() => navigate(hasBusinessAccount ? '/business-account' : '/business-auth')}
          className="w-full"
          variant={hasBusinessAccount ? "outline" : "default"}
        >
          {hasBusinessAccount ? (
            <>
              Accéder à mon espace
              <ArrowRight className="h-4 w-4 ml-2" />
            </>
          ) : (
            <>
              Créer mon compte business
              <Store className="h-4 w-4 ml-2" />
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
};