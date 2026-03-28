/**
 * Shared formatting utilities for the effector CLI.
 * Color output, guided prompts, NO_COLOR support.
 */

const NO_COLOR = process.env.NO_COLOR !== undefined;

export const c = {
  red:    s => NO_COLOR ? s : `\x1b[31m${s}\x1b[0m`,
  green:  s => NO_COLOR ? s : `\x1b[32m${s}\x1b[0m`,
  yellow: s => NO_COLOR ? s : `\x1b[33m${s}\x1b[0m`,
  cyan:   s => NO_COLOR ? s : `\x1b[36m${s}\x1b[0m`,
  bold:   s => NO_COLOR ? s : `\x1b[1m${s}\x1b[0m`,
  dim:    s => NO_COLOR ? s : `\x1b[2m${s}\x1b[0m`,
};
