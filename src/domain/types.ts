export type PlanStatus =
  | 'PENDING_APPROVAL'
  | 'APPROVED'
  | 'REJECTED'
  | 'STALE'
  | 'EXECUTING'
  | 'SUCCEEDED'
  | 'FAILED';

export type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH';

export type PlanAction =
  | 'CREATE_APPLICATION'
  | 'BACKUP_APPLICATION'
  | 'RESTORE_APPLICATION'
  | 'DELETE_APPLICATION';

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
  applicationStatus?: string;
  backupId?: string;
  appFingerprint?: string;
}

export interface ApprovalRecord {
  decision: 'APPROVE' | 'REJECT';
  planHash: string;
  approvedAt: string;
  approvedBy: string;
  source: 'review-ui' | 'mcp-elicitation' | 'test';
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
