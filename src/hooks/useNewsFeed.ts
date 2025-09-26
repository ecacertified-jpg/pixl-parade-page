import { useState, useEffect } from 'react';
import { Post } from '@/components/PostCard';

// Mock data for news feed posts with emotional content
const mockPosts: Post[] = [
  {
    id: '1',
    author: {
      name: 'Aminata Touré',
      avatar: undefined,
      initials: 'AT'
    },
    content: 'Mon fils a obtenu son baccalauréat avec mention ! 🎓✨ Je suis tellement fière de lui. Merci à tous ceux qui l\'ont soutenu dans cette aventure.',
    timestamp: 'Il y a 2 heures',
    type: 'text',
    occasion: 'Réussite',
    reactions: {
      love: 24,
      gift: 8,
      like: 42
    },
    comments: 15,
    userReaction: null
  },
  {
    id: '2',
    author: {
      name: 'Koffi Asante',
      avatar: undefined,
      initials: 'KA'
    },
    content: 'Surprise d\'anniversaire réussie pour ma femme ! 🎂💕 Elle ne s\'y attendait pas du tout. Merci à tous les amis qui ont participé à cette belle fête.',
    timestamp: 'Il y a 4 heures',
    type: 'image',
    media: {
      url: '/lovable-uploads/1c257532-9180-4894-83a0-d853a23a3bc1.png'
    },
    occasion: 'Anniversaire',
    reactions: {
      love: 56,
      gift: 12,
      like: 78
    },
    comments: 23,
    userReaction: 'love'
  },
  {
    id: '3',
    author: {
      name: 'Fatou Diallo',
      avatar: undefined,
      initials: 'FD'
    },
    content: 'Un petit message vocal pour vous remercier de vos vœux d\'anniversaire ! Votre amitié me touche énormément. 🥰',
    timestamp: 'Il y a 6 heures',
    type: 'audio',
    media: {
      url: '#'
    },
    occasion: 'Remerciements',
    reactions: {
      love: 31,
      gift: 5,
      like: 28
    },
    comments: 8,
    userReaction: null
  },
  {
    id: '4',
    author: {
      name: 'Ibrahim Koné',
      avatar: undefined,
      initials: 'IK'
    },
    content: 'Promotion obtenue après 3 ans d\'efforts ! 🚀 Je dédie cette réussite à ma famille qui m\'a toujours soutenu. Maintenant, place aux célébrations !',
    timestamp: 'Il y a 8 heures',
    type: 'text',
    occasion: 'Promotion',
    reactions: {
      love: 89,
      gift: 15,
      like: 124
    },
    comments: 34,
    userReaction: 'like'
  },
  {
    id: '5',
    author: {
      name: 'Aïcha Sangaré',
      avatar: undefined,
      initials: 'AS'
    },
    content: 'Petit poème du jour :\n\n"Dans chaque sourire partagé,\nDans chaque geste d\'amitié,\nSe cache un trésor précieux :\nL\'amour qui nous rend heureux." 💖',
    timestamp: 'Il y a 12 heures',
    type: 'text',
    occasion: 'Inspiration',
    reactions: {
      love: 47,
      gift: 7,
      like: 52
    },
    comments: 12,
    userReaction: null
  },
  {
    id: '6',
    author: {
      name: 'Moussa Traoré',
      avatar: undefined,
      initials: 'MT'
    },
    content: 'Mariage de mon petit frère ce week-end ! 💒 Une célébration pleine d\'émotion et de joie. Félicitations aux nouveaux mariés !',
    timestamp: 'Il y a 1 jour',
    type: 'video',
    media: {
      url: '#',
      thumbnail: '/lovable-uploads/1c257532-9180-4894-83a0-d853a23a3bc1.png'
    },
    occasion: 'Mariage',
    reactions: {
      love: 156,
      gift: 23,
      like: 201
    },
    comments: 45,
    userReaction: 'gift'
  }
];

export function useNewsFeed() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate API call
    const loadPosts = async () => {
      setLoading(true);
      
      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setPosts(mockPosts);
      setLoading(false);
    };

    loadPosts();
  }, []);

  return {
    posts,
    loading,
    refreshPosts: () => {
      setLoading(true);
      setTimeout(() => {
        setPosts([...mockPosts]);
        setLoading(false);
      }, 500);
    }
  };
}