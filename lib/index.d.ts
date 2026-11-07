import { Context } from "@deepseek-ai/cordis";
declare const name = "dsh-plugin-redteam";
declare const inject: string[];
/**
 * Install the redteam tools on the host.
 * @param ctx - host context providing the `tools` registry.
 */
declare function apply(ctx: Context): void;
export { apply, inject, name };