# UI 自动化测试与审计工具集 ([test-root])

> 本模板仅用于“已有 Playwright 测试框架中的 README 维护与补充”。
> 若项目尚未完成首次 Playwright/ui-test 基础框架初始化，请优先使用 `$playwright-bootstrap`。

本项目基于 **Playwright** 框架，集成了针对 [项目名称] 系统的冒烟测试、功能审计及全链路数据一致性校验工具。

## 环境准备 (Environmental Setup)

如果是首次在新的机器上使用，请按以下步骤准备环境：

1. **安装 Node.js**: 确保安装了 Node.js (建议 18.x 或以上版本)。
2. **安装项目依赖**:
   ```bash
   cd [project-root]
   npm install
   ```
3. **安装 Playwright 浏览器内核**:
   ```bash
   # 安装必要的浏览器二进制文件 (Chromium, Webkit 等)
   npx playwright install chromium
   ```
4. **(可选) 安装系统库**:
   如果是在 Linux 环境或遇到报错，可能需要安装系统级的显示库：
   ```bash
   npx playwright install-deps
   ```

---

## 目录结构说明

<!-- 根据项目实际情况填写，以下为示例模板 -->

- **`.auth/`**: 存放自动登录后的会话状态（Session Storage），供其他测试用例复用，实现"一次登录，多次测试"。
- **`capabilities/`**: **能力模块目录**。封装可复用的页面操作能力，供测试流程调用。
  - **`auth/`**: 认证相关能力。包括登录操作（`login.ts`）、已登录测试入口（`authed-test.ts`）、认证 Fixture（`session.ts`）。
  - **`common/`**: 通用能力。包括等待工具（`wait.ts`）、接口快照采集（`api-snapshot.ts`）、审计记录（`manual-audit.ts`）。
  - **`[模块名]/`**: [模块说明]。包括 [功能说明]（`[文件名].ts`）。
- **`flows/`**: **测试流程目录**。存放具体的测试用例（spec 文件）和前置准备脚本。
  - **`[模块名]/`**: [模块说明]。包括 [功能说明]（`[文件名].spec.ts`）和 [前置准备]（`[文件名].setup.ts`）。
- **`reporters/`**: **报告工具目录**。存放审计报告生成器（`audit-reporter.ts`），支持生成 Markdown 和 JSON 格式的审计报告。
- **`test.config.ts`**: **测试配置文件**。统一管理测试环境、账号、超时、选择器等配置。
- **`.gitignore`**: Git 忽略配置，排除认证状态文件和报告输出目录。

## 脚本执行清单 (Scripts Execution List)

<!-- 根据项目实际情况填写，以下为示例模板 -->

| 脚本路径 | 说明 | 静默执行 (Headless) | UI 显性执行 (Headed) |
|:---|:---|:---|:---|
| **认证与初始化** | | | |
| `[test-root]/flows/login/auth.setup.ts` | 全局登录态准备（刷新 `.auth/admin.json`） | `npx playwright test [test-root]/flows/login/auth.setup.ts` | - |
| **[模块名称]** | | | |
| `[test-root]/flows/[模块名]/[文件名].spec.ts` | [功能说明] | `npx playwright test [test-root]/flows/[模块名]/[文件名].spec.ts` | `--headed` |

---

## 维护说明

### 何时更新本文档

1. **新增测试模块时**：在「目录结构说明」和「脚本执行清单」中补充新模块信息。
2. **新增公共能力时**：在「目录结构说明」的 `capabilities/` 部分补充新能力说明。
3. **删除或重命名文件时**：同步更新文档中的对应描述。

### 更新规范

1. **目录结构说明**：保持与实际目录结构一致，每个目录和关键文件都应有简要说明。
2. **脚本执行清单**：列出所有可独立执行的测试脚本，包含完整的执行命令。
3. **格式要求**：使用 Markdown 表格展示脚本清单，保持对齐和可读性。
