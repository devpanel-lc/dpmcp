import type { ChangePlan } from '../domain/types.js';

/**
 * Render a plan as plain text for the human to read in the agent conversation.
 *
 * This is the entire approval surface now: there is no client dialog and no
 * review page, so everything the human needs in order to decide has to be
 * here — notably the mutating steps, the expiry, and the hash being approved.
 */
export function planSummary(plan: ChangePlan): string {
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

  if (plan.warnings && plan.warnings.length > 0) {
    lines.push(``, `WARNINGS:`);
    for (const w of plan.warnings) lines.push(`  - ${w}`);
  }

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

/**
 * The static question shown under every plan. Kept verbatim and in one place so
 * the wording the human answers is identical on every approval request.
 */
export const APPROVAL_QUESTION =
  'Do you approve this plan? Reply APPROVE to execute it, or REJECT to cancel.';
