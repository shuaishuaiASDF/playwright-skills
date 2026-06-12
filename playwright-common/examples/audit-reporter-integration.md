# 示例：AuditReporter 接入方式

## 适用场景

- 项目内已经存在稳定的报告生成工具，例如 `AuditReporter`
- 当前页面还没有统一接入报告工具
- 需要在 Playwright 脚本执行后，按 `playwright-common` 的标准报告结构输出审计结果

不适用场景：

- 项目还没有 Playwright 基础骨架
- 项目还没有 `ui-test/` 初始目录与基础模板
- 项目需要首次补齐 reporter 母版、package、tsconfig、playwright.config、`.env.db.local` 等基础文件

以上场景应提示用户显式改走 `$playwright-bootstrap`，不要在本示例中直接初始化框架。

## 接入原则

- 优先复用项目已有 reporter，不要重写一套新的 markdown 输出逻辑
- 只补当前页面所需的最小接入，不顺手改全局公共层
- 若发现当前项目实际上还没有稳定的 Playwright 基础骨架，暂停本方案，并提示用户显式改走 `$playwright-bootstrap`
- 若发现当前项目缺少 `package.json`、`tsconfig.json`、`playwright.config.ts`、`.env.db.local` 这类基础运行配置，也暂停本方案，并提示用户显式改走 `$playwright-bootstrap`
- 若项目已有章节分组能力，优先输出 `正常流`、`边界流`、`异常流`，确有跨页面或跨接口闭环时再追加 `联调场景`
- 关键接口建议同步记录原证，避免只看 UI 提示造成“伪通过”
- 项目工具的最终产物应与 `templates/audit-report-template.md` 保持一致
- 若项目 reporter 已支持 DB、文件、事件等外部原证，应按项目方法记录到报告附录；若不支持，最小扩展 reporter 或通过测试附件保留原证
- 业务断言失败但脚本仍能继续时，应记录审计 `FAIL` 并生成报告，不要只抛异常导致证据丢失
- `logWithSection` 的章节入参统一使用 `normal / boundary / exception`，确有联调章节时使用 `integration`，由 reporter 映射为中文章节名。

## 最小接入步骤

1. 在 spec 文件中引入项目已有的 reporter
2. 在测试开始前初始化 reporter，传入模块名、目标标识、报告标题
3. 在每个关键验证点调用 `log` 或 `logWithSection`；`log` 默认归入正常流，边界、异常、联调场景必须使用 `logWithSection`
4. 在关键接口完成后调用 `logApi` 记录 `Request / Response`
5. 若场景依赖 DB、文件或事件等外部证据，调用项目 reporter 的对应方法；没有现成方法时，优先先确认是否应由 bootstrap skill 补齐基础 reporter 或基础 DB 配置文件，再决定是否最小扩展
6. 在测试结束阶段调用 `generateReport()` 输出最终报告

## 示例代码

- 下方 `AuditReporter` 的 import 路径仅为示意，实际接入时必须按项目真实目录调整。

