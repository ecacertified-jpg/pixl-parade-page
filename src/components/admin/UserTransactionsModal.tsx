import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface Transaction {
  id: string;
  type: 'contribution' | 'gift_given' | 'gift_received';
  amount: number;
  currency: string;
  date: string;
  status: string;
  description: string;
}

interface UserTransactionsModalProps {
  userId: string | null;
  userName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function UserTransactionsModal({ userId, userName, open, onOpenChange }: UserTransactionsModalProps) {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (userId && open) {
      fetchTransactions();
    }
  }, [userId, open]);

  const fetchTransactions = async () => {
    if (!userId) return;
    
    setLoading(true);
    try {
      const allTransactions: Transaction[] = [];

      // Fetch contributions
      const { data: contributions, error: contribError } = await supabase
        .from('fund_contributions')
        .select('*, collective_funds(title)')
        .eq('contributor_id', userId)
        .order('created_at', { ascending: false });

      if (contribError) throw contribError;

      contributions?.forEach((contrib: any) => {
        allTransactions.push({
          id: contrib.id,
          type: 'contribution',
          amount: contrib.amount,
          currency: contrib.currency || 'XOF',
          date: contrib.created_at,
          status: 'completed',
          description: `Contribution à "${contrib.collective_funds?.title || 'Cagnotte'}"`,
        });
      });

      // Fetch gifts given
      const { data: giftsGiven, error: giftsGivenError } = await supabase
        .from('gifts')
        .select('*')
        .eq('giver_id', userId)
        .order('created_at', { ascending: false });

      if (giftsGivenError) throw giftsGivenError;

      giftsGiven?.forEach((gift: any) => {
        allTransactions.push({
          id: gift.id,
          type: 'gift_given',
          amount: gift.amount || 0,
          currency: gift.currency || 'XOF',
          date: gift.created_at,
          status: gift.status || 'given',
          description: `Cadeau donné: ${gift.gift_name}`,
        });
      });

      // Fetch gifts received
      const { data: giftsReceived, error: giftsReceivedError } = await supabase
        .from('gifts')
        .select('*')
        .eq('receiver_id', userId)
        .order('created_at', { ascending: false });

      if (giftsReceivedError) throw giftsReceivedError;

      giftsReceived?.forEach((gift: any) => {
        allTransactions.push({
          id: gift.id,
          type: 'gift_received',
          amount: gift.amount || 0,
          currency: gift.currency || 'XOF',
          date: gift.created_at,
          status: gift.status || 'received',
          description: `Cadeau reçu: ${gift.gift_name}`,
        });
      });

      // Sort by date
      allTransactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      
      setTransactions(allTransactions);
    } catch (error) {
      console.error('Error fetching transactions:', error);
      toast.error("Erreur lors du chargement des transactions");
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatAmount = (amount: number, currency: string) => {
    return `${amount.toLocaleString()} ${currency}`;
  };

  const getTypeBadge = (type: string) => {
    switch (type) {
      case 'contribution':
        return <Badge variant="secondary">Contribution</Badge>;
      case 'gift_given':
        return <Badge className="bg-orange-500">Cadeau donné</Badge>;
      case 'gift_received':
        return <Badge className="bg-green-500">Cadeau reçu</Badge>;
      default:
        return <Badge>{type}</Badge>;
    }
  };

  const filterByType = (type: string) => {
    if (type === 'all') return transactions;
    return transactions.filter(t => t.type === type);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Historique des transactions - {userName}</DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : (
          <Tabs defaultValue="all" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="all">Tout ({transactions.length})</TabsTrigger>
              <TabsTrigger value="contribution">
                Contributions ({filterByType('contribution').length})
              </TabsTrigger>
              <TabsTrigger value="gift_given">
                Donnés ({filterByType('gift_given').length})
              </TabsTrigger>
              <TabsTrigger value="gift_received">
                Reçus ({filterByType('gift_received').length})
              </TabsTrigger>
            </TabsList>

            {['all', 'contribution', 'gift_given', 'gift_received'].map((type) => (
              <TabsContent key={type} value={type}>
                {filterByType(type).length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">
                    Aucune transaction
                  </p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Description</TableHead>
                        <TableHead className="text-right">Montant</TableHead>
                        <TableHead>Statut</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filterByType(type).map((transaction) => (
                        <TableRow key={transaction.id}>
                          <TableCell className="text-sm">
                            {formatDate(transaction.date)}
                          </TableCell>
                          <TableCell>{getTypeBadge(transaction.type)}</TableCell>
                          <TableCell className="max-w-xs truncate">
                            {transaction.description}
                          </TableCell>
                          <TableCell className="text-right font-medium">
                            {formatAmount(transaction.amount, transaction.currency)}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">{transaction.status}</Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </TabsContent>
            ))}
          </Tabs>
        )}
      </DialogContent>
    </Dialog>
  );
}
