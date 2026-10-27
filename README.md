# LumericalFDTD Plugin

![version](https://img.shields.io/badge/version-1.2.0-blue)
![license](https://img.shields.io/badge/license-MIT-green)
![Ansys Lumerical](https://img.shields.io/badge/Ansys%20Lumerical-FDTD-orange)
![Made for](https://img.shields.io/badge/Made%20for-Claude%20Code-black)
![Made for](https://img.shields.io/badge/Made%20for-Codex-black)

Ansys Lumerical FDTD 仿真自动化 + 学术论文深度分析，Claude Code / Codex CLI 双生态插件。

项目官网源码位于 [`docs/`](docs/)，本地预览与 GitHub Pages 部署方式见下方说明。

## 功能概览

### 🔬 FDTD 仿真（4 个分级 skills + 4 个 slash commands）

| Skill | Command | 用途 |
|-------|---------|------|
| `LumericalFDTD-modeling` | `/fdtd-model` | 构建几何模型（结构、材料、光源、监视器） |
| `LumericalFDTD-simulation` | `/fdtd-simulate` | 执行仿真 + 自动 debug（最多 5 次重试） |
| `LumericalFDTD-analysis` | `/fdtd-analyze` | 分析 .npz 数据 + 生成发表级图表 |
| `LumericalFDTD` | `/fdtd-full` | 端到端全流程：建模 → 仿真 → 分析 → 验收 |

**能力覆盖**：衍射分析、超表面、波导、光栅、TGV 结构、场传播、参数扫描、逆设计优化。

### 📄 论文总结

| Skill | 用途 |
|-------|------|
| `paper-summarizer` | 结构化中文论文总结，逐图逐表 5 维度分析 |

## 安装

### Claude Code

```bash
# Claude Code 插件市场安装
/plugin marketplace add Lex669/AutoSim
/plugin install LumericalFDTD@AutoSim
```

### Codex CLI（v0.121+）

```bash
# 注册 AutoSim 插件市场
codex plugin marketplace add Lex669/AutoSim
# 安装插件（autosim 为清单注册名，可用 codex plugin marketplace list 查看）
codex plugin add LumericalFDTD@autosim
```

> [!NOTE]
> Codex 端注册 `skills/` 下的 5 个技能，用自然语言描述仿真/分析/论文总结任务即可自动调用；`/fdtd-*` 斜杠命令仅在 Claude Code 端可用。

> [!NOTE]
> 首次使用时，插件会自动探测本机 Lumerical Python 解释器，无需手动配置。

## 快速开始

### 全流程仿真

```
/fdtd-full

我要仿真一个 30μm 直径的圆孔在 50μm 厚 SiO2 衬底上的太赫兹衍射，
波长范围 80-120μm，PEC 衬底，观察远场 Airy 环。
```

### 仅建模

```
/fdtd-model

构建一个脊形波导模型：Si 芯层 220nm，SiO2 包层，
波长 1550nm，TE 模式。
```

### 仅仿真（已有建模脚本）

```
/fdtd-simulate

运行 myproject_sim.py，如果报错自动修复。
```

### 仅分析（已有 .npz 数据）

```
/fdtd-analyze

读取 data/results.npz，画透射谱和场分布图。
```

> [!TIP]
> 分析脚本（`*_analysis.py`）修改后可反复执行，无需重跑仿真。

## 项目结构

每个仿真项目遵循固定目录结构：

```
MyProject/
├── fsp/          # .fsp 仿真项目文件 + 仿真日志
├── data/         # .npz 仿真结果数据
├── pic/          # 每次运行一个 <label>_run_<NN>/ 子目录 (.png)
├── *_sim.py      # 仿真脚本
├── *_analysis.py # 分析脚本
└── REPORT.md     # 仿真报告
```

## 依赖

- **Ansys Lumerical FDTD**（2025 R2 或兼容版本）
- Lumerical 内置 Python 解释器（自动探测，无需用户配置）
- Python packages：`numpy`、`matplotlib`（Lumerical 解释器自带）

## 论文总结功能

支持 PDF 路径、Arxiv URL、DOI。输出中文 8 章节结构化报告：基本信息、研究动机、方法、实验、图表详解、核心贡献、局限、总结。每个图表从类型、内容、关键观察、与论点关系、质量评价 5 个维度分析。

## 更新日志

### 1.2.0 · 2026-09-07 — 图表归档 + Codex CLI 适配

- **图表归档约定**：每次分析运行写入独立的 `pic/<label>_run_<NN>/` 子目录（`label` 按仿真内容分类，`NN` 自动递增），历史图表全部保留，便于跨版本对比。
- `LumericalFDTD-analysis`、`LumericalFDTD` 两个 skill，以及 `/fdtd-analyze`、`/fdtd-full` 命令与 `CLAUDE.md` 同步更新。
- 新增 `.codex-plugin/plugin.json`，插件同时支持 **Claude Code 与 Codex CLI（v0.121+）**；Codex 端注册 `skills/` 下的 5 个技能，README 补充 Codex 安装指引。

### 1.1.0 · 2026-06-17 — Skill 分级拆分

- 单一 skill 拆分为 4 个分级模块：`LumericalFDTD-modeling`（建模）、`LumericalFDTD-simulation`（仿真 + 自动 debug）、`LumericalFDTD-analysis`（数据分析与绘图）、`LumericalFDTD`（端到端全流程）。
- 新增 4 个斜杠命令：`/fdtd-model`、`/fdtd-simulate`、`/fdtd-analyze`、`/fdtd-full`。
- 参考文件增强：`common-errors.md`、`building-blocks.md`、`diffraction.md`、`api-reference.md` 大幅扩充。
- 修复若干 bug（建模 skill、`scripts/template.py` 模板脚本）。

### 1.0.0 · 2026-05-25 ~ 2026-05-29 — 插件化

- 从 `git clone` 手动安装迁移为 Claude Code 插件安装方式。
- 新增 `paper-summarizer` skill：结构化中文论文总结，逐图逐表 5 维度分析，配套 `chart-analysis.md`、`output-template.md` 参考文件。
- 新增 `CLAUDE.md` 项目说明，README 面向 GitHub 重写。
- 强化核心工作流：执行仿真是必经阶段，不允许只生成脚本而不运行。
- 补充 quasi-2D / 2D 维度陷阱，以及 Windows 路径、宽谱光源等常见错误说明。

### 早期迭代 · 2026-05-06 ~ 2026-05-15

- 首版 `SKILL.md` 与 `API_SUMMARY.md`：Lumerical Python API 的建模、仿真与结果提取流程。
- 建立 `references/` 目录：`api-reference.md`、`building-blocks.md`、`common-errors.md`、`diffraction.md`。

## 项目官网

官网地址：https://lex669.github.io/LumericalFDTD-skill/

网站为无第三方运行时依赖的静态页面，版本、安装命令和更新日志在构建时从插件清单与本 README 中读取。

本地预览需要 Node.js 22 或更新版本，在仓库根目录执行：

```bash
node docs/scripts/build.mjs
node docs/scripts/serve.mjs
```

打开 http://localhost:4173/LumericalFDTD-skill/ ，修改网站源码后重新构建并刷新页面。生成目录为 `docs/dist/`，发布时由工作流重新构建。

GitHub Pages 使用 [部署工作流](.github/workflows/pages.yml)：在仓库 **Settings → Pages → Source** 选择 **GitHub Actions**，推送到 `main` 后自动构建并发布 `docs/dist/`，也可在 Actions 中手动运行。不要选择从分支的 `/docs` 发布，该方式会直接读取尚未替换占位符的 `docs/index.html` 模板。Pull request 仅构建验证，不发布。

## License

MIT

## Star History

[![Star History Chart](https://api.star-history.com/svg?repos=Lex669/LumericalFDTD-skill&type=Date)](https://star-history.com/#Lex669/LumericalFDTD-skill&Date)
