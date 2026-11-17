import { describe, it, expect, beforeEach, afterEach } from 'bun:test';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync, existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { installEnterpriseTemplate } from '../template-installer.ts';
import { loadWorkspaceConfig } from '../../workspaces/storage.ts';
import type { EnterpriseTemplateManifest } from '../types.ts';

let tempDir: string;
let templatesDir: string;
let workspacesDir: string;

function createTemplate(
  id: string,
  opts: {
    skills?: string[];
    tasks?: string[];
    statuses?: boolean;
    labels?: boolean;
    automations?: boolean;
    starterPrompt?: boolean;
  } = {},
) {
  const dir = join(templatesDir, id);
  mkdirSync(dir, { recursive: true });

  const manifest: EnterpriseTemplateManifest = {
    schemaVersion: 1,
    id,
    name: `Template ${id}`,
    description: `Description for ${id}`,
    version: '1.0.0',
    category: 'test',
    agentProfile: 'linsight',
    skills: opts.skills ?? ['test-skill'],
    tasks: opts.tasks,
    statuses: opts.statuses ? 'statuses.json' : undefined,
    labels: opts.labels ? 'labels.json' : undefined,
    automations: opts.automations ? 'automations.json' : undefined,
    starterPrompt: opts.starterPrompt ? 'starter-prompt.md' : undefined,
  };

  writeFileSync(join(dir, 'manifest.json'), JSON.stringify(manifest, null, 2));

  // Create skills
  for (const skillSlug of manifest.skills) {
    const skillDir = join(dir, 'skills', skillSlug);
    mkdirSync(skillDir, { recursive: true });
    writeFileSync(join(skillDir, 'SKILL.md'), `---\nname: ${skillSlug}\ndescription: test\n---\n\nInstructions.`);
  }

  // Create tasks
  if (manifest.tasks) {
    for (const taskSlug of manifest.tasks) {
      const taskDir = join(dir, 'tasks', taskSlug);
      mkdirSync(taskDir, { recursive: true });
      writeFileSync(join(taskDir, 'task.yaml'), [
        `id: ${taskSlug}`,
        `title: Test Task`,
        `goal: Test goal`,
        `acceptance_criteria: Test criteria`,
        `runner: conduct`,
        `nodes:`,
        `  - id: main`,
        `    title: Main`,
        `    prompt: Do the thing`,
        `    kind: session`,
      ].join('\n'));
    }
  }

  // Create statuses
  if (manifest.statuses) {
    writeFileSync(join(dir, manifest.statuses), JSON.stringify({
      version: 1,
      statuses: [
        { id: 'custom-status', label: 'Custom', category: 'open', isFixed: false, order: 0 },
      ],
    }));
  }

  // Create labels
  if (manifest.labels) {
    writeFileSync(join(dir, manifest.labels), JSON.stringify({
      version: 1,
      labels: [
        { id: 'custom-group', name: 'Custom Group', color: { light: '#FF0000', dark: '#FF6666' } },
      ],
    }));
  }

  // Create automations
  if (manifest.automations) {
    writeFileSync(join(dir, manifest.automations), JSON.stringify({ version: 1, automations: [] }));
  }

  // Create starter prompt
  if (manifest.starterPrompt) {
    writeFileSync(join(dir, manifest.starterPrompt), 'Welcome to the template.');
  }

  return dir;
}

beforeEach(() => {
  tempDir = mkdtempSync(join(tmpdir(), 'template-installer-test-'));
  templatesDir = join(tempDir, 'templates');
  workspacesDir = join(tempDir, 'workspaces');
  mkdirSync(templatesDir, { recursive: true });
  mkdirSync(workspacesDir, { recursive: true });
});

afterEach(() => {
  rmSync(tempDir, { recursive: true, force: true });
});

// ============================================================
// installEnterpriseTemplate
// ============================================================

