---
name: fdtd-model
description: 构建FDTD几何模型 — 设置材料、几何结构、光源、监视器、网格覆盖，输出建模脚本
---

# FDTD 结构建模

使用 **LumericalFDTD-modeling** skill 完成以下工作：

1. 理解需求：确认器件结构（几何参数、材料）、光源（波长范围、偏振）、监视器要求
2. 编写建模脚本：生成包含结构构建、材料设置、光源、监视器、网格覆盖的 Python 代码
3. 输出 `*_model.py`（纯建模，不含 `fdtd.run()`）

> 如需仿真执行，请使用 `/fdtd-simulate`。如需端到端全流程，请使用 `/fdtd-full`。
