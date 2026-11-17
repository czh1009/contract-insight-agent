/**
 * Enterprise Template Manifest Schema
 *
 * Zod schema for validating enterprise template manifests.
 * Only schemaVersion 1 is supported.
 */

import { z } from 'zod';

const SLUG_REGEX = /^[a-z0-9][a-z0-9-]*[a-z0-9]$|^[a-z0-9]$/;

export const EnterpriseTemplateManifestSchema = z.object({
  schemaVersion: z.literal(1),
  id: z.string().regex(SLUG_REGEX, 'Template ID must be lowercase kebab-case'),
  name: z.string().min(1, 'Template name is required'),
  description: z.string().min(1, 'Template description is required'),
  version: z.string().regex(/^\d+\.\d+\.\d+$/, 'Version must be SemVer (e.g. 1.0.0)'),
  category: z.string().min(1, 'Category is required'),
  agentProfile: z.literal('linsight'),
  skills: z.array(z.string().min(1)).min(1, 'At least one skill is required'),
  tasks: z.array(z.string().min(1)).optional(),
  requiredSources: z.array(z.string().min(1)).optional(),
  starterPrompt: z.string().min(1).optional(),
  statuses: z.string().min(1).optional(),
  labels: z.string().min(1).optional(),
  automations: z.string().min(1).optional(),
});

export type ParsedEnterpriseTemplateManifest = z.infer<typeof EnterpriseTemplateManifestSchema>;

/**
 * Validation result for enterprise template manifests.
 */
export interface ManifestValidationResult {
  valid: boolean;
  errors: ManifestValidationError[];
  warnings: ManifestValidationError[];
}

export interface ManifestValidationError {
  field: string;
  message: string;
  severity: 'error' | 'warning';
}

/**
 * Validate a raw manifest object against the schema.
 */
export function validateManifest(raw: unknown): ManifestValidationResult {
  const result = EnterpriseTemplateManifestSchema.safeParse(raw);

  if (result.success) {
    return { valid: true, errors: [], warnings: [] };
  }

  const errors: ManifestValidationError[] = result.error.issues.map((issue) => ({
    field: issue.path.join('.'),
    message: issue.message,
    severity: 'error' as const,
  }));

  return { valid: false, errors, warnings: [] };
}
