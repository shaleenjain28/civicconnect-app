// ─── Shared TypeScript Types ───
// Central type definitions used across the backend.

export interface UserPayload {
  id: string;
  email: string;
  role?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface NearbyQuery {
  lat: number;
  lon: number;
  radius: number;
  page: number;
  limit: number;
}

export interface AIAnalysisResult {
  title: string;
  description: string;
  department: string;
  criticality: 'critical' | 'high' | 'medium' | 'low';
}

export interface UserStats {
  totalReports: number;
  totalUpvotesReceived: number;
  issuesResolved: number;
  issuesPending: number;
  issuesInProgress: number;
}

export const DEPARTMENTS = [
  { name: 'Water Department', slug: 'water', icon: '🚰', color: '#0EA5E9', description: 'Water supply, leaks, contamination, drainage' },
  { name: 'Roads & Infrastructure', slug: 'roads', icon: '🛣️', color: '#F59E0B', description: 'Potholes, road damage, sidewalks, bridges' },
  { name: 'Electricity', slug: 'electricity', icon: '⚡', color: '#EAB308', description: 'Streetlights, power outages, exposed wires' },
  { name: 'Sanitation & Waste', slug: 'sanitation', icon: '🗑️', color: '#10B981', description: 'Garbage collection, drains, illegal dumping' },
  { name: 'Traffic & Transport', slug: 'traffic', icon: '🚦', color: '#EF4444', description: 'Traffic signals, parking, highway issues' },
  { name: 'Urban Development', slug: 'urban', icon: '🏗️', color: '#8B5CF6', description: 'Construction safety, building violations' },
  { name: 'Parks & Environment', slug: 'parks', icon: '🌳', color: '#22C55E', description: 'Parks, trees, pollution, stray animals' },
  { name: 'General Administration', slug: 'general', icon: '📋', color: '#6B7280', description: 'Policy, miscellaneous civic issues' },
] as const;

export const CRITICALITY_CONFIG = {
  critical: { color: '#DC2626', label: 'Critical', mapColor: '#DC2626' },
  high:     { color: '#EA580C', label: 'High',     mapColor: '#EA580C' },
  medium:   { color: '#CA8A04', label: 'Medium',   mapColor: '#CA8A04' },
  low:      { color: '#16A34A', label: 'Low',      mapColor: '#16A34A' },
} as const;
