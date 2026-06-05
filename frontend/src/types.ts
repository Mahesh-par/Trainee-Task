export type TaskStatus = "pending" | "in_progress" | "completed";
export type TrainingStatus = "active" | "completed" | "not_started";

export type DayState = "completed" | "in_progress" | "upcoming";

export type Trainee = {
  id: string;
  name: string;
  email: string;
  progress: number;
  joiningDate?: string;
  daysCompleted?: number;
  daysRemaining?: number;
  status?: TrainingStatus;
};

export type AuthUser = {
  id: string;
  name: string;
  email: string;
  role: "admin" | "user";
  createdAt?: string;
};

export type Task = {
  id: string;
  assignmentId?: string;
  title: string;
  description: string;
  startDate: string;
  endDate: string;
  status: TaskStatus;
  assignedTo: string[];
};

export type ResourceLink = {
  label: string;
  url: string;
};

export type CourseSectionType = "text" | "resources";
export type CourseSectionVariant = "default" | "task" | "tips" | "shopify" | "location";
export type CourseSectionIcon =
  | "none"
  | "lightbulb"
  | "target"
  | "map-pin"
  | "shopping-bag"
  | "book-open"
  | "check-circle"
  | "info"
  | "zap"
  | "clipboard"
  | "star"
  | "flame";
export type CourseSectionColor = "default" | "amber" | "orange" | "rose" | "red" | "emerald";

export type CourseSection = {
  id: string;
  label: string;
  type: CourseSectionType;
  order: number;
  content?: string;
  resources?: ResourceLink[];
  icon?: CourseSectionIcon;
  color?: CourseSectionColor;
  variant?: CourseSectionVariant;
};

export type CourseDay = {
  id: string;
  dayNumber: number;
  title: string;
  sections: CourseSection[];
  isPublished: boolean;
};

export type CourseDayInput = Omit<CourseDay, "id">;

export type SubmissionAttachment = {
  id: string;
  originalName: string;
  storedName: string;
  mimeType: string;
  size: number;
  url: string;
};

export type SubmissionReviewStatus = "done" | "need_improvement" | "cancel";

export type SubmissionMessage = {
  id: string;
  role: "admin" | "trainee";
  body: string;
  reviewStatus?: SubmissionReviewStatus | null;
  createdAt: string;
};

export type ProgramSettings = {
  totalDays: number;
  minimumTotalDays: number;
};

export type TraineeDayProgress = {
  unlockedDay: number;
  doneDays: number[];
  currentDay: number;
  programCompleted: boolean;
  totalDays: number;
};

export type DaySubmission = {
  id: string;
  dayNumber: number;
  content: string;
  attachments: SubmissionAttachment[];
  submittedAt?: string;
  updatedAt?: string;
  reviewStatus?: SubmissionReviewStatus | null;
  adminComment?: string;
  reviewedAt?: string;
  reviewedByName?: string;
  traineeReply?: string;
  traineeRepliedAt?: string;
  adminReplyRead?: boolean;
  messages: SubmissionMessage[];
};
