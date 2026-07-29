import type { ChangePlan, ApprovalMethod, ApprovalRecord } from '../domain/types.js';
import type { PlanStore } from '../stores/plan-store.js';
import { config } from '../config.js';
import { requestFormApproval, type ElicitFn } from './providers/form-elicitation.js';
import { requestUrlApproval, type UrlElicitFn } from './providers/url-elicitation.js';
import { getExternalApprovalUrl } from './providers/external-url.js';

type ApprovalOutcome =
  | { status: 'approved'; record: ApprovalRecord }
  | { status: 'declined'; approvalMethod: ApprovalMethod }
  | { status: 'cancelled' }
  | { status: 'url_fallback'; approvalUrl: string };

export class ApprovalService {
  constructor(
    private readonly store: PlanStore,
    private readonly elicitationFn: ElicitFn | undefined,
    private readonly urlElicitationFn: UrlElicitFn | undefined,
  ) {}

  async requestApproval(plan: ChangePlan, approvedBy = 'human'): Promise<ApprovalOutcome> {
    const mode = config.approvalMode;

    if (mode === 'form' || mode === 'auto') {
      if (this.elicitationFn) {
        try {
          const result = await requestFormApproval(plan, this.elicitationFn);
          if (result.cancelled) return { status: 'cancelled' };
          if (result.decision === 'APPROVE') {
            const record = await this.recordApproval(plan, 'APPROVE', result.method, approvedBy);
            return { status: 'approved', record };
          }
          return { status: 'declined', approvalMethod: result.method };
        } catch (e) {
          console.error('[approval] form elicitation failed, falling back:', e);
          if (mode === 'form') return { status: 'cancelled' };
        }
      }
      if (mode === 'form') return { status: 'cancelled' };
    }

    if (mode === 'url' || mode === 'auto') {
      if (this.urlElicitationFn) {
        try {
          const reviewUrl = `${config.approvalPublicBaseUrl}/review/${encodeURIComponent(plan.id)}`;
          const result = await requestUrlApproval(plan, this.urlElicitationFn, reviewUrl);
          if (result.decision === 'APPROVE') {
            const record = await this.recordApproval(plan, 'APPROVE', result.method, approvedBy);
            return { status: 'approved', record };
          }
          return { status: 'declined', approvalMethod: result.method };
        } catch (e) {
          console.error('[approval] URL elicitation failed, falling back:', e);
          if (mode === 'url') return { status: 'cancelled' };
        }
      }
      if (mode === 'url') return { status: 'cancelled' };
    }

    const fallback = getExternalApprovalUrl(plan, config.approvalPublicBaseUrl);
    return { status: 'url_fallback', approvalUrl: fallback.approvalUrl };
  }

  async recordApproval(
    plan: ChangePlan,
    decision: 'APPROVE' | 'REJECT',
    method: ApprovalMethod,
    approvedBy = 'human',
  ): Promise<ApprovalRecord> {
    const record: ApprovalRecord = {
      decision,
      planHash: plan.hash,
      approvedAt: new Date().toISOString(),
      approvedBy,
      approvalMethod: method,
    };
    await this.store.setApproval(plan.id, record);
    return record;
  }

  async getApprovalStatus(planId: string): Promise<ApprovalRecord | undefined> {
    const plan = await this.store.get(planId);
    return plan?.approval;
  }
}
