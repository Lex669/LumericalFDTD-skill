---
name: fdtd-simulate
description: 执行FDTD仿真 — 运行仿真脚本、自动debug、提取结果数据，输出.fsp和.npz文件
---

# FDTD 仿真执行

使用 **LumericalFDTD-simulation** skill 完成以下工作：

1. 环境探测（本会话首次）— 定位 Lumerical Python 解释器
2. 运行仿真脚本 — 调用 Lumerical Python 解释器执行 `*_sim.py`
3. 错误处理循环（最多 5 次）— 按 `common-errors.md` 排查修复，自动重试
4. 确认输出 — 验证 `.fsp` 和 `.npz` 文件已正确生成

> 需要先有仿真脚本。如尚未建模，请先使用 `/fdtd-model`。如需完整流程，请使用 `/fdtd-full`。
