// src/common/enums/complaint.enum.ts
export enum ComplaintCategory {
  PRODUCT_QUALITY = 'product_quality',
  DELIVERY_ISSUE = 'delivery_issue',
  BILLING = 'billing',
  TECHNICAL = 'technical',
  SERVICE = 'service',
  OTHER = 'other',
}

export enum ComplaintStatus {
  OPEN = 'open',
  IN_PROGRESS = 'in_progress',
  RESOLVED = 'resolved',
  AWAITING_FEEDBACK = 'awaiting_feedback',
  CLOSED = 'closed',
  REOPENED = 'reopened',
}

export enum PriorityLevel {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical',
}
