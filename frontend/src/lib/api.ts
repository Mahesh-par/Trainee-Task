import type {
  AuthUser,
  CourseDay,
  CourseDayInput,
  DaySubmission,
  Task,
  TaskStatus,
  Trainee,
  TrainingStatus
} from "../types";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://172.168.16.39:6060/api";

export const getUploadsBaseUrl = () => API_BASE_URL.replace(/\/api\/?$/, "");

type ApiResponse<T> = {
  success: boolean;
  message: string;
  data: T;
};

type BackendUser = {
  _id?: string;
  id?: string;
  name: string;
  email: string;
  role: "admin" | "user";
  createdAt?: string;
};

type BackendAssignment = {
  _id: string;
  status: TaskStatus;
  task: {
    _id: string;
    title: string;
    description: string;
    startDate: string;
    endDate: string;
  };
  trainee?: BackendUser;
};

type BackendTask = {
  _id: string;
  title: string;
  description: string;
  startDate: string;
  endDate: string;
  assignedTrainees?: BackendUser[];
  assignments?: BackendAssignment[];
};

export const getToken = () => localStorage.getItem("authToken");

export const setAuthSession = (token: string, user: AuthUser) => {
  localStorage.setItem("authToken", token);
  localStorage.setItem("authUser", JSON.stringify(user));
};

export const clearAuthSession = () => {
  localStorage.removeItem("authToken");
  localStorage.removeItem("authUser");
};

export const getStoredUser = (): AuthUser | null => {
  const rawUser = localStorage.getItem("authUser");

  if (!rawUser) {
    return null;
  }

  return JSON.parse(rawUser) as AuthUser;
};

export const getTrainingMeta = (createdAt?: string) => {
  if (!createdAt) {
    return {
      joiningDate: "",
      daysCompleted: 0,
      daysRemaining: 15,
      progress: 0,
      status: "not_started" as const
    };
  }

  const joiningDate = new Date(createdAt);
  const today = new Date();
  joiningDate.setHours(0, 0, 0, 0);
  today.setHours(0, 0, 0, 0);

  const elapsedDays = Math.floor((today.getTime() - joiningDate.getTime()) / 86400000);
  const daysCompleted = Math.min(Math.max(elapsedDays + 1, 0), 15);
  const daysRemaining = Math.max(15 - daysCompleted, 0);
  const progress = Math.round((daysCompleted / 15) * 100);
  const status: TrainingStatus =
    elapsedDays < 0 ? "not_started" : daysCompleted >= 15 ? "completed" : "active";

  return {
    joiningDate: createdAt.slice(0, 10),
    daysCompleted,
    daysRemaining,
    progress,
    status
  };
};

export const createDayTimeline = (createdAt?: string) => {
  const { daysCompleted, status } = getTrainingMeta(createdAt);
  const currentDay = Math.min(Math.max(daysCompleted, 1), 15);

  return {
    currentDay,
    days: Array.from({ length: 15 }, (_, index) => {
      const day = index + 1;

      if (status === "completed" || day < currentDay) {
        return { day, state: "completed" as const };
      }

      if (status === "active" && day === currentDay) {
        return { day, state: "in_progress" as const };
      }

      return { day, state: "upcoming" as const };
    })
  };
};

export const apiRequest = async <T>(path: string, options: RequestInit = {}) => {
  const token = getToken();
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers
    }
  });

  const payload = (await response.json()) as ApiResponse<T>;

  if (!response.ok) {
    throw new Error(payload.message || "Request failed");
  }

  return payload.data;
};

const getUserId = (user: BackendUser) => user.id ?? user._id ?? "";

export const mapTrainee = (user: BackendUser): Trainee => ({
  id: getUserId(user),
  name: user.name,
  email: user.email,
  ...getTrainingMeta(user.createdAt)
});

export const mapAdminTask = (task: BackendTask): Task => {
  const assignments = task.assignments ?? [];
  const completedCount = assignments.filter((assignment) => assignment.status === "completed").length;
  const status =
    assignments.length > 0 && completedCount === assignments.length
      ? "completed"
      : assignments.some((assignment) => assignment.status === "in_progress")
        ? "in_progress"
        : "pending";

  return {
    id: task._id,
    title: task.title,
    description: task.description,
    startDate: task.startDate.slice(0, 10),
    endDate: task.endDate.slice(0, 10),
    status,
    assignedTo: (task.assignedTrainees ?? []).map((trainee) => trainee.name)
  };
};

