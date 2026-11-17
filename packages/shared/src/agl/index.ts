export type {
  AglHeading,
  AglLanguage,
  AglValidationOptions,
  AglValidationResult,
  AglValidationError,
} from './types.ts';

export { AGL_REQUIRED_SECTIONS } from './types.ts';

export { validateAgl, extractHeadings } from './validator.ts';
