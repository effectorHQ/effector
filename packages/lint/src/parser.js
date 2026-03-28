/**
 * Parser for SKILL.md files.
 *
 * Delegates to @effectorhq/core for YAML frontmatter parsing.
 * Re-exports the functions that existing consumers depend on.
 */

export {
  parseSkillFile,
  extractMetadata,
} from '@effectorhq/core/skill';
