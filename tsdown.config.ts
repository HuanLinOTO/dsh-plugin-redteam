/** Build the host bundle. Peer `@deepseek-ai/*` imports stay external (the host provides them). */
import { defineConfig, type UserConfig } from 'tsdown'

const ID = '@huanlin/dsh-plugin-redteam'

const HOST_EXTERNALS = [
  '@deepseek-ai/cordis',
  '@deepseek-ai/dsh-llm',
  '@deepseek-ai/dsh-tools',
]

const libConfig: UserConfig = {
  name: ID,
  entry: { index: 'src/index.ts' },
  outDir: 'lib',
  format: ['esm'],
  platform: 'node',
  target: 'es2024',
  fixedExtension: false,
  dts: true,
  clean: true,
  external: HOST_EXTERNALS,
}

export default defineConfig([libConfig])
