---
description: Upgrade system prompt patches to the latest Claude Code version
---

Upgrade system prompt patches to the latest Claude Code version.

1. Run `npm view @anthropic-ai/claude-code version` to get the latest version
2. List version directories under `system-prompt/` to find the most recent patched version
3. If patches already exist for the latest version, report that and stop
4. If not, follow `system-prompt/UPGRADING.md` to upgrade
5. Always go through the Final Verification Checklist at the bottom of UPGRADING.md
