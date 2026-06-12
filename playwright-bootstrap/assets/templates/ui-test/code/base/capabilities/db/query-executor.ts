import { buildDbEnv, DB_EXECUTOR_PATH, getMissingDbConfigKeys } from './db-config'
import { runPythonFile } from './python-runtime'

export type QueryResult = {
  success: boolean
  rowCount: number
  rows: Record<string, unknown>[]
  error?: string
}

export type WaitForQueryOptions = {
  retries?: number
  delayMs?: number
  expectNonEmpty?: boolean
  debugLabel?: string
  debugLogger?: (message: string) => void
}

export function isDbReady(): boolean {
  return getMissingDbConfigKeys().length === 0
}

export async function runQuery(sql: string, params: unknown[] = []): Promise<QueryResult | null> {
  if (!isDbReady()) {
    return null
  }

  const stdout = runPythonFile(DB_EXECUTOR_PATH, [
    '--sql', sql,
    '--params', JSON.stringify(params),
  ], {
    cwd: process.cwd(),
    env: buildDbEnv(),
  })

  return JSON.parse(stdout.trim()) as QueryResult
}

export async function runQueryOne(sql: string, params: unknown[] = []): Promise<Record<string, unknown> | null> {
  const result = await runQuery(sql, params)
  if (!result || !result.success || result.rowCount === 0) {
    return null
  }
  return result.rows[0]
}

export async function waitForQuery(
  sql: string,
  params: unknown[] = [],
  options: WaitForQueryOptions = {},
): Promise<QueryResult | null> {
  if (!isDbReady()) {
    return null
  }

  const {
    retries = 5,
    delayMs = 1500,
    expectNonEmpty = true,
    debugLabel,
    debugLogger,
  } = options

  const logDebug =
    debugLabel && debugLogger
      ? (message: string) => {
          debugLogger(`[waitForQuery][${debugLabel}] ${message}`)
        }
      : null

  let lastResult: QueryResult | null = null
  for (let attempt = 0; attempt <= retries; attempt++) {
    logDebug?.(`第 ${attempt + 1}/${retries + 1} 次执行 SQL=${sql} params=${JSON.stringify(params)}`)
    lastResult = await runQuery(sql, params)

    if (!lastResult || !lastResult.success) {
      logDebug?.(`第 ${attempt + 1}/${retries + 1} 次执行失败 success=${String(lastResult?.success)} error=${lastResult?.error || '-'}`)
      return lastResult
    }

    logDebug?.(`第 ${attempt + 1}/${retries + 1} 次执行完成 rowCount=${lastResult.rowCount}`)

    if (expectNonEmpty && lastResult.rowCount > 0) {
      return lastResult
    }
    if (!expectNonEmpty && lastResult.rowCount === 0) {
      return lastResult
    }

    if (attempt < retries) {
      await new Promise(resolve => setTimeout(resolve, delayMs))
    }
  }

  return lastResult
}
