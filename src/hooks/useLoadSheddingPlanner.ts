import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export interface LoadShedRec {
  recommendation_key: string;
  severity: 'urgent' | 'upcoming' | 'info';
  title: string;
  inputs: string;
  logic: string;
  action: string;
}

export interface LoadShedDaily {
  date: string;
  outage_hours: number;
  zones: string[];
  window_count: number;
}

export interface LoadShedCollision {
  schedule_id: string;
  work_date: string;
  shift: string;
  zone: string;
  outage_window: string;
  overlap_hours: number;
}

export interface LoadShedWindow {
  id: string;
  zone: string;
  start_time: string;
  end_time: string;
}

export interface LoadShedResponse {
  generated_at: string;
  total_outage_hours: number;
  window_count: number;
  collision_count: number;
  exposed_assets: number;
  daily: LoadShedDaily[];
  collisions: LoadShedCollision[];
  windows: LoadShedWindow[];
  recommendations: LoadShedRec[];
}

export function useLoadSheddingPlanner() {
  const { session } = useAuth();
  return useQuery<LoadShedResponse>({
    queryKey: ['load-shedding-planner'],
    enabled: !!session,
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke('load-shedding-planner', { body: {} });
      if (error) throw error;
      return data;
    },
    staleTime: 60_000,
  });
}
