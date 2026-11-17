# Enterprise Templates

Enterprise application templates for Craft Agents Linsight work mode.

## Available Templates

| Template | Description | Skills | Tasks |
|----------|-------------|--------|-------|
| document-review | Review documents against standards | 1 | 0 |
| report-generation | Generate structured reports | 1 | 0 |
| policy-comparison | Compare policies and standards | 1 | 0 |
| ticket-assistant | Assist with support tickets | 1 | 0 |
| multi-agent-collaboration | Multi-agent research coordination | 1 | 1 |

## Usage

1. Click "Add Workspace" in the sidebar
2. Select "Create new"
3. Choose a template (or "Blank Workspace" for empty)
4. Enter workspace name and location
5. Click "Create"

## Creating Custom Templates

Each template requires:

```
<template-id>/
├── manifest.json          # Template metadata (required)
├── starter-prompt.md      # Initial prompt (optional)
├── skills/
│   └── <skill-id>/
│       └── SKILL.md       # AGL-formatted skill (required)
└── tasks/                 # Optional multi-agent tasks
    └── <task-id>/
        └── task.yaml
```

### manifest.json

```json
{
  "schemaVersion": 1,
  "id": "my-template",
  "name": "My Template",
  "description": "Description",
  "version": "1.0.0",
  "category": "custom",
  "agentProfile": "linsight",
  "skills": ["my-skill"]
}
```

### SKILL.md (AGL Format)

Each business skill must follow AGL three-section structure:

```markdown
---
name: My Skill
description: What this skill does
---

# 1. Problem Overview

## 1.1 Use Case
...

## 1.2 Goal
...

# 2. Required Tools and Resources
...

# 3. Step-by-Step Instructions
...
```

## Template Validation

Templates are validated on installation:

- Manifest schema validation (Zod)
- AGL structure validation (three required sections)
- Path safety checks (no traversal, no symlinks)
- Skill file existence
- Task file validity (if tasks included)

## Notices

See `NOTICE.md` for license information.
