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

export type CourseDay = {
  id: string;
  dayNumber: number;
  title: string;
  explanation: string;
  resources: ResourceLink[];
  shopifyApplication: string;
  shopifyAccessPath: string;
  dailyTask: string;
  developerTips: string;
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

export type DaySubmission = {
  id: string;
  dayNumber: number;
  content: string;
  attachments: SubmissionAttachment[];
  submittedAt?: string;
  updatedAt?: string;
};
