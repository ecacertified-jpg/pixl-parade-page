import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface PostData {
  id: string;
  user_id: string;
  content: string;
  type: 'text' | 'image' | 'video' | 'audio' | 'ai_song';
  media_url?: string | null;
  media_thumbnail?: string | null;
  occasion?: string | null;
  is_published: boolean;
  is_pinned?: boolean;
  created_at: string;
  profiles?: {
    first_name?: string;
    last_name?: string;
    avatar_url?: string;
  };
  reactions?: {
    love: number;
    gift: number;
    like: number;
  };
  user_reaction?: 'love' | 'gift' | 'like' | null;
  comments_count?: number;
}

export function usePosts() {
  const { user } = useAuth();
  const [posts, setPosts] = useState<PostData[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPosts = async () => {
    try {
      setLoading(true);

      // Fetch published posts
      const { data: postsData, error: postsError } = await supabase
        .from('posts')
        .select('*')
        .eq('is_published', true)
        .order('created_at', { ascending: false });

      if (postsError) throw postsError;

      // Fetch profiles for all unique user IDs
      const userIds = [...new Set(postsData?.map((post) => post.user_id) || [])];
      const { data: profilesData } = await supabase
        .from('profiles')
        .select('user_id, first_name, last_name, avatar_url')
        .in('user_id', userIds);

      // Create a map of user_id to profile
      const profilesMap = new Map(
        profilesData?.map((profile) => [profile.user_id, profile]) || []
      );

      // Fetch reactions counts for each post
      const postsWithReactions = await Promise.all(
        (postsData || []).map(async (post) => {
          const { data: reactionsData } = await supabase
            .from('post_reactions')
            .select('reaction_type')
            .eq('post_id', post.id);

          const reactions = {
            love: reactionsData?.filter((r) => r.reaction_type === 'love').length || 0,
            gift: reactionsData?.filter((r) => r.reaction_type === 'gift').length || 0,
            like: reactionsData?.filter((r) => r.reaction_type === 'like').length || 0,
          };

          // Check user's reaction
          const { data: userReactionData } = await supabase
            .from('post_reactions')
            .select('reaction_type')
            .eq('post_id', post.id)
            .eq('user_id', user?.id || '')
            .maybeSingle();

          // Fetch comments count
          const { count: commentsCount } = await supabase
            .from('post_comments')
            .select('*', { count: 'exact', head: true })
            .eq('post_id', post.id);

          const profile = profilesMap.get(post.user_id);

          return {
            ...post,
            type: post.type as 'text' | 'image' | 'video' | 'audio' | 'ai_song',
            profiles: profile ? {
              first_name: profile.first_name,
              last_name: profile.last_name,
              avatar_url: profile.avatar_url,
            } : undefined,
            reactions,
            user_reaction: (userReactionData?.reaction_type as 'love' | 'gift' | 'like') || null,
            comments_count: commentsCount || 0,
          };
        })
      );

      setPosts(postsWithReactions);
    } catch (error) {
      console.error('Error fetching posts:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts();

    // Subscribe to real-time updates
    const channel = supabase
      .channel('posts-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'posts',
        },
        () => {
          fetchPosts();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id]);

  const toggleReaction = async (postId: string, reactionType: 'love' | 'gift' | 'like') => {
    if (!user?.id) return;

    try {
      // Get post author id
      const post = posts.find(p => p.id === postId);
      const postAuthorId = post?.user_id;

      // Check if user already reacted
      const { data: existingReaction } = await supabase
        .from('post_reactions')
        .select('*')
        .eq('post_id', postId)
        .eq('user_id', user.id)
        .maybeSingle();

      if (existingReaction) {
        // If same reaction, remove it
        if (existingReaction.reaction_type === reactionType) {
          await supabase
            .from('post_reactions')
            .delete()
            .eq('id', existingReaction.id);
          
          // If removing gift reaction, also remove gift promise
          if (reactionType === 'gift') {
            await supabase
              .from('gift_promises' as any)
              .delete()
              .eq('post_id', postId)
              .eq('user_id', user.id);
          }
        } else {
          // If different reaction, update it
          await supabase
            .from('post_reactions')
            .update({ reaction_type: reactionType })
            .eq('id', existingReaction.id);
          
          // If changing TO gift reaction, create promise
          if (reactionType === 'gift' && postAuthorId) {
            await supabase
              .from('gift_promises' as any)
              .upsert({
                user_id: user.id,
                post_id: postId,
                post_author_id: postAuthorId,
              }, {
                onConflict: 'user_id,post_id'
              });
          }
          
          // If changing FROM gift reaction, remove promise
          if (existingReaction.reaction_type === 'gift') {
            await supabase
              .from('gift_promises' as any)
              .delete()
              .eq('post_id', postId)
              .eq('user_id', user.id);
          }
        }
      } else {
        // Add new reaction
        await supabase
          .from('post_reactions')
          .insert({
            post_id: postId,
            user_id: user.id,
            reaction_type: reactionType,
          });
        
        // If adding gift reaction, create promise
        if (reactionType === 'gift' && postAuthorId) {
          await supabase
            .from('gift_promises' as any)
            .insert({
              user_id: user.id,
              post_id: postId,
              post_author_id: postAuthorId,
            });
        }
      }

      // Refresh posts to update reactions
      fetchPosts();
    } catch (error) {
      console.error('Error toggling reaction:', error);
    }
  };

  return {
    posts,
    loading,
    refreshPosts: fetchPosts,
    toggleReaction,
  };
}
