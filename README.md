# Playwright Enterprise Skills for Claude Code / Codex

> 面向企业级 UI 自动化测试的 Claude Code / Codex Skill 套件，从框架初始化到测试矩阵规划，覆盖 Playwright 项目全生命周期。

## Skills 概览

| Skill | 用途 | 触发场景 |
|-------|------|---------|
| [`ctj-playwright-bootstrap`](playwright-bootstrap/) | 新项目首次初始化 Playwright ui-test 基础框架 | 新仓库搭框架、补齐缺失骨架 |
| [`playwright-common`](./playwright-common/) | 日常 Playwright 脚本开发与维护的通用知识库 | 写 spec、补能力、调试、重构、补矩阵 |
| [`playwright-matrix-plan`](./playwright-matrix-plan/) | 测试矩阵分析与场景规划 | 新模块评估、测试策略制定、用例规划 |

## 设计理念

### 真实数据优先

不依赖 Mock，直接对接真实后端 API 和真实数据库，确保测试结果反映系统真实状态。

### 审计驱动

每条测试步骤产出完整证据链：截图 + API 快照 + DB 查询结果，自动生成 Markdown/JSON 审计报告，满足金融/政务/合规场景的可追溯要求。

### 分层可复用

- **Spec 层**：只组织场景、断言和报告记录
- **Capability 层**：沉淀可复用的页面操作、接口封装、数据库断言
- **公共能力层**：跨项目可复制的审计报告、数据库查询、智能等待

### 智能等待

禁用 `waitForTimeout`，采用两阶段策略：先尝试快速超时，检测到 loading 状态后自动进入轮询，兼顾速度与稳定性。

## 安装

### 前置条件

