// 需求相關的類型定義

/**
 * 需求篩選參數的接口定義
 */
export interface DemandFilters {
  selectedDemand: string;
  selectedEventType: string;
  selectedEventNature: string;
  startDate: string;
  endDate: string;
  minParticipants: string;
  itemType: string;
  moneyMinAmount: string;
  moneyMaxAmount: string;
  speakerType: string;
}

/**
 * 需求文章的接口定義
 */
export interface DemandPost {
  id: string;
  title?: string;
  content?: string;
  postType?: string;
  author?: string;
  authorId?: string;
  organizationName?: string;
  organizationIcon?: string;
  eventStart?: string;
  eventEnd?: string;
  eventDate?: string;
  demandType?: string;
  eventNature?: string;
  itemType?: string;
  customItems?: string[];
  moneyLowerLimit?: string;
  moneyUpperLimit?: string;
  speakerType?: string;
  tags?: string[];
  createdAt?: any;
  selectedDemands?: string[];
  eventName?: string;
  eventType?: string;
  location?: string;
  isDraft?: boolean;
  email?: string;
  purposeType?: string;
  estimatedParticipants?: string;
  participationType?: string;
  eventEndDate?: string;
  eventDescription?: string;
  feedbackDetails?: string;
  sponsorDeadline?: string;
}
