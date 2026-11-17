# AGL Skills

AGL (Agent Guidance Language) compatible skills for enterprise agent tasks.

## Structure

AGL skills follow a three-section format:

### 1. Problem Overview

Defines the use case, goals, and constraints.

### 2. Required Tools and Resources

Lists data sources, tools, and materials needed.

### 3. Step-by-Step Instructions

Detailed execution steps, each with:
- Goal
- Input
- Actions
- Deliverable
- Acceptance Criteria

## Validation

AGL skills are validated by `skill_validate` with `agl: true`:

```json
{
  "skillSlug": "my-skill",
  "agl": true,
  "strict": true
}
```

### Validation Rules

- Three required top-level sections (Chinese or English)
- No duplicate sections
- Steps should have sub-sections
- Strict mode warns about missing acceptance criteria

## Chinese Sections

```markdown
# 1. 问题概述
# 2. 所需工具与资源
# 3. 分步骤指令
```

## English Sections

```markdown
# 1. Problem Overview
# 2. Required Tools and Resources
# 3. Step-by-Step Instructions
```

## Mixed Language

Both Chinese and English sections are accepted. The validator detects the language and validates accordingly.
