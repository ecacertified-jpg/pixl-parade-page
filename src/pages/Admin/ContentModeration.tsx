import { useState, useEffect } from 'react';
import { AdminLayout } from '@/components/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { AlertCircle, MoreVertical, Eye, TestTube } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useAuth } from '@/contexts/AuthContext';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ModeratePostDialog } from '@/components/admin/ModeratePostDialog';
import { ModerateCommentDialog } from '@/components/admin/ModerateCommentDialog';
import { toast } from 'sonner';

interface ReportedPost {
  id: string;
  post_id: string;
  reporter_id: string;
  reason: string;
  status: string;
  created_at: string;
  posts: {
    content: string;
    user_id: string;
    profiles: {
      first_name: string | null;
      last_name: string | null;
    };
  };
  reporter: {
    first_name: string | null;
    last_name: string | null;
  };
}

interface RecentPost {
  id: string;
  content: string;
  created_at: string;
  user_id: string;
  profiles: {
    first_name: string | null;
    last_name: string | null;
  };
}

export default function ContentModeration() {
  const { user } = useAuth();
  const [reportedPosts, setReportedPosts] = useState<ReportedPost[]>([]);
  const [recentPosts, setRecentPosts] = useState<RecentPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [creatingTest, setCreatingTest] = useState(false);
  
  const [moderatePostOpen, setModeratePostOpen] = useState(false);
  const [selectedPostId, setSelectedPostId] = useState<string | null>(null);
  const [selectedReportId, setSelectedReportId] = useState<string | null>(null);
  
  useEffect(() => {
    fetchData();
  }, []);
  
  const fetchData = async () => {
    setLoading(true);
    await Promise.all([
      fetchReportedPosts(),
      fetchRecentPosts()
    ]);
    setLoading(false);
  };
  
  const fetchReportedPosts = async () => {
    try {
      const { data, error } = await supabase
        .from('reported_posts')
        .select(`
          *,
          posts!fk_reported_posts_post(content, user_id, profiles!fk_posts_user(first_name, last_name)),
          reporter:profiles!fk_reported_posts_reporter(first_name, last_name)
        `)
        .eq('status', 'pending')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      setReportedPosts(data as any || []);
    } catch (error) {
      console.error('Error fetching reported posts:', error);
      toast.error('Erreur lors du chargement des signalements');
    }
  };
  
  const fetchRecentPosts = async () => {
    try {
      const { data, error } = await supabase
        .from('posts')
        .select('id, content, created_at, user_id, profiles!fk_posts_user(first_name, last_name)')
        .order('created_at', { ascending: false })
        .limit(50);
      
      if (error) throw error;
      setRecentPosts(data as any || []);
    } catch (error) {
      console.error('Error fetching recent posts:', error);
    }
  };
  
  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };
  
  const truncateText = (text: string, maxLength: number = 100) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };
  
  const createTestReport = async () => {
    if (!user) {
      toast.error('Utilisateur non connecté');
      return;
    }
    
    setCreatingTest(true);
    try {
      // Get a random post
      const { data: posts, error: postsError } = await supabase
        .from('posts')
        .select('id')
        .limit(10);
      
      if (postsError) throw postsError;
      
      if (!posts || posts.length === 0) {
        toast.error('Aucune publication disponible pour créer un signalement de test');
        return;
      }
      
      // Select random post
      const randomPost = posts[Math.floor(Math.random() * posts.length)];
      
      // Random reasons for testing
      const testReasons = ['spam', 'inappropriate', 'harassment', 'fake_news', 'other'];
      const randomReason = testReasons[Math.floor(Math.random() * testReasons.length)];
      
      // Create test report
      const { error: insertError } = await supabase
        .from('reported_posts')
        .insert({
          post_id: randomPost.id,
          reporter_id: user.id,
          reason: randomReason,
          status: 'pending'
        });
      
      if (insertError) throw insertError;
      
      toast.success('Signalement de test créé avec succès !');
      await fetchData();
    } catch (error) {
      console.error('Error creating test report:', error);
      toast.error('Erreur lors de la création du signalement de test');
    } finally {
      setCreatingTest(false);
    }
  };
  
  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-full">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
        </div>
      </AdminLayout>
    );
  }
  
  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Modération du contenu</h1>
            <p className="text-muted-foreground mt-2">
              Gérer les publications, commentaires et signalements
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={createTestReport}
            disabled={creatingTest}
          >
            <TestTube className="mr-2 h-4 w-4" />
            {creatingTest ? 'Création...' : 'Créer un signalement test'}
          </Button>
        </div>
        
        <Tabs defaultValue="reports" className="w-full">
          <TabsList>
            <TabsTrigger value="reports">
              Signalements ({reportedPosts.length})
            </TabsTrigger>
            <TabsTrigger value="posts">Publications</TabsTrigger>
            <TabsTrigger value="products">Produits</TabsTrigger>
          </TabsList>
          
          <TabsContent value="reports">
            <Card>
              <CardHeader>
                <CardTitle>Signalements en attente</CardTitle>
              </CardHeader>
              <CardContent>
                {reportedPosts.length === 0 ? (
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      Aucun signalement en attente de traitement.
                    </AlertDescription>
                  </Alert>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Contenu</TableHead>
                        <TableHead>Auteur</TableHead>
                        <TableHead>Signalé par</TableHead>
                        <TableHead>Raison</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {reportedPosts.map((report) => (
                        <TableRow key={report.id}>
                          <TableCell className="max-w-xs">
                            {truncateText(report.posts?.content || 'Contenu supprimé')}
                          </TableCell>
                          <TableCell>
                            {report.posts?.profiles?.first_name && report.posts?.profiles?.last_name
                              ? `${report.posts.profiles.first_name} ${report.posts.profiles.last_name}`
                              : 'Utilisateur'}
                          </TableCell>
                          <TableCell>
                            {report.reporter?.first_name && report.reporter?.last_name
                              ? `${report.reporter.first_name} ${report.reporter.last_name}`
                              : 'Anonyme'}
                          </TableCell>
                          <TableCell>
                            <Badge variant="secondary">{report.reason}</Badge>
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {formatDate(report.created_at)}
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              size="sm"
                              onClick={() => {
                                setSelectedPostId(report.post_id);
                                setSelectedReportId(report.id);
                                setModeratePostOpen(true);
                              }}
                            >
                              <Eye className="mr-2 h-4 w-4" />
                              Modérer
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="posts">
            <Card>
              <CardHeader>
                <CardTitle>Publications récentes ({recentPosts.length})</CardTitle>
              </CardHeader>
              <CardContent>
                {recentPosts.length === 0 ? (
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      Aucune publication disponible.
                    </AlertDescription>
                  </Alert>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Contenu</TableHead>
                        <TableHead>Auteur</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {recentPosts.map((post) => (
                        <TableRow key={post.id}>
                          <TableCell className="max-w-md">
                            {truncateText(post.content || 'Contenu multimédia')}
                          </TableCell>
                          <TableCell>
                            {post.profiles?.first_name && post.profiles?.last_name
                              ? `${post.profiles.first_name} ${post.profiles.last_name}`
                              : 'Utilisateur'}
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {formatDate(post.created_at)}
                          </TableCell>
                          <TableCell className="text-right">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon">
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem>
                                  <Eye className="mr-2 h-4 w-4" />
                                  Voir le détail
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="products">
            <Card>
              <CardHeader>
                <CardTitle>Produits récents</CardTitle>
              </CardHeader>
              <CardContent>
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    La gestion des produits est disponible dans la section "Gestion des prestataires".
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
        
        {/* Modals */}
        <ModeratePostDialog
          postId={selectedPostId}
          reportId={selectedReportId}
          open={moderatePostOpen}
          onOpenChange={setModeratePostOpen}
          onSuccess={fetchData}
        />
      </div>
    </AdminLayout>
  );
}
