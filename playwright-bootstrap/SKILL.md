---
name: playwright-bootstrap
description: 仅在新项目首次初始化 Playwright ui-test 基础框架，或在缺少同类基础框架时进行首次补齐时使用。适用于创建 ui-test/package.json、ui-test/tsconfig.json、ui-test/playwright.config.ts、README、.gitignore 以及可跨项目复用的数据库查询与审计报告基础能力模板。不用于日常脚本开发、已有框架内的普通功能扩展、业务用例编写、调试、重构或维护。
---

#  Playwright 初始化

## 目标

在新项目中快速搭建可维护的 `ui-test/` 自动化测试框架。初始化结果应继承现有项目的公共结构：配置集中、公共数据库查询能力可复制、公共审计报告能力可复制、业务用例按模块分层、真实样本与运行产物分离。

## 触发边界

以下场景才应触发本 skill：

- 新仓库或新模块第一次建立 `ui-test/` 基础框架
- 目标项目还没有同类 Playwright 基础骨架，需要首次补齐基础目录与公共能力
- 用户明确要求“初始化 Playwright 框架”“搭 ui-test 初始目录”“补齐初始骨架”

以下场景不应触发本 skill：

- 已有 `ui-test/` 框架内新增或修改业务 spec
- 已有框架内新增某个页面能力、某个模块能力或某条真实数据链路
- 调试测试失败、修复等待逻辑、修复选择器、补数据库断言
- 维护 README、测试矩阵、审计报告内容或已有配置的小幅调整

## 触发方式

本 skill 只允许显式触发，不依赖隐式猜测。

推荐触发写法：

- `$playwright-bootstrap`
- “请初始化 Playwright ui-test 基础框架”
- “请给这个项目首次搭建 ui-test 初始目录”
- “请补齐这个项目缺失的 Playwright 基础骨架”
- “请在新项目里初始化可运行的 ui-test 框架”

推荐补充的最小上下文：

```text
项目根目录:
是否已有 ui-test:
执行方式: 先检查模式 / 直接初始化
是否要补数据库能力:
是否要补审计报告能力:
是否要求顺带安装依赖:
```

触发判定规则：

- 用户明确提到“初始化 Playwright”“初始化 ui-test”“搭 ui-test 初始目录”“补齐基础骨架”时，命中本 skill。
- 用户明确要求“新项目快速搭框架”“把 Playwright 基础目录和公共能力初始化好”时，命中本 skill。
- 用户只是在已有 `ui-test/` 内新增 spec、修复脚本、补等待、补字段断言、补矩阵或补 README 时，不命中本 skill。
- 若请求同时包含“先搭框架”与“再写业务用例”，先执行本 skill 完成基础框架检查与补齐，再转后续 Playwright 开发类 skill。

误命中纠偏规则：

- 如果任务先命中了 `$playwright-common`，但实际诉求是首次初始化 `ui-test/`，必须立即停止在 `playwright-common` 内继续展开，转用 `$playwright-bootstrap`。
- 如果当前仓库已经存在稳定的 `ui-test/` 基础框架，只剩局部配置补充、README 修订或业务脚本开发，不再触发本 skill，改走对应维护类 skill。
- 如果用户没有显式说“初始化”，但检查发现项目根本没有 `ui-test/package.json`、`ui-test/tsconfig.json`、`ui-test/playwright.config.ts` 这类基础文件，应先向用户说明“当前判断为首次基础框架缺失，建议改用 `$playwright-bootstrap`”。

## 执行原则

- 先确认目标项目根目录，不确定时只做只读审计，不写入。
- 只创建缺失目录和必要入口文件，不覆盖已有文件。
- 初始化脚手架与业务脚本分开：先落公共框架，再按业务模块补 spec。
- 公共能力只复制跨项目可复用内容；登录、选择器、业务页面能力只能按目标系统重写。
- `playwright-report/`、`test-results/` 属于 Playwright 运行产物，不作为初始化必建目录，只加入忽略规则。
- `reports/` 属于审计报告运行产物，默认由 `AuditReporter` 首次写入时创建；仅当项目要求保留空目录时才创建 `.gitkeep`。
- README 必须同步说明真实目录结构和可执行命令，不能只写理想结构。
- 初始化 README 直接从 `assets/templates/ui-test/README.md` 复制，再按目标项目真实目录、模块名和数据库类型做最小改写。
- 需要直接复制的稳定模板统一放在 `assets/templates/ui-test/`，检查模式确认后优先从该目录补齐缺失文件。
- 不引入与 Playwright 初始化无关的依赖、格式化、重构或清理。
- 若目标仓库有 `AGENTS.md`、`.codex/rules/` 或其他项目规则，先读取并遵守。

