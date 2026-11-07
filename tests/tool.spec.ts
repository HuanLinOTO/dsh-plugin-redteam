import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { Context } from '@deepseek-ai/cordis'

vi.mock('@deepseek-ai/dsh-tools', () => ({
  defineTool: vi.fn((opts: unknown) => opts),
}))

import {
  checkTargetAgreement,
  renderCheckTargetAgreement,
  registerTools,
  type CheckTargetAgreementResult,
} from '../src/tool.js'
import { defineTool } from '@deepseek-ai/dsh-tools'

function makeCtx(): Context & { registered: unknown[]; disposers: (() => void)[] } {
  const registered: unknown[] = []
  const disposers: (() => void)[] = []
  const ctx = {
    tools: {
      register(definition: unknown): () => void {
        registered.push(definition)
        const disposer = (): void => {
          const i = registered.indexOf(definition)
          if (i >= 0) registered.splice(i, 1)
        }
        disposers.push(disposer)
        return disposer
      },
      schemas(): readonly { name: string; description: string }[] {
        return registered.map((d) => {
          const opts = d as { name: string; description: string }
          return { name: opts.name, description: opts.description }
        })
      },
    },
    logger: {
      info: vi.fn(),
      warn: vi.fn(),
      error: vi.fn(),
      debug: vi.fn(),
    },
  } as unknown as Context & { registered: unknown[]; disposers: (() => void)[] }
  Object.defineProperty(ctx, 'registered', { value: registered })
  Object.defineProperty(ctx, 'disposers', { value: disposers })
  return ctx
}

function getRegisteredTool(ctx: Context & { registered: unknown[] }): {
  name: string
  description: string
  parameters: Record<string, { type: string; required?: true }>
  output: { schema: unknown; render: (args: unknown, value: unknown) => { type: string; text: string }[] }
  execute: (args: unknown, exec: { signal: AbortSignal }) => Promise<unknown>
} {
  expect(ctx.registered).toHaveLength(1)
  return ctx.registered[0] as ReturnType<typeof getRegisteredTool>
}

describe('checkTargetAgreement', () => {
  it('answers true for a normal domain', () => {
    expect(checkTargetAgreement('example.com')).toBe(true)
  })

  it('answers true for an empty string (placeholder has no input policy yet)', () => {
    expect(checkTargetAgreement('')).toBe(true)
  })

  it('answers true for a host with a port and path', () => {
    expect(checkTargetAgreement('10.0.0.5:8443/admin')).toBe(true)
  })
})

describe('renderCheckTargetAgreement', () => {
  it('renders an authorized result with the checked domain', () => {
    const text = renderCheckTargetAgreement({ domain: 'example.com', authorized: true })
    expect(text).toContain('example.com')
    expect(text).toContain('authorized=true')
  })

  it('renders an unauthorized result with the checked domain', () => {
    const text = renderCheckTargetAgreement({ domain: 'example.com', authorized: false })
    expect(text).toContain('NOT confirmed')
    expect(text).toContain('authorized=false')
  })
})

describe('registerTools', () => {
  beforeEach(() => {
    vi.mocked(defineTool).mockClear()
  })

  it('registers exactly one tool named check_target_agreement', () => {
    const ctx = makeCtx()
    registerTools(ctx)
    const tool = getRegisteredTool(ctx)
    expect(defineTool).toHaveBeenCalledTimes(1)
    expect(tool.name).toBe('check_target_agreement')
    expect(tool.description.length).toBeGreaterThan(0)
  })

  it('disposing the registration removes the tool (HMR safety)', () => {
    const ctx = makeCtx()
    registerTools(ctx)
    expect(ctx.tools.schemas()).toHaveLength(1)
    expect(ctx.disposers).toHaveLength(1)
    ctx.disposers[0]()
    expect(ctx.tools.schemas()).toHaveLength(0)
  })

  it('declares domain as the single required string parameter', () => {
    const ctx = makeCtx()
    registerTools(ctx)
    const tool = getRegisteredTool(ctx)
    expect(Object.keys(tool.parameters)).toEqual(['domain'])
    expect(tool.parameters.domain.type).toBe('string')
    expect(tool.parameters.domain.required).toBe(true)
  })

  it('execute returns the canonical value with authorized=true', async () => {
    const ctx = makeCtx()
    registerTools(ctx)
    const tool = getRegisteredTool(ctx)
    const result = (await tool.execute(
      { domain: 'example.com' },
      { signal: new AbortController().signal },
    )) as CheckTargetAgreementResult
    expect(result).toEqual({ domain: 'example.com', authorized: true })
  })

  it('output.schema is a closed object with both required fields', () => {
    const ctx = makeCtx()
    registerTools(ctx)
    const tool = getRegisteredTool(ctx)
    const schema = tool.output.schema as {
      type: string
      additionalProperties: boolean
      properties: Record<string, { required?: true; type: string }>
    }
    expect(schema.type).toBe('object')
    expect(schema.additionalProperties).toBe(false)
    expect(schema.properties.domain.required).toBe(true)
    expect(schema.properties.authorized.required).toBe(true)
    expect(schema.properties.authorized.type).toBe('boolean')
  })

  it('output.render projects the canonical value as a single text block', () => {
    const ctx = makeCtx()
    registerTools(ctx)
    const tool = getRegisteredTool(ctx)
    const blocks = tool.output.render({ domain: 'example.com' }, {
      domain: 'example.com',
      authorized: true,
    })
    expect(blocks).toHaveLength(1)
    expect(blocks[0].type).toBe('text')
    expect(blocks[0].text).toContain('example.com')
  })
})
