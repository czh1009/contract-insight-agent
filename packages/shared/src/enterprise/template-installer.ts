/**
 * Enterprise Template Installer
 *
 * Transactionally installs an enterprise template into a workspace.
 * Validates everything before writing, and rolls back on failure.
 *
 * Install flow:
 * 1. Load and validate template manifest
 * 2. Validate all paths and resources
 * 3. Reject if directory already exists (protect user data)
 * 4. Create workspace
 * 5. Copy _shared skills (e.g., linsight-core)
 * 6. Copy template skills
 * 7. Copy tasks (with validation)
 * 8. Merge statuses
 * 9. Merge labels
 * 10. Copy automations
 * 11. Write starter prompt
 * 12. Write enterprise metadata to config.json
 * 13. Register workspace in global config
 * 14. Invalidate skill cache
 *
 * On any failure: delete ONLY the directory we created, return error.
 */

import {
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  rmSync,
  copyFileSync,
} from 'node:fs';
import { join } from 'node:path';
import type {
  EnterpriseTemplateManifest,
  InstalledEnterpriseTemplate,
} from './types.ts';
import { loadTemplateById, validateTemplateResources } from './template-loader.ts';
import { isPathSafe, isSymlinkEscape } from './path-safety.ts';
import {
  createWorkspaceAtPath,
  saveWorkspaceConfig,
  deleteWorkspaceFolder,
  getWorkspaceSkillsPath,
} from '../workspaces/storage.ts';
import { addWorkspace } from '../config/storage.ts';
import { saveTaskSpec, parseTaskYaml } from '../tasks/storage.ts';
import { saveStatusConfig } from '../statuses/storage.ts';
import { saveLabelConfig } from '../labels/storage.ts';
import { invalidateSkillsCache } from '../skills/storage.ts';
import { atomicWriteFileSync } from '../utils/files.ts';
import type { WorkspaceConfig } from '../workspaces/types.ts';
import type { WorkspaceStatusConfig } from '../statuses/types.ts';
import type { WorkspaceLabelConfig } from '../labels/types.ts';

const SKILLS_DIR = 'skills';
const SHARED_DIR = '_shared';
const TASKS_DIR = 'tasks';
const AUTOMATIONS_FILE = 'automations.json';

/**
 * Result of a template installation attempt.
 */
export interface InstallResult {
  success: boolean;
  workspaceRoot?: string;
  workspaceId?: string;
  error?: string;
  details?: string[];
}

/**
 * Install an enterprise template into a new workspace.
 *
 * @param templatesDir - Directory containing enterprise-templates/
 * @param templateId - ID of the template to install
 * @param workspaceRoot - Path where the new workspace will be created
 * @param workspaceName - Display name for the workspace
 * @returns Installation result
 */
