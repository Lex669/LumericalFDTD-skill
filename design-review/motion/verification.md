# 网页动效验证

2026-10-27。视觉方向沿用已确认的官网；变更记录见同目录 `direction-approved.md`。

## 动效内容

- 首屏标题、说明和入口按顺序轻移归位，输入波形单次描线。
- 波前与信号以 6.4 秒周期传播；提供可见暂停 / 播放按钮，保存用户选择。
- 流程步骤首次进入视口时触发；手机上每步分别触发，避免后续步骤在屏幕外就播完。
- 安装与任务标签的选中背景连续移动，内容保持不透明，仅短距离归位。
- 复制成功、移动菜单、主题图标、历史展开提供短时局部反馈。
- 采用 CSS 与 Web Animations API，无第三方依赖。实际 UI 状态与焦点仍由 app.js 管理。

## 浏览器检查

- 波前两次采样的 transform 与信号偏移均发生变化，确认不是静态装饰。
- 点击暂停后，两次采样的变换与偏移保持一致；刷新后仍为暂停。
- 滚动离开首屏后 data-wave-active 为 false，波前 animation-play-state 为 paused。
- 两个标签组连续点击后，选中背景与目标按钮的 x、y、宽、高差均为 0。
- 安装命令复制反馈及方向键切换通过；移动导航展开和选中后关闭通过。
- 连续展开 / 收起历史后，内容可见，临时 overflow 样式已清理。
- 检查 1440、768、375、320 CSS px 宽度，无横向溢出。
- 动效没有改变正文透明度。可见 HTML 文本最小字号 ≥12px；浅色最低对比度约 4.55:1，深色约 6.35:1；点击目标未低于 44 × 44px。
- 浏览器未观察到页面脚本错误。

`browser-checks.json` 为部分布局与可读性采样。SVG 动画为装饰性示意，不代表仿真结果；截图只能记录某一动画帧。

## 减少动效与后台行为

- CSS 为 prefers-reduced-motion 配置静态规则；JavaScript 同步响应系统偏好，取消已在进行的动画。
- `node design-review/motion/check-preferences.mjs` 对实际 motion.js 执行隔离环境测试：初始减少动效不创建 JavaScript 动画；运行中切换偏好或进入后台会取消已有动画；暂停与恢复、偏好保存均通过。
- 系统级减少动效没有在用户设备上被更改。上述隔离测试不等同于更改操作系统设置的浏览器仿真；普通浏览器中另验证了手动暂停和视口外暂停。

## 其他检查与限制

- 构建、JavaScript 语法、引用和标签可访问名称检查通过；新 motion.css / motion.js HTTP 请求均返回 200。
- skill 的 Python Playwright 体检和外观记账因缺少依赖跳过，未报告其通过；已执行 learn harvest，没有将单次任务指令泛化为长期审美偏好。
- 静态页面内容默认可见；不依赖动效决定 hidden、aria-selected 或焦点状态。

## 提交与发布

本地提交：`2ae57fd`（Add accessible optical and interface motion）。本轮推送因 GitHub SSH 22 端口连接超时失败，未确认线上部署。当前本地包含上一轮可读性提交和本轮动效提交，共两个待推送提交；网络恢复后执行 `git push origin main` 可一并发布。

本地复现：在仓库根目录运行 `node docs/scripts/build.mjs`，然后运行 `node docs/scripts/serve.mjs`，打开 http://localhost:4173/LumericalFDTD-skill/ 。本轮测试用的临时 4273 端口服务已停止，保留的已加载预览页可继续播放，刷新需重新启动服务。
