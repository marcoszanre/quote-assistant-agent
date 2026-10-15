# Quote Assistant Agent — M365 Copilot Declarative Agent with Custom Skills & GitHub Remote MCP

> **A production-ready reference implementation** demonstrating how to build, govern, troubleshoot, and deploy a **Microsoft 365 Copilot Declarative Agent** using **GitHub Copilot CLI** as an AI coding agent, orchestrated by **Work IQ Dev Tools (`wiqd`)**, **Progressive Agent Skills (`SKILL.md`)**, and the **GitHub Remote MCP Server (`https://api.githubcopilot.com/mcp/`)** with OAuth 2.0 (`OAuthPluginVault`).

---

## Table of Contents

1. [Overview & What This Project Demonstrates](#1-overview--what-this-project-demonstrates)
2. [Architecture & How Everything Works Together](#2-architecture--how-everything-works-together)
3. [Repository Structure](#3-repository-structure)
4. [Prerequisites](#4-prerequisites)
5. [Quick Start: Deploy This Agent to Your Tenant](#5-quick-start-deploy-this-agent-to-your-tenant)
6. [Step-by-Step Guide: Replicating & Building from Scratch with `wiqd` + Copilot CLI](#6-step-by-step-guide-replicating--building-from-scratch-with-wiqd--copilot-cli)
   - [Step 1: Install `wiqd` CLI & the Coding-Agent Plugin](#step-1-install-wiqd-cli--the-coding-agent-plugin)
   - [Step 2: Enable the `agent-skills` Feature Flag](#step-2-enable-the-agent-skills-feature-flag)
   - [Step 3: Scaffold the Agent Project & First Skill](#step-3-scaffold-the-agent-project--first-skill)
   - [Step 4: Author Progressive Agent Skills (`SKILL.md`)](#step-4-author-progressive-agent-skills-skillmd)
   - [Step 5: Register a GitHub OAuth App for the Remote MCP Server](#step-5-register-a-github-oauth-app-for-the-remote-mcp-server)
   - [Step 6: Connect the GitHub Remote MCP Server & Configure OAuth](#step-6-connect-the-github-remote-mcp-server--configure-oauth)
   - [Step 7: Enforce Read-Only Governance via Tool Pinning & Query Design](#step-7-enforce-read-only-governance-via-tool-pinning--query-design)
   - [Step 8: Validate, Provision & Evaluate](#step-8-validate-provision--evaluate)
7. [Field Notes, Troubleshooting & Lessons Learned (Real Errors & Fixes)](#7-field-notes-troubleshooting--lessons-learned-real-errors--fixes)
   - [Pitfall 1: `wiqd` Installer or Marketplace Command Fails on Windows (`git` Not in `PATH`)](#pitfall-1-wiqd-installer-or-marketplace-command-fails-on-windows-git-not-in-path)
   - [Pitfall 2: Skills Are Ignored at Package Time or Trigger Schema Warnings (`agent-skills` Flag)](#pitfall-2-skills-are-ignored-at-package-time-or-trigger-schema-warnings-agent-skills-flag)
   - [Pitfall 3: Clicking "Sign in to Agent" in Copilot Chat Does Nothing (`validDomains` & Comma-Delimited Scopes)](#pitfall-3-clicking-sign-in-to-agent-in-copilot-chat-does-nothing-validdomains--comma-delimited-scopes)
   - [Pitfall 4: OAuth Login Succeeds, But Every MCP Tool Call Fails (`scopes_supported` & Cached Vault IDs)](#pitfall-4-oauth-login-succeeds-but-every-mcp-tool-call-fails-scopes_supported--cached-vault-ids)
   - [Pitfall 5: `get_file_contents` / `list_commits` Fail with `missing Mcp-Param-owner header` (MCP `SEP-2243` `x-mcp-header`)](#pitfall-5-get_file_contents--list_commits-fail-with-missing-mcp-param-owner-header-mcp-sep-2243-x-mcp-header)
   - [Pitfall 6: `M365AppNotFoundError` When Resolving OAuth Configuration (`applicableToApps: AnyApp`)](#pitfall-6-m365appnotfounderror-when-resolving-oauth-configuration-applicabletoapps-anyapp)
   - [Pitfall 7: Coding Agent Edits Manifests Directly Without Running `wiqd` Workflows](#pitfall-7-coding-agent-edits-manifests-directly-without-running-wiqd-workflows)
8. [Security & Sanitization Checklist](#8-security--sanitization-checklist)
9. [Official References & Documentation](#9-official-references--documentation)

---

## 1. Overview & What This Project Demonstrates

**Quote Assistant Agent** is a Microsoft 365 Copilot Declarative Agent built to showcase modern extensibility patterns in M365 Copilot:

| Capability | Trigger / Command | How It Works |
| :--- | :--- | :--- |
| **Curated Inspirational Quotes** | `/quote-spark` or `/quote-spark <theme>` (`leadership`, `innovation`, `resilience`, `collaboration`, `focus`) | Uses the **`quote-spark` Agent Skill** (`appPackage/skills/quote-spark/SKILL.md`) to load a structured playbook and verified quote catalog on demand. |
| **Read-Only GitHub Repository Discovery & Inspection** | `/github-repos` or `/github-repos <owner-or-query>` (e.g., `/github-repos kiota`, `/github-repos microsoft/kiota`) | Uses the **`github-repos` Agent Skill** (`appPackage/skills/github-repos/SKILL.md`) paired with the **GitHub Remote MCP Server** (`https://api.githubcopilot.com/mcp/`) and **OAuth 2.0 (`OAuthPluginVault`)** to list repositories, inspect `README.md` / code files, and count/search commits in strict read-only mode. |
| **AI Coding-Agent Guardrails** | Automatic in GitHub Copilot CLI (`copilot`) | Uses `.github/extensions/wiqd-agent-enforcer/extension.mjs` and `.github/lsp.json` (`wiqd agent lsp`) so coding agents always route manifest edits through the official `wiqd` workflow and validate schemas in real time. |

---

## 2. Architecture & How Everything Works Together

### 2.1 Authoring Plane vs. Runtime Execution Plane

```text
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                           AUTHORING PLANE (Developer Machine)                          │
│                                                                                        │
│  Developer ──► GitHub Copilot CLI (`copilot --agent wiqd:wiqd`)                        │
│                     │                                                                  │
│                     ├──► .github/extensions/wiqd-agent-enforcer (blocks raw edits)     │
│                     ├──► .github/lsp.json (`wiqd agent lsp` real-time schema checks)   │
│                     └──► `wiqd` Skill & CLI (`@microsoft/wiqd`)                        │
│                               │                                                        │
│                               ├──► Scaffolds/edits `appPackage/*` & `m365agents*.yml`  │
│                               ├──► Registers OAuth in Teams Developer Portal Vault     │
│                               └──► Packages & provisions agent to M365 Copilot         │
└────────────────────────────────────────────────────────────────────────────────────────┘
                                              │
                                              ▼
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                           RUNTIME PLANE (Microsoft 365 Copilot)                        │
│                                                                                        │
│  User in M365 Copilot Chat                                                             │
│    │                                                                                   │
│    ├──► "/quote-spark leadership"                                                      │
│    │       └──► M365 Copilot Orchestrator                                              │
│    │               └──► Loads `appPackage/skills/quote-spark/SKILL.md` on demand       │
│    │                                                                                   │
│    └──► "/github-repos microsoft/kiota"                                                │
│            └──► M365 Copilot Orchestrator                                              │
│                    ├──► Loads `appPackage/skills/github-repos/SKILL.md` on demand      │
│                    ├──► Retrieves user OAuth token via `OAuthPluginVault`              │
│                    └──► Calls `https://api.githubcopilot.com/mcp/` (RemoteMCPServer)   │
│                            └──► Pinned Read-Only Tools ONLY:                           │
│                                 • get_me                                               │
│                                 • search_repositories                                  │
│                                 • search_code                                          │
│                                 • search_commits                                       │
│                                 • search_users                                         │
└────────────────────────────────────────────────────────────────────────────────────────┘
```

### 2.2 Why Combine `instructions.txt`, Agent Skills (`SKILL.md`), and Remote MCP?

1. **Always-On Instructions (`appPackage/instructions.txt`)**:
   - Capped at **8,000 characters** and loaded on **every** turn.
   - Kept concise: defines the agent's persona, high-level routing rules (when to trigger `/quote-spark` vs. `/github-repos`), and global guardrails.
2. **Progressive Agent Skills (`appPackage/skills/<slug>/SKILL.md`)**:
   - At startup, M365 Copilot only reads each skill's YAML frontmatter (`name` and `description`).
   - The full `SKILL.md` body (detailed playbooks, output templates, curated catalogs, and exact MCP query recipes) is loaded **only when the skill is triggered**.
   - This preserves the 8,000-character instruction budget while allowing rich, deterministic procedural guidance per domain.
3. **Remote MCP Server (`appPackage/ai-plugin.json`)**:
   - Connects the declarative agent to external live tools over HTTPS using `"type": "RemoteMCPServer"`.
   - Instead of writing and maintaining an OpenAPI spec for GitHub's REST API, the agent talks directly to GitHub's managed MCP endpoint (`https://api.githubcopilot.com/mcp/`).

---

## 3. Repository Structure

```text
quote-assistant-agent/
├── .github/
│   ├── extensions/
│   │   └── wiqd-agent-enforcer/
│   │       └── extension.mjs          # Copilot CLI hook: enforces invoking `skill(wiqd)` before editing agent files
│   └── lsp.json                       # Configures `wiqd agent lsp` for real-time JSON manifest diagnostics
├── .vscode/
│   ├── extensions.json                # Recommends Microsoft 365 Agents Toolkit VS Code extension
│   ├── launch.json                    # Browser preview launch configurations (Edge / Chrome)
│   ├── settings.json                  # Workspace schema settings
│   └── tasks.json                     # Pre-launch prerequisite and local provisioning tasks
├── appPackage/
│   ├── skills/
│   │   ├── github-repos/
│   │   │   └── SKILL.md               # Progressive skill playbook for `/github-repos` (read-only GitHub discovery)
│   │   └── quote-spark/
│   │       └── SKILL.md               # Progressive skill playbook for `/quote-spark` (curated quotes by theme)
│   ├── ai-plugin.json                 # Plugin manifest (v2.4): RemoteMCPServer + OAuthPluginVault + 5 pinned read-only tools
│   ├── color.png                      # 192x192 color icon required by M365/Teams manifest validation
│   ├── declarativeAgent.json          # Declarative agent manifest (v1.9): starters, agent_skills[], actions[]
│   ├── instructions.txt               # Always-on routing instructions and guardrails
│   ├── manifest.json                  # Teams/M365 app manifest (v1.30): metadata, validDomains, copilotAgents
│   └── outline.png                    # 32x32 outline icon required by M365/Teams manifest validation
├── env/
│   ├── .env.dev                       # Tracked template for the `dev` environment (no secrets or hardcoded IDs)
│   ├── .env.local.example             # Sample template for `env/.env.local` (copy and customize locally)
│   └── .env.user.example              # Sample template for `env/.env.<env>.user` (stores OAuth client secret locally)
├── evals/
│   └── prompts.json                   # Evaluation dataset for testing `/quote-spark` and `/github-repos`
├── .gitignore                         # Excludes `env/.env.local`, `env/.env.*.user`, and `appPackage/build/`
├── AGENTS.md                          # Instructions for AI coding agents (GitHub Copilot CLI / Claude Code)
├── m365agents.local.yml               # Provisioning lifecycle for `local` environment (includes `oauth/register`)
├── m365agents.yml                     # Provisioning & publishing lifecycle for `dev` / shared environments
└── README.md                          # This guide
```

> **🔒 Security Note on `env/` Files:**
> - `env/.env.local`, `env/.env.local.user`, `env/.env.dev.user`, and `appPackage/build/` are excluded via `.gitignore` and **never** committed to source control.
> - Only `env/.env.dev` (with empty placeholders), `env/.env.local.example`, and `env/.env.user.example` are tracked in Git.

---

## 4. Prerequisites

Before deploying or replicating this project, ensure you have:

1. **Microsoft 365 Development Environment**:
   - A Microsoft 365 work or school account with a **Microsoft 365 Copilot license**.
   - **Custom app upload (sideloading)** enabled in the Microsoft Teams Admin Center / Microsoft 365 Admin Center.
2. **Node.js & npm**:
   - **Node.js v22 LTS or v24 LTS** (verify with `node --version` and `npm --version`).
3. **Git**:
   - Installed and present in your system/user `PATH` (verify with `git --version`).
   - *Windows tip:* Ensure `C:\Program Files\Git\cmd` is in your `PATH` (see [Pitfall 1](#pitfall-1-wiqd-installer-or-marketplace-command-fails-on-windows-git-not-in-path)).
4. **AI Coding Agent CLI** *(recommended for AI-assisted authoring)*:
   - [GitHub Copilot CLI](https://docs.github.com/en/copilot/github-copilot-in-the-cli) (`copilot`) or Claude Code (`claude`).
5. **Work IQ Dev Tools (`wiqd`)**:
   - Both the `wiqd` CLI (`@microsoft/wiqd`) and the `wiqd@wiqd` coding-agent plugin (installation instructions in [Step 1](#step-1-install-wiqd-cli--the-coding-agent-plugin) below).
6. **GitHub Account**:
   - Required to create a standard **GitHub OAuth App** under **Settings → Developer settings → OAuth Apps** so M365 Copilot can authenticate users against `https://api.githubcopilot.com/mcp/`.

---

## 5. Quick Start: Deploy This Agent to Your Tenant

If you cloned this repository and want to deploy it directly to your own Microsoft 365 tenant:

### 5.1 Clone the Repository

```bash
git clone https://github.com/marcoszanre/quote-assistant-agent.git
cd quote-assistant-agent
```

### 5.2 Create a GitHub OAuth App

1. Open GitHub and navigate to **Settings** → **Developer settings** → **OAuth Apps** → **New OAuth App** (or visit <https://github.com/settings/developers>).
2. Fill in the fields:
   - **Application name:** `Quote Assistant M365 Copilot Agent` (or any name you prefer)
   - **Homepage URL:** `https://m365.cloud.microsoft`
   - **Authorization callback URL:**
     ```text
     https://teams.microsoft.com/api/platform/v1.0/oAuthRedirect
     ```
     > ⚠️ **CRITICAL:** The callback URL must match `https://teams.microsoft.com/api/platform/v1.0/oAuthRedirect` character-for-character.
3. Click **Register application**.
4. Copy the **Client ID** and click **Generate a new client secret** to copy your **Client Secret**.

### 5.3 Configure Your Local Environment Files

Create your untracked local environment files from the included templates:

```bash
# On macOS / Linux / Git Bash:
cp env/.env.local.example env/.env.local
cp env/.env.user.example env/.env.local.user
```

```powershell
# On Windows PowerShell:
Copy-Item env\.env.local.example env\.env.local
Copy-Item env\.env.user.example env\.env.local.user
```

1. Open `env/.env.local` and set `MCP_DA_OAUTH_CLIENT_ID_APIGITHUBC` to your GitHub OAuth App **Client ID**:
   ```dotenv
   MCP_DA_OAUTH_CLIENT_ID_APIGITHUBC=<your-github-oauth-client-id>
   MCP_DA_OAUTH_SCOPE_APIGITHUBC=repo,read:org,read:user
   MCP_DA_AUTH_ID_APIGITHUBC=
   ```
2. Open `env/.env.local.user` and set `SECRET_MCP_DA_OAUTH_CLIENT_SECRET_APIGITHUBC` to your GitHub OAuth App **Client Secret**:
   ```dotenv
   SECRET_MCP_DA_OAUTH_CLIENT_SECRET_APIGITHUBC=<your-github-oauth-client-secret>
   ```
   *(Note: If you plan to provision the `dev` environment instead of `local`, populate `env/.env.dev` and `env/.env.dev.user` the same way.)*

### 5.4 Enable Agent Skills, Validate & Provision

```bash
# 1. Enable packaging support for Agent Skills (SKILL.md folders)
wiqd config flags set agent-skills true

# 2. Run static manifest validation
wiqd agent validate --env local

# 3. Provision the agent and register OAuth in the Developer Portal vault
wiqd agent provision --env local
```

During `wiqd agent provision --env local`, a browser window will prompt you to sign in with your Microsoft 365 account. Once completed, `wiqd` will output your agent's direct test URL:

```text
https://m365.cloud.microsoft/chat?titleId=<YOUR_M365_TITLE_ID>
```

### 5.5 Test the Agent in M365 Copilot Chat

Open the link above in your browser and try the following prompts:

- `/quote-spark` — Returns a curated daily quote with author, context, and key takeaway.
- `/quote-spark leadership` — Returns a leadership quote from the `quote-spark` skill catalog.
- `/github-repos` — Prompts you to sign in to GitHub via the OAuth card (first run only), then calls `get_me` and `search_repositories` to list your repositories.
- `/github-repos microsoft/kiota` — Inspects the `microsoft/kiota` repository metadata, `README.md`, and code files in read-only mode.
- `"How many commits does microsoft/kiota have and what are the most recent ones?"` — Uses `search_commits` with `committer-date:>2000-01-01` to return total commit count and latest commit history.

---

## 6. Step-by-Step Guide: Replicating & Building from Scratch with `wiqd` + Copilot CLI

This section walks through the exact end-to-end journey used to create this project from an empty folder using **Work IQ Dev Tools (`wiqd`)** and **GitHub Copilot CLI** as the coding agent.

---

### Step 1: Install `wiqd` CLI & the Coding-Agent Plugin

There are **two distinct artifacts** in the `wiqd` ecosystem:
1. **The `wiqd` CLI (`@microsoft/wiqd`)**: The command-line tool that scaffolds, validates, packages, provisions, and evaluates M365 Copilot agents.
2. **The `wiqd@wiqd` Coding-Agent Host Plugin**: The skill and sub-agent bundle loaded by **GitHub Copilot CLI** (`copilot`) or **Claude Code** (`claude`) so your coding agent knows how to use `wiqd` workflows properly.

#### 1.1 Run the Official One-Line Installer

**Windows (PowerShell):**
```powershell
iex "& { $(irm 'https://aka.ms/wiqd/install.ps1') }"
```

**macOS / Linux:**
```bash
curl -fsSL https://aka.ms/wiqd/install.sh | bash
```

#### 1.2 Register the `wiqd@wiqd` Plugin in GitHub Copilot CLI

Verify or install the coding-agent plugin directly in GitHub Copilot CLI:

```bash
copilot plugin marketplace add microsoft/wiqd
copilot plugin install wiqd@wiqd
```

*(If using Claude Code, replace `copilot` with `claude`.)*

Verify your installation:
```bash
wiqd --version
```

---

### Step 2: Enable the `agent-skills` Feature Flag

Before creating or packaging any agent that uses `SKILL.md` folders (`agent_skills[]` or `agentSkills[]`), enable the `agent-skills` feature flag in `wiqd`:

```bash
wiqd config flags set agent-skills true
```

> **Why is this required?**
> The underlying `fx-core` packaging engine gates `SKILL.md` folder archiving behind a feature flag. When `agent-skills` is set to `true` in `wiqd`, the `wiqd` lifecycle backend automatically injects the required SDK environment variables during `add skill`, `package`, `provision`, and `publish`. If this flag is off, `wiqd` will refuse to package a declarative-agent skill rather than silently producing an incomplete `.zip` archive.

---

### Step 3: Scaffold the Agent Project & First Skill

You can build the agent **conversationally** using GitHub Copilot CLI with the `wiqd:wiqd` agent, or **deterministically** via `wiqd` CLI commands.

#### Option A: Conversational Creation with GitHub Copilot CLI (Recommended)

From an empty workspace directory, run:

```bash
copilot -i "create a new declarative agent and include a sample skill that returns a quote which is triggered with a custom cmd you pick" --agent wiqd:wiqd
```

When invoked with `--agent wiqd:wiqd`, Copilot CLI loads the `wiqd` orchestrator skill (`workflows/wiqd-core.md`) and automatically:
1. Scaffolds `quote-assistant-agent/` using `wiqd agent create --name quote-assistant-agent`.
2. Creates the `quote-spark` skill under `appPackage/skills/quote-spark/SKILL.md` and registers it in `appPackage/declarativeAgent.json`.
3. Authors `appPackage/instructions.txt` and `conversation_starters` for `/quote-spark`.
4. Installs `.github/lsp.json` and `.github/extensions/wiqd-agent-enforcer/extension.mjs`.
5. Validates the project via `wiqd agent validate`.

#### Option B: Equivalent Direct `wiqd` CLI Commands

```bash
# 1. Scaffold the declarative agent project
wiqd agent create --name quote-assistant-agent
cd quote-assistant-agent

# 2. Add the quote-spark skill
wiqd agent add skill \
  --name "quote-spark" \
  --description "Returns an inspiring quote with author and context when triggered with the custom command /quote-spark (or !quote-spark, quote-spark, or when the user asks for a quote)."
```

---

### Step 4: Author Progressive Agent Skills (`SKILL.md`)

Each skill lives in its own folder under `appPackage/skills/<skill-slug>/SKILL.md` and is referenced in `appPackage/declarativeAgent.json`:

```json
"agent_skills": [
    {
        "folder": "skills/quote-spark"
    },
    {
        "folder": "skills/github-repos"
    }
]
```

#### Anatomy of a Valid `SKILL.md` File

Every `SKILL.md` file **must** begin with YAML frontmatter containing `name` and `description`:

```markdown
---
name: quote-spark
description: Returns an inspiring quote with author and context when triggered with the custom command /quote-spark (or !quote-spark, quote-spark, or when the user asks for a quote).
---
# quote-spark

Activate this skill whenever the user invokes the custom command `/quote-spark`...
```

> **💡 Best Practices for `SKILL.md` Authoring:**
> - **Frontmatter `description` is critical:** It is the *only* part of the skill that M365 Copilot sees before the skill activates. Always include the exact trigger command (e.g., `/quote-spark`, `/github-repos`) and natural-language intent in `description`.
> - **Understanding the Two Skill Surfaces (`agent_skills` vs. `agentSkills`):**
>   - `agent_skills[]` (snake_case in `appPackage/declarativeAgent.json`) registers **Declarative Agent Chat** skills.
>   - `agentSkills[]` (camelCase in `appPackage/manifest.json`) registers top-level **Cowork / App-level** skills.
>   - You do **not** need dual registration for a Declarative Agent Chat skill as long as `wiqd config flags set agent-skills true` is enabled.

---

### Step 5: Register a GitHub OAuth App for the Remote MCP Server

Because the GitHub Remote MCP Server (`https://api.githubcopilot.com/mcp/`) requires user-delegated authentication, create an OAuth App in GitHub (**Settings → Developer settings → OAuth Apps**):

| Setting | Required Value | Why It Matters |
| :--- | :--- | :--- |
| **Application name** | `Quote Assistant M365 Agent` | Shown on the GitHub OAuth consent screen when a user signs in from Copilot Chat. |
| **Homepage URL** | `https://m365.cloud.microsoft` | Standard application URL requirement. |
| **Authorization callback URL** | `https://teams.microsoft.com/api/platform/v1.0/oAuthRedirect` | Microsoft 365 / Teams Developer Portal token broker endpoint that receives the OAuth authorization code. |

Save the generated **Client ID** and **Client Secret**.

---

### Step 6: Connect the GitHub Remote MCP Server & Configure OAuth

With the agent project open in GitHub Copilot CLI (or via CLI commands), add the GitHub Remote MCP Server action and the `github-repos` skill:

```bash
# 1. Add the Remote MCP Server action with OAuth authentication
wiqd agent add action \
  --mcp-server-url "https://api.githubcopilot.com/mcp/" \
  --mcp-auth-type oauth \
  --mcp-client-id "<YOUR_GITHUB_OAUTH_CLIENT_ID>" \
  --mcp-client-secret "<YOUR_GITHUB_OAUTH_CLIENT_SECRET>" \
  --mcp-scopes "repo,read:org,read:user" \
  --folder .

# 2. Add the github-repos skill
wiqd agent add skill \
  --name "github-repos" \
  --description "Lists and searches GitHub repositories in read-only mode using the GitHub MCP server when triggered with /github-repos or when the user asks to list, find, or inspect repositories."
```

#### How `oauth/register` Works in `m365agents.yml` and `m365agents.local.yml`

Both `m365agents.yml` and `m365agents.local.yml` include the `oauth/register` step inside the `provision` lifecycle:

```yaml
  - uses: oauth/register
    with:
      name: apigithubc
      appId: ${{TEAMS_APP_ID}}
      applicableToApps: AnyApp
      flow: authorizationCode
      authorizationUrl: https://github.com/login/oauth/authorize
      tokenUrl: https://github.com/login/oauth/access_token
      identityProvider: Custom
      baseUrl: https://api.githubcopilot.com/mcp/
      clientId: ${{MCP_DA_OAUTH_CLIENT_ID_APIGITHUBC}}
      clientSecret: ${{SECRET_MCP_DA_OAUTH_CLIENT_SECRET_APIGITHUBC}}
      scope: ${{MCP_DA_OAUTH_SCOPE_APIGITHUBC}}
    writeToEnvironmentFile:
      configurationId: MCP_DA_AUTH_ID_APIGITHUBC
```

When `wiqd agent provision` runs, this step registers your GitHub OAuth credentials in the Microsoft Teams Developer Portal vault and writes the resulting registration ID (`MCP_DA_AUTH_ID_APIGITHUBC`) to your environment file, which `appPackage/ai-plugin.json` references via:

```json
"auth": {
  "type": "OAuthPluginVault",
  "reference_id": "${{MCP_DA_AUTH_ID_APIGITHUBC}}"
}
```

#### Required `validDomains` in `appPackage/manifest.json`

Ensure `appPackage/manifest.json` includes the OAuth and MCP domains in `validDomains` so the M365 Copilot host allows the sign-in pop-up window:

```json
"validDomains": [
    "token.botframework.com",
    "github.com",
    "api.githubcopilot.com"
]
```

---

### Step 7: Enforce Read-Only Governance via Tool Pinning & Query Design

By default, `wiqd agent add action --mcp-server-url` generates dynamic tool discovery (`"run_for_functions": ["*"]`). However, the GitHub Remote MCP Server exposes nearly 50 tools — including write operations (creating issues, pushing files, opening pull requests) and tools that use MCP `x-mcp-header` parameters.

To guarantee **strictly read-only repository access** and **100% compatibility with the M365 Copilot MCP runtime**, this project pins **only 5 read-only tools** in `appPackage/ai-plugin.json`:

1. `get_me` — Retrieves the authenticated user's GitHub profile (`login`, name, metadata).
2. `search_repositories` — Finds and lists repositories by owner, name, topic, or query (`user:<login>`, `repo:<owner>/<repo>`).
3. `search_code` — Inspects `README.md` content, file trees, and source code across repositories (`repo:<owner>/<repo>`).
4. `search_commits` — Counts (`total_count`) and lists commit history (`repo:<owner>/<repo> committer-date:>2000-01-01`).
5. `search_users` — Searches GitHub users and organizations.

> **Defense-in-Depth Read-Only Architecture:**
> 1. **Hard Boundary (`appPackage/ai-plugin.json`)**: Because only those 5 read-only functions exist in `functions[]`, `run_for_functions[]`, and `mcp_tool_description.tools[]`, the M365 Copilot orchestrator has **zero write tools available to call**, even though the GitHub OAuth gateway requires the `repo` OAuth scope.
> 2. **Soft Boundary (`appPackage/instructions.txt` & `appPackage/skills/github-repos/SKILL.md`)**: Explicit instructions tell the model to politely decline any request to create, modify, or delete GitHub resources.

---

### Step 8: Validate, Provision & Evaluate

```bash
# 1. Static validation (fast, offline Rego/MVL schema & semantic checks)
wiqd agent validate --env local

# 2. Build the app package (.zip)
wiqd agent package --env local

# 3. Deep validation against downstream platform validators
wiqd agent validate --mode deep --env local

# 4. Provision to your M365 account
wiqd agent provision --env local
```

---

## 7. Field Notes, Troubleshooting & Lessons Learned (Real Errors & Fixes)

During the creation and testing of this agent, we encountered and resolved seven non-obvious platform and protocol issues. Use this section as your troubleshooting reference when building or customizing M365 Copilot agents with `wiqd` and MCP servers.

---

### Pitfall 1: `wiqd` Installer or Marketplace Command Fails on Windows (`git` Not in `PATH`)

- **Symptom:**
  Running `iex "& { $(irm 'https://aka.ms/wiqd/install.ps1') }"` fails at step `[5/5]` when registering the plugin in Copilot CLI / Claude Code, or running `copilot plugin marketplace add microsoft/wiqd` fails with a Git execution error.
- **Root Cause:**
  Git for Windows is installed at `C:\Program Files\Git\cmd\git.exe`, but `C:\Program Files\Git\cmd` was not added to the Windows User or System `PATH` environment variable (or the PowerShell session was not restarted after installing Git). Both the `wiqd` installer and `copilot plugin marketplace add` shell out to `git` to clone the plugin marketplace.
- **Fix:**
  Add `C:\Program Files\Git\cmd` permanently to your Windows user `PATH` and update the current session:
  ```powershell
  $gitCmd = "C:\Program Files\Git\cmd"
  $userPath = [Environment]::GetEnvironmentVariable("Path", "User")
  if ($userPath -notlike "*$gitCmd*") {
      [Environment]::SetEnvironmentVariable("Path", "$userPath;$gitCmd", "User")
  }
  $env:Path += ";$gitCmd"
  git --version
  ```
  Then re-run `copilot plugin marketplace add microsoft/wiqd` and `copilot plugin install wiqd@wiqd`.

---

### Pitfall 2: Skills Are Ignored at Package Time or Trigger Schema Warnings (`agent-skills` Flag)

- **Symptom:**
  - `wiqd agent package` or `wiqd agent provision` fails or omits `appPackage/skills/<slug>/SKILL.md` from `appPackage/build/appPackage.<env>.zip`.
  - Or static validation flags `agent_skills` in `declarativeAgent.json` as an unrecognized property on older schema versions.
- **Root Cause:**
  1. The `agent-skills` feature flag in `wiqd` is disabled by default in new installations.
  2. `declarativeAgent.json` must use `"version": "v1.9"` (with `$schema` `v1.8`+), and the `wiqd` CLI needs `agent-skills` set to `true` so `fx-core` bundles the referenced `skills/<slug>` folders into the `.zip` package.
- **Fix:**
  Always enable the feature flag once per machine before working with skills:
  ```bash
  wiqd config flags set agent-skills true
  ```

---

### Pitfall 3: Clicking "Sign in to Agent" in Copilot Chat Does Nothing (`validDomains` & Comma-Delimited Scopes)

- **Symptom:**
  When you run `/github-repos` in M365 Copilot Chat, the agent displays the **"Sign in to Quote Assistant"** OAuth card, but clicking the **Sign in** button does nothing (no pop-up window opens, or it immediately closes).
- **Root Cause (Two Independent Causes):**
  1. **Missing `validDomains` in `appPackage/manifest.json`:** Scaffolded templates start with `"validDomains": []`. If `token.botframework.com`, `github.com`, and `api.githubcopilot.com` are not listed in `validDomains`, the M365 Copilot / Teams web host blocks the OAuth pop-up.
  2. **Space-Separated Scopes in `oauth/register`:** The `oauth/register` driver in `m365agents.yml` parses the `scope` string using `.split(",")` (**comma** delimiter, not space!). If you configure `MCP_DA_OAUTH_SCOPE_APIGITHUBC=repo read:org read:user` (with spaces), the Teams Developer Portal vault stores a single malformed scope `["repo read:org read:user"]` containing spaces, which breaks the authorization URL handshake.
- **Fix:**
  1. Add `"token.botframework.com"`, `"github.com"`, and `"api.githubcopilot.com"` to `validDomains` in `appPackage/manifest.json`.
  2. Always format `MCP_DA_OAUTH_SCOPE_APIGITHUBC` as **comma-separated without spaces**:
     ```dotenv
     MCP_DA_OAUTH_SCOPE_APIGITHUBC=repo,read:org,read:user
     ```
  3. Also check that your browser is not blocking pop-ups from `m365.cloud.microsoft` / `copilot.cloud.microsoft`, and verify your GitHub OAuth App callback URL is `https://teams.microsoft.com/api/platform/v1.0/oAuthRedirect`.

---

### Pitfall 4: OAuth Login Succeeds, But Every MCP Tool Call Fails (`scopes_supported` & Cached Vault IDs)

- **Symptom:**
  You click **Sign in**, authorize the GitHub OAuth App in the pop-up window, and return to M365 Copilot Chat — but every tool call to the GitHub MCP server fails (`403 Forbidden: insufficient scopes` or remote request failure).
- **Root Cause:**
  1. **Gateway Scope Validation (`scopes_supported`):** Generic tutorials often suggest leaving OAuth scopes blank (`scopes: []`) or using GitHub's `public_repo` scope. However, inspecting the GitHub Remote MCP Server's OAuth Protected Resource metadata endpoint:
     ```bash
     curl -s https://api.githubcopilot.com/.well-known/oauth-protected-resource/mcp/
     ```
     reveals that the `api.githubcopilot.com/mcp/` gateway explicitly requires scopes from its `scopes_supported` list (`repo`, `read:org`, `read:user`, etc.) and **does not accept** `public_repo` or empty scopes for repository search/inspection tools.
  2. **Stale OAuth Registration ID (`MCP_DA_AUTH_ID_APIGITHUBC`):** Once `oauth/register` writes `MCP_DA_AUTH_ID_APIGITHUBC` to `env/.env.local`, subsequent runs of `wiqd agent provision` **do not overwrite** the existing vault record in the Teams Developer Portal, and M365 Copilot continues using the cached token issued with the old scopes.
- **Fix:**
  1. Set `MCP_DA_OAUTH_SCOPE_APIGITHUBC=repo,read:org,read:user` in `env/.env.local` (and `env/.env.dev`).
  2. Whenever you change `clientId`, `clientSecret`, or `scope`, **clear the existing `MCP_DA_AUTH_ID_APIGITHUBC=` value** in `env/.env.local` before running `wiqd agent provision --env local`. This forces `oauth/register` to create a fresh vault configuration ID and invalidates cached tokens in M365 Copilot Chat.
  3. Start a **New Chat** session in M365 Copilot (`Ctrl+F5`) so the new `reference_id` is loaded.

---

### Pitfall 5: `get_file_contents` / `list_commits` Fail with `missing Mcp-Param-owner header` (MCP `SEP-2243` `x-mcp-header`)

- **Symptom:**
  After OAuth sign-in succeeds, `search_repositories` works (`200 OK`), but when the agent calls `get_file_contents`, `list_commits`, `list_branches`, or `list_tags`, the M365 Copilot Developer Debug Card shows:
  ```text
  Request failed (remote): header mismatch: missing Mcp-Param-owner header for parameter "owner"
  Request failed (remote): header mismatch: missing Mcp-Param-repo header for parameter "repo"
  ```
- **Root Cause:**
  In MCP protocol version `2026-07-28` (`SEP-2243`), the GitHub Remote MCP Server (`https://api.githubcopilot.com/mcp/`) annotates path-scoped input parameters (`owner`, `repo`) with `"x-mcp-header"` in the tool's `inputSchema`. It requires the MCP client to mirror those parameter values into HTTP request headers (`Mcp-Param-owner` and `Mcp-Param-repo`). Currently, the M365 Copilot Remote MCP runtime does not inject dynamic per-parameter `Mcp-Param-*` HTTP headers.
- **Fix (Query-Based Tool Pinning Pattern):**
  Instead of using path-parameter tools that require `x-mcp-header` (`get_file_contents`, `list_commits`, etc.), pin the **5 query-based read-only tools** in `appPackage/ai-plugin.json` (`get_me`, `search_repositories`, `search_code`, `search_commits`, `search_users`) — none of which use `x-mcp-header` — and instruct the skill (`appPackage/skills/github-repos/SKILL.md`) to use GitHub Search qualifiers:
  - **List the signed-in user's repositories:** Call `get_me` to get `login`, then call `search_repositories` with `query: "user:<login>"`.
  - **Inspect a repository's metadata:** Call `search_repositories` with `query: "repo:<owner>/<repo>"`.
  - **Read `README.md` and inspect source files:** Call `search_code` with `query: "repo:<owner>/<repo>"` and `query: "repo:<owner>/<repo> import OR def OR class OR from"`.
  - **Count and list all commits in a repository:** Call `search_commits` with:
    ```text
    repo:<owner>/<repo> committer-date:>2000-01-01
    ```
    *(Tip: GitHub's commit search API rejects a bare `repo:<owner>/<repo>` query unless paired with a search term or date qualifier; adding `committer-date:>2000-01-01` matches every commit in the repository and returns both `total_count` and the commit list!)*

---

### Pitfall 6: `M365AppNotFoundError` When Resolving OAuth Configuration (`applicableToApps: AnyApp`)

- **Symptom:**
  Tool calls fail with `404 NotFound`:
  ```json
  {
    "code": "NotFound",
    "message": "Configuration '...' not found in Application '<M365_APP_ID>'",
    "innerError": { "code": "M365AppNotFoundError" }
  }
  ```
- **Root Cause:**
  An M365 Copilot agent package receives two distinct identifiers during provisioning: `TEAMS_APP_ID` (created by `teamsApp/create`) and `M365_APP_ID` (created later by `copilotAgent/publish`). If `oauth/register` sets `applicableToApps: SpecificApp`, the Developer Portal binds the OAuth vault record strictly to `TEAMS_APP_ID`, whereas M365 Copilot Chat resolves the vault record under `M365_APP_ID`.
- **Fix:**
  In both `m365agents.yml` and `m365agents.local.yml`, always set:
  ```yaml
  appId: ${{TEAMS_APP_ID}}
  applicableToApps: AnyApp
  ```
  *(Note: Keep `appId: ${{TEAMS_APP_ID}}` even when `applicableToApps` is `AnyApp`, because the `oauth/register` action driver validates the presence of `appId` unconditionally.)*

---

### Pitfall 7: Coding Agent Edits Manifests Directly Without Running `wiqd` Workflows

- **Symptom:**
  When using an AI coding agent (such as GitHub Copilot CLI or Claude Code) to modify the project, the model occasionally edits `declarativeAgent.json` or `ai-plugin.json` directly without loading the `wiqd` skill, introducing schema regressions.
- **Root Cause:**
  Skill invocation based solely on `AGENTS.md` / `SKILL.md` descriptions is best-effort unless enforced by a pre-tool hook.
- **Fix:**
  This repository includes two built-in safeguards under `.github/`:
  1. **`.github/extensions/wiqd-agent-enforcer/extension.mjs`**: A Copilot CLI session extension (`onPreToolUse`) that blocks any file mutation under `appPackage/` or `m365agents*.yml` unless `skill("wiqd")` has been invoked in the current turn.
  2. **`.github/lsp.json`**: Automatically launches `wiqd agent lsp` to provide real-time manifest diagnostics (`MVL*`, `atk-env-var`, `atk-file-ref`) inside the coding agent session.

---

## 8. Security & Sanitization Checklist

This repository follows strict enterprise security hygiene so it can be safely shared, forked, and used as a customer template:

- [x] **Zero Hardcoded Secrets or Client IDs:** `env/.env.dev` contains empty placeholders (`MCP_DA_OAUTH_CLIENT_ID_APIGITHUBC=`), and user secrets (`SECRET_MCP_DA_OAUTH_CLIENT_SECRET_APIGITHUBC`) live only in gitignored `env/.env.*.user` files.
- [x] **Zero Tenant or App Instance IDs in Git:** `TEAMS_APP_ID`, `TEAMS_APP_TENANT_ID`, `M365_TITLE_ID`, `M365_APP_ID`, and `MCP_DA_AUTH_ID_APIGITHUBC` are generated dynamically at provision time into gitignored `env/.env.local`.
- [x] **Clean Environment Templates Included:** `env/.env.local.example` and `env/.env.user.example` document every variable with inline guidance.
- [x] **Least-Privilege Read-Only MCP Tool Pinning:** `appPackage/ai-plugin.json` pins only the 5 read-only search/profile tools (`get_me`, `search_repositories`, `search_code`, `search_commits`, `search_users`).

---

## 9. Official References & Documentation

Use these official Microsoft, GitHub, and Model Context Protocol resources to dive deeper into each component used in this project:

### Microsoft 365 Copilot Extensibility & Declarative Agents
- [Declarative Agents for Microsoft 365 Copilot Overview](https://learn.microsoft.com/en-us/microsoft-365-copilot/extensibility/overview-declarative-agent)
- [Build a Declarative Agent with Microsoft 365 Agents Toolkit](https://learn.microsoft.com/en-us/microsoft-365-copilot/extensibility/build-declarative-agents)
- [Declarative Agent Manifest Schema Reference](https://learn.microsoft.com/en-us/microsoft-365-copilot/extensibility/declarative-agent-manifest)
- [Write Effective Instructions for Declarative Agents](https://learn.microsoft.com/en-us/microsoft-365-copilot/extensibility/declarative-agent-instructions)

### Model Context Protocol (MCP) Plugins & OAuth Authentication in M365 Copilot
- [Build MCP Plugins for Microsoft 365 Copilot](https://learn.microsoft.com/en-us/microsoft-365-copilot/extensibility/build-mcp-plugins)
- [Step 1: Create an OAuth Client for MCP Plugin Authentication](https://learn.microsoft.com/en-us/microsoft-365-copilot/extensibility/build-mcp-plugins#step-1-create-an-oauth-client-for-authentication)
- [Configure Authentication for API and MCP Plugins (`OAuthPluginVault`)](https://learn.microsoft.com/en-us/microsoft-365-copilot/extensibility/api-plugin-authentication)
- [Microsoft 365 App Manifest Schema (`validDomains`, `copilotAgents`)](https://learn.microsoft.com/en-us/microsoftteams/platform/resources/schema/manifest-schema)

### Work IQ Dev Tools (`wiqd`), Evaluations & Coding Agents
- [Work IQ Dev Tools (`microsoft/wiqd`) Official Repository](https://github.com/microsoft/wiqd)
- [Microsoft 365 Copilot Agent Evaluations CLI Overview](https://learn.microsoft.com/en-us/microsoft-365/copilot/extensibility/evaluations-cli-overview)
- [GitHub Copilot CLI Documentation](https://docs.github.com/en/copilot/github-copilot-in-the-cli)

### GitHub Remote MCP Server & OAuth Apps
- [GitHub MCP Server Official Repository (`github/github-mcp-server`)](https://github.com/github/github-mcp-server)
- [Using the GitHub Remote MCP Server (`https://api.githubcopilot.com/mcp/`)](https://docs.github.com/en/copilot/customizing-copilot/extending-copilot-chat-with-mcp)
- [Creating an OAuth App in GitHub](https://docs.github.com/en/apps/oauth-apps/building-oauth-apps/creating-an-oauth-app)
- [Scopes for GitHub OAuth Apps](https://docs.github.com/en/apps/oauth-apps/building-oauth-apps/scopes-for-oauth-apps)
- [Model Context Protocol (MCP) Official Specification](https://modelcontextprotocol.io/introduction)

