import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useCountryFilters } from '@/hooks/useCountryFilters';

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
    is_visible?: boolean;
    country_code?: string;
  };
  reactions?: {
    love: number;
    gift: number;
    like: number;
  };
  user_reaction?: 'love' | 'gift' | 'like' | null;
  comments_count?: number;
}

export function usePosts(filterFollowing: boolean = false) {
  const { user } = useAuth();
  const { localFilter, socialFollowingFilter } = useCountryFilters();
  const [posts, setPosts] = useState<PostData[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPosts = async () => {
    try {
      setLoading(true);

      let postsData;
      
      if (filterFollowing && user?.id) {
        // Get list of followed users
        const { data: followedUsers } = await supabase
          .from('user_follows')
          .select('following_id')
          .eq('follower_id', user.id);

        const followedUserIds = followedUsers?.map(f => f.following_id) || [];
        
        // If not following anyone, return empty
        if (followedUserIds.length === 0) {
          setPosts([]);
          setLoading(false);
          return;
        }

        // Fetch posts from followed users - NO COUNTRY FILTER
        // Users see posts from ALL their friends regardless of location
        let followingQuery = supabase
          .from('posts')
          .select('*')
          .eq('is_published', true)
          .in('user_id', followedUserIds);
        
        // socialFollowingFilter is always null - no country filtering for friends
        if (socialFollowingFilter) {
          followingQuery = followingQuery.eq('country_code', socialFollowingFilter);
        }
        
        const { data, error: postsError } = await followingQuery.order('created_at', { ascending: false });

        if (postsError) throw postsError;
        postsData = data;
      } else {
        // Fetch all published posts - filtered by current navigation country
        let allQuery = supabase
          .from('posts')
          .select('*')
          .eq('is_published', true);
        
        // localFilter uses the current navigation country for discovery content
        if (localFilter) {
          allQuery = allQuery.eq('country_code', localFilter);
        }
        
        const { data, error: postsError } = await allQuery.order('created_at', { ascending: false });

        if (postsError) throw postsError;
        postsData = data;
      }


      // Fetch profiles for all unique user IDs
      const userIds = [...new Set(postsData?.map((post) => post.user_id) || [])];
      if (userIds.length === 0) {
        setPosts([]);
        setLoading(false);
        return;
      }
      
      const postIds = postsData?.map((post) => post.id) || [];
      
      // Batch all queries in parallel for better performance
      const [profilesResult, reactionsResult, userReactionsResult, commentsResult] = await Promise.all([
        // Profiles - use RPC function to respect privacy settings
        supabase
          .rpc('get_visible_profiles_for_posts', {
            p_viewer_id: user?.id || null,
            p_user_ids: userIds as string[]
          }),
        // All reactions for all posts
        supabase
          .from('post_reactions')
          .select('post_id, reaction_type')
          .in('post_id', postIds),
        // User's reactions
        user?.id ? supabase
          .from('post_reactions')
          .select('post_id, reaction_type')
          .in('post_id', postIds)
          .eq('user_id', user.id) : Promise.resolve({ data: [] }),
        // Comments count - use a single query with grouping
        supabase
          .from('post_comments')
          .select('post_id')
          .in('post_id', postIds)
      ]);

      const profilesData = profilesResult.data;
      const allReactionsData = reactionsResult.data || [];
      const userReactionsData = userReactionsResult.data || [];
      const commentsData = commentsResult.data || [];

      // Create maps for quick lookups
      const profilesMap = new Map(
        profilesData?.map((profile) => [profile.user_id, profile]) || []
      );
      
      // Group reactions by post_id
      const reactionsMap = new Map<string, { love: number; gift: number; like: number }>();
      allReactionsData.forEach((r) => {
        if (!reactionsMap.has(r.post_id)) {
          reactionsMap.set(r.post_id, { love: 0, gift: 0, like: 0 });
        }
        const counts = reactionsMap.get(r.post_id)!;
        if (r.reaction_type === 'love') counts.love++;
        else if (r.reaction_type === 'gift') counts.gift++;
        else if (r.reaction_type === 'like') counts.like++;
      });
      
      // User reactions map
      const userReactionsMap = new Map<string, 'love' | 'gift' | 'like'>(
        userReactionsData.map((r) => [r.post_id, r.reaction_type as 'love' | 'gift' | 'like'])
      );
      
      // Comments count map
      const commentsCountMap = new Map<string, number>();
      commentsData.forEach((c) => {
        commentsCountMap.set(c.post_id, (commentsCountMap.get(c.post_id) || 0) + 1);
      });

      // Transform posts with all data from maps
      const postsWithReactions = (postsData || []).map((post) => {
        const profile = profilesMap.get(post.user_id);
        const reactions = reactionsMap.get(post.id) || { love: 0, gift: 0, like: 0 };
        const userReaction = userReactionsMap.get(post.id) || null;
        const commentsCount = commentsCountMap.get(post.id) || 0;

        return {
          ...post,
          type: post.type as 'text' | 'image' | 'video' | 'audio' | 'ai_song',
          profiles: profile ? {
            first_name: profile.first_name,
            last_name: profile.last_name,
            avatar_url: profile.avatar_url,
            is_visible: profile.is_visible,
            country_code: profile.country_code,
          } : undefined,
          reactions,
          user_reaction: userReaction,
          comments_count: commentsCount,
        };
      });

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
  }, [user?.id, filterFollowing, localFilter, socialFollowingFilter]);

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
