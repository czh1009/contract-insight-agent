/**
 * Enterprise Template Types
 *
 * Domain model for enterprise application templates.
 * Templates are Craft Workspace Bundles that install skills, tasks,
 * statuses, labels, and automations into a workspace.
 */

/**
 * Metadata stored in a workspace's config.json when an enterprise template is installed.
 */
export interface InstalledEnterpriseTemplate {
  templateId: string;
  templateVersion: string;
  agentProfile: 'linsight';
  installedAt: number;
}

/**
 * Enterprise template manifest stored as manifest.json in each template directory.
 */
export interface EnterpriseTemplateManifest {
  schemaVersion: 1;
  id: string;
  name: string;
  description: string;
  version: string;
  category: string;
  agentProfile: 'linsight';
  skills: string[];
  tasks?: string[];
  requiredSources?: string[];
  starterPrompt?: string;
  statuses?: string;
  labels?: string;
  automations?: string;
}

/**
 * Lightweight summary for listing templates (consumed by UI).
 */
export interface EnterpriseTemplateSummary {
  id: string;
  name: string;
  description: string;
  version: string;
  category: string;
  agentProfile: 'linsight';
  skillCount: number;
  taskCount: number;
  requiredSources: string[];
}
