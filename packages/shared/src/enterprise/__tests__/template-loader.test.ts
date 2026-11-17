import { describe, it, expect, beforeEach, afterEach } from 'bun:test';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { loadTemplate, validateTemplateResources, discoverTemplates } from '../template-loader.ts';
import type { EnterpriseTemplateManifest } from '../types.ts';

let tempDir: string;

const VALID_MANIFEST: EnterpriseTemplateManifest = {
  schemaVersion: 1,
  id: 'test-template',
  name: 'Test Template',
  description: 'A test template',
  version: '1.0.0',
  category: 'test',
  agentProfile: 'linsight',
  skills: ['test-skill'],
};

function createTemplateDir(id: string, manifestOverrides?: Partial<EnterpriseTemplateManifest>) {
  const dir = join(tempDir, id);
  mkdirSync(dir, { recursive: true });

  const manifest = { ...VALID_MANIFEST, id, ...manifestOverrides };
  writeFileSync(join(dir, 'manifest.json'), JSON.stringify(manifest, null, 2));

  // Create skill directory
  const skillDir = join(dir, 'skills', id === manifest.skills[0] ? manifest.skills[0] : manifest.skills[0]!);
  mkdirSync(skillDir, { recursive: true });
  writeFileSync(join(skillDir, 'SKILL.md'), `---\nname: ${manifest.name}\ndescription: test\n---\n\nContent.`);

  return dir;
}

beforeEach(() => {
  tempDir = mkdtempSync(join(tmpdir(), 'template-loader-test-'));
});

afterEach(() => {
  rmSync(tempDir, { recursive: true, force: true });
});

// ============================================================
// loadTemplate
// ============================================================

describe('loadTemplate', () => {
  it('loads a valid template', () => {
    createTemplateDir('my-template');
    const result = loadTemplate(join(tempDir, 'my-template'));
    expect(result).not.toBeNull();
    expect(result!.manifest.id).toBe('my-template');
    expect(result!.manifest.name).toBe('Test Template');
  });

  it('returns null for non-existent directory', () => {
    const result = loadTemplate(join(tempDir, 'nonexistent'));
    expect(result).toBeNull();
  });

  it('returns null for invalid manifest', () => {
    const dir = join(tempDir, 'bad');
    mkdirSync(dir, { recursive: true });
    writeFileSync(join(dir, 'manifest.json'), JSON.stringify({ id: 123 }));

    const result = loadTemplate(dir);
    expect(result).toBeNull();
  });

  it('returns null for missing manifest.json', () => {
    const dir = join(tempDir, 'no-manifest');
    mkdirSync(dir, { recursive: true });

    const result = loadTemplate(dir);
    expect(result).toBeNull();
  });
});

// ============================================================
// validateTemplateResources
// ============================================================

describe('validateTemplateResources', () => {
  it('validates a complete template', () => {
    const dir = createTemplateDir('complete');
    const loaded = loadTemplate(join(tempDir, 'complete'));
    expect(loaded).not.toBeNull();

    const result = validateTemplateResources(loaded!.manifest, join(tempDir, 'complete'));
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('reports missing skill files', () => {
    const dir = join(tempDir, 'missing-skill');
    mkdirSync(dir, { recursive: true });
    writeFileSync(join(dir, 'manifest.json'), JSON.stringify({
      ...VALID_MANIFEST,
      id: 'missing-skill',
      skills: ['nonexistent'],
    }));

    const loaded = loadTemplate(dir);
    expect(loaded).not.toBeNull();

    const result = validateTemplateResources(loaded!.manifest, dir);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes('nonexistent'))).toBe(true);
  });
});

// ============================================================
// discoverTemplates
// ============================================================

describe('discoverTemplates', () => {
  it('discovers valid templates', () => {
    createTemplateDir('template-a');
    createTemplateDir('template-b');

    const summaries = discoverTemplates(tempDir);
    expect(summaries.length).toBeGreaterThanOrEqual(2);

    const ids = summaries.map((s) => s.id);
    expect(ids).toContain('template-a');
    expect(ids).toContain('template-b');
  });

  it('skips _shared directory', () => {
    const sharedDir = join(tempDir, '_shared');
    mkdirSync(sharedDir, { recursive: true });
    writeFileSync(join(sharedDir, 'manifest.json'), JSON.stringify(VALID_MANIFEST));

    const summaries = discoverTemplates(tempDir);
    expect(summaries.every((s) => s.id !== '_shared')).toBe(true);
  });

  it('returns empty for non-existent directory', () => {
    const summaries = discoverTemplates(join(tempDir, 'nonexistent'));
    expect(summaries).toHaveLength(0);
  });

  it('returns correct summary fields', () => {
    createTemplateDir('summary-test');
    const summaries = discoverTemplates(tempDir);
    const summary = summaries.find((s) => s.id === 'summary-test');
    expect(summary).toBeDefined();
    expect(summary!.name).toBe('Test Template');
    expect(summary!.version).toBe('1.0.0');
    expect(summary!.agentProfile).toBe('linsight');
    expect(summary!.skillCount).toBe(1);
  });
});
