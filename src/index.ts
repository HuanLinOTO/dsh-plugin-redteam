/**
 * index.ts — dsh-plugin-redteam cordis plugin entry.
 *
 * Registers one model-facing tool, `check_target_agreement`. Registration is
 * effect-based (`ctx.tools.register`), so disposing the plugin fiber
 * unregisters the tool automatically.
 *
 * @module @huanlin/dsh-plugin-redteam
 */

import type { Context } from '@deepseek-ai/cordis'
import { registerTools } from './tool.js'

export const name = 'dsh-plugin-redteam'
export const inject = ['tools']

/**
 * Install the redteam tools on the host.
 * @param ctx - host context providing the `tools` registry.
 */
export function apply(ctx: Context): void {
  registerTools(ctx)
}
