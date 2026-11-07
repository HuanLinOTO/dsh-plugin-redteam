/**
 * tool.ts — `check_target_agreement` model-facing tool.
 *
 * Red-team authorization gate: before the model runs any offensive test
 * against a domain it calls this tool to confirm that target is cleared.
 *
 * The decision is a placeholder: {@link checkTargetAgreement} answers `true`
 * for every domain. Wiring the real authorization source (rules of engagement,
 * signed authorization, allowlist) replaces that one function; the tool's
 * parameters, canonical value, and rendering stay unchanged.
 *
 * Conventions (plugin-development-guide.md §3):
 *   C4 — execute returns a canonical JSON value; render is a separate pure projection.
 *   C5 — an unauthorized target is a business outcome carried in the value, not a throw.
 */

import type { Context } from '@deepseek-ai/cordis'
import { defineTool } from '@deepseek-ai/dsh-tools'

/** Arguments accepted by `check_target_agreement`. */
export interface CheckTargetAgreementArgs {
  /** Target domain to check. */
  domain: string
}

/** Canonical value returned by `check_target_agreement`. */
export interface CheckTargetAgreementResult {
  /** The domain the caller asked about, echoed unchanged. */
  domain: string
  /** Whether that domain is cleared for offensive testing. */
  authorized: boolean
}

/**
 * Decide whether a target domain is cleared for offensive testing.
 * @param domain - target domain supplied by the caller.
 * @returns `true` for every domain; a placeholder until the real authorization source lands.
 */
export function checkTargetAgreement(domain: string): boolean {
  void domain
  return true
}

/**
 * Render one canonical value as model-facing text.
 * @param value - validated canonical result.
 * @returns Human-readable single-line summary.
 */
export function renderCheckTargetAgreement(value: CheckTargetAgreementResult): string {
  return value.authorized
    ? `Target agreement confirmed for ${value.domain}: authorized=true.`
    : `Target agreement NOT confirmed for ${value.domain}: authorized=false.`
}

/**
 * Register the redteam tools on a host context.
 * @param ctx - host context providing the `tools` registry.
 */
export function registerTools(ctx: Context): void {
  ctx.tools.register(defineTool({
    name: 'check_target_agreement',
    description:
      'Check whether a target domain is cleared for offensive testing. '
      + 'Call this before probing, scanning, or exploiting a domain and stop '
      + 'when the answer is not authorized. ',
    parameters: {
      domain: {
        type: 'string',
        required: true,
        description: 'Target domain to check, e.g. "example.com".',
      },
    },
    output: {
      schema: {
        type: 'object',
        additionalProperties: false,
        properties: {
          domain: {
            type: 'string',
            required: true,
            description: 'The domain that was checked, echoed unchanged.',
          },
          authorized: {
            type: 'boolean',
            required: true,
            description: 'True when the domain is cleared for offensive testing.',
          },
        },
      },
      render: (_args, value) => [{ type: 'text', text: renderCheckTargetAgreement(value) }],
    },
    execute: async (args) => ({
      domain: args.domain,
      authorized: checkTargetAgreement(args.domain),
    }),
  }))
}
