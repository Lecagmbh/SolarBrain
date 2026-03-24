export interface DashboardActivityApi {
  id: number;
  type: string;
  message: string;
  timestamp: string;
  updatedAt: string;
  status: string;
  userId?: number;
  userName?: string;
  customerName?: string;
  installationId?: number;
  installationPublicId?: string;
  publicId?: string;
  location?: string;
  gridOperator?: string;
  hasCriticalMissingDocuments?: boolean;
  missingDocumentsCount?: number;
}
export interface DashboardStatsApi {
  total: number;
  open: number;
  completed: number;
  pending: number;
  avgDays: number;
}
