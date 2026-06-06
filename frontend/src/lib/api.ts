import { resolveSectionStyle } from "./sectionStyle";
import type {
  AuthUser,
  CourseDay,
  CourseSection,
  CurriculumTrack,
  DaySubmission,
  SubmissionMessage,
  SubmissionReviewStatus,
  ProgramSettings,
  TraineeDayProgress,
  Task,
  TaskStatus,
  Trainee,
  TrainingStatus
} from "../types";
import { DEFAULT_CURRICULUM_TRACK } from "./curriculumTracks";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:6060/api";

export const DEFAULT_TOTAL_DAYS = 15;

export const getUploadsBaseUrl = () => {
  if (API_BASE_URL.startsWith("http://") || API_BASE_URL.startsWith("https://")) {
    return API_BASE_URL.replace(/\/api\/?$/, "");
  }

  return "";
};

export const getAttachmentUrl = (storedName: string) =>
  `${getUploadsBaseUrl()}/uploads/${encodeURIComponent(storedName)}`;

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
  traineeRole?: CurriculumTrack;
  createdAt?: string;
};

const withTrackQuery = (path: string, track?: CurriculumTrack) => {
  if (!track) {
    return path;
  }

  const separator = path.includes("?") ? "&" : "?";
  return `${path}${separator}track=${encodeURIComponent(track)}`;
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

export const createDayTimelineFromProgress = (progress: TraineeDayProgress) => ({
  currentDay: progress.currentDay,
  days: Array.from({ length: progress.totalDays }, (_, index) => {
    const day = index + 1;

    if (progress.doneDays.includes(day)) {
      return { day, state: "completed" as const };
    }

    if (day === progress.unlockedDay) {
      return { day, state: "in_progress" as const };
    }

    return { day, state: "upcoming" as const };
  })
});

export const fetchTraineeDayProgress = async () => {
  const data = await apiRequest<{ progress: TraineeDayProgress }>("/submissions/my-progress");
  return data.progress;
};

export const fetchProgramSettings = async (track?: CurriculumTrack) => {
  const data = await apiRequest<ProgramSettings>(withTrackQuery("/program-settings", track));
  return data;
};

export const updateProgramSettings = async (totalDays: number, track?: CurriculumTrack) => {
  const data = await apiRequest<ProgramSettings>(withTrackQuery("/program-settings", track), {
    method: "PATCH",
    body: JSON.stringify({ totalDays, track })
  });

  return data;
};

export const updateTraineeRole = async (traineeId: string, traineeRole: CurriculumTrack) => {
  const data = await apiRequest<{ trainee: BackendUser }>(`/users/trainees/${traineeId}/role`, {
    method: "PATCH",
    body: JSON.stringify({ traineeRole })
  });

  return mapTrainee(data.trainee);
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

  const rawText = await response.text();
  let payload: ApiResponse<T>;

  try {
    payload = rawText
      ? (JSON.parse(rawText) as ApiResponse<T>)
      : {
          success: false,
          message: `Empty response from server (${response.status})`,
          data: null as T
        };
  } catch {
    throw new Error(
      rawText.trim() || `Request failed with status ${response.status}. Check that the backend is running on port 6060.`
    );
  }

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
  traineeRole: user.traineeRole ?? DEFAULT_CURRICULUM_TRACK,
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
  sections?: CourseSection[];
  isPublished: boolean;
};

export const mapCourseDay = (courseDay: BackendCourseDay): CourseDay => ({
  id: courseDay._id,
  dayNumber: courseDay.dayNumber,
  title: courseDay.title,
  sections: (courseDay.sections ?? []).map((section, index) => {
    const { icon, color } = resolveSectionStyle(section);

    return {
      ...section,
      order: section.order ?? index,
      resources: section.resources ?? [],
      content: section.content ?? "",
      icon,
      color
    };
  }),
  isPublished: courseDay.isPublished
});

type BackendSubmissionAttachment = {
  _id: string;
  originalName: string;
  storedName: string;
  mimeType: string;
  size: number;
};

type BackendReviewer = {
  name: string;
  email?: string;
};

type BackendDaySubmission = {
  _id: string;
  dayNumber: number;
  content: string;
  attachments?: BackendSubmissionAttachment[];
  createdAt?: string;
  updatedAt?: string;
  reviewStatus?: SubmissionReviewStatus | null;
  adminComment?: string;
  reviewedAt?: string;
  reviewedBy?: BackendReviewer | string | null;
  traineeReply?: string;
  traineeRepliedAt?: string;
  adminReplyRead?: boolean;
  messages?: Array<{
    _id?: string;
    id?: string;
    role: "admin" | "trainee";
    body: string;
    reviewStatus?: SubmissionReviewStatus | null;
    createdAt?: string;
  }>;
};

const mapSubmissionMessages = (
  submission: BackendDaySubmission
): SubmissionMessage[] => {
  if (submission.messages && submission.messages.length > 0) {
    return submission.messages
      .map((message, index) => ({
        id: message._id ?? message.id ?? `message-${index}`,
        role: message.role,
        body: message.body ?? "",
        reviewStatus: message.reviewStatus ?? null,
        createdAt: message.createdAt ?? new Date().toISOString()
      }))
      .filter((message) => message.body.trim().length > 0)
      .sort((left, right) => left.createdAt.localeCompare(right.createdAt));
  }

  const legacyMessages: SubmissionMessage[] = [];

  if (submission.adminComment?.trim() && submission.reviewStatus) {
    legacyMessages.push({
      id: "legacy-admin",
      role: "admin",
      body: submission.adminComment,
      reviewStatus: submission.reviewStatus,
      createdAt: submission.reviewedAt ?? new Date().toISOString()
    });
  }

  if (submission.traineeReply?.trim()) {
    legacyMessages.push({
      id: "legacy-trainee",
      role: "trainee",
      body: submission.traineeReply,
      createdAt: submission.traineeRepliedAt ?? new Date().toISOString()
    });
  }

  return legacyMessages;
};

export const mapDaySubmission = (submission: BackendDaySubmission): DaySubmission => {
  const reviewedBy =
    submission.reviewedBy && typeof submission.reviewedBy === "object"
      ? submission.reviewedBy.name
      : undefined;

  return {
    id: submission._id,
    dayNumber: submission.dayNumber,
    content: submission.content ?? "",
    attachments: (submission.attachments ?? []).map((attachment) => ({
      id: attachment._id,
      originalName: attachment.originalName,
      storedName: attachment.storedName,
      mimeType: attachment.mimeType,
      size: attachment.size,
      url: getAttachmentUrl(attachment.storedName)
    })),
    submittedAt: submission.createdAt,
    updatedAt: submission.updatedAt,
    reviewStatus: submission.reviewStatus ?? null,
    adminComment: submission.adminComment ?? "",
    reviewedAt: submission.reviewedAt,
    reviewedByName: reviewedBy,
    traineeReply: submission.traineeReply ?? "",
    traineeRepliedAt: submission.traineeRepliedAt,
    adminReplyRead: submission.adminReplyRead ?? true,
    messages: mapSubmissionMessages(submission)
  };
};

export const updateSubmissionReview = async ({
  submissionId,
  reviewStatus,
  adminComment
}: {
  submissionId: string;
  reviewStatus: SubmissionReviewStatus;
  adminComment: string;
}) => {
  const data = await apiRequest<{ submission: BackendDaySubmission }>(
    `/submissions/${submissionId}/review`,
    {
      method: "PATCH",
      body: JSON.stringify({ reviewStatus, adminComment })
    }
  );

  return mapDaySubmission(data.submission);
};

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

export const submitTraineeReply = async (dayNumber: number, traineeReply: string) => {
  const data = await apiRequest<{ submission: BackendDaySubmission }>(
    `/submissions/day/${dayNumber}/reply`,
    {
      method: "PATCH",
      body: JSON.stringify({ traineeReply })
    }
  );

  return mapDaySubmission(data.submission);
};

export const fetchUnreadReplyCounts = async () => {
  const data = await apiRequest<{
    unreadReplies: Array<{ traineeId: string; count: number }>;
  }>("/submissions/unread-replies");

  return new Map(data.unreadReplies.map((item) => [item.traineeId, item.count]));
};

export const markTraineeRepliesAsRead = async (traineeId: string) => {
  await apiRequest(`/submissions/trainee/${traineeId}/mark-replies-read`, {
    method: "PATCH"
  });
};
