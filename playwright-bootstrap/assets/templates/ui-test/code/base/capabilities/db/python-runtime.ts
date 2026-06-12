import { execFileSync } from 'node:child_process'

export type PythonCandidate = {
  command: string
  baseArgs: string[]
}

const DEFAULT_PYTHON_CANDIDATES: PythonCandidate[] = [
  { command: 'python', baseArgs: [] },
  { command: 'py', baseArgs: ['-3'] },
  { command: 'py', baseArgs: [] },
]

let cachedPythonRuntime: PythonCandidate | null = null

export function findPythonRuntime(candidates: PythonCandidate[] = DEFAULT_PYTHON_CANDIDATES): PythonCandidate {
  if (cachedPythonRuntime) {
    return cachedPythonRuntime
  }
  for (const candidate of candidates) {
    try {
      execFileSync(candidate.command, [...candidate.baseArgs, '--version'], { encoding: 'utf-8', stdio: 'pipe' })
      cachedPythonRuntime = candidate
      return candidate
    } catch (_ignored) {
    }
  }
  throw new Error('未找到可用 Python 运行时，请安装 python 或 py 启动器。')
}

export function runPythonFile(
  filePath: string,
  args: string[],
  options?: {
    cwd?: string
    env?: NodeJS.ProcessEnv
    candidates?: PythonCandidate[]
  },
): string {
  const python = findPythonRuntime(options?.candidates)
  return execFileSync(python.command, [...python.baseArgs, filePath, ...args], {
    cwd: options?.cwd,
    encoding: 'utf-8',
    env: {
      ...process.env,
      PYTHONIOENCODING: 'utf-8',
      PYTHONUTF8: '1',
      ...(options?.env || {}),
    },
    stdio: 'pipe',
  })
}
