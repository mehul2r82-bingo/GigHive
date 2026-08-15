// ---------- TASK STATUS ----------
export type TaskStatus =
  | "DRAFT"
  | "PAYMENT_PENDING"
  | "OPEN"
  | "ACCEPTED"
  | "SUBMITTED"
  | "COMPLETED"
  | "FAILED"
  | "CANCELLED";

// ---------- TASK ----------
export interface Task {
  id: number;
  title: string;
  status: TaskStatus;
  price: number;

  task_type?: number;

  band?: "short" | "medium" | "long";
  mode?: "online" | "offline" | "hybrid";

  deadline?: string;
  details?: string;

  location_hint?: string;
  availability_window?: string;

  bonus_tokens?: number;

  giver?: number;
  created_at?: string;
}

// ---------- AUTH ----------
export interface User {
  id: number;
  username: string;
  email: string;
  name: string;
}

export interface LoginPayload {
  username: string;
  password: string;
}

export interface RegisterPayload {
  username: string;
  email: string;
  password: string;
}