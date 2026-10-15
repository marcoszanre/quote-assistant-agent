---
name: github-repos
description: Lists and searches GitHub repositories in read-only mode using the GitHub MCP server when triggered with /github-repos or when the user asks to list, find, or inspect repositories.
---
# github-repos

Activate this skill whenever the user runs the custom command `/github-repos` (or `!github-repos`, `github-repos <query>`) or asks to list, search, or inspect GitHub repositories.

## Command Syntax

- `/github-repos` — Lists repositories accessible to the signed-in GitHub user (or searches popular/user repositories).
- `/github-repos <owner-or-query>` — Lists or searches repositories matching `<owner-or-query>` (for example, `/github-repos microsoft`, `/github-repos kiota`, or `/github-repos user:<username>`).

## Scope & Guardrails (Read-Only Repositories Only)

- **Read-Only Enforcement:** Only invoke the pinned read-only search/profile tools from the GitHub MCP server (`apigithubc`): `get_me`, `search_repositories`, `search_commits`, `search_code`, and `search_users`.
- **Forbidden Actions:** Never invoke any write, mutation, or destructive GitHub MCP tools. If the user asks to modify a repository, politely explain that this agent and skill are scoped strictly to read-only repository access.

## Procedure

1. **Listing or finding repositories (`/github-repos` or `/github-repos <query>`)**:
   - If the user invokes `/github-repos` without arguments, first call `get_me` to get the signed-in GitHub user's `login`, then call `search_repositories` with `query: "user:<login>"`.
   - If the user provides an owner, organization, or keyword (e.g., `/github-repos kiota` or `/github-repos microsoft/kiota`), call `search_repositories` with that query.
2. **Inspecting a repository's structure and README (`<owner>/<repo>`)**:
   - Call `search_repositories` with `query: "repo:<owner>/<repo>"` to retrieve repository metadata (description, default branch, language, license, created/pushed dates).
   - Call `search_code` with `query: "repo:<owner>/<repo>"` to retrieve `README.md` fragments and top files.
   - Call `search_code` with `query: "repo:<owner>/<repo> import OR def OR class OR from"` to list the project's source and test file paths.
3. **Counting or listing commits in a repository (`<owner>/<repo>`)**:
   - Call `search_commits` with `query: "repo:<owner>/<repo> committer-date:>2000-01-01"` (GitHub commit search requires a date or text qualifier alongside `repo:`; `committer-date:>2000-01-01` matches all commits and returns `total_count` plus the commit list).
4. **Format the response**:
   - Present repository metadata, file structure, or commit history (`total_count`, SHA, date, author, message) in a clean markdown table or structured summary.

