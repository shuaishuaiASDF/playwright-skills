import * as fs from 'node:fs'
import * as path from 'node:path'

export type DbConfig = {
  dbType: string
  host: string
  port: string
  database: string
  user: string
  password: string
}

type EnvAliasConfig = {
  label: keyof DbConfig
  aliases: string[]
}

type ParsedEnvEntry = {
  key: string
  value: string
}

function parseEnvLine(raw: string): ParsedEnvEntry | null {
  const line = raw.trim()
  if (!line || line.startsWith('#')) {
    return null
  }
  const index = line.indexOf('=')
  if (index <= 0) {
    return null
  }
  const key = line.slice(0, index).trim()
  const value = line.slice(index + 1).trim().replace(/^"(.*)"$/, '$1').replace(/^'(.*)'$/, '$1')
  if (!key) {
    return null
  }
  return { key, value }
}

function loadEnvFileIfPresent(filePath: string): void {
  if (!fs.existsSync(filePath)) {
    return
  }
  const content = fs.readFileSync(filePath, 'utf-8')
  for (const rawLine of content.split(/\r?\n/)) {
    const parsed = parseEnvLine(rawLine)
    if (!parsed) {
      continue
    }
    if (!process.env[parsed.key]) {
      process.env[parsed.key] = parsed.value
    }
  }
}

function bootstrapDbEnv(): void {
  const localEnvPath = path.resolve(process.cwd(), '.env.db.local')
  loadEnvFileIfPresent(localEnvPath)
}

bootstrapDbEnv()

const DB_ENV_ALIAS_CONFIG: EnvAliasConfig[] = [
  { label: 'dbType', aliases: ['MYSQL_TYPE', 'DB_TYPE'] },
  { label: 'host', aliases: ['MYSQL_HOST', 'DB_HOST'] },
  { label: 'port', aliases: ['MYSQL_PORT', 'DB_PORT'] },
  { label: 'database', aliases: ['MYSQL_NAME', 'DB_NAME'] },
  { label: 'user', aliases: ['MYSQL_USER', 'DB_USER'] },
  { label: 'password', aliases: ['MYSQL_PASSWORD', 'DB_PASSWORD'] },
]

export const DB_EXECUTOR_PATH = path.resolve(process.cwd(), 'code/base/scripts/db/db-executor.py')

function readFirstEnv(aliases: string[]): string {
  for (const key of aliases) {
    const value = process.env[key]
    if (value) {
      return value
    }
  }
  return ''
}

export function getMissingDbConfigKeys(): string[] {
  return DB_ENV_ALIAS_CONFIG
    .filter(item => !readFirstEnv(item.aliases))
    .map(item => item.aliases[0])
}

export function getDbConfig(): DbConfig | null {
  const missingKeys = getMissingDbConfigKeys()
  if (missingKeys.length > 0) {
    return null
  }
  return {
    dbType: readFirstEnv(['MYSQL_TYPE', 'DB_TYPE']).trim().toLowerCase(),
    host: readFirstEnv(['MYSQL_HOST', 'DB_HOST']).trim(),
    port: readFirstEnv(['MYSQL_PORT', 'DB_PORT']).trim(),
    database: readFirstEnv(['MYSQL_NAME', 'DB_NAME']).trim(),
    user: readFirstEnv(['MYSQL_USER', 'DB_USER']).trim(),
    password: readFirstEnv(['MYSQL_PASSWORD', 'DB_PASSWORD']).trim(),
  }
}

export function buildDbEnv(baseEnv: NodeJS.ProcessEnv = process.env): NodeJS.ProcessEnv {
  const dbConfig = getDbConfig()
  if (!dbConfig) {
    return baseEnv
  }
  return {
    ...baseEnv,
    DB_EXECUTOR_TYPE: dbConfig.dbType,
    DB_EXECUTOR_HOST: dbConfig.host,
    DB_EXECUTOR_PORT: dbConfig.port,
    DB_EXECUTOR_NAME: dbConfig.database,
    DB_EXECUTOR_USER: dbConfig.user,
    DB_EXECUTOR_PASSWORD: dbConfig.password,
  }
}