describe('installEnterpriseTemplate', () => {
  it('installs a minimal template successfully', () => {
    createTemplate('minimal');
    const workspaceRoot = join(workspacesDir, 'test-ws');

    const result = installEnterpriseTemplate(templatesDir, 'minimal', workspaceRoot, 'Test WS');

    expect(result.success).toBe(true);
    expect(result.workspaceRoot).toBe(workspaceRoot);
    expect(existsSync(join(workspaceRoot, 'config.json'))).toBe(true);
    expect(existsSync(join(workspaceRoot, 'skills', 'test-skill', 'SKILL.md'))).toBe(true);
  });

  it('writes enterprise metadata to config.json', () => {
    createTemplate('meta-test');
    const workspaceRoot = join(workspacesDir, 'meta-ws');

    const result = installEnterpriseTemplate(templatesDir, 'meta-test', workspaceRoot, 'Meta WS');

    expect(result.success).toBe(true);

    const config = loadWorkspaceConfig(workspaceRoot);
    expect(config).not.toBeNull();
    expect(config!.enterprise).toBeDefined();
    expect(config!.enterprise!.templateId).toBe('meta-test');
    expect(config!.enterprise!.templateVersion).toBe('1.0.0');
    expect(config!.enterprise!.agentProfile).toBe('linsight');
    expect(config!.enterprise!.installedAt).toBeGreaterThan(0);
  });

  it('installs tasks with validation', () => {
    createTemplate('with-tasks', { tasks: ['review-task'] });
    const workspaceRoot = join(workspacesDir, 'task-ws');

    const result = installEnterpriseTemplate(templatesDir, 'with-tasks', workspaceRoot, 'Task WS');

    expect(result.success).toBe(true);
    expect(existsSync(join(workspaceRoot, 'tasks', 'review-task', 'task.yaml'))).toBe(true);
  });

  it('installs custom statuses', () => {
    createTemplate('with-statuses', { statuses: true });
    const workspaceRoot = join(workspacesDir, 'status-ws');

    const result = installEnterpriseTemplate(templatesDir, 'with-statuses', workspaceRoot, 'Status WS');

    expect(result.success).toBe(true);
    expect(existsSync(join(workspaceRoot, 'statuses', 'config.json'))).toBe(true);

    const statusConfig = JSON.parse(readFileSync(join(workspaceRoot, 'statuses', 'config.json'), 'utf-8'));
    expect(statusConfig.statuses.some((s: any) => s.id === 'custom-status')).toBe(true);
  });

  it('installs custom labels', () => {
    createTemplate('with-labels', { labels: true });
    const workspaceRoot = join(workspacesDir, 'label-ws');

    const result = installEnterpriseTemplate(templatesDir, 'with-labels', workspaceRoot, 'Label WS');

    expect(result.success).toBe(true);
    expect(existsSync(join(workspaceRoot, 'labels', 'config.json'))).toBe(true);
  });

  it('installs starter prompt', () => {
    createTemplate('with-prompt', { starterPrompt: true });
    const workspaceRoot = join(workspacesDir, 'prompt-ws');

    const result = installEnterpriseTemplate(templatesDir, 'with-prompt', workspaceRoot, 'Prompt WS');

    expect(result.success).toBe(true);
    expect(existsSync(join(workspaceRoot, 'starter-prompt.md'))).toBe(true);
    expect(readFileSync(join(workspaceRoot, 'starter-prompt.md'), 'utf-8')).toBe('Welcome to the template.');
  });

  it('rolls back on failure', () => {
    createTemplate('fail-template', { tasks: ['bad-task'] });
    // Create an invalid task file that will fail validation
    const taskDir = join(templatesDir, 'fail-template', 'tasks', 'bad-task');
    writeFileSync(join(taskDir, 'task.yaml'), 'invalid: [yaml: content: broken');

    const workspaceRoot = join(workspacesDir, 'fail-ws');

    const result = installEnterpriseTemplate(templatesDir, 'fail-template', workspaceRoot, 'Fail WS');

    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
    expect(existsSync(workspaceRoot)).toBe(false);
  });

  it('returns error for non-existent template', () => {
    const workspaceRoot = join(workspacesDir, 'no-template-ws');

    const result = installEnterpriseTemplate(templatesDir, 'nonexistent', workspaceRoot, 'No Template');

    expect(result.success).toBe(false);
    expect(result.error).toContain('not found');
  });

  it('installs all components in full template', () => {
    createTemplate('full', {
      skills: ['skill-a', 'skill-b'],
      tasks: ['task-1'],
      statuses: true,
      labels: true,
      automations: true,
      starterPrompt: true,
    });
    const workspaceRoot = join(workspacesDir, 'full-ws');

    const result = installEnterpriseTemplate(templatesDir, 'full', workspaceRoot, 'Full WS');

    expect(result.success).toBe(true);
    expect(result.details).toBeDefined();
    expect(result.details!.length).toBeGreaterThan(3);

    // Verify all components
    expect(existsSync(join(workspaceRoot, 'skills', 'skill-a', 'SKILL.md'))).toBe(true);
    expect(existsSync(join(workspaceRoot, 'skills', 'skill-b', 'SKILL.md'))).toBe(true);
    expect(existsSync(join(workspaceRoot, 'tasks', 'task-1', 'task.yaml'))).toBe(true);
    expect(existsSync(join(workspaceRoot, 'statuses', 'config.json'))).toBe(true);
    expect(existsSync(join(workspaceRoot, 'labels', 'config.json'))).toBe(true);
    expect(existsSync(join(workspaceRoot, 'automations.json'))).toBe(true);
    expect(existsSync(join(workspaceRoot, 'starter-prompt.md'))).toBe(true);
  });
});
