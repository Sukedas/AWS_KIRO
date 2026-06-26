# MCP Integrations — AWS Learning Flash Cards

## Overview

This document lists all evaluated MCP (Model Context Protocol) server integrations relevant to AWS development for this project, along with their availability status and Kiro configuration instructions.

---

## Evaluated MCP Servers

### 1. AWS Documentation MCP Server
| Field | Value |
|---|---|
| **Package** | `awslabs.aws-documentation-mcp-server` |
| **Status** | ✅ Available |
| **Capability** | Fetches and searches official AWS documentation pages in real-time |
| **Use case** | Generating accurate `documentation_links` for flash cards, verifying service descriptions |

**Kiro Configuration** (`.kiro/settings/mcp.json`):
```json
{
  "mcpServers": {
    "aws-docs": {
      "command": "uvx",
      "args": ["awslabs.aws-documentation-mcp-server@latest"],
      "env": {
        "FASTMCP_LOG_LEVEL": "ERROR"
      },
      "disabled": false,
      "autoApprove": ["search_documentation", "get_documentation"]
    }
  }
}
```
**Prerequisites**: Install `uv` — see [uv installation guide](https://docs.astral.sh/uv/getting-started/installation/). Once installed, `uvx` downloads and runs the server automatically.

---

### 2. AWS CDK MCP Server
| Field | Value |
|---|---|
| **Package** | `awslabs.cdk-mcp-server` |
| **Status** | ✅ Available |
| **Capability** | Cloud architecture guidance, CDK construct recommendations, best practice checks |
| **Use case** | Architecture assistance when designing the deployment infrastructure |

**Kiro Configuration**:
```json
{
  "mcpServers": {
    "aws-cdk": {
      "command": "uvx",
      "args": ["awslabs.cdk-mcp-server@latest"],
      "env": {
        "FASTMCP_LOG_LEVEL": "ERROR"
      },
      "disabled": false,
      "autoApprove": []
    }
  }
}
```

---

### 3. Supabase MCP Server
| Field | Value |
|---|---|
| **Package** | `@supabase/mcp-server-supabase` (via npx) |
| **Status** | ✅ Available |
| **Capability** | Query Supabase projects, manage tables, inspect schema, run SQL |
| **Use case** | Iterating on database schema, verifying RLS policies during development |

**Kiro Configuration**:
```json
{
  "mcpServers": {
    "supabase": {
      "command": "npx",
      "args": ["-y", "@supabase/mcp-server-supabase@latest",
               "--supabase-url", "YOUR_SUPABASE_URL",
               "--supabase-key", "YOUR_SERVICE_ROLE_KEY"],
      "disabled": false,
      "autoApprove": ["list_tables", "describe_table"]
    }
  }
}
```
⚠️ Use the **service-role key** only in local development. Never commit this value to version control.

---

### 4. AWS CLI MCP Server
| Field | Value |
|---|---|
| **Package** | `awslabs.aws-cli-mcp-server` |
| **Status** | ✅ Available |
| **Capability** | Executes AWS CLI commands, browses service resources |
| **Use case** | Verifying Bedrock model availability, inspecting IAM roles during dev setup |

**Kiro Configuration**:
```json
{
  "mcpServers": {
    "aws-cli": {
      "command": "uvx",
      "args": ["awslabs.aws-cli-mcp-server@latest"],
      "env": {
        "AWS_PROFILE": "your-dev-profile",
        "FASTMCP_LOG_LEVEL": "ERROR"
      },
      "disabled": false,
      "autoApprove": []
    }
  }
}
```
**Prerequisites**: AWS CLI v2 installed and configured (`aws configure`).

---

## Recommended Open-Source Alternatives

If any of the above servers are unavailable, the following open-source alternatives cover the same capability areas:

| Capability | Alternative | Repository |
|---|---|---|
| AWS documentation lookup | `mcp-server-fetch` (fetch AWS docs URLs directly) | `github.com/modelcontextprotocol/servers` |
| Cloud architecture guidance | `mcp-server-filesystem` + local AWS Well-Architected docs | `github.com/modelcontextprotocol/servers` |
| AWS CLI assistance | Direct shell execution via `mcp-server-shell` | `github.com/modelcontextprotocol/servers` |

---

## Combining Multiple MCP Servers

All servers can be active simultaneously. Add each entry to the same `mcpServers` object in `.kiro/settings/mcp.json`. Servers reconnect automatically on config changes or can be restarted from the MCP Server view in the Kiro feature panel.

---

## Security Notes

- MCP servers with shell or CLI access should have `autoApprove` set to `[]` to require manual approval for all tool calls.
- Never include real credentials in committed config files. Use environment variable references or a secrets manager.
- The Supabase MCP server should use an anon key (read-only) in shared/CI environments, not the service-role key.
