# UI 自动化测试与审计工具集 (ui-test)

本项目基于 Playwright 框架，提供 UI 自动化测试、接口审计、数据库只读校验和审计报告生成能力。

## 初始化与补齐原则

- 初始化前先检查 `ui-test/` 现有结构。
- 只补齐缺失目录和缺失文件，不覆盖已有文件。
- 已存在的 `package.json`、`tsconfig.json`、`playwright.config.ts`、`README.md`、`.gitignore` 只做差异提示，确认后再合并。
- 已存在的数据库能力和报告能力只补缺失文件，不直接覆盖已有实现。
- `reports/`、`playwright-report/`、`test-results/` 是运行产物目录，由运行时创建，不需要初始化时预创建。

## 环境准备

1. 安装 Node.js，建议使用 18.x 或以上版本。
2. 进入 `ui-test/` 目录并安装项目依赖。

```powershell
cd <项目根目录>\ui-test
npm install -D @playwright/test typescript @types/node
npx playwright install chromium
```

首次初始化完成后，建议立即检查以下项目是否齐全：

- `package.json` 已声明 `@playwright/test`、`typescript`、`@types/node`
- `package.json` 已提供 `test`、`test:headed`、`test:list` 脚本
- `tsconfig.json` 已覆盖 `playwright.config.ts` 和 `code/**/*.ts`
- `playwright.config.ts` 已配置 `testDir`、`reporter`、`outputDir`、`projects`
- 当前命令执行目录为 `ui-test/`

3. 如需启用数据库校验，安装 Python 及目标数据库驱动。

```powershell
pip install pymysql
pip install oracledb
```

达梦数据库需要安装 `dmPython`，通常由数据库厂商提供驱动包。

4. 如需启用数据库校验，补齐 `ui-test/.env.db.local`。

配置项说明：

- `DB_TYPE`: 数据库类型，例如 `mysql`、`oracle`、`dm`
- `DB_HOST`: 数据库主机地址或 IP
- `DB_PORT`: 数据库端口
- `DB_NAME`: 数据库名、实例名或项目实际连接目标
- `DB_USER`: 数据库账号
- `DB_PASSWORD`: 数据库密码

说明：

- 初始化生成的 `.env.db.local` 仅包含占位值和字段说明，不包含真实凭据。
- 数据库能力是否可运行，以 `.env.db.local` 是否补齐真实值以及 Python 驱动是否安装完成为准。

## 目录结构说明

- `package.json`: ui-test 独立依赖与脚本入口。
- `tsconfig.json`: ui-test TypeScript 编译配置，覆盖 `playwright.config.ts` 和 `code/**/*.ts`。
- `playwright.config.ts`: Playwright 标准配置，统一 testDir、报告输出、运行产物、浏览器项目和审计批次号。
- `code/`: 自动化脚本主目录。集中存放 Playwright 配置、公共能力、测试用例和端到端组合脚本。
  - `test.config.ts`: 测试配置文件。统一管理测试环境、账号、超时、选择器和业务路径。
  - `.auth/`: 存放 Playwright 登录态文件。该目录不提交仓库。
  - `base/capabilities/`: 公共能力目录。
    - `db/`: 数据库辅助能力。包括数据库配置、Python 运行时定位和查询执行封装。
    - `reporters/`: 报告生成能力。存放审计报告生成器，支持生成 Markdown 和 JSON。
    - `<module>/`: 业务模块能力目录。按目标项目实际业务新增，不从其他项目直接复制。
  - `base/scripts/db/`: 数据库脚本目录。存放 Python 查询执行器。
  - `case/`: 模块测试用例目录。按业务模块存放 Playwright spec 文件和前置准备脚本。
  - `e2e/`: 跨模块端到端组合脚本目录。
- `docs/`: 测试矩阵、用例说明和审计口径文档。
  - `excel/`: 原始 Excel 用例和按模块整理后的用例说明。
