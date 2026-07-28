import type { ChangePlan, ElicitationResult, ApprovalMethod } from '../../domain/types.js';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type ElicitFn = (...args: any[]) => Promise<ElicitationResult>;

function planSummary(plan: ChangePlan): string {
  const lines = [
    `DevPanel Change Plan`,
    ``,
    `Action: ${plan.action.replace(/_/g, ' ')}`,
    `Risk: ${plan.risk}`,
    `Summary: ${plan.summary}`,
    ``,
    `Plan ID: ${plan.id}`,
    `Hash: ${plan.hash}`,
    `Expires: ${plan.expiresAt}`,
  ];

  const t = plan.target as Record<string, unknown>;
  if (t.applicationName || t.applicationId) {
    lines.push(``, `Target:`);
    if (t.applicationName) lines.push(`  Application: ${t.applicationName}`);
    if (t.applicationId) lines.push(`  Application ID: ${t.applicationId}`);
    if (t.workspaceId) lines.push(`  Workspace: ${t.workspaceId}`);
    if (t.repository) lines.push(`  Repository: ${t.repository}`);
    if (t.branch) lines.push(`  Branch: ${t.branch}`);
  }

  lines.push(``, `Planned operations:`);
  for (const s of plan.steps) {
    lines.push(`  ${s.order}. ${s.description}${s.mutates ? ' [WILL CHANGE]' : ''}`);
  }

  lines.push(``, `Expected result: ${plan.expectedResult}`);
  lines.push(`Rollback: ${plan.rollback}`);

  return lines.join('\n');
}

export interface FormApprovalResult {
  method: ApprovalMethod;
  decision: 'APPROVE' | 'REJECT';
  cancelled?: boolean;
}

export async function requestFormApproval(
  plan: ChangePlan,
  elicitationFn: ElicitFn,
): Promise<FormApprovalResult> {
  const message = planSummary(plan);

  const result: ElicitationResult = await elicitationFn({
    mode: 'form',
    message,
    requestedSchema: {
      type: 'object',
      properties: {
        confirm: {
          type: 'boolean',
          title: `Approve ${plan.action.replace(/_/g, ' ').toLowerCase()}?`,
          description: `Risk: ${plan.risk}. Check to approve this exact plan.`,
          default: false,
        },
      },
    },
  });

  if (result.action === 'accept') {
    const confirmed = result.content?.confirm === true || result.content?.confirm === 'true';
    return { method: 'MCP_ELICITATION', decision: confirmed ? 'APPROVE' : 'REJECT' };
  }

  if (result.action === 'cancel') {
    return { method: 'MCP_ELICITATION', decision: 'REJECT', cancelled: true };
  }

  return { method: 'MCP_ELICITATION', decision: 'REJECT' };
}
