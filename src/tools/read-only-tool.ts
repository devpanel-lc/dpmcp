import type { McpServer, ToolCallback } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { z } from 'zod';

const READ_ONLY_ANNOTATIONS = {
  readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false,
} as const;

/**
 * Registers a genuinely read-only tool with the fixed annotations block DevPanel's
 * read/discovery tools all share. Has no override parameter by design -- it cannot
 * be used to register anything but a read-only tool (see AGENTS.md mutation-gating rule).
 */
export function defineReadOnlyTool<Args extends z.ZodRawShape>(
  server: McpServer,
  name: string,
  description: string,
  inputSchema: Args,
  handler: ToolCallback<Args>,
): void {
  server.registerTool(name, { description, inputSchema, annotations: READ_ONLY_ANNOTATIONS }, handler);
}
