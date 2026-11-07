# dsh-plugin-redteam — Agent Guide

## 插件概览

Bundle 形式的 DSH 插件，只注册一个模型可见工具 `check_target_agreement`：红队测试的授权门。纯 host 半边，无 client UI。

## 关键约定

- **Bundle 形态**：`cordis.patch.yml` 插入一行（id `redteam`，name 为包名）；`package.json` 声明 `dsh.bundle.patch`。不改 DSH checkout 任何文件。
- **预构建 `lib/`**：`lib/` 入库，无 `prepare` 脚本（`@deepseek-ai/*` private peer 在 pnpm 临时目录拉不到）。
- **占位判定**：`checkTargetAgreement(domain)` 恒 `true`。接真实逻辑只改这一个函数。
- **ESM**：`type: module`，相对导入用 `.js` 后缀（NodeNext）。
- **defineTool 契约**：`execute` 返回规范 JSON 值，`render` 是独立纯投影。

## 文件职责

| 文件 | 职责 |
|------|------|
| `src/index.ts` | 入口：`name` / `inject = ['tools']` / `apply` |
| `src/tool.ts` | `checkTargetAgreement` / `renderCheckTargetAgreement` / `registerTools` |
| `tests/tool.spec.ts` | 单元测试（无活宿主） |

## 命令

```sh
pnpm run typecheck    # tsc --noEmit（src）
pnpm test             # vitest run
pnpm run build        # tsc + tsdown → lib/
```

## 注意

- 不要为占位实现加防御性输入校验或域名规范化——授权来源确定后再定输入策略。
- `pnpm install` 会警告 `ERR_PNPM_IGNORED_BUILDS`（esbuild 构建脚本被 pnpm 12 拦），不影响 `typecheck`/`test`/`build`。
