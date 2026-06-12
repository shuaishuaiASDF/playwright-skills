# 字段审计最小模式

适用于以下高频场景：

- 唯一键查询命中后，补关键字段一致性校验
- 查看页或详情页，核对 UI 回显与详情接口
- 保存成功后，核对展示态、保存入参与回查接口

## 推荐字段模型

```ts
type AuditField = {
  label: string
  apiProp: string
  aliases?: string[]
  source: 'UI' | 'API' | 'UI+API'
  compareMode?: 'exact' | 'contains'
  requiredInUi?: boolean
}

const AUDIT_FIELDS: AuditField[] = [
  { label: '业务编号', apiProp: 'businessCode', source: 'UI+API', compareMode: 'exact', requiredInUi: true },
  { label: '业务名称', apiProp: 'businessName', source: 'UI+API', compareMode: 'exact', requiredInUi: true },
  { label: '状态', apiProp: 'status', source: 'UI+API', compareMode: 'exact', requiredInUi: true },
  { label: '创建人', apiProp: 'createdBy', source: 'UI+API', compareMode: 'exact', requiredInUi: true },
]
```

## 推荐流程

1. 先用唯一键证明当前列表命中的就是目标数据。
2. 再打开查看页、详情页或保存后结果页。
3. 抓当前页面稳定展示的 `uiFields`，不要把整行文本直接当成唯一对比来源。
4. 从详情接口、保存入参或回查接口解析 `apiVal`。
5. 循环字段模型，把 `uiVal` 和 `apiVal` 一起写进 reporter。

## 最小 helper 骨架

```ts
type AuditField = {
  label: string
  apiProp: string
  aliases?: string[]
  source: 'UI' | 'API' | 'UI+API'
  compareMode?: 'exact' | 'contains'
  requiredInUi?: boolean
}

function normalizeAuditValue(value: unknown): string {
  if (value === null || value === undefined) return '-'
  return String(value).replace(/\s+/g, ' ').trim() || '-'
}

function resolveApiValue(field: AuditField, payload: Record<string, unknown>): string {
  const candidateKeys = [field.apiProp, ...(field.aliases || [])]
  for (const key of candidateKeys) {
    const raw = payload[key]
    if (raw !== null && raw !== undefined && String(raw).trim() !== '') {
      return normalizeAuditValue(raw)
    }
  }
  return '-'
}

async function collectUiFieldMap(page: Page): Promise<Record<string, string>> {
  return {
    业务编号: await getFormItemValue(page, '业务编号'),
    业务名称: await getFormItemValue(page, '业务名称'),
    状态: await getFormItemValue(page, '状态'),
    创建人: await getFormItemValue(page, '创建人'),
  }
}

function compareField(uiVal: string, apiVal: string, compareMode: 'exact' | 'contains' = 'exact'): boolean {
  if (compareMode === 'contains') {
    return uiVal !== '-' && apiVal !== '-' && uiVal.includes(apiVal)
  }
  return uiVal === apiVal
}
```

## 最小审计循环

```ts
const uiFields = await collectUiFieldMap(page)
const detailData = (detailPayload?.data || {}) as Record<string, unknown>

for (const field of AUDIT_FIELDS) {
  const uiVal = normalizeAuditValue(uiFields[field.label])
  const apiVal = resolveApiValue(field, detailData)

  if (uiVal === '-' && field.requiredInUi && apiVal !== '-') {
    auditReporter.logWithSection('normal', 'FAIL', `[查看页字段] ${field.label}`, 'UI未展示该字段（疑似漏展示）', '-', apiVal, field.apiProp)
    continue
  }

  if (field.source === 'API' && apiVal !== '-') {
    auditReporter.logWithSection('normal', 'PASS', `[查看页字段] ${field.label}`, '字段已通过 API 回查确认', '-', apiVal, field.apiProp)
    continue
  }

  const matched = compareField(uiVal, apiVal, field.compareMode || 'exact')
  auditReporter.logWithSection(
    'normal',
    matched ? 'PASS' : 'FAIL',
    `[查看页字段] ${field.label}`,
    matched ? '字段匹配' : '字段不匹配',
    uiVal,
    apiVal,
    field.apiProp,
  )
}
```

## 记录口径

- `uiVal` 只写页面当前真实可见值。
- `apiVal` 只写接口、保存入参或回查值。
- 若项目 reporter 未支持自定义状态，字段不匹配统一记 `FAIL`，不要写 `MISMATCH`。
- 若需要先盘点 UI 缺失字段或模型外字段，可额外记录 `字段覆盖盘点` 审计点。