export function installEnterpriseTemplate(
  templatesDir: string,
  templateId: string,
  workspaceRoot: string,
  workspaceName: string,
): InstallResult {
  const details: string[] = [];

  // 1. Load and validate manifest
  const loaded = loadTemplateById(templatesDir, templateId);
  if (!loaded) {
    return { success: false, error: `Template "${templateId}" not found or has invalid manifest` };
  }

  const { manifest, templateDir } = loaded;
  details.push(`Loaded template: ${manifest.name} v${manifest.version}`);

  // 2. Validate all paths in manifest
  const pathFields = [
    manifest.starterPrompt,
    manifest.statuses,
    manifest.labels,
    manifest.automations,
  ].filter(Boolean) as string[];

  for (const p of pathFields) {
    const check = isPathSafe(p, templateDir);
    if (!check.safe) {
      return { success: false, error: `Unsafe path in manifest: ${check.reason}`, details };
    }
  }

  // 3. Validate template resources
  const resourceValidation = validateTemplateResources(manifest, templateDir);
  if (!resourceValidation.valid) {
    return {
      success: false,
      error: 'Template resource validation failed',
      details: [...details, ...resourceValidation.errors],
    };
  }

  details.push('Template validation passed');

  // 4. Safety check: reject if directory already exists (protect user data)
  let createdDirectory = false;
  if (existsSync(workspaceRoot)) {
    // Directory exists — check if it's already a valid workspace
    const configPath = join(workspaceRoot, 'config.json');
    if (existsSync(configPath)) {
      return {
        success: false,
        error: `Directory already contains a workspace: ${workspaceRoot}`,
        details,
      };
    }
    // Directory exists but is not a workspace — refuse to avoid data loss
    return {
      success: false,
      error: `Directory already exists and is not empty: ${workspaceRoot}. Choose a different location.`,
      details,
    };
  }

  // 5. Create workspace
  let workspaceConfig: WorkspaceConfig;
  try {
    workspaceConfig = createWorkspaceAtPath(workspaceRoot, workspaceName);
    createdDirectory = true;
    details.push(`Created workspace: ${workspaceConfig.id}`);
  } catch (e) {
    return {
      success: false,
      error: `Failed to create workspace: ${e instanceof Error ? e.message : 'Unknown error'}`,
      details,
    };
  }

  // --- Install steps with rollback on failure ---
  try {
    // 6. Copy _shared skills (e.g., linsight-core)
    const sharedSkillsCount = installSharedSkills(templateDir, workspaceRoot);
    if (sharedSkillsCount > 0) {
      details.push(`Installed ${sharedSkillsCount} shared skill(s)`);
    }

    // 7. Copy template skills
    installSkills(manifest, templateDir, workspaceRoot);
    details.push(`Installed ${manifest.skills.length} skill(s)`);

    // 8. Copy tasks (with validation)
    if (manifest.tasks && manifest.tasks.length > 0) {
      installTasks(manifest, templateDir, workspaceRoot);
      details.push(`Installed ${manifest.tasks.length} task(s)`);
    }

    // 9. Merge statuses
    if (manifest.statuses) {
      installStatuses(manifest, templateDir, workspaceRoot);
      details.push('Installed custom statuses');
    }

    // 10. Merge labels
    if (manifest.labels) {
      installLabels(manifest, templateDir, workspaceRoot);
      details.push('Installed custom labels');
    }

    // 11. Copy automations
    if (manifest.automations) {
      installAutomations(manifest, templateDir, workspaceRoot);
      details.push('Installed automations');
    }

    // 12. Write starter prompt
    if (manifest.starterPrompt) {
      installStarterPrompt(manifest, templateDir, workspaceRoot);
      details.push('Installed starter prompt');
    }

    // 13. Write enterprise metadata to config.json
    const enterpriseMeta: InstalledEnterpriseTemplate = {
      templateId: manifest.id,
      templateVersion: manifest.version,
      agentProfile: manifest.agentProfile,
      installedAt: Date.now(),
    };

    const updatedConfig: WorkspaceConfig = {
      ...workspaceConfig,
      enterprise: enterpriseMeta,
      updatedAt: Date.now(),
    };
    saveWorkspaceConfig(workspaceRoot, updatedConfig);
    details.push('Saved enterprise metadata');

    // 14. Register workspace in global config
    try {
      const registered = addWorkspace({
        name: workspaceName,
        rootPath: workspaceRoot,
      });
      details.push(`Registered workspace: ${registered.id}`);
    } catch (e) {
      details.push(`Warning: workspace registration failed (non-fatal): ${e instanceof Error ? e.message : 'Unknown error'}`);
    }

    // 15. Invalidate skill cache
    try {
      invalidateSkillsCache();
      details.push('Invalidated skill cache');
    } catch {
      details.push('Warning: skill cache invalidation failed (non-fatal)');
    }

    return { success: true, workspaceRoot, workspaceId: workspaceConfig.id, details };
  } catch (e) {
    // Rollback: ONLY delete the directory we just created
    details.push(`Installation failed: ${e instanceof Error ? e.message : 'Unknown error'}`);
    details.push('Rolling back: deleting workspace...');

    if (createdDirectory) {
      try {
        deleteWorkspaceFolder(workspaceRoot);
        details.push('Rollback complete: workspace deleted');
      } catch (rollbackError) {
        details.push(`Rollback failed: ${rollbackError instanceof Error ? rollbackError.message : 'Unknown error'}`);
      }
    } else {
      details.push('Rollback skipped: directory was not created by this installer');
    }

    return { success: false, error: e instanceof Error ? e.message : 'Installation failed', details };
  }
}

// ============================================================
// Installation Helpers
// ============================================================

/**
 * Copy skills from _shared directory (e.g., linsight-core).
 * These are shared across all templates.
 */
function installSharedSkills(
  templateDir: string,
  workspaceRoot: string,
): number {
  const sharedDir = join(templateDir, SHARED_DIR, SKILLS_DIR);
  if (!existsSync(sharedDir)) return 0;

  const destSkillsDir = getWorkspaceSkillsPath(workspaceRoot);
  let count = 0;

  try {
    const entries = readdirSync(sharedDir, { withFileTypes: true });
    for (const entry of entries) {
      if (!entry.isDirectory()) continue;

      const skillSlug = entry.name;
      const srcSkillDir = join(sharedDir, skillSlug);
      const srcSkillMd = join(srcSkillDir, 'SKILL.md');

      if (!existsSync(srcSkillMd)) continue;

      const check = isPathSafe(skillSlug, sharedDir);
      if (!check.safe) continue;

      const destSkillDir = join(destSkillsDir, skillSlug);
      mkdirSync(destSkillDir, { recursive: true });
      copyFileSync(srcSkillMd, join(destSkillDir, 'SKILL.md'));
      count++;
    }
  } catch {
    // Non-fatal: shared skills are optional
  }

  return count;
}

/**
 * Copy skill directories from template to workspace.
 * Validates each path before copying.
 */
