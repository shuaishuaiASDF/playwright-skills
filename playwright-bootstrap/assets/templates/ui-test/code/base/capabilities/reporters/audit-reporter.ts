import fs from 'fs'
import path from 'path'

export type AuditSection = 'normal' | 'boundary' | 'exception'

const SECTION_LABELS: Record<AuditSection, string> = {
  normal: '正常流',
  boundary: '边界流',
  exception: '异常流',
}

interface AuditResult {
  section?: string
  type: string
  category: string
  msg: string
  uiVal: string
  apiVal: string
  apiProp: string
  screenshot?: string
}

interface AuditApiLog {
  name: string
  req: unknown
  res: unknown
}

interface AuditApiSnapshot {
  name: string
  request: string
  response: string
}

interface AuditDbLog {
  name: string
  sql: string
  result: unknown
}

interface AuditDbSnapshot {
  name: string
  sql: string
  result: string
}

interface AuditReportData {
  module: string
  target: string
  timestamp: string
  environment: string
  summary: { total: number; pass: number; warn: number; fail: number; skip: number }
  evidences: Record<AuditSection, AuditResult[]>
  apiSnapshots: AuditApiSnapshot[]
  dbSnapshots: AuditDbSnapshot[]
}

export class AuditReporter {
  private results: AuditResult[] = []
  private apiLogs: AuditApiLog[] = []
  private dbLogs: AuditDbLog[] = []
  private moduleName: string
  private targetId: string
  private reportTitle: string
  private reportDir: string
  private reportRunId: string

  constructor(
    moduleName: string,
    targetId: string = 'global',
    reportTitle: string = '自动化审计验证报告',
    outputDir: string = 'reports',
  ) {
    this.moduleName = moduleName
    this.targetId = targetId
    this.reportTitle = reportTitle
    this.reportRunId =
      process.env.AUDIT_RUN_ID?.trim() ||
      new Date().toLocaleString('sv-SE', { timeZone: 'Asia/Shanghai' }).replace(/[:\s]/g, '-')
    const folderName = `Audit_${this.sanitizePathSegment(moduleName)}_${this.sanitizePathSegment(targetId)}_${this.reportRunId}`
    this.reportDir = path.join(process.cwd(), outputDir, folderName)
  }

  private ensureDir() {
    if (!fs.existsSync(this.reportDir)) {
      fs.mkdirSync(this.reportDir, { recursive: true })
    }
  }

  logWithSection(
    section: string,
    type: string,
    category: string,
    msg: string,
    uiVal: string = '-',
    apiVal: string = '-',
    apiProp: string = '-',
    screenshot?: string,
  ) {
    if (type !== 'INFO') {
      this.results.push({ section, type, category, msg, uiVal, apiVal, apiProp, screenshot })
    }
    this.printConsole(type, `${section}/${category}`, msg, screenshot)
  }

  logApi(name: string, req: unknown, res: unknown) {
    this.apiLogs.push({ name, req, res })
  }

  logDb(name: string, sql: string, result: unknown) {
    this.dbLogs.push({ name, sql, result })
  }

  getScreenshotPath(label: string): string {
    void label
    this.ensureDir()
    return path.join(this.reportDir, `shot-${Date.now()}.png`)
  }

  generateReport(targetId: string = this.targetId): string {
    this.ensureDir()
    const reportPath = path.join(this.reportDir, 'index.md')
    const jsonPath = path.join(this.reportDir, 'report.json')
    const reportData = this.mergeReportData(this.buildReportData(targetId), jsonPath)
    const markdown = this.generateMarkdown(reportData)

    fs.writeFileSync(reportPath, markdown, 'utf-8')
    fs.writeFileSync(jsonPath, JSON.stringify(reportData, null, 2), 'utf-8')

    return reportPath
  }

  private buildReportData(targetId: string): AuditReportData {
    const evidences = this.buildEvidenceSections()
    const apiSnapshots = this.buildApiSnapshots()
    const dbSnapshots = this.buildDbSnapshots()
    return this.composeReportData(targetId, evidences, apiSnapshots, dbSnapshots)
  }

  private buildEvidenceSections(): Record<AuditSection, AuditResult[]> {
    return {
      normal: this.results.filter(item => item.section === 'normal'),
      boundary: this.results.filter(item => item.section === 'boundary'),
      exception: this.results.filter(item => item.section === 'exception'),
    }
  }