export const mapTraineeTask = (assignment: BackendAssignment): Task => ({
  id: assignment.task._id,
  assignmentId: assignment._id,
  title: assignment.task.title,
  description: assignment.task.description,
  startDate: assignment.task.startDate.slice(0, 10),
  endDate: assignment.task.endDate.slice(0, 10),
  status: assignment.status,
  assignedTo: []
});

type BackendCourseDay = {
  _id: string;
  dayNumber: number;
  title: string;
  explanation: string;
  resources: CourseDay["resources"];
  shopifyApplication: string;
  shopifyAccessPath: string;
  dailyTask: string;
  developerTips: string;
  isPublished: boolean;
};

export const mapCourseDay = (courseDay: BackendCourseDay): CourseDay => ({
  id: courseDay._id,
  dayNumber: courseDay.dayNumber,
  title: courseDay.title,
  explanation: courseDay.explanation,
  resources: courseDay.resources ?? [],
  shopifyApplication: courseDay.shopifyApplication,
  shopifyAccessPath: courseDay.shopifyAccessPath,
  dailyTask: courseDay.dailyTask,
  developerTips: courseDay.developerTips,
  isPublished: courseDay.isPublished
});

export const emptyCourseDayInput = (dayNumber: number): CourseDayInput => ({
  dayNumber,
  title: "",
  explanation: "",
  resources: [{ label: "", url: "" }],
  shopifyApplication: "",
  shopifyAccessPath: "",
  dailyTask: "",
  developerTips: "",
  isPublished: false
});

type BackendSubmissionAttachment = {
  _id: string;
  originalName: string;
  storedName: string;
  mimeType: string;
  size: number;
};

type BackendDaySubmission = {
  _id: string;
  dayNumber: number;
  content: string;
  attachments?: BackendSubmissionAttachment[];
  createdAt?: string;
  updatedAt?: string;
};

export const mapDaySubmission = (submission: BackendDaySubmission): DaySubmission => ({
  id: submission._id,
  dayNumber: submission.dayNumber,
  content: submission.content ?? "",
  attachments: (submission.attachments ?? []).map((attachment) => ({
    id: attachment._id,
    originalName: attachment.originalName,
    storedName: attachment.storedName,
    mimeType: attachment.mimeType,
    size: attachment.size,
    url: `${getUploadsBaseUrl()}/uploads/${attachment.storedName}`
  })),
  submittedAt: submission.createdAt,
  updatedAt: submission.updatedAt
});

export const fetchMyDaySubmission = async (dayNumber: number) => {
  const data = await apiRequest<{ submission: BackendDaySubmission | null }>(
    `/submissions/day/${dayNumber}`
  );

  return data.submission ? mapDaySubmission(data.submission) : null;
};

export const submitDaySubmission = async ({
  dayNumber,
  content,
  files
}: {
  dayNumber: number;
  content: string;
  files: File[];
}) => {
  const token = getToken();
  const formData = new FormData();
  formData.append("dayNumber", String(dayNumber));
  formData.append("content", content);
  files.forEach((file) => formData.append("files", file));

  const response = await fetch(`${API_BASE_URL}/submissions`, {
    method: "POST",
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    },
    body: formData
  });

  const payload = (await response.json()) as ApiResponse<{ submission: BackendDaySubmission }>;

  if (!response.ok) {
    throw new Error(payload.message || "Failed to submit work");
  }

  return mapDaySubmission(payload.data.submission);
};

export const deleteSubmissionAttachment = async (dayNumber: number, attachmentId: string) => {
  const data = await apiRequest<{ submission: BackendDaySubmission }>(
    `/submissions/day/${dayNumber}/attachments/${attachmentId}`,
    { method: "DELETE" }
  );

  return mapDaySubmission(data.submission);
};

export const fetchTraineeSubmissions = async (traineeId: string) => {
  const data = await apiRequest<{ submissions: BackendDaySubmission[] }>(
    `/submissions/trainee/${traineeId}`
  );

  return data.submissions.map(mapDaySubmission);
};
