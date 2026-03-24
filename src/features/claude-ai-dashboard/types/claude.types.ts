export interface ClaudeAIStatus {
  configured: boolean;
  model: string;
  stats: {
    totalAnalyses: number;
    todayAnalyses: number;
    avgResponseTime: number;
    cacheHitRate: number;
  };
}

export interface ClaudeAIDashboard {
  stats: ClaudeAIStatus["stats"];
  recentAnalyses: EmailAnalysis[];
  alerts: InstallationAlert[];
}

export interface EmailAnalysis {
  id: number;
  emailId: number;
  installationId?: number;
  type: "GENEHMIGUNG" | "RUECKFRAGE" | "ABLEHNUNG" | "INFO" | "SONSTIGES";
  confidence: number;
  summary: string;
  requirements?: string[];
  deadline?: string;
  suggestedAction?: string;
  createdAt: string;
}

export interface InstallationAlert {
  installationId: number;
  type: string;
  severity: "critical" | "warning" | "info";
  message: string;
  suggestedAction?: string;
  dueDate?: string;
}

export interface QualityCheck {
  installationId: number;
  score: number;
  issues: Array<{ field: string; severity: string; message: string }>;
  suggestions: string[];
}

export interface InstallationInsight {
  summary: string;
  quality: QualityCheck;
  alerts: InstallationAlert[];
  nextSteps: string[];
}

export interface AssistantResponse {
  response: string;
  actions?: Array<{ type: string; description: string; data: Record<string, unknown> }>;
  executed?: boolean;
}
