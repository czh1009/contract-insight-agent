/**
 * Enterprise Template Loader
 *
 * Discovers, loads, and validates enterprise templates from the filesystem.
 * Templates are directories containing a manifest.json and associated resources.
 */

import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join, resolve } from 'node:path';
import type {
  EnterpriseTemplateManifest,
  EnterpriseTemplateSummary,
} from './types.ts';
import { validateManifest } from './manifest-schema.ts';
import type { ManifestValidationResult } from './manifest-schema.ts';
import { isPathSafe } from './path-safety.ts';

const MANIFEST_FILE = 'manifest.json';
const SKILLS_DIR = 'skills';
const TASKS_DIR = 'tasks';

/**
 * Load and validate a single template from a directory.
 * Returns null if the directory doesn't contain a valid template.
 */
export function loadTemplate(
  templateDir: string,
): { manifest: EnterpriseTemplateManifest; validation: ManifestValidationResult } | null {
  const manifestPath = join(templateDir, MANIFEST_FILE);

  if (!existsSync(manifestPath)) return null;

  let raw: unknown;
  try {
    const content = readFileSync(manifestPath, 'utf-8');
    raw = JSON.parse(content.replace(/^\uFEFF/, ''));
  } catch {
    return null;
  }

  const validation = validateManifest(raw);
  if (!validation.valid) return null;

  return { manifest: raw as EnterpriseTemplateManifest, validation };
}

/**
 * Validate a loaded template's resource integrity.
 * Checks that all referenced paths exist and are safe.
 */
export function validateTemplateResources(
  manifest: EnterpriseTemplateManifest,
  templateDir: string,
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  // Validate all path fields
  const pathFields: Array<{ field: string; value?: string }> = [
    { field: 'starterPrompt', value: manifest.starterPrompt },
    { field: 'statuses', value: manifest.statuses },
    { field: 'labels', value: manifest.labels },
    { field: 'automations', value: manifest.automations },
  ];

  for (const { field, value } of pathFields) {
    if (!value) continue;

    const pathCheck = isPathSafe(value, templateDir);
    if (!pathCheck.safe) {
      errors.push(`${field}: ${pathCheck.reason}`);
      continue;
    }

    const fullPath = resolve(templateDir, value);
    if (!existsSync(fullPath)) {
      errors.push(`${field}: referenced file not found: ${value}`);
    }
  }

  // Validate skill directories exist
  for (const skillSlug of manifest.skills) {
    const skillDir = join(templateDir, SKILLS_DIR, skillSlug);
    const skillMd = join(skillDir, 'SKILL.md');
    if (!existsSync(skillMd)) {
      errors.push(`skills/${skillSlug}/SKILL.md: not found`);
    }
  }

  // Validate task files exist
  if (manifest.tasks) {
    for (const taskSlug of manifest.tasks) {
      const taskFile = join(templateDir, TASKS_DIR, taskSlug, 'task.yaml');
      if (!existsSync(taskFile)) {
        errors.push(`tasks/${taskSlug}/task.yaml: not found`);
      }
    }
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Discover all templates in a directory.
 * Each subdirectory with a valid manifest.json is treated as a template.
 */
export function discoverTemplates(templatesDir: string): EnterpriseTemplateSummary[] {
  if (!existsSync(templatesDir)) return [];

  const summaries: EnterpriseTemplateSummary[] = [];

  try {
    const entries = readdirSync(templatesDir, { withFileTypes: true });

    for (const entry of entries) {
      if (!entry.isDirectory()) continue;
      if (entry.name.startsWith('_')) continue; // Skip _shared and other meta-dirs

      const templateDir = join(templatesDir, entry.name);
      const loaded = loadTemplate(templateDir);

      if (!loaded) continue;

      // Count skills and tasks
      const skillsDir = join(templateDir, SKILLS_DIR);
      const skillCount = existsSync(skillsDir)
        ? readdirSync(skillsDir, { withFileTypes: true }).filter((d) => d.isDirectory()).length
        : 0;

      const tasksDir = join(templateDir, TASKS_DIR);
      const taskCount = existsSync(tasksDir)
        ? readdirSync(tasksDir, { withFileTypes: true }).filter((d) => d.isDirectory()).length
        : 0;

      summaries.push({
        id: loaded.manifest.id,
        name: loaded.manifest.name,
        description: loaded.manifest.description,
        version: loaded.manifest.version,
        category: loaded.manifest.category,
        agentProfile: loaded.manifest.agentProfile,
        skillCount,
        taskCount,
        requiredSources: loaded.manifest.requiredSources ?? [],
      });
    }
  } catch {
    // Return empty on directory read errors
  }

  return summaries;
}

/**
 * Load a template by ID from a templates directory.
 */
export function loadTemplateById(
  templatesDir: string,
  templateId: string,
): { manifest: EnterpriseTemplateManifest; templateDir: string } | null {
  const templateDir = join(templatesDir, templateId);
  const loaded = loadTemplate(templateDir);

  if (!loaded) return null;

  return { manifest: loaded.manifest, templateDir };
}
