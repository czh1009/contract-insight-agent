import { describe, expect, it, beforeEach, afterEach } from 'bun:test';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { handleSkillValidate } from './skill-validate.ts';

let tempDir: string;
let workspacePath: string;

function createCtx(overrides: Record<string, unknown> = {}) {
  return {
    workspacePath,
    sessionId: 'test-session',
    workingDirectory: undefined,
    fs: {
      exists: (p: string) => {
        try {
          const { statSync } = require('node:fs');
          statSync(p);
          return true;
        } catch {
          return false;
        }
      },
      readFile: (p: string) => {
        const { readFileSync } = require('node:fs');
        return readFileSync(p, 'utf-8');
      },
    },
    ...overrides,
  } as any;
}

function createSkill(slug: string, content: string, tier: 'workspace' | 'project' = 'workspace') {
  const base = tier === 'workspace'
    ? join(workspacePath, 'skills', slug)
    : join(workspacePath, 'project', '.agents', 'skills', slug);
  mkdirSync(base, { recursive: true });
  writeFileSync(join(base, 'SKILL.md'), content, 'utf-8');
  return join(base, 'SKILL.md');
}

beforeEach(() => {
  tempDir = mkdtempSync(join(tmpdir(), 'skill-validate-test-'));
  workspacePath = join(tempDir, 'workspace');
  mkdirSync(workspacePath, { recursive: true });
});

afterEach(() => {
  rmSync(tempDir, { recursive: true, force: true });
});

// ============================================================
// Basic validation (existing behavior)
// ============================================================

describe('handleSkillValidate - basic', () => {
  it('returns error for invalid slug', async () => {
    const result = await handleSkillValidate(createCtx(), { skillSlug: 'Invalid Slug!' });
    expect(result.isError).toBe(true);
  });

  it('returns error when SKILL.md not found', async () => {
    const result = await handleSkillValidate(createCtx(), { skillSlug: 'nonexistent' });
    expect(result.isError).toBe(true);
    expect(result.content[0]!.text).toContain('not found');
  });

  it('validates a correct SKILL.md', async () => {
    createSkill('test-skill', '---\nname: Test\ndescription: A test\n---\n\nInstructions here.');
    const result = await handleSkillValidate(createCtx(), { skillSlug: 'test-skill' });
    expect(result.isError).toBeFalsy();
    expect(result.content[0]!.text).toContain('Validation passed');
  });

  it('reports missing frontmatter fields', async () => {
    createSkill('bad-skill', '---\nname: Only Name\n---\n\nContent');
    const result = await handleSkillValidate(createCtx(), { skillSlug: 'bad-skill' });
    expect(result.isError).toBe(true);
    expect(result.content[0]!.text).toContain('description');
  });
});

// ============================================================
// AGL validation
// ============================================================

describe('handleSkillValidate - AGL', () => {
  const validAglContent = `---
name: Document Review
description: Review documents
---

# 1. 问题概述

审查合同文档。

# 2. 所需工具与资源

- @文档@

# 3. 分步骤指令

## 3.1 检查
检查文档。`;

  const validEnAglContent = `---
name: Report Generator
description: Generate reports
---

# 1. Problem Overview

Generate analysis reports.

# 2. Required Tools and Resources

- @data@

# 3. Step-by-Step Instructions

## 3.1 Collect Data
Gather information.`;

  it('skips AGL validation when agl is not set', async () => {
    createSkill('no-agl', '---\nname: No AGL\ndescription: Test\n---\n\nPlain content.');
    const result = await handleSkillValidate(createCtx(), { skillSlug: 'no-agl' });
    expect(result.content[0]!.text).not.toContain('AGL');
  });

  it('validates correct Chinese AGL structure', async () => {
    createSkill('zh-agl', validAglContent);
    const result = await handleSkillValidate(createCtx(), { skillSlug: 'zh-agl', agl: true });
    expect(result.isError).toBeFalsy();
    expect(result.content[0]!.text).toContain('AGL structure valid');
    expect(result.content[0]!.text).toContain('Chinese');
  });

  it('validates correct English AGL structure', async () => {
    createSkill('en-agl', validEnAglContent);
    const result = await handleSkillValidate(createCtx(), { skillSlug: 'en-agl', agl: true });
    expect(result.isError).toBeFalsy();
    expect(result.content[0]!.text).toContain('AGL structure valid');
    expect(result.content[0]!.text).toContain('English');
  });

  it('reports missing AGL sections', async () => {
    createSkill('incomplete-agl', `---\nname: Incomplete\ndescription: Test\n---\n\n# 1. 问题概述\n\nSome content.`);
    const result = await handleSkillValidate(createCtx(), { skillSlug: 'incomplete-agl', agl: true });
    expect(result.content[0]!.text).toContain('AGL structure invalid');
    expect(result.content[0]!.text).toContain('所需工具与资源');
  });

  it('does not run AGL validation when base validation fails', async () => {
    createSkill('bad-skill', '---\nname: Only\n---\n\nContent');
    const result = await handleSkillValidate(createCtx(), { skillSlug: 'bad-skill', agl: true });
    expect(result.isError).toBe(true);
    expect(result.content[0]!.text).not.toContain('AGL');
  });

  it('strict mode adds warnings for missing acceptance criteria', async () => {
    const noAcceptance = `---
name: Test
description: Test
---

# 1. 问题概述
# 2. 所需工具与资源
# 3. 分步骤指令`;
    createSkill('strict-skill', noAcceptance);
    const result = await handleSkillValidate(createCtx(), { skillSlug: 'strict-skill', agl: true, strict: true });
    expect(result.content[0]!.text).toContain('AGL Warnings');
    expect(result.content[0]!.text).toContain('acceptance criteria');
  });
});

// ============================================================
// Three-tier resolution
// ============================================================

describe('handleSkillValidate - tier resolution', () => {
  it('finds skill in workspace tier', async () => {
    createSkill('ws-skill', '---\nname: WS\ndescription: Test\n---\n\nContent.', 'workspace');
    const result = await handleSkillValidate(createCtx(), { skillSlug: 'ws-skill' });
    expect(result.content[0]!.text).toContain('workspace tier');
  });
});