## M0 目标确认

写入前确认以下信息：

```text
项目根目录:
ui-test 目标目录:
是否已有 ui-test/package.json:
是否已有 ui-test/tsconfig.json:
是否已有 ui-test/playwright.config.ts:
Playwright 命令执行目录: ui-test
测试目标系统地址:
默认角色与账号来源:
是否启用数据库能力:
是否启用审计报告:
是否需要真实样本目录:
```

不确定项不能编造。若用户只要求“先给建议”，只输出目录建议和差异清单，不创建文件。

## M1 只读审计

在目标项目中检查：

- 是否已有 `ui-test/`
- 是否已有 `ui-test/package.json`
- 是否已有 `ui-test/tsconfig.json`
- 是否已有 `ui-test/playwright.config.ts`
- 是否已有 `ui-test/README.md`
- 是否已有 `ui-test/.gitignore`
- 是否已有 `ui-test/.env.db.local`
- 是否已有 `ui-test/node_modules`
- 是否已声明 `@playwright/test`、`typescript`、`@types/node`
- 是否已声明 `test`、`test:headed`、`test:list` 脚本
- 是否已存在 `playwright.config.ts` 的关键配置：`testDir`、`reporter`、`outputDir`
- 是否已有 `.gitignore`
- 是否已有测试、报告、数据库或认证相关目录

输出审计结果：

```text
现有项:
缺失项:
可复用项:
会新增的目录:
会新增的文件:
需确认项:
```

发现已有同名文件时，不覆盖，改为说明需要人工确认合并。

## M2 检查模式

默认先进入检查模式。检查模式只读，不创建、不复制、不修改文件。

检查模式必须输出：

```text
结论:
完整项:
缺失项:
需补齐文件:
需补齐目录:
已有但需人工确认合并:
已有但需补齐字段/依赖:
不可直接复制项:
建议执行范围:
```

补齐规则：

- 只补 `缺失项`，不覆盖已有文件。
- 对于基础配置和公共能力，优先从 `assets/templates/ui-test/` 复制缺失文件，再按目标项目做最小适配。
- 已存在的 `package.json`、`tsconfig.json`、`playwright.config.ts`、`README.md`、`.gitignore` 不能整文件重写；仅允许补齐缺失字段、缺失脚本、缺失依赖和缺失说明。
- 已存在的 `code/base/capabilities/db/`、`code/base/capabilities/reporters/` 只能补缺失文件，不能覆盖已有实现。
- 若已有实现与标准模板不一致，输出“建议合并点”，等待用户确认。
- 用户明确要求“直接初始化全量框架”时，也必须先完成检查模式并列出将新增的文件。

缺失项确认格式：

```text
允许补齐目录:
允许补齐文件:
允许复制公共能力:
允许生成 README:
允许生成 package/tsconfig/playwright config:
允许补齐依赖与脚本:
不允许覆盖的既有文件:
```

未获得确认前，不进入补齐执行。确认时至少要明确：允许补齐目录、允许补齐文件、允许复制公共能力、允许补齐依赖与脚本、不允许覆盖的既有文件。

## M3 标准目录模板

默认初始化以下源码与配置结构。业务模块目录可按项目实际名称替换，公共能力目录保持稳定。

```text
ui-test/
├── README.md
├── playwright.config.ts
├── package.json
├── tsconfig.json
├── code/
│   ├── test.config.ts
│   ├── .auth/
│   │   └── .gitkeep
│   ├── base/
│   │   ├── capabilities/
│   │   │   ├── auth/
│   │   │   ├── common/
│   │   │   ├── db/
│   │   │   └── reporters/
│   │   └── scripts/
│   │       └── db/
│   ├── case/
│   │   └── login/
│   └── e2e/
├── docs/
│   └── excel/
├── original/
│   └── fixtures/
└── .gitignore
```

目录职责只保留三条硬要求：

- `code/base/capabilities/` 只放跨项目可复用能力，业务页面能力不要从别的项目直接复制。
- `code/case/` 放单模块 spec，`code/e2e/` 放跨模块链路，`original/fixtures/` 放真实样本。
- `reports/`、`playwright-report/`、`test-results/` 都视为运行产物，不默认预创建，只维护忽略规则和输出路径。

