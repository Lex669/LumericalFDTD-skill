---
name: fdtd-full
description: FDTD全流程自动化 — 从零开始完成建模→仿真→分析→验收的端到端工作流
---

# FDTD 全流程自动化

使用 **LumericalFDTD** skill，严格按以下三阶段执行：

### 阶段 A：准备与建模
1. 理解需求 — 器件结构、材料、光源、监视器、验收条件
2. 环境探测 — 定位 Lumerical Python 解释器
3. 编写 `*_sim.py` — 结构构建、光源、监视器、数据保存

### 阶段 B：执行仿真（不可跳过）
4. 运行仿真脚本 — 调用 Lumerical Python 解释器
5. 检查输出 — 确认 `.fsp` 和 `.npz` 已生成
6. 如遇错误 — 查 `common-errors.md`，修复后重跑（最多 5 次）
7. 编写并运行 `*_analysis.py` — 读取 `.npz`，绘图保存 `.png`

### 阶段 C：验收
8. 验证结果 — 检查图表是否满足验收条件
9. 更新 REPORT.md — 记录参数、结果摘要、图表说明

### 完成定义
- [ ] `fsp/*.fsp` — 仿真项目文件
- [ ] `data/*.npz` — 仿真结果数据
- [ ] `pic/*.png` — 结果图表
- [ ] `*_sim.py` — 仿真脚本
- [ ] `*_analysis.py` — 分析脚本
