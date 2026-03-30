---
name: git-workflow
description: Assist with Git operations including branching strategies, commit message conventions, merge conflict resolution, and pull request workflows. Use when the task involves git commands, branch management, or collaborative development workflows.
metadata:
  author:
    name: Supermarket Team
    email: team@supermarket.dev
  tags:
    - git
    - workflow
    - devtools
  homepage: https://github.com/memoh/supermarket
---

# Git Workflow

## Branching Strategy

Use a trunk-based development model:

- `main` — production-ready code
- `feat/<name>` — new features
- `fix/<name>` — bug fixes
- `chore/<name>` — maintenance tasks

## Commit Conventions

Follow Conventional Commits:

```
<type>(<scope>): <description>

[optional body]
```

Types: `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`

## Pull Request Workflow

1. Create a feature branch from `main`
2. Make small, focused commits
3. Open a PR with a clear description
4. Request review from at least one team member
5. Squash and merge after approval
