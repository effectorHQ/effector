/**
 * Validation rules for SKILL.md files
 */

export const SEVERITY = {
  ERROR: 'error',
  WARNING: 'warning',
  INFO: 'info'
};

/**
 * Run all validation rules against a parsed SKILL file
 * @param {Object} metadata - Extracted metadata from the skill
 * @param {string} body - The markdown body content
 * @returns {Array} - Array of validation results
 */
export function validateSkill(metadata, body) {
  const results = [];

  // Required fields
  results.push(...validateRequiredFields(metadata));

  // Name validation
  results.push(...validateName(metadata.name));

  // Description validation
  results.push(...validateDescription(metadata.description));

  // Emoji validation
  results.push(...validateEmoji(metadata.emoji));

  // Metadata structure
  results.push(...validateMetadataStructure(metadata));

  // Install entries
  results.push(...validateInstallEntries(metadata.install));

  // Body validation
  results.push(...validateBody(body));

  return results;
}

/**
 * Check that all required fields are present
 */
function validateRequiredFields(metadata) {
  const results = [];

  if (!metadata.name || metadata.name.trim() === '') {
    results.push({
      severity: SEVERITY.ERROR,
      rule: 'required-fields',
      message: 'Missing required field: "name" in frontmatter'
    });
  }

  if (!metadata.description || metadata.description.trim() === '') {
    results.push({
      severity: SEVERITY.ERROR,
      rule: 'required-fields',
      message: 'Missing required field: "description" in frontmatter'
    });
  }

  return results;
}

/**
 * Validate skill name format
 */
function validateName(name) {
  const results = [];

  if (!name) return results;

  // Check for kebab-case
  if (!/^[a-z0-9]([a-z0-9-]*[a-z0-9])?$/.test(name)) {
    results.push({
      severity: SEVERITY.WARNING,
      rule: 'name-format',
      message: `Skill name should be kebab-case. Got: "${name}"`
    });
  }

  // Check length
  if (name.length > 50) {
    results.push({
      severity: SEVERITY.WARNING,
      rule: 'name-length',
      message: `Skill name is long (${name.length} chars). Keep it under 50 characters.`
    });
  }

  return results;
}

/**
 * Validate skill description
 */
function validateDescription(description) {
  const results = [];

  if (!description) return results;

  // Check length
  if (description.length < 10) {
    results.push({
      severity: SEVERITY.WARNING,
      rule: 'description-length',
      message: 'Description is too short. Aim for 20-100 characters.'
    });
  }

  if (description.length > 200) {
    results.push({
      severity: SEVERITY.WARNING,
      rule: 'description-length',
      message: `Description is too long (${description.length} chars). Keep it under 200 characters.`
    });
  }

  // Check if it starts with capital letter
  if (description[0] !== description[0].toUpperCase()) {
    results.push({
      severity: SEVERITY.INFO,
      rule: 'description-format',
      message: 'Description should start with a capital letter for consistency.'
    });
  }

  return results;
}

/**
 * Validate emoji is present
 */
function validateEmoji(emoji) {
  const results = [];

  if (!emoji || emoji.trim() === '') {
    results.push({
      severity: SEVERITY.WARNING,
      rule: 'missing-emoji',
      message: 'Missing emoji in metadata.openclaw.emoji. Add one for better visual identification.'
    });
  } else if (emoji.length > 2) {
    results.push({
      severity: SEVERITY.WARNING,
      rule: 'emoji-format',
      message: `Emoji should be a single character. Got: "${emoji}"`
    });
  }

  return results;
}

/**
 * Validate metadata.openclaw structure
 */
function validateMetadataStructure(metadata) {
  const results = [];

  // This is informational; structure is flexible
  if (!metadata.metadata?.openclaw) {
    results.push({
      severity: SEVERITY.INFO,
      rule: 'metadata-structure',
      message: 'Consider adding metadata.openclaw section for better ClawHub discovery.'
    });
  }

  return results;
}

/**
 * Validate install entries
 */
function validateInstallEntries(installEntries) {
  const results = [];

  if (!Array.isArray(installEntries)) {
    return results; // Install section is optional
  }

  if (installEntries.length === 0) {
    results.push({
      severity: SEVERITY.INFO,
      rule: 'no-install',
      message: 'No install methods specified. Consider adding them for better user onboarding.'
    });
    return results;
  }

  installEntries.forEach((entry, index) => {
    // Check required fields for each install entry
    if (!entry.id) {
      results.push({
        severity: SEVERITY.ERROR,
        rule: 'install-missing-id',
        message: `Install method ${index}: missing required field "id"`
      });
    }

    if (!entry.kind) {
      results.push({
        severity: SEVERITY.ERROR,
        rule: 'install-missing-kind',
        message: `Install method ${index}: missing required field "kind"`
      });
    }

    // Validate kind value
    const validKinds = ['brew', 'apt', 'manual', 'npm', 'pip'];
    if (entry.kind && !validKinds.includes(entry.kind)) {
      results.push({
        severity: SEVERITY.WARNING,
        rule: 'install-invalid-kind',
        message: `Install method ${index}: unknown kind "${entry.kind}". Valid: ${validKinds.join(', ')}`
      });
    }

    // Check for installation target
    const hasTarget = entry.formula || entry.package || entry.steps;
    if (!hasTarget) {
      results.push({
        severity: SEVERITY.ERROR,
        rule: 'install-no-target',
        message: `Install method ${index}: missing installation target (formula/package/steps)`
      });
    }

    // If kind requires bins/formula/package, check they exist
    if (entry.kind === 'brew' && !entry.formula) {
      results.push({
        severity: SEVERITY.ERROR,
        rule: 'install-missing-formula',
        message: `Install method ${index}: brew kind requires "formula" field`
      });
    }

    if (entry.kind === 'apt' && !entry.package) {
      results.push({
        severity: SEVERITY.ERROR,
        rule: 'install-missing-package',
        message: `Install method ${index}: apt kind requires "package" field`
      });
    }

    if (entry.kind === 'manual' && (!entry.steps || !Array.isArray(entry.steps))) {
      results.push({
        severity: SEVERITY.ERROR,
        rule: 'install-missing-steps',
        message: `Install method ${index}: manual kind requires "steps" array`
      });
    }
  });

  return results;
}

/**
 * Validate markdown body content
 */
function validateBody(body) {
  const results = [];

  if (!body || body.trim() === '') {
    results.push({
      severity: SEVERITY.WARNING,
      rule: 'empty-body',
      message: 'Skill description body is empty. Add sections like "Purpose", "When to Use", "Setup", etc.'
    });
    return results;
  }

  const bodyLower = body.toLowerCase();

  // Check for common sections
  const requiredSections = ['purpose', 'when to use', 'setup'];
  const missingSections = [];

  requiredSections.forEach(section => {
    if (!bodyLower.includes(`## ${section.toLowerCase()}`) &&
        !bodyLower.includes(`# ${section.toLowerCase()}`)) {
      missingSections.push(section);
    }
  });

  if (missingSections.length > 0) {
    results.push({
      severity: SEVERITY.WARNING,
      rule: 'missing-sections',
      message: `Consider adding sections: ${missingSections.map(s => `"${s}"`).join(', ')}`
    });
  }

  // Check for examples section
  if (!bodyLower.includes('## example') && !bodyLower.includes('# example')) {
    results.push({
      severity: SEVERITY.INFO,
      rule: 'no-examples',
      message: 'Consider adding an "Examples" section with usage patterns.'
    });
  }

  return results;
}
