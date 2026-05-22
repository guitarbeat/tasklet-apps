export interface DailyStat {
  date: string;
  prs_merged: number;
  prs_closed: number;
  sessions_created: number;
  sessions_completed: number;
  repos_cleared: number;
}

export interface PrAction {
  id: number;
  repo: string;
  pr_number: number;
  action: string;
  title: string;
  reason: string;
  created_at: string;
}

export interface MonitoredRepo {
  repo: string;
  owner: string;
  priority: string;
  active: number;
  default_branch: string;
  notes: string | null;
}

export interface JulesSession {
  session_id: string;
  repo: string;
  focus: string | null;
  status: string;
  pr_number: number | null;
  created_at: string;
  updated_at: string | null;
}

export interface TriggerRun {
  run_id: number;
  timestamp: string;
  repos_scanned: number;
  prs_processed: number;
  errors: string | null;
}

export interface LiveRepoPRs {
  repo: string;
  count: number;
  loading: boolean;
  error: boolean;
}
