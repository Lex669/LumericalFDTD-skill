# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## This is a Claude Code Plugin

This repo defines the **LumericalFDTD** plugin with 5 skills and 4 slash commands:

| Skill | 用途 |
|-------|------|
| **LumericalFDTD** | FDTD 全流程自动化 — 建模→仿真→分析→验收，端到端流水线 |
| **LumericalFDTD-modeling** | FDTD 结构建模 — 几何、材料、光源、监视器，输出建模脚本 |
| **LumericalFDTD-simulation** | FDTD 仿真执行 — 运行、自动debug、结果提取，输出 .fsp/.npz |
| **LumericalFDTD-analysis** | FDTD 数据分析 — 读取 .npz、计算指标、绘图，输出 .png |
| **paper-summarizer** | 学术论文深度总结 — 结构化中文报告，逐图逐表详细解释 |

| Command | 说明 |
|---------|------|
| `/fdtd-model` | 触发 LumericalFDTD-modeling — 仅建模 |
| `/fdtd-simulate` | 触发 LumericalFDTD-simulation — 仅仿真 |
| `/fdtd-analyze` | 触发 LumericalFDTD-analysis — 仅分析 |
| `/fdtd-full` | 触发 LumericalFDTD — 全流程 |

**There is no build, lint, test suite, or traditional CI pipeline.** "Development" means editing skill files (`skills/*/SKILL.md`), command files (`commands/*.md`), and reference files (`skills/*/references/`).

## Architecture

```
.claude-plugin/
  plugin.json                         # Plugin manifest — 注册所有 skills 和 commands
commands/
  fdtd-model.md                       # /fdtd-model 命令
  fdtd-simulate.md                    # /fdtd-simulate 命令
  fdtd-analyze.md                     # /fdtd-analyze 命令
  fdtd-full.md                        # /fdtd-full 命令
skills/
  LumericalFDTD/
    SKILL.md                          # FDTD 全流程 skill 定义
    references/
      building-blocks.md              # 几何结构、光源、监视器、网格覆盖
      api-reference.md                # 会话管理、SimObject、数据传递、lumopt
      common-errors.md                # 已知 Lumerical API 陷阱（按错误类型分类）
      diffraction.md                  # 孔衍射、Airy环、近场/远场分析
    scripts/
      template.py                     # 仿真脚本骨架模板
    assets/                           # (预留)
  LumericalFDTD-modeling/
    SKILL.md                          # FDTD 建模 skill 定义
  LumericalFDTD-simulation/
    SKILL.md                          # FDTD 仿真执行 skill 定义
  LumericalFDTD-analysis/
    SKILL.md                          # FDTD 数据分析 skill 定义
  paper-summarizer/
    SKILL.md                          # 论文总结 skill 定义
    references/
      output-template.md              # 中文输出报告模板
      chart-analysis.md               # 各类型图表分析方法论
```

**How skills work at runtime:**
1. `plugin.json` 的 `components.skills` 注册每个 skill 的路径
2. Claude Code 启动时加载所有 skill 的 `name` + `description`（始终在上下文中）
3. 当用户请求匹配某个 skill 的 description 时，`Skill` 工具加载完整 `SKILL.md`
4. `SKILL.md` 中引用 `references/` 文件，模型按需读取（渐进披露）

**How commands work at runtime:**
1. `plugin.json` 的 `components.commands` 注册每个 command 的路径
2. 用户输入 `/fdtd-model` 等斜杠命令时加载对应 `.md` 文件
3. Command 文件引导模型调用对应的 skill

## Key Design Decisions

- **Simulation/analysis separation is mandatory.** Heavy FDTD runs go in `*_sim.py`; data processing and plotting go in `*_analysis.py`. The intermediate interface is `.npz` files. This lets users tweak plots without re-running simulations.
- **First-use environment probing.** Each session starts by probing the OS and locating the Lumerical Python interpreter (`python.exe` on Windows, `python` on Linux). Common paths are tried first; if none work, the user is asked.
- **Fixed directory structure per project.** Every simulation project must have `fsp/`, `data/`, `pic/` subdirectories. No output files in the root.
- **No `addmaterial` + `set("type",...)`.** Use built-in material name strings directly (e.g., `"SiO2 (Glass) - Palik"`, `"PEC (Perfect Electrical Conductor)"`). Several API methods have non-obvious names or don't exist — see `references/common-errors.md` for the full list.
- **Max 5 retries for error loop.** The simulation debug loop caps at 5 automatic retries. If all fail, escalate to user with a summary of attempts.
- **Skill granularity.** LumericalFDTD is split into 4 skills (full-pipeline + 3 phase-specific) so users can invoke only the phase they need without loading the full pipeline context.

## Common Operations

- **Editing FDTD full-pipeline skill:** Edit `skills/LumericalFDTD/SKILL.md`. The frontmatter `name` and `description` fields control when the skill triggers.
- **Editing phase-specific skills:** Edit `skills/LumericalFDTD-{modeling,simulation,analysis}/SKILL.md`.
- **Editing a command:** Edit `commands/fdtd-{model,simulate,analyze,full}.md`. Commands should be thin wrappers that delegate to skills.
- **Adding a new API quirk:** Add a row to the table in `skills/LumericalFDTD/references/common-errors.md`. Classify by type (语法/API/环境) and severity (阻塞/警告).
- **Adding a new geometry pattern:** Add a section to `skills/LumericalFDTD/references/building-blocks.md`. Update the TOC at the top.
- **Updating the FDTD template:** Edit `skills/LumericalFDTD/scripts/template.py`. Keep `__API_PATH__` and `__OUTPUT_DIR__` as placeholders.
- **Editing paper-summarizer skill:** Edit `skills/paper-summarizer/SKILL.md`. Output template in `skills/paper-summarizer/references/output-template.md`, chart methodology in `skills/paper-summarizer/references/chart-analysis.md`.
- **Registering a new skill:** Add an entry to `.claude-plugin/plugin.json` under `components.skills`.
- **Registering a new command:** Add an entry to `.claude-plugin/plugin.json` under `components.commands` and create the command `.md` file in `commands/`.
- **Validating the skill:** Install it in your Claude Code via `/plugin marketplace add Lex669/LumericalFDTD-skill` + `/plugin install LumericalFDTD@LumericalFDTD` and test with a real task. There is no automated test suite — validation requires the Lumerical license (for FDTD) or real PDF papers (for paper-summarizer).
