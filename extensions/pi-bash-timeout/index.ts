/**
 * Bash Tool with Default Timeout Extension
 *
 * This extension wraps the built-in bash tool and adds a default timeout of 120 seconds.
 * The native bash tool doesn't have a default timeout, which can cause issues with
 * long-running or hanging commands.
 *
 * Features:
 * - Adds a 120-second default timeout to all bash commands (override via timeout param)
 * - Preserves the built-in tool's description, promptSnippet, parameters, and
 *   renderCall/renderResult (so the TUI looks identical to the stock bash tool)
 * - Properly delegates to the underlying bash implementation with ctx.cwd so commands
 *   run in the correct project directory regardless of where pi was launched
 *
 * How it works:
 * - createBashToolDefinition() returns the full ToolDefinition pi uses internally,
 *   including the renderers that produce the stock bash UI.
 * - We spread it and override only `execute` to inject `params.timeout ?? 120`.
 * - pi.registerTool() with name "bash" replaces the built-in entry in the tool
 *   registry (extension tools win by name), so our wrapped execute is the one the
 *   agent calls, while every other field stays the built-in default.
 *
 * Usage:
 *   pi -e ./bash-with-timeout.ts
 *
 * Or install globally:
 *   mkdir -p ~/.pi/agent/extensions
 *   cp bash-with-timeout.ts ~/.pi/agent/extensions/
 *   pi  # Will auto-load the extension
 *
 * Example behavior:
 *   - Command with no timeout: Uses 120s default
 *   - Command with explicit timeout: Uses that timeout
 *   - Command that exceeds timeout: Killed and shows "Command timed out" message
 */

import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import { createBashToolDefinition } from "@earendil-works/pi-coding-agent";

const DEFAULT_TIMEOUT_SECONDS = 120;

export default function (pi: ExtensionAPI) {
  // Full built-in bash ToolDefinition (description, promptSnippet, parameters,
  // renderCall, renderResult, execute). We keep everything except `execute`.
  const builtinBash = createBashToolDefinition(process.cwd());

  pi.registerTool({
    ...builtinBash,
    name: "bash", // same name → overrides the built-in bash tool in the registry
    // Append a short note about the default so the LLM knows the fallback when
    // it omits the timeout param. The rest of the description is the built-in's.
    description: `${builtinBash.description} (default timeout: ${DEFAULT_TIMEOUT_SECONDS}s when omitted)`,

    async execute(toolCallId, params, signal, onUpdate, ctx) {
      // Apply default timeout if none specified; explicit timeout always wins.
      const effectiveParams = {
        ...params,
        timeout: params.timeout ?? DEFAULT_TIMEOUT_SECONDS,
      };

      // Delegate to the built-in bash implementation, scoped to ctx.cwd so we
      // execute in the correct project directory regardless of where pi was
      // launched. ToolDefinition.execute takes 5 params (incl ctx).
      const bashTool = createBashToolDefinition(ctx.cwd);
      return bashTool.execute(
        toolCallId,
        effectiveParams,
        signal,
        onUpdate,
        ctx,
      );
    },
  });
}
