---
name: Multi-Agent Collaboration
description: Coordinates multiple agent sessions for complex research tasks. Defines roles, handoff protocols, and quality gates.
---

# 1. Problem Overview

## 1.1 Use Case

Complex research tasks that benefit from parallel investigation and multi-perspective analysis. Single-agent execution may miss perspectives, produce shallow analysis, or lose context on long tasks. Multi-agent coordination divides labor across specialized roles.

## 1.2 Goal

Coordinate four specialized roles to produce a verified research report:
- **Research**: Gather information from multiple sources
- **Analysis**: Process findings, identify patterns and insights
- **Synthesis**: Combine analysis into a coherent narrative
- **Review**: Verify accuracy, completeness, and quality

## 1.3 Constraints

- Each role operates in its own session with focused context
- Output from earlier roles feeds into later roles via structured handoffs
- The orchestrator coordinates the flow and handles failures
- No role should fabricate information — all claims must trace to evidence

# 2. Required Tools and Resources

- **Research Question**: The topic or question to investigate
- **Data Sources** (optional): Connected sources for information retrieval
- **Review Criteria** (optional): Quality standards for the review phase

# 3. Step-by-Step Instructions

## 3.1 Task Planning

**Goal**: Break the research question into parallelizable investigation streams.

**Input**: Research question from user.

**Actions**:
1. Analyze the research question to identify 2-4 independent investigation angles
2. For each angle, define what information is needed
3. Assign investigation streams to the Research role
4. Create a dependency map: which streams can run in parallel, which depend on others

**Deliverable**: Research plan with parallel streams identified.

**Acceptance Criteria**: Streams are independent; each has clear scope.

## 3.2 Parallel Research

**Goal**: Gather information from multiple sources simultaneously.

**Input**: Research plan from step 3.1.

**Actions**:
1. Dispatch 2-3 Research sessions in parallel, each investigating one stream
2. Each session gathers information, takes notes, and produces a structured summary
3. Sessions save findings to `scratch/research-stream-{n}.md`
4. Monitor for completion; handle failures by retrying or reassigning

**Deliverable**: Research summaries from each stream.

**Acceptance Criteria**: Each stream has findings with source citations.

## 3.3 Analysis

**Goal**: Process raw research into structured insights.

**Input**: Research summaries from step 3.2.

**Actions**:
1. Read all research summaries
2. Identify patterns, contradictions, and gaps across streams
3. Categorize findings by theme or topic
4. Assess the strength of evidence for each finding
5. Save analysis to `scratch/analysis.md`

**Deliverable**: Structured analysis with categorized findings.

**Acceptance Criteria**: Analysis covers all research streams; evidence strength is assessed.

## 3.4 Synthesis

**Goal**: Combine analysis into a coherent research report.

**Input**: Analysis from step 3.3.

**Actions**:
1. Read the analysis document
2. Organize findings into a logical narrative structure
3. Write the report with:
   - Executive summary
   - Key findings (grouped by theme)
   - Evidence and supporting details
   - Implications and recommendations
   - Methodology note
4. Save to `output/research-report.md`

**Deliverable**: Complete research report draft.

**Acceptance Criteria**: Report is well-structured; findings flow logically.

## 3.5 Independent Review

**Goal**: Verify accuracy and quality of the report.

**Input**: Report draft from step 3.4.

**Actions**:
1. Read the report without seeing the analysis (fresh perspective)
2. Check each claim against the original research summaries
3. Verify that conclusions are supported by evidence
4. Identify any gaps, biases, or unsupported assertions
5. Produce a review with:
   - Verified claims
   - Unsupported claims (flagged)
   - Missing perspectives
   - Quality assessment
6. Save to `scratch/review.md`

**Deliverable**: Review report with verification results.

**Acceptance Criteria**: All claims are checked; unsupported claims are flagged.

## 3.6 Revision and Final Output

**Goal**: Incorporate review feedback and produce final deliverable.

**Input**: Report draft + review from steps 3.4-3.5.

**Actions**:
1. Read the review
2. Address flagged issues:
   - Remove or qualify unsupported claims
   - Add missing evidence where possible
   - Correct any factual errors
3. Write the final report to `output/final-report.md`
4. Summarize key findings to the user

**Deliverable**: Final verified report.

**Acceptance Criteria**: All review issues addressed; report is complete and accurate.
