import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';

export type RealtimeEventType = 'user' | 'business' | 'order' | 'fund' | 'contribution';

export interface RealtimeEvent {
  id: string;
  type: RealtimeEventType;
  action: 'INSERT' | 'UPDATE';
  data: any;
  timestamp: Date;
  title: string;
  description: string;
}

export interface LiveStats {
  todayUsers: number;
  todayBusinesses: number;
  todayOrders: number;
  todayFunds: number;
  todayContributions: number;
  totalOrderAmount: number;
  totalContributionAmount: number;
}

export interface ChartDataPoint {
  time: string;
  users: number;
  businesses: number;
  orders: number;
  funds: number;
  contributions: number;
}

const MAX_EVENTS = 50;
const CHART_MINUTES = 30;

export function useRealtimeDashboard() {
  const [events, setEvents] = useState<RealtimeEvent[]>([]);
  const [liveStats, setLiveStats] = useState<LiveStats>({
    todayUsers: 0,
    todayBusinesses: 0,
    todayOrders: 0,
    todayFunds: 0,
    todayContributions: 0,
    totalOrderAmount: 0,
    totalContributionAmount: 0,
  });
  const [chartData, setChartData] = useState<ChartDataPoint[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(true);
  const [isPaused, setIsPaused] = useState(false);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  // Initialize chart data with empty minutes
  useEffect(() => {
    const now = new Date();
    const initialData: ChartDataPoint[] = [];
    for (let i = CHART_MINUTES - 1; i >= 0; i--) {
      const time = new Date(now.getTime() - i * 60000);
      initialData.push({
        time: time.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
        users: 0,
        businesses: 0,
        orders: 0,
        funds: 0,
        contributions: 0,
      });
    }
    setChartData(initialData);
  }, []);

  // Update chart data when new event arrives
  const updateChartData = useCallback((type: RealtimeEventType) => {
    setChartData(prev => {
      const now = new Date();
      const currentMinute = now.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
      
      const newData = [...prev];
      const lastIndex = newData.length - 1;
      
      if (newData[lastIndex]?.time === currentMinute) {
        // Update current minute
        const typeKey = type === 'user' ? 'users' : 
                       type === 'business' ? 'businesses' :
                       type === 'order' ? 'orders' :
                       type === 'fund' ? 'funds' : 'contributions';
        newData[lastIndex] = {
          ...newData[lastIndex],
          [typeKey]: newData[lastIndex][typeKey] + 1
        };
      } else {
        // New minute - shift and add
        newData.shift();
        const newPoint: ChartDataPoint = {
          time: currentMinute,
          users: type === 'user' ? 1 : 0,
          businesses: type === 'business' ? 1 : 0,
          orders: type === 'order' ? 1 : 0,
          funds: type === 'fund' ? 1 : 0,
          contributions: type === 'contribution' ? 1 : 0,
        };
        newData.push(newPoint);
      }
      
      return newData;
    });
  }, []);

  // Add new event
  const addEvent = useCallback((event: Omit<RealtimeEvent, 'id' | 'timestamp'>) => {
    if (isPaused) return;

    const newEvent: RealtimeEvent = {
      ...event,
      id: crypto.randomUUID(),
      timestamp: new Date(),
    };

    setEvents(prev => [newEvent, ...prev].slice(0, MAX_EVENTS));
    updateChartData(event.type);

    // Update live stats
    setLiveStats(prev => {
      const updates: Partial<LiveStats> = {};
      switch (event.type) {
        case 'user':
          updates.todayUsers = prev.todayUsers + 1;
          break;
        case 'business':
          updates.todayBusinesses = prev.todayBusinesses + 1;
          break;
        case 'order':
          updates.todayOrders = prev.todayOrders + 1;
          updates.totalOrderAmount = prev.totalOrderAmount + (event.data?.total_amount || 0);
          break;
        case 'fund':
          updates.todayFunds = prev.todayFunds + 1;
          break;
        case 'contribution':
          updates.todayContributions = prev.todayContributions + 1;
          updates.totalContributionAmount = prev.totalContributionAmount + (event.data?.amount || 0);
          break;
      }
      return { ...prev, ...updates };
    });
  }, [isPaused, updateChartData]);

  // Fetch initial stats for today
  const fetchTodayStats = useCallback(async () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayISO = today.toISOString();

    try {
      const [usersRes, businessesRes, ordersRes, fundsRes, contributionsRes] = await Promise.all([
        supabase.from('profiles').select('*', { count: 'exact', head: true }).gte('created_at', todayISO),
        supabase.from('business_accounts').select('*', { count: 'exact', head: true }).gte('created_at', todayISO),
        supabase.from('business_orders').select('total_amount').gte('created_at', todayISO),
        supabase.from('collective_funds').select('*', { count: 'exact', head: true }).gte('created_at', todayISO),
        supabase.from('fund_contributions').select('amount').gte('created_at', todayISO),
      ]);

      const totalOrderAmount = ordersRes.data?.reduce((sum, o) => sum + (o.total_amount || 0), 0) || 0;
      const totalContributionAmount = contributionsRes.data?.reduce((sum, c) => sum + (c.amount || 0), 0) || 0;

      setLiveStats({
        todayUsers: usersRes.count || 0,
        todayBusinesses: businessesRes.count || 0,
        todayOrders: ordersRes.data?.length || 0,
        todayFunds: fundsRes.count || 0,
        todayContributions: contributionsRes.data?.length || 0,
        totalOrderAmount,
        totalContributionAmount,
      });
    } catch (error) {
      console.error('Error fetching today stats:', error);
    }
  }, []);

  // Subscribe to realtime changes
  useEffect(() => {
    fetchTodayStats();

    const channel = supabase.channel('admin-realtime-dashboard')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'profiles' },
        (payload) => {
          const data = payload.new as any;
          addEvent({
            type: 'user',
            action: 'INSERT',
            data,
            title: 'Nouvel utilisateur inscrit',
            description: `${data.first_name || ''} ${data.last_name || ''} a rejoint la plateforme`.trim(),
          });
        }
      )
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'business_accounts' },
        (payload) => {
          const data = payload.new as any;
          addEvent({
            type: 'business',
            action: 'INSERT',
            data,
            title: 'Nouveau business inscrit',
            description: `${data.business_name} - ${data.business_type || 'Non spécifié'}`,
          });
        }
      )
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'business_orders' },
        (payload) => {
          const data = payload.new as any;
          addEvent({
            type: 'order',
            action: 'INSERT',
            data,
            title: 'Nouvelle commande',
            description: `${data.total_amount?.toLocaleString('fr-FR') || 0} ${data.currency || 'XOF'}`,
          });
        }
      )
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'collective_funds' },
        (payload) => {
          const data = payload.new as any;
          addEvent({
            type: 'fund',
            action: 'INSERT',
            data,
            title: 'Nouvelle cagnotte créée',
            description: `${data.title} - Objectif: ${data.target_amount?.toLocaleString('fr-FR') || 0} ${data.currency || 'XOF'}`,
          });
        }
      )
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'fund_contributions' },
        (payload) => {
          const data = payload.new as any;
          addEvent({
            type: 'contribution',
            action: 'INSERT',
            data,
            title: 'Nouvelle contribution',
            description: `${data.amount?.toLocaleString('fr-FR') || 0} ${data.currency || 'XOF'} ajoutés`,
          });
        }
      )
      .subscribe((status) => {
        setIsConnecting(false);
        setIsConnected(status === 'SUBSCRIBED');
      });

    channelRef.current = channel;

    return () => {
      supabase.removeChannel(channel);
    };
  }, [addEvent, fetchTodayStats]);

  const togglePause = useCallback(() => {
    setIsPaused(prev => !prev);
  }, []);

  const clearEvents = useCallback(() => {
    setEvents([]);
  }, []);

  return {
    events,
    liveStats,
    chartData,
    isConnected,
    isConnecting,
    isPaused,
    togglePause,
    clearEvents,
    refetchStats: fetchTodayStats,
  };
}
