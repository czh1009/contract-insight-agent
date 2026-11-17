/**
 * AGL (Agent Guidance Language) Types
 *
 * AGL is a Markdown/SOP specification for enterprise agent skills.
 * In this project, AGL manuals are carried directly by Craft SKILL.md files.
 * This module provides static validation of AGL structure.
 */

/**
 * Required top-level sections in an AGL manual.
 * Both Chinese and English titles are recognized.
 */
export const AGL_REQUIRED_SECTIONS = {
  zh: ['问题概述', '所需工具与资源', '分步骤指令'] as const,
  en: ['Problem Overview', 'Required Tools and Resources', 'Step-by-Step Instructions'] as const,
} as const;

export type AglLanguage = 'zh' | 'en' | 'mixed';

/**
 * A parsed AGL heading entry.
 */
export interface AglHeading {
  level: number;
  text: string;
  line: number;
}

/**
 * Options for AGL validation.
 */
export interface AglValidationOptions {
  /** Require specific language for sections (default: accept both) */
  language?: AglLanguage;
  /** Strict mode: warn on optional best practices */
  strict?: boolean;
}

/**
 * Result of AGL validation.
 */
export interface AglValidationResult {
  valid: boolean;
  language: AglLanguage;
  errors: AglValidationError[];
  warnings: AglValidationError[];
  headings: AglHeading[];
}

export interface AglValidationError {
  field: string;
  message: string;
  severity: 'error' | 'warning';
  line?: number;
}
