import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { AlertCircle, Send } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

const resubmitSchema = z.object({
  business_name: z.string().min(2, 'Le nom doit contenir au moins 2 caractères'),
  business_type: z.string().min(2, 'Le type doit contenir au moins 2 caractères'),
  phone: z.string().optional(),
  address: z.string().optional(),
  description: z.string().optional(),
  email: z.string().email('Email invalide').optional().or(z.literal('')),
  corrections_message: z.string().min(20, 'Veuillez expliquer en détail les corrections apportées (minimum 20 caractères)'),
});

type ResubmitFormData = z.infer<typeof resubmitSchema>;

interface ResubmitBusinessFormProps {
  businessId: string;
  rejectionReason: string;
  rejectionDate: string;
  initialData: {
    business_name: string;
    business_type: string | null;
    phone: string | null;
    address: string | null;
    description: string | null;
    email: string | null;
  };
  onSuccess?: () => void;
}

export function ResubmitBusinessForm({
  businessId,
  rejectionReason,
  rejectionDate,
  initialData,
  onSuccess,
}: ResubmitBusinessFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<ResubmitFormData>({
    resolver: zodResolver(resubmitSchema),
    defaultValues: {
      business_name: initialData.business_name,
      business_type: initialData.business_type || '',
      phone: initialData.phone || '',
      address: initialData.address || '',
      description: initialData.description || '',
      email: initialData.email || '',
      corrections_message: '',
    },
  });

  const onSubmit = async (data: ResubmitFormData) => {
    try {
      setIsSubmitting(true);

      // Get current resubmission count
      const { data: currentBusiness } = await supabase
        .from('business_accounts')
        .select('resubmission_count')
        .eq('id', businessId)
        .single();

      // Update business account with new data and mark as resubmitted
      const { error: updateError } = await supabase
        .from('business_accounts')
        .update({
          business_name: data.business_name,
          business_type: data.business_type,
          phone: data.phone || null,
          address: data.address || null,
          description: data.description || null,
          email: data.email || null,
          corrections_message: data.corrections_message,
          status: 'resubmitted',
          resubmission_count: (currentBusiness?.resubmission_count || 0) + 1,
          updated_at: new Date().toISOString(),
        })
        .eq('id', businessId);

      if (updateError) throw updateError;

      // Log resubmission in registration logs
      await supabase.from('business_registration_logs').insert({
        business_account_id: businessId,
        business_name: data.business_name,
        business_email: data.email,
        business_type: data.business_type,
        action: 'registered', // New submission after rejection
      });

      // Notify admins of resubmission
      const { data: adminUsers } = await supabase
        .from('admin_users')
        .select('user_id')
        .eq('is_active', true);

      if (adminUsers && adminUsers.length > 0) {
        const notifications = adminUsers.map(admin => ({
          user_id: admin.user_id,
          notification_type: 'business_resubmitted',
          title: '🔄 Demande business réinscrite',
          message: `"${data.business_name}" a soumis une nouvelle demande après rejet. Corrections: ${data.corrections_message.substring(0, 100)}...`,
          scheduled_for: new Date().toISOString(),
          delivery_methods: ['push', 'in_app'],
          metadata: {
            business_id: businessId,
            corrections_message: data.corrections_message,
          },
        }));

        await supabase.from('scheduled_notifications').insert(notifications);
      }

      toast.success('Demande réinscrite avec succès ! Un administrateur examinera votre dossier.');
      
      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      console.error('Error resubmitting business:', error);
      toast.error('Erreur lors de la réinscription');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Demande rejetée</AlertTitle>
        <AlertDescription>
          <strong>Date:</strong> {new Date(rejectionDate).toLocaleDateString('fr-FR')}
          <br />
          <strong>Motif:</strong> {rejectionReason}
        </AlertDescription>
      </Alert>

      <Card>
        <CardHeader>
          <CardTitle>Réinscrire votre demande</CardTitle>
          <CardDescription>
            Corrigez les informations demandées et expliquez les modifications apportées
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="business_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nom du business *</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Mon entreprise" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="business_type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Type de business *</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Restaurant, Boutique, Service..." />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input {...field} type="email" placeholder="contact@monentreprise.com" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Téléphone</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="+225 XX XX XX XX XX" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="address"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Adresse</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Adresse complète" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea
                        {...field}
                        placeholder="Décrivez votre activité..."
                        rows={4}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="corrections_message"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-primary">Corrections apportées * (Important)</FormLabel>
                    <FormControl>
                      <Textarea
                        {...field}
                        placeholder="Expliquez en détail les modifications que vous avez apportées suite au rejet. Soyez précis sur les corrections effectuées..."
                        rows={6}
                        className="border-primary"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button type="submit" disabled={isSubmitting} className="w-full">
                {isSubmitting ? (
                  <>Envoi en cours...</>
                ) : (
                  <>
                    <Send className="mr-2 h-4 w-4" />
                    Soumettre la demande réinscrite
                  </>
                )}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
