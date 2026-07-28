import { createServer, type IncomingMessage, type ServerResponse } from 'node:http';
import type { PlanStore } from '../stores/plan-store.js';
import { config } from '../config.js';

function esc(v: unknown): string {
  return String(v ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]!));
}

export function startApprovalReviewServer(store: PlanStore): void {
  const server = createServer(async (req, res) => {
    try {
      const url = new URL(req.url ?? '/', config.approvalPublicBaseUrl);
      const match = url.pathname.match(/^\/review\/([^/]+)$/);
      if (!match) return send(res, 404, 'Not found');
      const planId = decodeURIComponent(match[1]);
      const plan = await store.get(planId);
      if (!plan) return send(res, 404, 'Plan not found');

      if (req.method === 'GET') {
        const rows = plan.steps.map(s => `<li>${esc(s.order)}. ${esc(s.description)}${s.mutates ? ' <strong>[CHANGE]</strong>' : ''}</li>`).join('');
        return html(res, `<!doctype html><meta charset="utf-8"><title>Review DevPanel plan</title>
          <style>body{font-family:system-ui;max-width:760px;margin:40px auto;padding:0 20px}pre{background:#f5f5f5;padding:16px;overflow:auto}button{padding:10px 18px;margin-right:8px}.danger{font-weight:700}</style>
          <h1>Review DevPanel Change Plan</h1><p><strong>${esc(plan.summary)}</strong></p>
          <p>Risk: <strong class="danger">${esc(plan.risk)}</strong><br>Plan: ${esc(plan.id)}<br>Hash: ${esc(plan.hash)}</p>
          <h2>Target</h2><pre>${esc(JSON.stringify(plan.target, null, 2))}</pre><h2>Steps</h2><ol>${rows}</ol>
          <h2>Expected result</h2><p>${esc(plan.expectedResult)}</p><h2>Rollback</h2><p>${esc(plan.rollback)}</p>
          <form method="post"><button name="decision" value="approve">Approve exact plan</button><button name="decision" value="reject">Reject</button></form>`);
      }

      if (req.method === 'POST') {
        const body = await readBody(req);
        const params = new URLSearchParams(body);
        const decision = params.get('decision');
        if (decision !== 'approve' && decision !== 'reject') return send(res, 400, 'Invalid decision');
        await store.setApproval(plan.id, {
          decision: decision === 'approve' ? 'APPROVE' : 'REJECT',
          planHash: plan.hash,
          approvedAt: new Date().toISOString(),
          approvedBy: 'local-review-user',
          source: 'review-ui',
        });
        return html(res, `<h1>${decision === 'approve' ? 'Approved' : 'Rejected'}</h1><p>You may return to your MCP client.</p>`);
      }
      return send(res, 405, 'Method not allowed');
    } catch (e) { return send(res, 500, e instanceof Error ? e.message : String(e)); }
  });
  server.listen(config.approvalPort, config.approvalHost, () => {
    console.error(`[approval] review UI listening at ${config.approvalPublicBaseUrl}`);
  });
}

function readBody(req: IncomingMessage): Promise<string> { return new Promise((resolve, reject) => { const chunks: Buffer[] = []; req.on('data', c => chunks.push(Buffer.from(c))); req.on('end', () => resolve(Buffer.concat(chunks).toString('utf8'))); req.on('error', reject); }); }
function send(res: ServerResponse, code: number, text: string): void { res.statusCode = code; res.setHeader('content-type', 'text/plain; charset=utf-8'); res.end(text); }
function html(res: ServerResponse, body: string): void { res.statusCode = 200; res.setHeader('content-type', 'text/html; charset=utf-8'); res.end(body); }
