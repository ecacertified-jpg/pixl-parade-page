import { useState } from 'react';
import { z } from 'zod';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { generateSecurePassword } from '@/utils/generatePassword';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Lock, Loader2, Eye, EyeOff, Sparkles } from 'lucide-react';

const passwordSchema = z.object({
  password: z.string().min(8, 'Le mot de passe doit contenir au moins 8 caractères'),
  confirm: z.string(),
}).refine((data) => data.password === data.confirm, {
  message: 'Les mots de passe ne correspondent pas',
  path: ['confirm'],
});

export function ChangePasswordForm() {
  const { toast } = useToast();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<{ password?: string; confirm?: string }>({});

  const handleSubmit = async () => {
    setErrors({});

    const result = passwordSchema.safeParse({ password, confirm });
    if (!result.success) {
      const fieldErrors: typeof errors = {};
      result.error.errors.forEach((e) => {
        const field = e.path[0] as keyof typeof errors;
        fieldErrors[field] = e.message;
      });
      setErrors(fieldErrors);
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;

      setPassword('');
      setConfirm('');
      toast({
        title: 'Mot de passe mis à jour',
        description: 'Votre mot de passe a été changé avec succès.',
      });
    } catch (err: any) {
      console.error('Password update error:', err);
      toast({
        title: 'Erreur',
        description: err.message || 'Impossible de mettre à jour le mot de passe.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const EyeToggle = () => (
    <button
      type="button"
      onClick={() => setShowPassword(!showPassword)}
      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
      tabIndex={-1}
    >
      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
    </button>
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Lock className="h-5 w-5" />
          Changer le mot de passe
        </CardTitle>
        <CardDescription>
          Définissez un nouveau mot de passe pour votre compte
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="new-password">Nouveau mot de passe</Label>
          <div className="relative">
            <Input
              id="new-password"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => { setPassword(e.target.value); setErrors({}); }}
              placeholder="Minimum 8 caractères"
              className={errors.password ? 'border-destructive pr-10' : 'pr-10'}
            />
            <EyeToggle />
          </div>
          {errors.password && <p className="text-xs text-destructive">{errors.password}</p>}
          <button
            type="button"
            onClick={() => {
              const pwd = generateSecurePassword();
              setPassword(pwd);
              setConfirm(pwd);
              setShowPassword(true);
              setErrors({});
              toast({ title: 'Mot de passe suggéré', description: 'Pensez à le noter ou le copier avant de continuer.' });
            }}
            className="flex items-center gap-1.5 text-xs text-primary hover:text-primary/80 transition-colors"
          >
            <Sparkles className="h-3.5 w-3.5" />
            Suggérer un mot de passe sécurisé
          </button>
        </div>

        <div className="space-y-2">
          <Label htmlFor="confirm-password">Confirmer le mot de passe</Label>
          <div className="relative">
            <Input
              id="confirm-password"
              type={showPassword ? 'text' : 'password'}
              value={confirm}
              onChange={(e) => { setConfirm(e.target.value); setErrors({}); }}
              placeholder="Retapez le mot de passe"
              className={errors.confirm ? 'border-destructive pr-10' : 'pr-10'}
            />
            <EyeToggle />
          </div>
          {errors.confirm && <p className="text-xs text-destructive">{errors.confirm}</p>}
        </div>

        <Button onClick={handleSubmit} disabled={loading || !password || !confirm} className="w-full">
          {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
          Mettre à jour le mot de passe
        </Button>
      </CardContent>
    </Card>
  );
}
