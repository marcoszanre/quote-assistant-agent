# M365 Declarative Agent Project

This is an M365 Copilot declarative agent project managed by the **Work IQ Dev Tools (`wiqd`)** CLI and coding-agent plugin (`wiqd@wiqd`).

## Available Skills

When working on this project in **GitHub Copilot CLI** (`copilot`) or **Claude Code** (`claude`), you MUST use the `wiqd` skill (or `declarative-agent-developer` on older plugin versions) before editing any project files. **Do NOT work directly on files under `appPackage/` or `m365agents*.yml` without invoking the skill first.**

| Skill                                    | When to Use                                                                                                            |
| ---------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| **`wiqd`** (`declarative-agent-developer`) | Any task involving this agent (see scenarios below). **This is the primary skill for this project and is enforced by `.github/extensions/wiqd-agent-enforcer/extension.mjs`.** |
| **`ui-widget-developer`**                | Only when adding an MCP server that renders rich interactive widgets (HTML) in Copilot Chat using the OpenAI Apps SDK. |
| **`install-wiqd`**                       | Only when the `wiqd` CLI is not installed or needs updating.                                                           |

## ⛔ MANDATORY: Invoke the `wiqd` Skill First

**This is a declarative agent project. For ANY task in this workspace — regardless of what it is — you MUST invoke `skill("wiqd")` (or `declarative-agent-developer`) BEFORE mutating any agent files.** This is enforced automatically at runtime by `.github/extensions/wiqd-agent-enforcer/extension.mjs`.

### Scenarios handled by this skill

- Creating a new agent project from scratch (`wiqd agent create`)
- Editing manifests (`appPackage/declarativeAgent.json`, `appPackage/manifest.json`, `appPackage/ai-plugin.json`, `m365agents.yml`, `m365agents.local.yml`)
- Adding or updating Agent Skills (`appPackage/skills/<slug>/SKILL.md` with `wiqd config flags set agent-skills true`)
- Adding or removing capabilities (web search, SharePoint/OneDrive, Copilot connectors, etc.)
- Adding API plugins from OpenAPI specs
- Adding Remote MCP Server plugins (`wiqd agent add action --mcp-server-url ...`) and pinning tools
- Adding and troubleshooting OAuth 2.0 authentication (`OAuthPluginVault` / `oauth/register`)
- Localizing an agent into multiple languages
- Writing or updating agent instructions (`appPackage/instructions.txt`)
- Deploying and provisioning with `wiqd agent provision`
- Validating the project with `wiqd agent validate` (and real-time diagnostics via `wiqd agent lsp`)
- Evaluating the agent with `wiqd agent eval`

**Do NOT:**

- Edit `declarativeAgent.json`, `ai-plugin.json`, `manifest.json`, or `m365agents*.yml` directly without invoking the `wiqd` skill first
- Hardcode secrets, client IDs, or tenant IDs in tracked files (use `env/.env.<env>.user` for secrets and `env/.env.local` for local environment IDs)

