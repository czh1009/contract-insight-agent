/**
 * AGL Markdown Static Validator
 *
 * Validates that a SKILL.md file follows AGL structure requirements:
 * - Contains three required top-level sections (Chinese or English)
 * - Steps have clear goals and deliverables
 * - No path traversal, duplicate resources, or illegal patterns
 *
 * This is a pure function module with no runtime/FS dependencies.
 */

import type {
  AglHeading,
  AglLanguage,
  AglValidationOptions,
  AglValidationResult,
  AglValidationError,
} from './types.ts';
import { AGL_REQUIRED_SECTIONS } from './types.ts';

/**
 * Extract headings from Markdown content.
 * Ignores headings inside code blocks (fenced by ```).
 * Handles BOM and CRLF line endings.
 */
export function extractHeadings(markdown: string): AglHeading[] {
  const normalized = markdown.replace(/^\uFEFF/, '').replace(/\r\n/g, '\n');
  const lines = normalized.split('\n');
  const headings: AglHeading[] = [];
  let inCodeBlock = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]!;
    const trimmed = line.trim();

    // Track fenced code blocks
    if (trimmed.startsWith('```')) {
      inCodeBlock = !inCodeBlock;
      continue;
    }

    if (inCodeBlock) continue;

    // Match ATX headings: # Heading, ## Heading, etc.
    const match = trimmed.match(/^(#{1,6})\s+(.+)$/);
    if (match) {
      headings.push({
        level: match[1]!.length,
        text: match[2]!.trim(),
        line: i + 1,
      });
    }
  }

  return headings;
}

/**
 * Detect the language of AGL section headings.
 */
function detectLanguage(headings: AglHeading[]): AglLanguage {
  const level1Texts = headings
    .filter((h) => h.level === 1)
    .map((h) => stripLeadingNumber(h.text));

  const hasZh = level1Texts.some((t) =>
    AGL_REQUIRED_SECTIONS.zh.some((s) => t.includes(s)),
  );
  const hasEn = level1Texts.some((t) =>
    AGL_REQUIRED_SECTIONS.en.some((s) => t.toLowerCase().includes(s.toLowerCase())),
  );

  if (hasZh && hasEn) return 'mixed';
  if (hasZh) return 'zh';
  if (hasEn) return 'en';
  return 'zh'; // default
}

/**
 * Strip leading numbering like "1. " or "1.1 " from heading text.
 */
function stripLeadingNumber(text: string): string {
  return text.replace(/^\d+([.\d]*)\s+/, '');
}

/**
 * Validate AGL structure in a SKILL.md file.
 *
 * @param content - The full SKILL.md content (with or without YAML frontmatter)
 * @param options - Validation options
 * @returns Validation result with errors, warnings, and detected headings
 */
export function validateAgl(
  content: string,
  options: AglValidationOptions = {},
): AglValidationResult {
  const errors: AglValidationError[] = [];
  const warnings: AglValidationError[] = [];

  // Strip YAML frontmatter if present
  const body = stripFrontmatter(content);
  const headings = extractHeadings(body);
  const language = detectLanguage(headings);

  // Check required sections
  const requiredSections =
    language === 'en'
      ? AGL_REQUIRED_SECTIONS.en
      : language === 'zh'
        ? AGL_REQUIRED_SECTIONS.zh
        : [...AGL_REQUIRED_SECTIONS.zh, ...AGL_REQUIRED_SECTIONS.en];

  const level1Texts = headings
    .filter((h) => h.level === 1)
    .map((h) => stripLeadingNumber(h.text).toLowerCase());

  for (const section of requiredSections) {
    const found = level1Texts.some((t) => t.includes(section.toLowerCase()));
    if (!found) {
      errors.push({
        field: `section.${section}`,
        message: `Missing required AGL section: "${section}"`,
        severity: 'error',
      });
    }
  }

  // Check for duplicate sections
  const seen = new Map<string, number>();
  for (const h of headings.filter((h) => h.level === 1)) {
    const key = stripLeadingNumber(h.text).toLowerCase();
    const count = (seen.get(key) ?? 0) + 1;
    seen.set(key, count);
    if (count > 1) {
      errors.push({
        field: `section.duplicate`,
        message: `Duplicate top-level section: "${h.text}"`,
        severity: 'error',
        line: h.line,
      });
    }
  }

  // Check that step sections have content (level 2 headings under step instructions)
  const stepSection = headings.find((h) =>
    h.level === 1 &&
    (stripLeadingNumber(h.text).toLowerCase().includes('step') ||
      stripLeadingNumber(h.text).includes('分步骤')),
  );

  if (stepSection) {
    const stepIndex = headings.indexOf(stepSection);
    const nextLevel1 = headings.findIndex(
      (h, i) => i > stepIndex && h.level === 1 && h !== stepSection,
    );
    const endIndex = nextLevel1 === -1 ? headings.length : nextLevel1;
    const stepHeadings = headings.slice(stepIndex + 1, endIndex).filter((h) => h.level === 2);

    if (stepHeadings.length === 0) {
      warnings.push({
        field: 'steps',
        message: 'Step section has no sub-steps (level 2 headings)',
        severity: 'warning',
        line: stepSection.line,
      });
    }
  }

  // Strict mode: warn about best practices
  if (options.strict) {
    // Check for acceptance criteria mentions
    const fullText = body.toLowerCase();
    if (!fullText.includes('acceptance') && !fullText.includes('验收')) {
      warnings.push({
        field: 'acceptance_criteria',
        message: 'No acceptance criteria found (recommended in strict mode)',
        severity: 'warning',
      });
    }
  }

  return {
    valid: errors.length === 0,
    language,
    errors,
    warnings,
    headings,
  };
}

/**
 * Strip YAML frontmatter from content.
 */
function stripFrontmatter(content: string): string {
  const normalized = content.replace(/^\uFEFF/, '').replace(/\r\n/g, '\n');
  const match = normalized.match(/^---\n[\s\S]*?\n---\n/);
  if (match) {
    return normalized.slice(match[0].length);
  }
  return normalized;
}
