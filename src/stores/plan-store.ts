import type { ApprovalRecord, ChangePlan, PlanStatus } from '../domain/types.js';

export interface PlanStore {
  save(plan: ChangePlan): Promise<void>;
  get(id: string): Promise<ChangePlan | undefined>;
  setStatus(id: string, status: PlanStatus): Promise<ChangePlan>;
  setApproval(id: string, approval: ApprovalRecord): Promise<ChangePlan>;
  setExecution(id: string, execution: ChangePlan['execution']): Promise<ChangePlan>;
}

export class InMemoryPlanStore implements PlanStore {
  private readonly plans = new Map<string, ChangePlan>();

  async save(plan: ChangePlan): Promise<void> {
    this.plans.set(plan.id, structuredClone(plan));
  }

  async get(id: string): Promise<ChangePlan | undefined> {
    const plan = this.plans.get(id);
    return plan ? structuredClone(plan) : undefined;
  }

  async setStatus(id: string, status: PlanStatus): Promise<ChangePlan> {
    const plan = this.require(id);
    plan.status = status;
    return structuredClone(plan);
  }

  async setApproval(id: string, approval: ApprovalRecord): Promise<ChangePlan> {
    const plan = this.require(id);
    plan.approval = approval;
    plan.status = approval.decision === 'APPROVE' ? 'APPROVED' : 'REJECTED';
    return structuredClone(plan);
  }

  async setExecution(id: string, execution: ChangePlan['execution']): Promise<ChangePlan> {
    const plan = this.require(id);
    plan.execution = execution;
    return structuredClone(plan);
  }

  private require(id: string): ChangePlan {
    const plan = this.plans.get(id);
    if (!plan) throw new Error(`Plan not found: ${id}`);
    return plan;
  }
}
