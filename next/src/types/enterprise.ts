export interface EnterprisePost {
  id: string;
  title: string;
  companyName?: string;
  email?: string;
  content?: string;
  createdAt?: string | Date;
  status?: "active" | "closed";
  authorId?: string;
  postType?: string;
  announcementType?: string;

  // Special Offer Partnership properties
  partnershipName?: string;
  contractPeriodDuration?: string;

  // Activity Cooperation properties
  activityName?: string;
  activityType?: string;
  activityStartDate?: Date | string;
  activityEndDate?: Date | string;
  activityLocation?: string;
  applicationDeadline?: Date | string;
  cooperationType?: string;
  documentURL?: string;
  partnerRequirements?: string;

  // Internship Cooperation properties
  internshipTitle?: string;
  internshipDepartment?: string;
  internshipPeriod?: string;
  weeklyHours?: string;
  salary?: string;
  workLocation?: string;
  internshipApplicationDeadline?: Date | string;
  interviewMethod?: string;
  jobDescription?: string;
  requirements?: string;
  benefits?: string;
  additionalDocumentURL?: string;

  // Contact information
  contactName?: string;
  contactPhone?: string;
  contactEmail?: string;
}
