import type { ChangePlan, ElicitationResult, ApprovalMethod } from '../../domain/types.js';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type UrlElicitFn = (...args: any[]) => Promise<ElicitationResult>;

export interface UrlApprovalResult {
  method: ApprovalMethod;
  decision: 'APPROVE' | 'REJECT';
}

export async function requestUrlApproval(
  plan: ChangePlan,
  elicitationFn: UrlElicitFn,
  reviewUrl: string,
): Promise<UrlApprovalResult> {
  const message = [
    `DevPanel Change Plan requires your review:`,
    ``,
    `Action: ${plan.action.replace(/_/g, ' ')}`,
    `Risk: ${plan.risk}`,
    `Summary: ${plan.summary}`,
    `Plan ID: ${plan.id}`,
    ``,
    `Open the review URL to approve or reject this exact plan.`,
  ].join('\n');

  const result: ElicitationResult = await elicitationFn({
    mode: 'url',
    message,
    elicitationId: plan.id,
    url: reviewUrl,
  });

  if (result.action === 'accept') {
    return { method: 'URL_ELICITATION', decision: 'APPROVE' };
  }

  return { method: 'URL_ELICITATION', decision: 'REJECT' };
}
