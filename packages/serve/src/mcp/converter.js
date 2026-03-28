/**
 * SKILL.md to MCP Tool Converter
 *
 * Converts parsed SKILL.md objects to MCP (Model Context Protocol) tool definitions.
 *
 * Mapping:
 * - SKILL.md name → MCP tool name
 * - SKILL.md description → MCP tool description
 * - SKILL.md requires.env → MCP inputSchema properties (all as strings)
 * - SKILL.md version, author → Preserved in tool metadata
 */

/**
 * Convert a parsed SKILL.md object to an MCP tool definition.
 *
 * The MCP tool schema follows JSON Schema with:
 * - name: Required, identifier for the tool
 * - description: Human-readable description
 * - inputSchema: JSON Schema object defining input parameters
 *
 * @param {Object} skill - Parsed skill object from parser.parseSkillFromFile()
 *        Expected structure:
 *        {
 *          frontmatter: {
 *            name: string,
 *            description: string,
 *            version: string,
 *            author: string,
 *            requires: {
 *              env: [string, ...]
 *            }
 *          },
 *          body: string,
 *          path: string
 *        }
 *
 * @returns {Object} MCP tool definition
 *         {
 *           name: string,
 *           description: string,
 *           inputSchema: {
 *             type: "object",
 *             properties: {
 *               [envVar]: { type: "string" }
 *             },
 *             required: [envVar, ...]
 *           },
 *           metadata: {
 *             version: string,
 *             author: string,
 *             skillPath: string
 *           }
 *         }
 *
 * @throws {Error} If skill is missing required fields (name, description)
 *
 * @example
 * const skill = {
 *   frontmatter: {
 *     name: 'EmailSender',
 *     description: 'Send emails via SMTP',
 *     requires: {
 *       env: ['SMTP_HOST', 'SMTP_PORT', 'EMAIL_USER']
 *     }
 *   },
 *   body: '# Email Sender...',
 *   path: './skills/email-sender.md'
 * };
 * const mcpTool = skillToMCPTool(skill);
 * // Returns MCP tool with inputSchema containing SMTP_HOST, SMTP_PORT, EMAIL_USER
 */
export function skillToMCPTool(skill) {
  const { frontmatter, body, path: skillPath } = skill;

  // Validate required fields
  if (!frontmatter.name) {
    throw new Error('Skill frontmatter must have a "name" field');
  }

  const description = frontmatter.description || 'No description provided';

  // Build inputSchema from requires.env
  const envVars = (frontmatter.requires?.env || []).filter((v) => v && typeof v === 'string');

  const inputSchema = {
    type: 'object',
    properties: {},
    required: envVars.length > 0 ? envVars : undefined,
  };

  // Each environment variable becomes a string property
  for (const envVar of envVars) {
    inputSchema.properties[envVar] = {
      type: 'string',
      description: `Environment variable: ${envVar}`,
    };
  }

  // Remove required field if empty
  if (!inputSchema.required || inputSchema.required.length === 0) {
    delete inputSchema.required;
  }

  // If no properties, keep properties as empty object
  // MCP spec requires inputSchema to always be an object

  const mcpTool = {
    name: normalizeToolName(frontmatter.name),
    description,
    inputSchema,
  };

  // Add metadata if available
  if (frontmatter.version || frontmatter.author || skillPath) {
    mcpTool._metadata = {
      version: frontmatter.version,
      author: frontmatter.author,
      skillPath,
    };
  }

  return mcpTool;
}

/**
 * Normalize a skill name to a valid MCP tool name.
 *
 * MCP tool names should:
 * - Start with a letter
 * - Contain only alphanumeric characters and underscores
 * - Be lowercase
 *
 * @param {string} name - The skill name
 * @returns {string} Normalized tool name
 *
 * @example
 * normalizeToolName('My Cool Skill') // 'my_cool_skill'
 * normalizeToolName('Email@Sender!') // 'email_sender'
 */
function normalizeToolName(name) {
  let normalized = name
    // Replace camelCase boundaries with underscore (before lowercasing)
    .replace(/([a-z])([A-Z])/g, '$1_$2')
    // Convert to lowercase
    .toLowerCase()
    // Replace spaces and special chars with underscores
    .replace(/[^a-z0-9_]/g, '_')
    // Collapse multiple underscores
    .replace(/_+/g, '_')
    // Remove leading/trailing underscores
    .replace(/^_+|_+$/g, '');

  // Ensure it starts with a letter
  if (/^[0-9_]/.test(normalized)) {
    normalized = 'skill_' + normalized;
  }

  return normalized;
}

/**
 * Convert multiple skills to MCP tools.
 *
 * @param {Array<Object>} skills - Array of parsed skill objects
 * @returns {Array<Object>} Array of MCP tool definitions
 *
 * @example
 * const skills = [skill1, skill2, skill3];
 * const tools = skillsToMCPTools(skills);
 */
export function skillsToMCPTools(skills) {
  return skills.map((skill) => skillToMCPTool(skill));
}

/**
 * Check if a skill is compatible with MCP conversion.
 *
 * Returns warnings/errors for skills that might not convert cleanly.
 *
 * @param {Object} skill - Parsed skill object
 * @returns {Array<string>} Array of warning/error messages (empty if valid)
 *
 * @example
 * const warnings = validateSkillForMCP(skill);
 * if (warnings.length > 0) {
 *   console.warn('Conversion warnings:', warnings);
 * }
 */
export function validateSkillForMCP(skill) {
  const warnings = [];
  const { frontmatter } = skill;

  if (!frontmatter.name) {
    warnings.push('Missing "name" field in frontmatter');
  }

  if (!frontmatter.description) {
    warnings.push('Missing "description" field (recommended)');
  }

  if (frontmatter.requires && Object.keys(frontmatter.requires).length > 0) {
    const unsupportedKeys = Object.keys(frontmatter.requires).filter((k) => k !== 'env');
    if (unsupportedKeys.length > 0) {
      warnings.push(
        `Unsupported requires fields: ${unsupportedKeys.join(', ')} (only "env" is converted to MCP inputSchema)`
      );
    }
  }

  return warnings;
}

/**
 * Internal for testing
 */
export { normalizeToolName };