- `original/fixtures/`: 原始测试样本目录。按业务模块或场景继续分层。
- `reports/`: 审计报告、截图证据和运行过程产物。由审计报告器运行时创建。
- `playwright-report/`: Playwright HTML 报告输出目录。由 Playwright 运行时创建。
- `test-results/`: Playwright 原始运行结果目录。由 Playwright 运行时创建。
- `.gitignore`: Git 忽略配置，排除登录态、报告和测试运行产物。

## 公共能力说明

### 数据库能力

数据库能力用于在 UI 流程后执行只读 SQL 校验。默认文件包括：

- `code/base/capabilities/db/db-config.ts`
- `code/base/capabilities/db/python-runtime.ts`
- `code/base/capabilities/db/query-executor.ts`
- `code/base/scripts/db/db-executor.py`

注意事项：

- SQL 执行入口只允许只读查询，不允许写库、DDL 或批量修复 SQL。
- `DB_EXECUTOR_PATH` 必须指向当前项目真实存在的 `db-executor.py`。
- 数据库连接信息建议放在环境变量或 `.env.db.local`，不要提交真实账号密码。
- Python DB 驱动需要按数据库类型安装：
  - MySQL: `pymysql`
  - Oracle: `oracledb`
  - 达梦: `dmPython`
- 目标项目没安装对应驱动，或数据库类型不在执行器支持范围内，数据库能力不能直接运行。

### 审计报告能力

审计报告能力用于汇总 UI 断言、接口原证、DB 原证、截图证据和人工审计结论。默认文件包括：

- `code/base/capabilities/reporters/audit-reporter.ts`

注意事项：

- `AuditReporter` 默认输出目录使用 `reports`，因为所有命令都在 `ui-test/` 目录内执行。
- 推荐由 `playwright.config.ts` 在加载阶段生成统一 `AUDIT_RUN_ID`。
- 报告输出至少保留 Markdown 和 JSON。
- `reports/` 目录默认由报告器首次写入时创建，不需要初始化时预创建。

## 执行方式

所有命令都进入 `ui-test/` 目录执行 npm scripts：

```powershell
cd <项目根目录>\ui-test
npm run test:list
npm run test
npm run test:headed
```

查看用例清单：

```powershell
npx playwright test -c playwright.config.ts --list
```

显性浏览器执行：

```powershell
npx playwright test -c playwright.config.ts --headed
```

首次补齐完成后，至少执行一次以下检查命令：

```powershell
cd <项目根目录>\ui-test
npm run test:list
```

如果当前机器还没有安装依赖或浏览器内核，先执行：

```powershell
cd <项目根目录>\ui-test
npm install
npx playwright install chromium
```

如果启用了数据库能力，初始化完成后还需要检查：

- `ui-test/.env.db.local` 是否已补齐真实数据库连接信息
- 当前数据库类型对应的 Python 驱动是否已安装
- `code/base/scripts/db/db-executor.py` 是否存在

## 脚本执行清单

| 脚本路径 | 说明 | 静默执行 | UI 显性执行 |
|:---|:---|:---|:---|
| `code/case/<module>/<scenario>.spec.ts` | 按业务模块补充说明 | `npx playwright test -c playwright.config.ts code/case/<module>/<scenario>.spec.ts` | 追加 `--headed` |
| `code/e2e/<flow>.spec.ts` | 跨模块端到端流程 | `npx playwright test -c playwright.config.ts code/e2e/<flow>.spec.ts` | 追加 `--headed` |

## 新增模块约定

1. 先在 `code/base/capabilities/<module>/` 沉淀页面、接口、数据库和审计辅助能力。
2. 再在 `code/case/<module>/` 编写单模块 spec。
3. 跨模块流程放在 `code/e2e/`。
4. 真实样本放在 `original/fixtures/<module>/`。
5. 新增 spec 后同步更新本 README 的脚本执行清单。

## 忽略文件建议

```text
node_modules/
code/.auth/*.json
reports/
playwright-report/
test-results/
.env
.env.db.local
```
