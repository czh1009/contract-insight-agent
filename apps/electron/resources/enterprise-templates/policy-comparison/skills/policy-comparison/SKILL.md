---
name: Policy Comparison
description: Compare policy documents, regulations, or standards. Identifies differences, gaps, and alignment across versions or jurisdictions.
---

# 1. Problem Overview

## 1.1 Use Case

Compare two or more policy documents, regulatory frameworks, standards, or contract versions to identify:
- Areas of alignment and consistency
- Differences and divergences
- Gaps where one document covers something the other does not
- Changes between versions of the same document
- Compliance implications across jurisdictions

## 1.2 Goal

Produce a structured comparison that:
- Maps corresponding sections across documents
- Highlights specific differences with evidence from each source
- Identifies gaps and overlap
- Provides a summary of alignment level
- Notes areas requiring human expert judgment

## 1.3 Constraints

- Base comparisons only on document content — do not assume intent or external context
- Clearly distinguish verbatim differences from interpretive differences
- If documents use different structures, create a cross-reference mapping
- Never fabricate content that does not exist in the source documents

# 2. Required Tools and Resources

- **Primary Document**: The baseline or "reference" document
- **Comparison Documents**: One or more documents to compare against the primary
- **Comparison Criteria** (optional): Specific areas or clauses to focus on

If the user has connected document sources, use them to retrieve files. Otherwise, ask the user to provide the documents.

# 3. Step-by-Step Instructions

## 3.1 Document Intake

**Goal**: Receive and understand all documents to be compared.

**Input**: User-provided documents.

**Actions**:
1. Read all documents completely
2. Identify each document's type (policy, regulation, standard, contract)
3. Note document metadata (version, date, authority, scope)
4. Confirm with the user which document is the baseline for comparison

**Deliverable**: All documents loaded; baseline confirmed.

**Acceptance Criteria**: All documents are fully loaded; comparison scope is clear.

## 3.2 Structure Mapping

**Goal**: Create a cross-reference map between document sections.

**Input**: All documents from step 3.1.

**Actions**:
1. Extract the section structure (headings, numbering) from each document
2. Identify corresponding sections across documents
3. Create a mapping table: Document A Section → Document B Section
4. Flag sections that exist in one document but not others
5. Note structural differences (different numbering, different organization)

**Deliverable**: Section mapping table.

**Acceptance Criteria**: All major sections are mapped; unmapped sections are flagged.

## 3.3 Clause-by-Clause Comparison

**Goal**: Systematically compare content across corresponding sections.

**Input**: Section mapping from step 3.2, document content.

**Actions**:
1. For each mapped section pair/group:
   - Extract the key provisions or requirements
   - Compare wording, scope, and obligations
   - Classify each difference:
     - **Identical**: Same meaning, same wording
     - **Substantive**: Same topic, different requirements
     - **Present/Absent**: Covered in one document, missing in another
     - **Structural**: Different organization or numbering
2. Record specific quotes where wording differs
3. Note any ambiguities that require expert interpretation

**Deliverable**: Detailed comparison table with classifications.

**Acceptance Criteria**: Each mapped section has a comparison classification; differences are documented with evidence.

## 3.4 Gap Analysis

**Goal**: Identify gaps, overlaps, and unique provisions.

**Input**: Comparison from step 3.3.

**Actions**:
1. Identify provisions unique to each document
2. Identify areas where documents overlap (full or partial)
3. Identify conflicts where documents contradict each other
4. Assess the significance of each gap (critical / moderate / minor)
5. Note any provisions that may have been updated or superseded

**Deliverable**: Gap analysis with significance ratings.

**Acceptance Criteria**: All significant gaps are identified and rated.

## 3.5 Comparison Report Generation

**Goal**: Produce the final comparison report.

**Input**: Structure mapping, comparison, and gap analysis.

**Actions**:
1. Write `output/comparison-report.md` with:
   - Executive summary (overall alignment level, key differences)
   - Document overview (metadata for each document)
   - Section-by-section comparison table
   - Gap analysis
   - Recommendations (e.g., which document to adopt, what to harmonize)
   - Appendix: Detailed clause comparisons
2. Include a summary table showing alignment percentage per section
3. Summarize the key differences to the user

**Deliverable**: Comparison report file and summary.

**Acceptance Criteria**: Report is complete; all differences are traceable to source documents.

## 3.6 Completion

**Goal**: Finalize and hand off.

**Actions**:
1. Set session status to `needs-review` if available
2. Summarize: alignment level, number of differences, critical gaps
3. Suggest next steps (e.g., legal review of conflicting provisions)

**Deliverable**: Completion summary.

**Acceptance Criteria**: User has the report and understands the key differences.
