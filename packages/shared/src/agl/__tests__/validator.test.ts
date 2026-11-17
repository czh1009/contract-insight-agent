import { describe, it, expect } from 'bun:test';
import { validateAgl, extractHeadings } from '../validator.ts';

// ============================================================
// extractHeadings
// ============================================================

describe('extractHeadings', () => {
  it('extracts headings from markdown', () => {
    const md = `# Title
## Subtitle
### Detail`;
    const headings = extractHeadings(md);
    expect(headings).toHaveLength(3);
    expect(headings[0]).toEqual({ level: 1, text: 'Title', line: 1 });
    expect(headings[1]).toEqual({ level: 2, text: 'Subtitle', line: 2 });
    expect(headings[2]).toEqual({ level: 3, text: 'Detail', line: 3 });
  });

  it('ignores headings inside code blocks', () => {
    const md = `# Real Heading

\`\`\`markdown
# Fake Heading
\`\`\`

## Another Real`;
    const headings = extractHeadings(md);
    expect(headings).toHaveLength(2);
    expect(headings[0]!.text).toBe('Real Heading');
    expect(headings[1]!.text).toBe('Another Real');
  });

  it('handles BOM', () => {
    const md = '\uFEFF# BOM Title';
    const headings = extractHeadings(md);
    expect(headings).toHaveLength(1);
    expect(headings[0]!.text).toBe('BOM Title');
  });

  it('handles CRLF line endings', () => {
    const md = '# Title\r\n## Sub\r\n';
    const headings = extractHeadings(md);
    expect(headings).toHaveLength(2);
  });

  it('strips leading numbering from heading text', () => {
    const md = '# 1. Problem Overview\n## 1.1 Goals';
    const headings = extractHeadings(md);
    expect(headings[0]!.text).toBe('1. Problem Overview');
    expect(headings[1]!.text).toBe('1.1 Goals');
  });
});

// ============================================================
// validateAgl - Chinese sections
// ============================================================

describe('validateAgl - Chinese sections', () => {
  const zhAgl = `---
name: 文档审查
description: 审查企业文档
---

# 1. 问题概述

## 1.1 适用场景
审查合同文档。

## 1.2 目标
识别风险条款。

# 2. 所需工具与资源

- @待审查文件@：审查对象

# 3. 分步骤指令

## 3.1 文档结构检查
检查文档完整性。

## 3.2 风险识别
识别风险条款。`;

  it('validates correct Chinese AGL', () => {
    const result = validateAgl(zhAgl);
    expect(result.valid).toBe(true);
    expect(result.language).toBe('zh');
    expect(result.errors).toHaveLength(0);
  });

  it('detects missing required sections', () => {
    const incomplete = `# 1. 问题概述

Some content here.`;
    const result = validateAgl(incomplete);
    expect(result.valid).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
    expect(result.errors.some((e) => e.message.includes('所需工具与资源'))).toBe(true);
    expect(result.errors.some((e) => e.message.includes('分步骤指令'))).toBe(true);
  });

  it('detects duplicate top-level sections', () => {
    const dup = `# 1. 问题概述
Content
# 2. 问题概述
More content`;
    const result = validateAgl(dup);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.message.includes('Duplicate'))).toBe(true);
  });
});

// ============================================================
// validateAgl - English sections
// ============================================================

describe('validateAgl - English sections', () => {
  const enAgl = `# 1. Problem Overview

## 1.1 Use Cases
Review contract documents.

## 1.2 Goals
Identify risk clauses.

# 2. Required Tools and Resources

- @documents@: Review target

# 3. Step-by-Step Instructions

## 3.1 Document Structure Check
Check document completeness.

## 3.2 Risk Identification
Identify risk clauses.`;

  it('validates correct English AGL', () => {
    const result = validateAgl(enAgl);
    expect(result.valid).toBe(true);
    expect(result.language).toBe('en');
    expect(result.errors).toHaveLength(0);
  });

  it('detects missing English sections', () => {
    const incomplete = `# 1. Problem Overview

Some content.`;
    const result = validateAgl(incomplete);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.message.includes('Required Tools'))).toBe(true);
  });
});

// ============================================================
// validateAgl - Mixed language
// ============================================================

describe('validateAgl - mixed language', () => {
  it('detects mixed Chinese and English sections', () => {
    const mixed = `# 1. 问题概述
Content
# 2. Required Tools and Resources
Content
# 3. 分步骤指令
Content`;
    const result = validateAgl(mixed);
    expect(result.language).toBe('mixed');
  });
});

// ============================================================
// validateAgl - edge cases
// ============================================================

describe('validateAgl - edge cases', () => {
  it('handles empty content', () => {
    const result = validateAgl('');
    expect(result.valid).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
  });

  it('handles content with only frontmatter', () => {
    const result = validateAgl('---\nname: test\n---\n');
    expect(result.valid).toBe(false);
  });

  it('handles code block pseudo-headings', () => {
    const md = `# 1. 问题概述

\`\`\`
# This is not a real heading
\`\`\`

# 2. 所需工具与资源

# 3. 分步骤指令`;
    const result = validateAgl(md);
    expect(result.valid).toBe(true);
    expect(result.headings).toHaveLength(3);
  });

  it('strict mode warns about missing acceptance criteria', () => {
    const md = `# 1. 问题概述
# 2. 所需工具与资源
# 3. 分步骤指令`;
    const result = validateAgl(md, { strict: true });
    expect(result.warnings.some((w) => w.message.includes('acceptance criteria'))).toBe(true);
  });

  it('strict mode does not warn when acceptance criteria present', () => {
    const md = `# 1. 问题概述
# 2. 所需工具与资源
# 3. 分步骤指令

验收标准：输出必须包含风险等级。`;
    const result = validateAgl(md, { strict: true });
    expect(result.warnings.some((w) => w.message.includes('acceptance criteria'))).toBe(false);
  });
});
