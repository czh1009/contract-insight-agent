# Linsight Work Mode

Linsight is a work mode for enterprise agent tasks, not a separate Agent Backend.

## Architecture

```
Craft Agent Runtime
+ AGL Skill
+ Linsight Core Skill
+ Enterprise Templates
+ Tasks Conductor
```

## Linsight Core Skill

The `linsight-core` skill provides general work mode guidance:

1. **Task Clarification** — Confirm objectives and inputs
2. **Planning** — Create task lists for complex work
3. **Tool/Source Checking** — Verify available resources
4. **Execution** — Work through tasks systematically
5. **Quality Control** — Verify completeness and accuracy
6. **Completion** — Deliver results and set status

## Enterprise Templates

Pre-built templates for common enterprise tasks:

- **Document Review** — Review against standards
- **Report Generation** — Create structured reports
- **Policy Comparison** — Compare policies/standards
- **Ticket Assistant** — Process support tickets
- **Multi-Agent Research** — Coordinated research

## Key Principles

- Business skills override core skill guidance
- Permission mode is always respected
- External write operations require approval
- No fabricated results — evidence-based only
- Language follows user input
