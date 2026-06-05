# Supermarket

Official Plugin & Skill Registry for [Memoh](https://github.com/memohai/Memoh).

## Project Structure

```
supermarket/
├── plugins/               # Plugin registry
│   └── <plugin-id>/
│       ├── plugin.yaml    # Required plugin manifest
│       └── skills/        # Optional bundled skills
├── mcps/                  # MCP server registry
│   └── <mcp-id>/
│       └── mcp.yaml
├── skills/                # Skill registry
│   └── <skill-id>/
│       ├── SKILL.md       # Required entry file
│       └── ...            # Optional scripts, references, assets
├── server/                # Nitro API routes & utilities
│   ├── api/
│   │   ├── plugins/
│   │   ├── mcps/
│   │   └── skills/
│   ├── utils/
│   └── types/
├── src/                   # Vue frontend
├── nitro.config.ts
└── vite.config.ts
```

## API

Base URL: `https://supermarket.memoh.ai`

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/plugins` | List Plugins. Query: `q`, `tag`, `page`, `limit` |
| GET | `/api/plugins/:id` | Get Plugin details |
| GET | `/api/plugins/:id/download` | Download Plugin package (`plugin.yaml` plus bundled skills) |
| GET | `/api/mcps` | List MCPs. Query: `q`, `tag`, `transport`, `page`, `limit` |
| GET | `/api/mcps/:id` | Get MCP details |
| GET | `/api/mcps/:id/download` | Download MCP config. Query: `format=yaml\|json` |
| GET | `/api/skills` | List skills. Query: `q`, `tag`, `page`, `limit` |
| GET | `/api/skills/:id` | Get skill details |
| GET | `/api/skills/:id/download` | Download skill directory (tar.gz) |
| GET | `/api/tags` | List all tags (aggregated from Plugins and Skills) |

## Contributing

### Adding a Plugin

1. Create a directory under `plugins/` named after your plugin (e.g. `plugins/notion/`).
2. Add a `plugin.yaml` manifest:

```yaml
schema_version: "1"
id: notion
name: Notion
version: "0.1.0"
description: Use Notion pages, databases, and search from Memoh.
author:
  name: Memoh
  email: support@memoh.ai
icon:
  kind: builtin | external_url
  name: notion                 # for builtin
  url: https://example/icon.svg # for external_url
homepage: https://example.com
tags:
  - productivity
capabilities:
  - search_pages

auth_requirements:
  - key: notion_oauth
    type: none | managed_oauth | user_secret
    client_ref: notion
    scopes: []

mcps:
  - key: notion
    name: Notion
    transport: stdio
    command: npx
    args:
      - "-y"
      - "@notionhq/notion-mcp-server"
    auth_ref: notion_oauth
    visibility: hidden

skills: []
```

3. Optionally bundle skills under `plugins/<plugin-id>/skills/<skill-id>/SKILL.md`.

### Adding an MCP Server

1. Create a directory under `mcps/` named after your MCP (e.g. `mcps/my-mcp/`).
2. Add a `mcp.yaml` file with the following schema:

```yaml
name: my-mcp
description: A short description of what this MCP server does.
author:
  name: Your Name
  email: you@example.com
transport: sse | http | stdio     # Pick one

# For sse / http transport
url: https://example.com/mcp
headers:
  - key: Authorization
    description: Bearer token
    defaultValue: "Bearer ${API_KEY}"

# For stdio transport
command: npx
args:
  - "-y"
  - "@my-org/mcp-server"

# Environment variables (all transports)
env:
  - key: API_KEY
    description: API key for authentication
    defaultValue: ""

# Optional
icon: https://example.com/icon.svg
homepage: https://example.com
tags:
  - category
  - another-tag
```

### Adding a Skill

1. Create a directory under `skills/` named after your skill (e.g. `skills/my-skill/`).
2. Add a `SKILL.md` file with YAML frontmatter:

```markdown
---
name: my-skill
description: What this skill does and when to use it.
metadata:
  author:
    name: Your Name
    email: you@example.com
  tags:
    - tag1
    - tag2
  homepage: https://example.com
---

# My Skill

Instructions and documentation go here...
```

## License

[Apache-2.0](LICENSE)

---

Built with [Nitro](https://nitro.build) and [Cloudflare Workers](https://workers.cloudflare.com).
