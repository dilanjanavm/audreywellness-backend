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
  RECEIVED = 'received',
  ASSIGNED = 'assigned',
  IN_PROGRESS = 'in_progress',
  ON_HOLD = 'on_hold',
  AWAITING_CUSTOMER = 'awaiting_customer',
  RESOLVED = 'resolved',
  CLOSED = 'closed',
  REJECTED = 'rejected',
  // Legacy statuses for backward compatibility
  OPEN = 'open', // Maps to RECEIVED
  AWAITING_FEEDBACK = 'awaiting_feedback', // Maps to AWAITING_CUSTOMER
  REOPENED = 'reopened', // Maps to RECEIVED
}

export enum PriorityLevel {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical',
}