```ts
import { test, expect } from '@playwright/test'
import { AuditReporter } from '../utils/audit-reporter'

test.describe('业务对象审计', () => {
  const reporter = new AuditReporter('business-object', 'demo-key', '业务对象自动化审计验证报告')

  test('新增与查询闭环', async ({ page }) => {
    await page.goto('/business-object')

    reporter.logWithSection('normal', 'PASS', '页面进入', '成功进入业务对象页面')

    // 示例：关键交互后记录截图证据
    const enterShot = reporter.getScreenshotPath('enter_business_object_page')
    await page.screenshot({ path: enterShot, fullPage: true })
    reporter.logWithSection(
      'normal',
      'PASS',
      '页面进入',
      '页面首屏加载完成',
      '列表已展示',
      '-',
      '-',
      enterShot,
    )

    // 示例：关键接口原证记录
    const queryPayload = { keyword: 'demo-key' }
    const queryResponse = { code: 200, data: { total: 1 } }
    reporter.logApi('业务对象查询接口', queryPayload, queryResponse)

    // 示例：若项目 reporter 支持外部数据原证，可记录 DB、文件或事件结果
    // reporter.logExternal?.('唯一键持久化检查', 'DB', 'SELECT ... WHERE business_key = ?', { rowCount: 1 })

    // 示例：字段未在 UI 稳定展示时记 WARN，而不是直接 FAIL
    reporter.logWithSection(
      'normal',
      'WARN',
      '唯一键回查',
      '目标数据命中，但目标字段未在当前列表稳定展示',
      '列表未展示目标字段',
      '详情接口返回目标字段',
      'targetField',
    )

    // 示例：如果本场景期望查询命中但系统返回 0 条，应记录业务 FAIL，而不是直接抛成脚本异常
    reporter.logWithSection(
      'normal',
      'FAIL',
      '唯一键回查未命中',
      '查询接口成功返回，但目标数据未命中，本场景主断言不成立',
      '列表未展示目标行',
      '接口总条数=0',
      'total',
    )

    await expect(page.getByRole('button', { name: '查询' })).toBeVisible()
  })

  test.afterAll(async () => {
    reporter.generateReport('demo-key')
  })
})
```

## 章节记录建议

### 正常流

- 页面进入成功
- 新增 / 编辑 / 删除 / 查询主链路闭环
- 关键字段与接口结果一致

### 边界流

- 必填项校验
- 长度边界
- 格式边界
- 联合查询或重置清空

### 异常流

- 接口 5xx 失败处置
- 接口超时恢复
- 重复提交幂等

## 关键方法说明

### `new AuditReporter(moduleName, targetId, reportTitle)`

- `moduleName`：报告目录与模块标识
- `targetId`：本次审计目标，例如账号、订单号、日期
- `reportTitle`：最终报告标题

### `logWithSection(section, type, category, msg, uiVal, apiVal, apiProp, screenshot)`

- `section`：推荐使用 `normal`、`boundary`、`exception`；确有联调章节时使用 `integration`。报告展示时映射为 `正常流`、`边界流`、`异常流`、`联调场景`
- `type`：推荐使用 `PASS`、`WARN`、`FAIL`、`SKIP`
- `category`：当前环节名称，例如“新增闭环”“必填校验”
- `msg`：验证详情或结论说明
- `uiVal / apiVal`：分别记录 UI 与接口观测值
- `apiProp`：可写字段名或接口属性名
- `screenshot`：截图绝对路径

### `logApi(name, req, res)`

- 用于记录关键接口原证
- 建议至少覆盖查询接口、保存接口、状态变更接口

### 外部数据原证方法

- 方法名由项目 reporter 决定，常见形式可以是 `logDb`、`logFile`、`logEvent`、`logExternal` 或测试附件。
- 记录内容至少包含数据来源、查询/操作、结果摘要。
- 若外部依赖未配置，依赖该证据的场景不得标记为 `PASS`。

### `generateReport(targetId)`

- 在 `afterAll` 或主流程全部结束后调用
- 生成最终 `index.md` 与关联截图目录
- 若业务验证点出现 `FAIL / WARN` 但脚本仍跑完，仍应生成报告并如实标记结果
- 只有 Playwright 脚本执行级别报错、阻断或无法形成有效审计结果时，才视为“脚本失败”

## 使用提醒

- 若项目已有统一 spec 示例，优先复用同模块已有写法
- 若当前页面只做轻量验证，也建议至少补 1 个关键截图和 1 条接口原证
- 项目 reporter 应允许输出包含 `FAIL / WARN / SKIP` 的审计报告，但不要伪造成功报告
- 若脚本执行级别失败导致流程中断，应明确标记阻断原因，并避免输出误导性的成功结论
- 若当前仓库连 reporter 母版、基础目录或 `.env.db.local` 这类基础配置都没有，不要在本示例内硬起一套，应提示用户显式改走 `$playwright-bootstrap`
