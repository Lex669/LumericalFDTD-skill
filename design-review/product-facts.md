# 网页评审事实依据

评审日期：2026-10-27（Asia/Shanghai）。评审目标为现有网页，不生成新视觉设计、不修改网站源码、不发布。

## 来源与核验

- 官网：https://lex669.github.io/LumericalFDTD-skill/
- 仓库：https://github.com/Lex669/LumericalFDTD-skill
- 当前本地提交：`aa1f361`，`fix: deploy built site from docs/dist`。
- 本地事实来源：`README.md`、`.codex-plugin/plugin.json`、`docs/index.html`、`docs/styles.css`。
- 已尝试 WebSearch 核查项目，并通过官网 HTTP GET 直接验证当前发布内容。Web 搜索引擎不能直接打开官网，但本机 HTTP 请求返回 200。
- 线上 HTML 与本次从源码生成的 `docs/dist/index.html` 在统一换行、去除首尾空白后完全一致；线上未发现 `VERSION`、`INSTALL_CLAUDE`、`INSTALL_CODEX`、`CHANGELOG` 模板占位符。
- 插件清单和页面当前版本均为 1.2.0。项目定位与功能说明以仓库为依据，本次没有重新验证软件兼容性、实际仿真能力或科学结果。

## 可用于评审的产品事实

- 项目是面向 Claude Code 与 Codex 的本地 FDTD 自动化插件。
- 功能包含建模、仿真、分析、全流程和论文总结。
- 页面已经说明需要本地 Ansys Lumerical FDTD 环境与相应许可。
- 首屏光学图、流程和目录树明确标注为示意。
- 当前案例区域展示需求文字和预期产物，没有展示真实仿真模型、场图或光谱结果。
- 平台标签当前采用 `✳`、`⌘` 字形；本次未把它们认定为经过核验的官方品牌资产。

## 方法与限制

- 已阅读 huashu-design 主文件与 `references/critique-guide.md`。
- 已运行偏好查询、外观账本查询与能力检查，没有发现该用户的已存审美偏好，外观账本为空。
- `design_lint.py check docs/index.html` 因缺少 Python Playwright 跳过，不将其记录为自动检查通过；使用当前浏览器截图、DOM 字号和控件尺寸测量补充评审。
- 桌面视口为 1440 × 900，手机视口为 390 × 844，均为 CSS 像素。浏览器临时尺寸覆盖已恢复。
- 本次是视觉与内容审查，不是完整的无障碍合规审核、性能测试或用户研究。评分是设计判断，不是用户测试结果。
- 不涉及新设计，未启动三方向初稿流程，也没有把现有页面冒记为一次新设计交付。
- skill 目录没有独立 `.git`，按其规定跳过远程版本标签检查。
