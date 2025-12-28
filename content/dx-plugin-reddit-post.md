# Reddit Post: r/ClaudeAI

**Title:** Created my first plugin for improving general developer experience with Claude Code

---

I've been using custom slash commands and a skill with Claude Code for a while now, and I found them useful enough that I wanted to package them into a plugin so they're easier to install.

The plugin is called `dx` (developer experience) and includes:

| Command/Skill | What it does |
|---------------|--------------|
| `/dx:gha <url>` | Analyzes GitHub Actions failures - checks for flakiness, identifies breaking commits, suggests fixes |
| `/dx:handoff` | Creates a handoff document so the next agent with fresh context can continue your work |
| `/dx:clone` | Clones the current conversation so you can branch off and try a different approach |
| `reddit-fetch` | Fetches Reddit content via Gemini CLI when WebFetch is blocked (auto-invoked) |

**Install with two commands:**

```bash
claude plugin marketplace add ykdojo/claude-code-tips
claude plugin install dx@ykdojo
```

I also considered including Playwright MCP, but I decided to leave it out for simplicity - if you already have it installed, you don't want duplicates. You can add it separately with:

```bash
claude mcp add playwright npx @playwright/mcp@latest
```

**Source repo:** https://github.com/ykdojo/claude-code-tips

Let me know if you have any feedback.
