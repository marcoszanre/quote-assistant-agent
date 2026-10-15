/**
 * wiqd-agent-enforcer
 * --------------------
 * Project-scoped Copilot CLI extension that enforces routing of M365
 * declarative agent edits through the `wiqd` skill from the
 * `wiqd` plugin.
 *
 * Why this exists:
 *   Skill discovery via SKILL.md descriptions is best-effort. The model
 *   sometimes bypasses wiqd and invokes raw `edit`/`create` on
 *   agent files (declarativeAgent.json, manifest.json, m365agents.yml,
 *   plugin manifests, etc.). This extension closes that gap by denying
 *   raw mutations to agent-owned paths until `skill(wiqd)` is
 *   invoked in the current turn.
 *
 * To disable for a single session: delete or rename this file before
 * launching `copilot`.
 */
import { joinSession } from "@github/copilot-sdk/extension";

let agentBuildInvokedThisTurn = false;

const MUTATION_TOOLS = new Set([
    "apply_patch",
    "create",
    "create_file",
    "edit",
    "replace",
    "write",
]);

const MARKER_FILES = new Set([
    "m365agents.yml",
    "m365agents.local.yml",
    "teamsapp.yml",
    "teamsapp.local.yml",
    "wiqd.plugin.json",
]);

function isAgentOwnedPath(rawPath) {
    if (!rawPath) return false;
    const p = String(rawPath).replace(/\\/g, "/").toLowerCase();
    if (/(^|\/)apppackage\//.test(p)) return true;
    const fileName = p.toLowerCase().split("/").pop();
    return MARKER_FILES.has(fileName);
}

function getMutationPaths(toolName, toolArgs) {
    const args =
        typeof toolArgs === "object" && toolArgs !== null ? toolArgs : {};
    const paths = [args.path, args.file_path, args.filePath].filter(Boolean);

    if (toolName !== "apply_patch") return paths;

    const patch =
        typeof toolArgs === "string"
            ? toolArgs
            : (args.patch ?? args.input ?? args.content);
    if (typeof patch !== "string") return paths;

    for (const match of patch.matchAll(
        /^\*\*\* (?:Add|Delete|Update) File: (.+)$|^\*\*\* Move to: (.+)$/gm,
    )) {
        paths.push(match[1] ?? match[2]);
    }
    return [...new Set(paths)];
}

function extractTool(input) {
    const toolName = input?.toolName ?? input?.name ?? input?.tool ?? "";
    const toolArgs =
        input?.toolArgs ?? input?.arguments ?? input?.args ?? input?.input ?? {};
    return { toolName, toolArgs };
}

await joinSession({
    hooks: {
        onUserPromptSubmitted: async () => {
            agentBuildInvokedThisTurn = false;
        },
        onPreToolUse: async (rawInput) => {
            const { toolName, toolArgs } = extractTool(rawInput);
            if (toolName === "skill") {
                const name = toolArgs?.name || toolArgs?.skillName || toolArgs?.skill;
                if (name === "wiqd") {
                    agentBuildInvokedThisTurn = true;
                }
                return;
            }

            if (!MUTATION_TOOLS.has(toolName)) return;
            if (agentBuildInvokedThisTurn) return;

            const filePaths = getMutationPaths(toolName, toolArgs);
            const pathUnavailable =
                toolName === "apply_patch" && filePaths.length === 0;
            if (
                !pathUnavailable &&
                !filePaths.some((filePath) => isAgentOwnedPath(filePath))
            )
                return;

            return {
                permissionDecision: "deny",
                permissionDecisionReason:
                    "This file is part of an M365 declarative agent project. " +
                    "You MUST invoke skill(wiqd) before editing files under " +
                    "appPackage/, wiqd.plugin.json, m365agents.yml, or teamsapp.yml. " +
                    "Call skill(wiqd) first to load the wiqd workflow, " +
                    "then retry this edit.",
            };
        },
    },
});
