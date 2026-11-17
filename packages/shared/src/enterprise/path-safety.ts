/**
 * Path Safety Utilities
 *
 * Validates and normalizes file paths for template installation.
 * Prevents path traversal, symlink escape, and other security issues.
 */

import { resolve, normalize, relative, isAbsolute, sep } from 'node:path';
import { lstatSync } from 'node:fs';

/**
 * Check if a relative path is safe (no traversal, no absolute paths).
 *
 * A path is unsafe if it:
 * - Is empty
 * - Contains `..` segments
 * - Is an absolute path
 * - Contains null bytes
 * - Resolves to a location outside the base directory
 */
export function isPathSafe(relativePath: string, baseDir: string): { safe: boolean; reason?: string } {
  if (!relativePath) {
    return { safe: false, reason: 'Path is empty' };
  }

  if (relativePath.includes('\0')) {
    return { safe: false, reason: 'Path contains null bytes' };
  }

  if (isAbsolute(relativePath)) {
    return { safe: false, reason: `Path is absolute: ${relativePath}` };
  }

  // Also reject Windows-style absolute paths (C:\, D:\, \\server\)
  if (/^[A-Za-z]:[\\\/]/.test(relativePath) || /^\\\\/.test(relativePath)) {
    return { safe: false, reason: `Path is absolute (Windows): ${relativePath}` };
  }

  // Normalize and check for .. segments
  const normalized = normalize(relativePath);
  const segments = normalized.split(sep).filter(Boolean);

  if (segments.includes('..')) {
    return { safe: false, reason: `Path contains traversal: ${relativePath}` };
  }

  // Resolve against base and verify it stays within
  const resolved = resolve(baseDir, normalized);
  const resolvedBase = resolve(baseDir);
  const rel = relative(resolvedBase, resolved);

  if (rel.startsWith('..') || isAbsolute(rel)) {
    return { safe: false, reason: `Path escapes base directory: ${relativePath}` };
  }

  return { safe: true };
}

/**
 * Check if a path is a symlink that escapes the template directory.
 * Returns true if the path is a symlink pointing outside the base.
 */
export function isSymlinkEscape(path: string, baseDir: string): boolean {
  try {
    const stat = lstatSync(path);
    if (!stat.isSymbolicLink()) return false;

    const resolved = resolve(path);
    const resolvedBase = resolve(baseDir);
    const rel = relative(resolvedBase, resolved);

    return rel.startsWith('..') || isAbsolute(rel);
  } catch {
    // If we can't stat, assume safe (will fail later during copy)
    return false;
  }
}

/**
 * Validate all paths in a manifest against a template directory.
 * Returns all unsafe paths with reasons.
 */
export function validateTemplatePaths(
  paths: string[],
  templateDir: string,
): { valid: boolean; errors: Array<{ path: string; reason: string }> } {
  const errors: Array<{ path: string; reason: string }> = [];

  for (const p of paths) {
    const result = isPathSafe(p, templateDir);
    if (!result.safe) {
      errors.push({ path: p, reason: result.reason! });
    }
  }

  return { valid: errors.length === 0, errors };
}
