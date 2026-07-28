import type { ChangePlan, ApprovalMethod } from '../../domain/types.js';

export interface ExternalUrlResult {
  method: ApprovalMethod;
  decision: 'APPROVE' | 'REJECT';
  approvalUrl: string;
}

export function getExternalApprovalUrl(plan: ChangePlan, baseUrl: string): ExternalUrlResult {
  return {
    method: 'EXTERNAL_URL',
    decision: 'APPROVE',
    approvalUrl: `${baseUrl}/review/${encodeURIComponent(plan.id)}`,
  };
}