function installSkills(
  manifest: EnterpriseTemplateManifest,
  templateDir: string,
  workspaceRoot: string,
): void {
  const destSkillsDir = getWorkspaceSkillsPath(workspaceRoot);

  for (const skillSlug of manifest.skills) {
    const srcSkillDir = join(templateDir, SKILLS_DIR, skillSlug);

    const check = isPathSafe(skillSlug, templateDir);
    if (!check.safe) {
      throw new Error(`Unsafe skill path: ${check.reason}`);
    }

    if (isSymlinkEscape(srcSkillDir, templateDir)) {
      throw new Error(`Skill directory is a symlink escaping template: ${skillSlug}`);
    }

    const srcSkillMd = join(srcSkillDir, 'SKILL.md');
    if (!existsSync(srcSkillMd)) {
      throw new Error(`Skill SKILL.md not found: ${skillSlug}`);
    }

    const destSkillDir = join(destSkillsDir, skillSlug);
    mkdirSync(destSkillDir, { recursive: true });
    copyFileSync(srcSkillMd, join(destSkillDir, 'SKILL.md'));

    // Copy additional files (icon, etc.)
    if (existsSync(srcSkillDir)) {
      const files = readdirSync(srcSkillDir, { withFileTypes: true });
      for (const file of files) {
        if (file.name === 'SKILL.md') continue;
        if (file.isFile()) {
          const srcFile = join(srcSkillDir, file.name);
          if (isSymlinkEscape(srcFile, templateDir)) {
            throw new Error(`Skill file is a symlink escaping template: ${skillSlug}/${file.name}`);
          }
          copyFileSync(srcFile, join(destSkillDir, file.name));
        }
      }
    }
  }
}

/**
 * Copy and validate task definitions.
 */
function installTasks(
  manifest: EnterpriseTemplateManifest,
  templateDir: string,
  workspaceRoot: string,
): void {
  for (const taskSlug of manifest.tasks!) {
    const check = isPathSafe(taskSlug, templateDir);
    if (!check.safe) {
      throw new Error(`Unsafe task path: ${check.reason}`);
    }

    const srcTaskDir = join(templateDir, TASKS_DIR, taskSlug);
    const srcTaskYaml = join(srcTaskDir, 'task.yaml');

    if (!existsSync(srcTaskYaml)) {
      throw new Error(`Task file not found: ${taskSlug}/task.yaml`);
    }

    const yamlContent = readFileSync(srcTaskYaml, 'utf-8');
    const parseResult = parseTaskYaml(yamlContent);

    if (!parseResult.valid || !parseResult.spec) {
      const errors = parseResult.errors.map((e) => e.message).join('; ');
      throw new Error(`Invalid task ${taskSlug}: ${errors}`);
    }

    saveTaskSpec(workspaceRoot, parseResult.spec);
  }
}

function installStatuses(
  manifest: EnterpriseTemplateManifest,
  templateDir: string,
  workspaceRoot: string,
): void {
  const srcStatuses = join(templateDir, manifest.statuses!);
  if (!existsSync(srcStatuses)) {
    throw new Error(`Statuses file not found: ${manifest.statuses}`);
  }
  const content = readFileSync(srcStatuses, 'utf-8');
  const statusConfig = JSON.parse(content) as WorkspaceStatusConfig;
  saveStatusConfig(workspaceRoot, statusConfig);
}

function installLabels(
  manifest: EnterpriseTemplateManifest,
  templateDir: string,
  workspaceRoot: string,
): void {
  const srcLabels = join(templateDir, manifest.labels!);
  if (!existsSync(srcLabels)) {
    throw new Error(`Labels file not found: ${manifest.labels}`);
  }
  const content = readFileSync(srcLabels, 'utf-8');
  const labelConfig = JSON.parse(content) as WorkspaceLabelConfig;
  saveLabelConfig(workspaceRoot, labelConfig);
}

function installAutomations(
  manifest: EnterpriseTemplateManifest,
  templateDir: string,
  workspaceRoot: string,
): void {
  const srcAutomations = join(templateDir, manifest.automations!);
  if (!existsSync(srcAutomations)) {
    throw new Error(`Automations file not found: ${manifest.automations}`);
  }
  const content = readFileSync(srcAutomations, 'utf-8');
  JSON.parse(content); // validate JSON
  atomicWriteFileSync(join(workspaceRoot, AUTOMATIONS_FILE), content);
}

function installStarterPrompt(
  manifest: EnterpriseTemplateManifest,
  templateDir: string,
  workspaceRoot: string,
): void {
  const srcPrompt = join(templateDir, manifest.starterPrompt!);
  if (!existsSync(srcPrompt)) {
    throw new Error(`Starter prompt not found: ${manifest.starterPrompt}`);
  }
  const content = readFileSync(srcPrompt, 'utf-8');
  atomicWriteFileSync(join(workspaceRoot, 'starter-prompt.md'), content);
}
