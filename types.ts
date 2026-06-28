export type SeverityLevel = "Low" | "Medium" | "High" | "Critical";
export type IssueStatus = "Pending" | "In_Progress" | "Resolved";

export interface GeoLocation {
  lat: number;
  lng: number;
  ward: string;
  address: string;
}

export interface GeminiAnalysis {
  detectedIssue: string;
  confidenceScore: number;
  severity: SeverityLevel;
  urgency: string;
  suggestedDepartment: string;
  explanation: string;
  priorityLevel: "Low" | "Medium" | "High" | "Critical";
  suggestedAuthority: string;
  recommendedResponseTime: string;
  summary: string;
}

export interface CivicReport {
  id: string;
  title: string;
  description: string;
  category: string;
  location: GeoLocation;
  status: IssueStatus;
  severity: SeverityLevel;
  contactDetails?: {
    name?: string;
    phone?: string;
    email?: string;
  };
  createdAt: string;
  hasVoice?: boolean;
  voiceText?: string;
  imageUrl?: string;
  analysis?: GeminiAnalysis;
  isUrgent?: boolean;
}

export interface Hotspot {
  id: string;
  ward: string;
  issueType: string;
  count: number;
  description: string;
  severity: SeverityLevel;
  lat: number;
  lng: number;
}

export interface PredictiveAlert {
  id: string;
  title: string;
  type: string;
  description: string;
  trend: "Increasing" | "Stable" | "Decreasing";
  severity: SeverityLevel;
  urgency: "Immediate" | "Monitor" | "Action Required";
  department: string;
  reasoning: string;
  createdAt: string;
}

export interface NeighborhoodHealthScore {
  score: number;
  status: "Excellent" | "Good" | "Average" | "Poor" | "Critical";
  breakdown: {
    cleanliness: number;
    roadQuality: number;
    safety: number;
    infrastructure: number;
  };
  activeIssuesCount: number;
  resolvedIssuesCount: number;
}

export interface ChatMessage {
  id: string;
  sender: "user" | "assistant";
  text: string;
  timestamp: string;
}

export interface Insight {
  id: string;
  category: string;
  text: string;
  percentage: number;
  iconName: string;
}
