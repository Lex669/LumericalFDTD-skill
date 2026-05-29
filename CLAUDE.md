# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## This is a Claude Code Plugin

This repo defines the **LumericalFDTD** plugin with three skills:

| Skill | 用途 |
|-------|------|
| **LumericalFDTD** | Ansys Lumerical FDTD 仿真自动化 — 构建 Python 脚本、运行仿真、debug、输出 `.fsp`/`.npz`/`.png` |
| **paper-summarizer** | 学术论文深度总结 — 读取PDF论文，结构化输出中文总结，逐图逐表详细解释 |
| **propaper-reader** | (待迁移) 多智能体论文分析管线 |
| **export-paper** | (待迁移) 论文分析结果导出 |

**There is no build, lint, test suite, or traditional CI pipeline.** "Development" means editing skill files (`skills/*/SKILL.md`) and their reference files (`skills/*/references/`).

## Architecture

```
.claude-plugin/
  plugin.json                         # Plugin manifest — 注册所有 skills
skills/
  LumericalFDTD/
    SKILL.md                          # FDTD 仿真 skill 定义
    references/
      building-blocks.md              # 几何结构、光源、监视器、网格覆盖
      api-reference.md                # 会话管理、SimObject、数据传递、lumopt
      common-errors.md                # 已知 Lumerical API 陷阱
      diffraction.md                  # 孔衍射、Airy环、近场/远场分析
    scripts/
      template.py                     # 仿真脚本骨架模板
    assets/                           # (预留)
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

## Key Design Decisions

- **Simulation/analysis separation is mandatory.** Heavy FDTD runs go in `*_sim.py`; data processing and plotting go in `*_analysis.py`. The intermediate interface is `.npz` files. This lets users tweak plots without re-running simulations.
- **First-use environment probing.** Each session starts by probing the OS and locating the Lumerical Python interpreter (`python.exe` on Windows, `python` on Linux). Common paths are tried first; if none work, the user is asked.
- **Fixed directory structure per project.** Every simulation project must have `fsp/`, `data/`, `pic/` subdirectories. No output files in the root.
- **No `addmaterial` + `set("type",...)`.** Use built-in material name strings directly (e.g., `"SiO2 (Glass) - Palik"`, `"PEC (Perfect Electrical Conductor)"`). Several API methods have non-obvious names or don't exist — see `references/common-errors.md` for the full list.

## Common Operations

- **Editing FDTD skill:** Edit `skills/LumericalFDTD/SKILL.md`. The frontmatter `name` and `description` fields control when the skill triggers.
- **Adding a new API quirk:** Add a row to the table in `skills/LumericalFDTD/references/common-errors.md`.
- **Adding a new geometry pattern:** Add a section to `skills/LumericalFDTD/references/building-blocks.md`.
- **Updating the FDTD template:** Edit `skills/LumericalFDTD/scripts/template.py`. Keep `__API_PATH__` and `__OUTPUT_DIR__` as placeholders.
- **Editing paper-summarizer skill:** Edit `skills/paper-summarizer/SKILL.md`. Output template in `skills/paper-summarizer/references/output-template.md`, chart methodology in `skills/paper-summarizer/references/chart-analysis.md`.
- **Registering a new skill:** Add an entry to `.claude-plugin/plugin.json` under `components.skills`.
- **Validating the skill:** Install it in your Claude Code via `/plugin marketplace add Lex669/LumericalFDTD-skill` + `/plugin install LumericalFDTD@LumericalFDTD` and test with a real task. There is no automated test suite — validation requires the Lumerical license (for FDTD) or real PDF papers (for paper-summarizer).
