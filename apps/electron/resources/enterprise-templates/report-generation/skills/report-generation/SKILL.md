---
name: Report Generation
description: Generate structured reports from data, research, or analysis. Produces well-formatted documents with tables, insights, and recommendations.
---

# 1. Problem Overview

## 1.1 Use Case

Generate professional reports from provided data, research materials, or analytical requirements. Reports may include market analysis, performance summaries, project status updates, research findings, or operational reviews.

## 1.2 Goal

Produce a well-structured report that:
- Has a clear executive summary
- Presents data with appropriate structure (tables, lists, sections)
- Includes analysis and insights, not just data presentation
- Provides actionable recommendations where applicable
- Is formatted for the intended audience

## 1.3 Constraints

- Base all analysis on provided data — do not fabricate statistics or figures
- Clearly distinguish between data-driven conclusions and interpretive analysis
- If data is insufficient for a conclusion, state the limitation
- Use markdown as the primary output format; other formats are derived from it

# 2. Required Tools and Resources

- **Data or Research Materials**: The source data, files, or research notes for the report
- **Report Requirements** (optional): Template, style guide, or structural requirements
- **Audience Context** (optional): Who the report is for, what decisions it supports

If the user has connected data sources, use them to gather information. Otherwise, work with user-provided materials.

# 3. Step-by-Step Instructions

## 3.1 Requirement Clarification

**Goal**: Understand the report scope, audience, and format requirements.

**Input**: User's report request.

**Actions**:
1. Confirm the report topic and purpose
2. Identify the target audience (executives, technical team, clients, etc.)
3. Determine the report structure (sections, length, depth)
4. Identify available data sources
5. Agree on output format (markdown, HTML, or both)

**Deliverable**: Report brief with scope, structure, and format confirmed.

**Acceptance Criteria**: Report requirements are clear and agreed upon.

## 3.2 Data Collection and Organization

**Goal**: Gather and organize all necessary data.

**Input**: User-provided data, files, or source materials.

**Actions**:
1. Read all provided data sources
2. Organize data by topic or section
3. Identify data gaps — what information is missing?
4. Create an outline mapping data to report sections
5. If using connected sources, retrieve and cache relevant data

**Deliverable**: Organized data set with outline.

**Acceptance Criteria**: All available data is collected; gaps are identified.

## 3.3 Analysis and Insight Generation

**Goal**: Transform raw data into meaningful analysis.

**Input**: Organized data from step 3.2.

**Actions**:
1. Identify key trends, patterns, and anomalies in the data
2. Calculate or derive relevant metrics (growth rates, percentages, comparisons)
3. Generate insights that answer "so what?" for each data point
4. Prioritize insights by relevance to the report's purpose
5. Note any assumptions made during analysis

**Deliverable**: Analysis notes with key findings and insights.

**Acceptance Criteria**: Insights are derived from data; assumptions are documented.

## 3.4 Report Drafting

**Goal**: Write the complete report.

**Input**: Analysis from step 3.3, structure from step 3.1.

**Actions**:
1. Write the report following the agreed structure:
   - Executive Summary (1-2 paragraphs)
   - Introduction / Background
   - Methodology (if applicable)
   - Findings / Analysis (main body with subsections)
   - Conclusions
   - Recommendations
   - Appendix (data tables, sources)
2. Use tables for structured data comparisons
3. Use lists for action items and recommendations
4. Ensure each section has a clear purpose and flows logically

**Deliverable**: Complete report draft.

**Acceptance Criteria**: Report covers all sections; data is accurately represented.

## 3.5 Review and Refinement

**Goal**: Ensure report quality and accuracy.

**Input**: Draft report from step 3.4.

**Actions**:
1. Verify all data references are accurate
2. Check that the executive summary reflects the main findings
3. Ensure recommendations are actionable and tied to findings
4. Review for clarity, consistency, and tone appropriate to the audience
5. Fix any formatting or structural issues

**Deliverable**: Polished report.

**Acceptance Criteria**: Report is accurate, well-structured, and audience-appropriate.

## 3.6 Output Generation

**Goal**: Produce the final report files.

**Input**: Polished report from step 3.5.

**Actions**:
1. Write `output/report.md` with the complete report
2. If HTML was requested, generate `output/report.html`
3. Summarize the report's key findings and recommendations to the user

**Deliverable**: Report file(s) and summary.

**Acceptance Criteria**: Files are generated; user receives summary.