## M4 公共能力复制清单

初始化时只复制跨项目可复用能力。允许复制的类别只有：

- 数据库查询基础能力与对应占位配置文件
- 审计报告基础能力
- `assets/templates/ui-test/` 下的初始化模板文件

禁止直接复制认证、选择器、页面操作、业务模块能力。数据库能力必须保持只读查询；`.env.db.local` 只能写占位值和注释，不写真实账号密码。

路径适配门禁：

```text
命令执行目录:
playwright.config.ts 所在目录:
testDir 实际路径:
DB_EXECUTOR_PATH 实际路径:
AuditReporter 默认输出目录:
README 示例命令:
```

以上任一项不一致时，先修正路径口径，再复制业务 spec。

模板目录：

```text
assets/templates/ui-test/
├── package.json
├── tsconfig.json
├── playwright.config.ts
├── README.md
├── .gitignore
├── .env.db.local
└── code/
    ├── test.config.ts
    └── base/
        ├── capabilities/
        │   ├── db/
        │   └── reporters/
        └── scripts/
            └── db/
```

使用规则：

- `assets/templates/ui-test/` 里的文件是初始化母版，适合直接复制到新项目。
- 模板更新后，应与当前仓库真实公共能力实现保持同步，避免模板漂移。
- 数据库本地配置初始文件以 `assets/templates/ui-test/.env.db.local` 为准。

## M5 初始化基础文件

初始化时应生成以下基础文件。若目标文件已存在，先输出差异和合并建议，不覆盖。

- `ui-test/package.json`
- `ui-test/tsconfig.json`
- `ui-test/playwright.config.ts`
- `ui-test/README.md`
- `ui-test/.gitignore`
- `ui-test/.env.db.local`（启用数据库能力时）

执行方式：

- `ui-test/package.json`、`ui-test/tsconfig.json`、`ui-test/playwright.config.ts`、`ui-test/.gitignore`、`ui-test/README.md` 统一从 `assets/templates/ui-test/` 复制。
- 启用数据库能力时，`ui-test/.env.db.local` 也从模板复制。
- `ui-test/code/test.config.ts` 也从模板复制，再只改目标项目需要的最小配置项。
- `README.md` 不再从 `references/` 生成，直接使用模板文件落地后修改。
- 非必要不在 `SKILL.md` 中重复维护模板代码内容；模板文件本身就是事实来源。

固定执行口径：

- 必须进入 `ui-test/` 后执行 Playwright。
- `AuditReporter` 默认输出目录使用 `reports`。
- `DB_EXECUTOR_PATH` 使用 `code/base/scripts/db/db-executor.py`。
- README 中脚本路径使用 `code/case/...`、`code/e2e/...`，不带 `ui-test/` 前缀。
- `package.json` 中脚本统一走 `playwright.config.ts`，不保留 `npm init` 默认脚本。
- `tsconfig.json` 统一覆盖 `playwright.config.ts` 和 `code/**/*.ts`。

## M5.5 Playwright 依赖与配置补齐

目录落地后，还要检查 Playwright 运行前置条件；不能只建目录不检查可运行性。至少确认：

- `package.json` 已包含 `@playwright/test`、`typescript`、`@types/node` 和 `test / test:headed / test:list`
- `tsconfig.json` 已覆盖 `playwright.config.ts` 和 `code/**/*.ts`
- `playwright.config.ts` 已包含 `testDir`、`reporter`、`outputDir`、`use.baseURL`、`projects`
- `README.md` 已写明进入 `ui-test/` 执行 `npm install` 与 `npx playwright install chromium`
- 启用数据库能力时，`.env.db.local` 已落地且每个配置项写明用途

补齐原则：

- `package.json` 缺失时，直接从模板复制。
- `package.json` 已存在但缺少 Playwright 依赖或脚本时，只补缺失项，不改用户已有无关字段。
- `tsconfig.json` 缺失时，直接从模板复制。
- `tsconfig.json` 已存在但缺少 `playwright.config.ts` 或 `code/**/*.ts` 覆盖范围时，只补缺失项。
- `playwright.config.ts` 缺失时，直接从模板复制。
- `playwright.config.ts` 已存在但关键项缺失时，只做最小补齐，不推翻用户已有项目配置。
- `node_modules` 不作为仓库初始化目录落地，但若用户明确要求“直接初始化可运行环境”，应补充执行依赖安装步骤。
- 数据库能力启用时，直接复制 `.env.db.local` 占位文件；若目标文件已存在，不覆盖，只提示人工确认。