- [Claude Code](https://docs.anthropic.com/en/docs/claude-code) 或 [OpenAI Codex CLI](https://github.com/openai/codex) 已安装并可用
- Git

### Claude Code

<details>
<summary><b>一键安装（推荐）</b></summary>

```bash
# macOS / Linux
git clone https://github.com/shuaishuaiASDF/playwright-skills.git /tmp/playwright-skills && \
mkdir -p ~/.claude/skills && \
cp -r /tmp/playwright-skills/ctj-playwright-bootstrap ~/.claude/skills/ && \
cp -r /tmp/playwright-skills/playwright-common ~/.claude/skills/ && \
cp -r /tmp/playwright-skills/playwright-matrix-plan ~/.claude/skills/ && \
rm -rf /tmp/playwright-skills && \
echo "✅ 安装完成"
```

```powershell
# Windows (PowerShell)
git clone https://github.com/shuaishuaiASDF/playwright-skills.git $env:TEMP\playwright-skills
Copy-Item -Recurse $env:TEMP\playwright-skills\ctj-playwright-bootstrap $env:USERPROFILE\.claude\skills\
Copy-Item -Recurse $env:TEMP\playwright-skills\playwright-common $env:USERPROFILE\.claude\skills\
Copy-Item -Recurse $env:TEMP\playwright-skills\playwright-matrix-plan $env:USERPROFILE\.claude\skills\
Remove-Item -Recurse $env:TEMP\playwright-skills
Write-Host "✅ 安装完成"
```

</details>

<details>
<summary><b>手动安装</b></summary>

```bash
git clone https://github.com/shuaishuaiASDF/playwright-skills.git
cp -r playwright-skills/ctj-playwright-bootstrap ~/.claude/skills/
cp -r playwright-skills/playwright-common ~/.claude/skills/
cp -r playwright-skills/playwright-matrix-plan ~/.claude/skills/
```

</details>

<details>
<summary><b>项目级安装</b></summary>

仅当前项目可用，适合团队统一版本：

```bash
# 在项目根目录执行
git clone https://github.com/shuaishuaiASDF/playwright-skills.git /tmp/playwright-skills
mkdir -p .claude/skills
cp -r /tmp/playwright-skills/ctj-playwright-bootstrap .claude/skills/
cp -r /tmp/playwright-skills/playwright-common .claude/skills/
cp -r /tmp/playwright-skills/playwright-matrix-plan .claude/skills/
rm -rf /tmp/playwright-skills
```

</details>

### Codex CLI

```bash
# macOS / Linux
git clone https://github.com/shuaishuaiASDF/playwright-skills.git /tmp/playwright-skills && \
mkdir -p ~/.codex/skills && \
cp -r /tmp/playwright-skills/ctj-playwright-bootstrap ~/.codex/skills/ && \
cp -r /tmp/playwright-skills/playwright-common ~/.codex/skills/ && \
cp -r /tmp/playwright-skills/playwright-matrix-plan ~/.codex/skills/ && \
rm -rf /tmp/playwright-skills && \
echo "✅ 安装完成"
```

```powershell
# Windows (PowerShell)
git clone https://github.com/shuaishuaiASDF/playwright-skills.git $env:TEMP\playwright-skills
Copy-Item -Recurse $env:TEMP\playwright-skills\ctj-playwright-bootstrap $env:USERPROFILE\.codex\skills\
Copy-Item -Recurse $env:TEMP\playwright-skills\playwright-common $env:USERPROFILE\.codex\skills\
Copy-Item -Recurse $env:TEMP\playwright-skills\playwright-matrix-plan $env:USERPROFILE\.codex\skills\
Remove-Item -Recurse $env:TEMP\playwright-skills
Write-Host "✅ 安装完成"
```

### 验证安装

重启 Claude Code / Codex，确认 Skill 已加载：

```bash
# Claude Code — 查看可用命令
/help

# Codex — 确认 skills 目录存在
ls ~/.codex/skills/
```

预期输出：

```
ctj-playwright-bootstrap  — 初始化 Playwright ui-test 框架
playwright-common         — 日常 Playwright 脚本开发
playwright-matrix-plan    — 测试矩阵分析与规划
```

如果未出现，确认目录结构正确：

```
# Claude Code
~/.claude/skills/
├── ctj-playwright-bootstrap/SKILL.md
├── playwright-common/SKILL.md
└── playwright-matrix-plan/SKILL.md

# Codex
~/.codex/skills/
├── ctj-playwright-bootstrap/SKILL.md
├── playwright-common/SKILL.md
└── playwright-matrix-plan/SKILL.md
```

## 使用

### 框架初始化（新项目）

在 Claude Code 中输入：

```
$ctj-playwright-bootstrap
```

或直接用自然语言：

```
请初始化 Playwright ui-test 基础框架
项目根目录: D:\my-project
是否启用数据库能力: 是
是否启用审计报告: 是
```

Skill 会自动检查项目现状，只补齐缺失文件，不覆盖已有内容。

### 日常脚本开发（已有框架）

```
$playwright-common
```

适用场景：新增 spec、补充页面能力、调试测试失败、修复选择器、补充数据库断言。

### 测试矩阵规划

```
$playwright-matrix-plan
```

适用场景：新模块测试策略评估、用例矩阵规划、场景覆盖分析。

## 目录结构

```
├── ctj-playwright-bootstrap/     # 框架初始化 Skill
│   ├── SKILL.md                  #   Skill 指令文件
│   ├── agents/openai.yaml        #   Codex Agent 配置
│   └── assets/templates/ui-test/ #   可复制的框架模板
│       ├── package.json
│       ├── playwright.config.ts
│       ├── tsconfig.json
│       ├── README.md
│       └── code/
│           ├── test.config.ts
│           └── base/capabilities/
│               ├── db/           #     数据库查询能力
│               └── reporters/    #     审计报告能力
│
├── playwright-common/            # 日常开发 Skill
│   ├── SKILL.md                  #   Skill 指令文件
│   ├── agents/openai.yaml        #   Codex Agent 配置
│   ├── references/               #   实现参考文档
│   ├── examples/                 #   代码示例
│   └── templates/                #   输出模板
│
└── playwright-matrix-plan/       # 测试矩阵 Skill
    ├── SKILL.md                  #   Skill 指令文件
    ├── agents/openai.yaml        #   Codex Agent 配置
    └── references/               #   映射规则与矩阵模板
```

## 适用场景

- 企业级中后台系统的 UI 自动化测试
- 金融/政务/合规等需要审计证据链的项目
- 使用 Ant Design Vue / Element Plus 等 UI 框架的 Vue 3 项目
- 需要真实后端 + 真实数据库验证的集成测试

## 兼容性

- Claude Code（Skill 直接加载）
- OpenAI Codex（通过 `agents/openai.yaml` 配置）
- 支持 Windows / macOS / Linux

## License

MIT