  private buildApiSnapshots(): AuditApiSnapshot[] {
    return this.apiLogs.map(item => ({
      name: item.name,
      request: this.stringifyPayload(item.req),
      response: this.stringifyPayload(item.res),
    }))
  }

  private buildDbSnapshots(): AuditDbSnapshot[] {
    return this.dbLogs.map(item => ({
      name: item.name,
      sql: this.stringifyPayload(item.sql),
      result: this.stringifyPayload(item.result),
    }))
  }

  private composeReportData(
    targetId: string,
    evidences: Record<AuditSection, AuditResult[]>,
    apiSnapshots: AuditApiSnapshot[],
    dbSnapshots: AuditDbSnapshot[],
  ): AuditReportData {
    const allResults = [...evidences.normal, ...evidences.boundary, ...evidences.exception]
    return {
      module: this.moduleName,
      target: targetId,
      timestamp: new Date().toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' }),
      environment: process.env.BASE_URL || 'http://localhost:5173',
      summary: {
        total: allResults.length,
        pass: allResults.filter(item => item.type === 'PASS').length,
        warn: allResults.filter(item => item.type === 'WARN').length,
        fail: allResults.filter(item => item.type === 'FAIL').length,
        skip: allResults.filter(item => item.type === 'SKIP').length,
      },
      evidences,
      apiSnapshots,
      dbSnapshots,
    }
  }

  private mergeReportData(currentData: AuditReportData, jsonPath: string): AuditReportData {
    if (!fs.existsSync(jsonPath)) {
      return currentData
    }

    try {
      const existingData = this.parseExistingReport(jsonPath)
      return this.composeReportData(
        currentData.target,
        {
          normal: this.mergeAuditResults(existingData.evidences.normal, currentData.evidences.normal),
          boundary: this.mergeAuditResults(existingData.evidences.boundary, currentData.evidences.boundary),
          exception: this.mergeAuditResults(existingData.evidences.exception, currentData.evidences.exception),
        },
        this.mergeApiSnapshots(existingData.apiSnapshots, currentData.apiSnapshots),
        this.mergeDbSnapshots(existingData.dbSnapshots, currentData.dbSnapshots),
      )
    } catch (_error) {
      return currentData
    }
  }

  private parseExistingReport(jsonPath: string): AuditReportData {
    const raw = fs.readFileSync(jsonPath, 'utf-8')
    const parsed = JSON.parse(raw) as Partial<AuditReportData>
    return {
      module: parsed.module || this.moduleName,
      target: parsed.target || this.targetId,
      timestamp: parsed.timestamp || new Date().toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' }),
      environment: parsed.environment || process.env.BASE_URL || 'http://localhost:5173',
      summary: parsed.summary || { total: 0, pass: 0, warn: 0, fail: 0, skip: 0 },
      evidences: {
        normal: parsed.evidences?.normal || [],
        boundary: parsed.evidences?.boundary || [],
        exception: parsed.evidences?.exception || [],
      },
      apiSnapshots: parsed.apiSnapshots || [],
      dbSnapshots: parsed.dbSnapshots || [],
    }
  }

  private mergeAuditResults(existingItems: AuditResult[], currentItems: AuditResult[]): AuditResult[] {
    const merged = new Map<string, AuditResult>()
    ;[...existingItems, ...currentItems].forEach(item => {
      const key = `${item.section || 'normal'}::${item.category || item.msg}`
      merged.set(key, item)
    })
    return [...merged.values()]
  }

  private mergeApiSnapshots(existingItems: AuditApiSnapshot[], currentItems: AuditApiSnapshot[]): AuditApiSnapshot[] {
    const merged = new Map<string, AuditApiSnapshot>()
    ;[...existingItems, ...currentItems].forEach(item => {
      const key = `${item.name}::${item.request}::${item.response}`
      merged.set(key, item)
    })
    return [...merged.values()]
  }

  private mergeDbSnapshots(existingItems: AuditDbSnapshot[], currentItems: AuditDbSnapshot[]): AuditDbSnapshot[] {
    const merged = new Map<string, AuditDbSnapshot>()
    ;[...existingItems, ...currentItems].forEach(item => {
      const key = `${item.name}::${item.sql}::${item.result}`
      merged.set(key, item)
    })
    return [...merged.values()]
  }

