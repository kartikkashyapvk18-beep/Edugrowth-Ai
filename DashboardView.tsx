export type LeadStatus = 'Hot' | 'Warm' | 'Cold' | 'Converted';

export interface TimelineEvent {
  id: string;
  type: 'created' | 'call' | 'whatsapp' | 'status_change' | 'converted' | 'note';
  title: string;
  description: string;
  timestamp: string;
}

export interface Lead {
  id: string;
  name: string;
  email: string;
  phone: string;
  targetCourse: string;
  status: LeadStatus;
  notes: string;
  addedAt: string;
  lastContacted: string; // descriptive string, e.g., "2 hours ago" or ISO date
  timeline: TimelineEvent[];
}

export interface Student {
  id: string;
  name: string;
  email: string;
  phone: string;
  targetCourse: string;
  batch: string;
  feesStatus: 'Paid' | 'Partial' | 'Unpaid';
  onboardingProgress: number; // percentage (0 - 100)
  enrolledAt: string;
}

export interface Course {
  id: string;
  name: string;
  code: string;
  description?: string;
}

export interface MessageTemplate {
  id: string;
  title: string;
  content: string;
  type: 'Syllabus' | 'PYQs' | 'MockTest' | 'Prospectus' | 'Custom';
}

export interface CallLogRequest {
  leadId: string;
  outcome: string;
  duration: number; // in seconds
  notes: string;
  nextStatus?: LeadStatus;
}

export interface WhatsAppSendRequest {
  leadId: string;
  templateId: string;
  customText?: string;
}

export interface AIDraftRequest {
  leadId: string;
  promptNotes?: string;
  tone?: 'professional' | 'encouraging' | 'urgent';
  templateType: string;
}
