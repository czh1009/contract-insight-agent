import { describe, it, expect } from 'bun:test';
import { isPathSafe, validateTemplatePaths } from '../path-safety.ts';

describe('isPathSafe', () => {
  const baseDir = '/templates/document-review';

  it('accepts simple relative paths', () => {
    expect(isPathSafe('skills/doc-review/SKILL.md', baseDir).safe).toBe(true);
  });

  it('accepts nested relative paths', () => {
    expect(isPathSafe('tasks/review-pipeline/task.yaml', baseDir).safe).toBe(true);
  });

  it('rejects empty paths', () => {
    expect(isPathSafe('', baseDir).safe).toBe(false);
  });

  it('rejects absolute paths', () => {
    expect(isPathSafe('/etc/passwd', baseDir).safe).toBe(false);
  });

  it('rejects paths with ..', () => {
    expect(isPathSafe('../../../etc/passwd', baseDir).safe).toBe(false);
  });

  it('rejects paths with embedded ..', () => {
    expect(isPathSafe('skills/../../../etc/passwd', baseDir).safe).toBe(false);
  });

  it('rejects paths with null bytes', () => {
    expect(isPathSafe('skills/test\0/etc', baseDir).safe).toBe(false);
  });

  it('rejects Windows-style absolute paths', () => {
    expect(isPathSafe('C:\\Windows\\System32', baseDir).safe).toBe(false);
  });

  it('normalizes and rejects traversal', () => {
    expect(isPathSafe('skills/./../../etc/passwd', baseDir).safe).toBe(false);
  });
});

describe('validateTemplatePaths', () => {
  const templateDir = '/templates/doc-review';

  it('validates multiple safe paths', () => {
    const result = validateTemplatePaths(
      ['skills/doc/SKILL.md', 'tasks/review/task.yaml'],
      templateDir,
    );
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('catches unsafe paths in list', () => {
    const result = validateTemplatePaths(
      ['skills/doc/SKILL.md', '../../../etc/passwd'],
      templateDir,
    );
    expect(result.valid).toBe(false);
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0]!.path).toBe('../../../etc/passwd');
  });
});
