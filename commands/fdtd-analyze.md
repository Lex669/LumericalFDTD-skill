---
name: fdtd-analyze
description: FDTD数据分析 — 读取仿真结果.npz、计算光学指标、生成发表级图表，输出.png文件
---

# FDTD 数据分析

使用 **LumericalFDTD-analysis** skill 完成以下工作：

1. 读取 `.npz` 仿真数据
2. 计算光学指标（透射率、模式分布、衍射环、场分布等）
3. 生成发表级图表（`.png`），保存到 `pic/` 目录
4. 验证结果是否满足验收条件

> 分析脚本（`*_analysis.py`）修改后可反复执行，无需重跑仿真。如尚未跑仿真，请先使用 `/fdtd-simulate`。
