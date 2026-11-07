<p align="center">
  <a href="https://dshfind.com/zh/plugins/huanlinoto/dsh-plugin-redteam"><img src="https://dshfind.com/api/card/huanlinoto/dsh-plugin-redteam?lang=zh" alt="dsh-plugin-redteam card"></a>
</p>

# dsh-plugin-redteam

红队（red team）授权门插件：给模型一个 `check_target_agreement(domain)` 工具，在发起任何攻击性测试前先确认目标域名已获授权。

**当前实现是占位**：判定恒为 `true`。真实授权来源（ROE 文档、授权书、白名单）尚未确定，接入时只需替换 `src/tool.ts` 里的 `checkTargetAgreement`，工具参数、规范返回值、渲染投影均不变。

## 当前行为

| 项 | 值 |
|----|----|
| 工具名 | `check_target_agreement` |
| 参数 | `domain`（string，必填） |
| 返回（规范值） | `{ "domain": "<回显>", "authorized": true }` |
| 渲染 | `Target agreement confirmed for <domain>: authorized=true.` |
| 配置 | 无（`cordis.patch.yml` 里 `config: {}`） |

约定遵循 `plugin-development-guide.md` §3：`execute` 返回一个规范 JSON 值（C4），`render` 是独立的纯投影；未授权属于业务非理想态，将来应体现在规范值的 `authorized=false` 里，而不是抛错（C5）。

## 开发

```sh
pnpm install          # 依赖：cordis / dsh-tools / dsh-llm 走 link 到本地 DSH checkout
pnpm run typecheck    # tsc --noEmit
pnpm test             # vitest（tests/tool.spec.ts）
pnpm run build        # tsc + tsdown → lib/index.js + lib/index.d.ts
```

- 纯 host 半边，无 client bundle、无 CSS 管线；UI 走通用工具卡片。
- `peerDependencies` 为宿主提供的 `@deepseek-ai/*`；`devDependencies` 用 `link:` 指向本地 checkout（路径是本机专用，勿提交到上游）。
- 预构建策略：`lib/` 入库（不在 `.gitignore`），不加 `prepare` 脚本，`github:` 安装开箱即用。

接入真实授权逻辑的位置：

1. 改 `checkTargetAgreement(domain)`——查授权台账/白名单，返回 `boolean`。
2. 授权来源若是部署相关（文件路径、API 地址），在 `src/index.ts` 加 Schemastery `Config` 并在 `cordis.patch.yml` 暴露字段（A4/A5），不要硬编码。

## 运行

```sh
dsh plugin --profile web add link:D:/Projects/deepseek-harness/dsh-plugin-redteam
# 或 github:huanlinoto/dsh-plugin-redteam
```

重启 `dsh web` 后工具出现在模型工具表里。卸载：`dsh plugin --profile web remove @huanlin/dsh-plugin-redteam`。

## 检查

```sh
pnpm run typecheck && pnpm test && pnpm run build
```

构建后可直接跑真实契约冒烟（不经 mock）：

```sh
node -e "import('./lib/index.js').then(async (m) => { const r = []; m.apply({ tools: { register: (d) => (r.push(d), () => {}) } }); const v = await r[0].execute({ domain: 'example.com' }, { signal: new AbortController().signal }); console.log(JSON.stringify(v)) })"
```

预期 `{"domain":"example.com","authorized":true}`。