依赖安装口径：

```powershell
cd ui-test
npm install
npx playwright install chromium
```

执行要求：

- 若当前环境无法联网、无 npm 或无浏览器安装权限，要明确说明“配置已补齐，但依赖安装未执行”。
- 若用户只要求生成框架，不默认伪造已安装状态。
- 若用户明确要求“初始化完成即可运行”，则在权限和环境允许时执行依赖安装，并在结果中说明实际执行情况。

## M6 用例分层约定

新增业务脚本时按以下顺序落地：

1. 在 `code/base/capabilities/<module>/` 沉淀可复用页面、接口、数据库和审计能力。
2. 在 `code/case/<module>/` 编写单模块 spec。
3. 跨模块链路放入 `code/e2e/`。
4. 真实样本放入 `original/fixtures/<module>/`。
5. 文档同步到 `docs/` 和 `README.md` 的脚本执行清单。

不要把大量页面操作直接堆在 spec 中。spec 只负责组织场景、断言和报告记录。

## M7 验证门禁

初始化后至少验证：

```powershell
cd ui-test
npm run test:list
```

如依赖尚未安装，先执行：

```powershell
cd ui-test
npm install
npx playwright install chromium
```

如已生成示例 spec，可追加：

```powershell
npx playwright test -c playwright.config.ts code/case/login/login.spec.ts --list
```

验证输出中必须说明：

```text
执行结果:
目录结果:
检查模式结果:
实际补齐项:
依赖与配置补齐情况:
依赖安装情况:
跳过的已有项:
公共能力保留情况:
初始化后需配置项:
验证命令:
剩余风险/待确认:
```

如果依赖未安装或当前环境不能联网，只能说明“未执行依赖安装/未运行完整测试”，不能声称初始化已通过运行验证。

其中 `初始化后需配置项` 不能只写标题，至少要覆盖以下内容：

```text
初始化后需配置项:
- 测试目标地址: 在 ui-test/code/test.config.ts 的 TEST_CONFIG.baseUrl 配置
- 数据库连接信息: 在 ui-test/.env.db.local 配置
- 数据库驱动安装: 按数据库类型安装 pymysql / oracledb / dmPython
- 登录态或测试账号来源: 在 ui-test/code/base/capabilities/auth/ 或项目实际登录能力中补齐
- 首个业务模块用例: 在 ui-test/code/case/<module>/ 下新增 spec
```

## 输出格式

只读审计输出：

```text
结论:
完整项:
缺失项:
需补齐文件:
需补齐目录:
已有但需人工确认合并:
需确认项:
下一步:
```

执行完成输出：

```text
执行结果:
改动点:
影响范围:
DB/接口契约变化:
验证结果:
初始化后需配置项:
需用户确认/联调:
```

`初始化后需配置项` 使用以下固定模板输出：

```text
初始化后需配置项:
- 测试目标地址
  - 配置位置: ui-test/code/test.config.ts
  - 配置项: TEST_CONFIG.baseUrl
  - 当前状态: 待填写 / 已填写
  - 说明: 填写目标系统实际访问地址
- 数据库连接信息
  - 配置位置: ui-test/.env.db.local
  - 配置项: DB_TYPE、DB_HOST、DB_PORT、DB_NAME、DB_USER、DB_PASSWORD
  - 当前状态: 待填写 / 已填写 / 未启用数据库能力
  - 说明: 按实际数据库环境填写真实连接信息
- 数据库驱动
  - 配置位置: 本机 Python 环境
  - 配置项: pymysql / oracledb / dmPython
  - 当前状态: 待安装 / 已安装 / 未启用数据库能力
  - 说明: 数据库能力依赖对应驱动，未安装则不能执行 DB 查询
- 登录态或测试账号来源
  - 配置位置: ui-test/code/base/capabilities/auth/ 或项目实际登录实现
  - 配置项: 登录方法、storageState、账号来源
  - 当前状态: 待补齐 / 已补齐 / 当前未初始化
  - 说明: 该项不属于通用复制能力，需要按目标项目接入
- 首个业务模块用例
  - 配置位置: ui-test/code/case/<module>/
  - 配置项: 首个业务 spec、前置准备脚本
  - 当前状态: 待新增 / 已新增
  - 说明: 初始化只落基础框架，不自动生成真实业务用例
```
