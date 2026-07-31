export type PlanStatus =
  | 'DRAFT'
  | 'READY_FOR_REVIEW'
  | 'PENDING_APPROVAL'
  | 'APPROVED'
  | 'REJECTED'
  | 'CANCELLED'
  | 'STALE'
  | 'VALIDATING'
  | 'EXECUTING'
  | 'SUCCEEDED'
  | 'FAILED';

export type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH';

export type PlanAction =
  | 'CREATE_APPLICATION'
  | 'BACKUP_APPLICATION'
  | 'RESTORE_APPLICATION'
  | 'DELETE_APPLICATION';

export type ApprovalMethod = 'MCP_ELICITATION' | 'URL_ELICITATION' | 'EXTERNAL_URL';

export interface GitOwnerRef {
  id: string;
  name: string;
  provider: string;
  avatarUrl?: string;
}

export interface GitRepoRef {
  id: string;
  name: string;
  owner: string;
  provider: string;
  fullName?: string;
  defaultBranch?: string;
  private?: boolean;
}

export interface GitBranchRef {
  name: string;
  commitSha?: string;
}

export type ErrorCode =
  | 'PLAN_NOT_FOUND'
  | 'PLAN_EXPIRED'
  | 'PLAN_STALE'
  | 'PLAN_REJECTED'
  | 'PLAN_ALREADY_EXECUTED'
  | 'PLAN_INTEGRITY_FAILED'
  | 'PLAN_OWNER_MISMATCH'
  | 'APPROVAL_REQUIRED'
  | 'APPROVAL_CANCELLED'
  | 'EXECUTION_FAILED'
  | 'DEVPanel API_ERROR'
  | 'INTERNAL_ERROR';

export interface ElicitationResult {
  action: 'accept' | 'decline' | 'cancel';
  content?: Record<string, unknown>;
}

export interface ApplicationRef {
  id: string;
  projectId: string;
  workspaceId: string;
  name?: string;
  hostname?: string;
  status?: string;
  originBranch?: string;
  raw?: unknown;
}

export interface BackupRef {
  id: string;
  applicationId: string;
  createdAt?: string;
  type?: string;
  raw?: unknown;
}

export interface PlanStep {
  order: number;
  operation: string;
  description: string;
  mutates: boolean;
}

export interface Preconditions {
  applicationId?: string;
  projectId?: string;
  workspaceId?: string;
  applicationStatus?: string;
  backupId?: string;
  appFingerprint?: string;
}

export interface ApprovalRecord {
  decision: 'APPROVE' | 'REJECT';
  planHash: string;
  approvedAt: string;
  approvedBy: string;
  approvalMethod: ApprovalMethod;
}

export interface ChangePlan {
  id: string;
  version: 1;
  action: PlanAction;
  status: PlanStatus;
  risk: RiskLevel;
  summary: string;
  createdAt: string;
  expiresAt: string;
  hash: string;
  ownerId: string;
  target: Record<string, unknown>;
  proposedInput: Record<string, unknown>;
  steps: PlanStep[];
  preconditions: Preconditions;
  expectedResult: string;
  rollback: string;
  approval?: ApprovalRecord;
  execution?: {
    startedAt: string;
    finishedAt?: string;
    result?: unknown;
    error?: string;
  };
}
