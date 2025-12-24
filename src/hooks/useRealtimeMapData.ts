import { useMemo } from 'react';
import { findCityCoordinates, CityCoordinates } from '@/utils/ivoryCoastCities';

export type RealtimeEventType = 'user' | 'business' | 'order' | 'fund' | 'contribution';

export interface RealtimeEvent {
  id: string;
  type: RealtimeEventType;
  title: string;
  subtitle?: string;
  timestamp: Date;
  location?: string;
  coordinates?: [number, number];
}

export interface MapMarker {
  id: string;
  city: CityCoordinates;
  coordinates: [number, number];
  events: RealtimeEvent[];
  counts: Record<RealtimeEventType, number>;
  totalCount: number;
  lastEventTime: Date;
  isNew: boolean;
}

export function useRealtimeMapData(events: RealtimeEvent[]) {
  const markers = useMemo(() => {
    const cityMap = new Map<string, MapMarker>();
    const now = new Date();
    const newThreshold = 10000; // 10 seconds
    
    events.forEach(event => {
      if (!event.location) return;
      
      const city = findCityCoordinates(event.location);
      if (!city) return;
      
      const cityKey = city.name.toLowerCase();
      
      if (!cityMap.has(cityKey)) {
        cityMap.set(cityKey, {
          id: cityKey,
          city,
          coordinates: [city.lng, city.lat],
          events: [],
          counts: { user: 0, business: 0, order: 0, fund: 0, contribution: 0 },
          totalCount: 0,
          lastEventTime: event.timestamp,
          isNew: false,
        });
      }
      
      const marker = cityMap.get(cityKey)!;
      marker.events.push(event);
      marker.counts[event.type]++;
      marker.totalCount++;
      
      if (event.timestamp > marker.lastEventTime) {
        marker.lastEventTime = event.timestamp;
      }
      
      // Mark as new if recent event
      if (now.getTime() - event.timestamp.getTime() < newThreshold) {
        marker.isNew = true;
      }
    });
    
    return Array.from(cityMap.values()).sort((a, b) => b.totalCount - a.totalCount);
  }, [events]);
  
  const statistics = useMemo(() => {
    const stats = {
      totalEvents: events.length,
      eventsWithLocation: events.filter(e => e.location).length,
      citiesCount: markers.length,
      topCity: markers[0]?.city.name || 'N/A',
    };
    return stats;
  }, [events, markers]);
  
  return { markers, statistics };
}