  private generateMarkdown(reportData: AuditReportData): string {
    const sectionMarkdown = (Object.keys(SECTION_LABELS) as AuditSection[])
      .map(section => this.generateSectionMarkdown(reportData.evidences[section], SECTION_LABELS[section]))
      .join('\n\n')

    return `# ${this.reportTitle}

## 审计执行摘要

| 状态 | 数量 |
| --- | --- |
| PASS | ${reportData.summary.pass} |
| WARN | ${reportData.summary.warn} |
| FAIL | ${reportData.summary.fail} |
| SKIP | ${reportData.summary.skip} |
| TOTAL | ${reportData.summary.total} |

${sectionMarkdown}${this.generateApiAppendix(reportData.apiSnapshots)}${this.generateDbAppendix(reportData.dbSnapshots)}
`
  }

  private generateSectionMarkdown(items: AuditResult[], sectionName: string): string {
    if (items.length === 0) {
      return `### ${sectionName}\n\n> 暂无验证点`
    }
    return `### ${sectionName}

| 环节 | 状态 | 验证详情 | 观测值 | 审计结论与视觉证据 |
| --- | --- | --- | --- | --- |
${items.map((item, index) => this.buildResultRow(item, index)).join('\n')}`
  }

  private buildResultRow(result: AuditResult, index: number): string {
    const statusIcon = result.type === 'PASS' ? '✅' : result.type === 'WARN' ? '⚠️' : result.type === 'SKIP' ? '⏩' : '❌'
    const observation = [result.uiVal !== '-' ? `UI: ${this.cleanMarkdownCell(result.uiVal)}` : '', result.apiVal !== '-' ? `API: ${this.cleanMarkdownCell(result.apiVal)}` : '']
      .filter(Boolean)
      .join('<br/>') || '-'
    let evidence = `结论: ${this.cleanMarkdownCell(result.msg)}`

    if (result.screenshot) {
      evidence += `<br/><br/>![Evidence](./${path.basename(result.screenshot)})`
    }

    return `| ${this.cleanMarkdownCell(result.category || `Step ${index + 1}`)} | ${statusIcon} ${result.type} | ${this.cleanMarkdownCell(result.msg)} | ${observation} | ${evidence} |`
  }

  private generateApiAppendix(apiSnapshots: Array<{ name: string; request: string; response: string }>): string {
    if (apiSnapshots.length === 0) {
      return ''
    }

    const detailsBlocks = apiSnapshots
      .map(snapshot => {
        return `<details>
<summary><b>点击展开: ${this.cleanMarkdownCell(snapshot.name)}</b></summary>

**Request:**
\`\`\`json
${snapshot.request}
\`\`\`

**Response:**
\`\`\`json
${snapshot.response}
\`\`\`
</details>`
      })
      .join('\n\n')

    return `\n\n---\n\n## 接口原证快照\n\n${detailsBlocks}\n`
  }

  private generateDbAppendix(dbSnapshots: AuditDbSnapshot[]): string {
    if (dbSnapshots.length === 0) {
      return '\n\n---\n\n*报告由 AuditReporter 自动生成*'
    }

    const detailsBlocks = dbSnapshots
      .map(snapshot => {
        return `<details>
<summary><b>点击展开: ${this.cleanMarkdownCell(snapshot.name)}</b></summary>

**SQL:**
\`\`\`sql
${snapshot.sql}
\`\`\`

**Result:**
\`\`\`json
${snapshot.result}
\`\`\`
</details>`
      })
      .join('\n\n')

    return `\n\n---\n\n## DB 查询原证快照\n\n${detailsBlocks}\n\n*报告由 AuditReporter 自动生成*`
  }

  private printConsole(type: string, category: string, msg: string, screenshot?: string) {
    const icon = type === 'PASS' ? '✅' : type === 'WARN' ? '⚠️' : type === 'INFO' ? 'ℹ️' : type === 'SKIP' ? '⏩' : '❌'
    console.log(`${icon} [${category}] ${msg}${screenshot ? ' (已关联截图)' : ''}`)
  }

  private stringifyPayload(payload: unknown): string {
    if (payload === undefined || payload === null) {
      return 'No payload'
    }
    return typeof payload === 'string' ? payload : JSON.stringify(payload, null, 2)
  }

  private sanitizePathSegment(value: string): string {
    return value.replace(/[<>:"/\\|?*\s-]+/g, '_')
  }

  private cleanMarkdownCell(value?: string): string {
    if (!value) {
      return '-'
    }
    return value.replace(/\|/g, '/').replace(/\r?\n+/g, '<br/>').trim() || '-'
  }
}

export default AuditReporter
