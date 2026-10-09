// ---------- GAMIFICATION BADGE TYPE ----------
export type BadgeType =
  | 'GOLD_PATRON'
  | 'SILVER_PATRON'
  | 'BRONZE_PATRON'
  | 'SPEED_DEMON'
  | 'FAST_RESPONDER'
  | 'VERIFIED_RUNNER'
  | 'STREAK';

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
  preferences?: string;

  location_hint?: string;
  availability_window?: string;

  bonus_tokens?: number;

  giver?: number | string;
  taker?: number | string;
  giver_badge?: BadgeType | null;
  giver_streak?: number;
  taker_badge?: BadgeType | null;
  taker_streak?: number;
  attachment?: string | null;
  created_at?: string;
}

export interface TaskSpecs {
  deliverable_format?: string;
  scope_length?: string;
  criteria?: string;
}

// ---------- LEADERBOARD ----------
export interface SpeedRunnerEntry {
  rank: number;
  username: string;
  reg_no: string;
  speed_streak: number;
  fast_tasks: number;
  tasks_completed: number;
  badge_type: BadgeType | null;
}

export interface GoldPatronEntry {
  rank: number;
  username: string;
  reg_no: string;
  tasks_posted: number;
  is_gold_patron: boolean;
  badge_type: BadgeType | null;
}

export interface LeaderboardData {
  speed_runners: SpeedRunnerEntry[];
  gold_patrons: GoldPatronEntry[];
}

// ---------- AUTH & PROFILE ----------
export interface User {
  id: number;
  username: string;
  email: string;
  name: string;
}

export interface UserProfile {
  username: string;
  registration_number?: string;
  college_verified: boolean;
  upi_id?: string;
  earnings_upi_id?: string;
  earnings_upi_verified: boolean;
  refund_upi_id?: string;
  refund_upi_verified: boolean;
  tasks_posted_count: number;
  tasks_completed_count: number;
  speed_streak: number;
  fast_tasks_counter: number;
  is_gold_patron: boolean;
  badge_type?: BadgeType | null;
}

export interface LoginPayload {
  username: string;
  password: string;
}

export interface RegisterPayload {
  username: string;
  email: string;
  password: string;
  registration_number?: string;
}