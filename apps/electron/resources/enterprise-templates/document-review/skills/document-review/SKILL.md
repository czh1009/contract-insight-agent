---
name: Document Review
description: Review enterprise documents against standards and requirements. Produces structured findings with risk levels and recommendations.
---

# 1. Problem Overview

## 1.1 Use Case

Review enterprise documents (contracts, reports, policies, technical specs) against defined standards, regulatory requirements, or organizational policies. Identify risks, gaps, non-compliance items, and areas for improvement.

## 1.2 Goal

Produce a structured review report that:
- Lists findings categorized by severity (Critical / Major / Minor / Advisory)
- Provides evidence from the source document for each finding
- Includes actionable recommendations
- Notes any areas that require human expert judgment

## 1.3 Constraints

- Do not fabricate findings — only report what is actually present in the document
- Distinguish between factual observations and interpretive assessments
- If a required review standard is not provided, state which checks were skipped
- Never execute external write operations (API calls, database updates) without explicit user approval

# 2. Required Tools and Resources

- **Source Document**: The document to be reviewed (user-provided file or pasted content)
- **Review Criteria** (optional): Standards, checklists, or comparison documents the user wants applied
- **Reference Materials** (optional): Related policies, regulations, or prior reviews for context

If the user has connected a document source (e.g., file system, cloud storage), use it to retrieve the document. Otherwise, ask the user to provide the document directly.

# 3. Step-by-Step Instructions

## 3.1 Document Intake

**Goal**: Obtain and understand the document to be reviewed.

**Input**: User-provided document or file path.

**Actions**:
1. Read the document content completely
2. Identify the document type (contract, report, policy, technical spec, etc.)
3. Note the document structure (sections, headings, appendices)
4. Confirm with the user what review criteria to apply, if not specified

**Deliverable**: Confirmation of document received and review scope agreed.

**Acceptance Criteria**: Document content is fully loaded; review scope is clear.

## 3.2 Structure Analysis

**Goal**: Map the document structure and identify review areas.

**Input**: Document content from step 3.1.

**Actions**:
1. Create a section map of the document
2. Identify key sections relevant to the review criteria
3. Flag any structural issues (missing sections, inconsistent formatting)
4. Note sections that reference external documents or standards

**Deliverable**: Document structure summary with review area mapping.

**Acceptance Criteria**: All major sections identified; review areas mapped to criteria.

## 3.3 Findings Extraction

**Goal**: Systematically review each section and extract findings.

**Input**: Document content + review criteria.

**Actions**:
1. Review each section against the applicable criteria
2. For each finding, record:
   - **Section**: Where in the document the finding occurs
   - **Severity**: Critical / Major / Minor / Advisory
   - **Finding**: Clear description of the issue
   - **Evidence**: Direct quote or reference from the document
   - **Recommendation**: Suggested action to address the finding
3. If information is insufficient to make a determination, note it as "Insufficient Information"
4. Do not infer or assume facts not present in the document

**Deliverable**: Complete list of findings with evidence.

**Acceptance Criteria**: Every finding has a severity level, evidence, and recommendation. No fabricated findings.

## 3.4 Risk Summary

**Goal**: Aggregate findings into a risk summary.

**Input**: Findings from step 3.3.

**Actions**:
1. Count findings by severity level
2. Identify the top 3-5 most critical issues
3. Assess overall document compliance (if review criteria were provided)
4. Note any patterns across findings (e.g., recurring issues in specific sections)

**Deliverable**: Risk summary with overall assessment.

**Acceptance Criteria**: Summary accurately reflects the findings; top risks are highlighted.

## 3.5 Review Report Generation

**Goal**: Produce the final review report.

**Input**: Document structure, findings, and risk summary.

**Actions**:
1. Write the review report to `output/review-report.md` with:
   - Executive summary
   - Document overview
   - Detailed findings (grouped by severity)
   - Risk summary
   - Recommendations
   - Appendix: Review criteria applied
2. If the user requested HTML output, generate `output/review-report.html`
3. Summarize the key findings to the user

**Deliverable**: Review report file(s) and verbal summary.

**Acceptance Criteria**: Report is complete, well-structured, and all findings are traceable to document evidence.

## 3.6 Completion

**Goal**: Finalize and hand off.

**Actions**:
1. Set session status to `needs-review` if available
2. Summarize: total findings, critical issues, overall assessment
3. Suggest next steps (e.g., expert review of critical findings, document revision)

**Deliverable**: Completion summary.

**Acceptance Criteria**: User has the report and understands the key findings.
