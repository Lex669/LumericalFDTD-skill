---
name: LumericalFDTD-analysis
description: |
  分析 Ansys Lumerical FDTD 仿真结果 — 读取.npz数据、计算光学指标、生成发表级图表。当你需要分析FDTD结果、绘制场分布图、计算透射率/衍射效率时使用此skill。
  Analyze Ansys Lumerical FDTD simulation results — load .npz data, compute optical metrics, generate publication-quality figures. Use when analyzing FDTD results, plotting field distributions, computing transmission/diffraction efficiency.
---

# FDTD 数据分析器

## 职责范围

本 skill **仅负责**数据分析与可视化阶段：读取 `.npz` 数据、计算光学指标、绘制图表、验证验收条件。输出 `.png` 图表文件。

**不负责**：结构建模（→ `LumericalFDTD-modeling`）、仿真执行（→ `LumericalFDTD-simulation`）、端到端全流程（→ `LumericalFDTD`）。

## 前置条件

`.npz` 数据文件必须已存在于 `data/` 目录。若不存在，先运行仿真。

## 工作流

### 1. 确认数据可用

```bash
ls path/to/project/data/
# 确认 results.npz 等文件存在
```

### 2. 编写分析脚本

按模板生成 `*_analysis.py`（纯数据分析，不调 `lumapi.FDTD`）：

```python
import numpy as np
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt

# 加载数据
data = np.load(os.path.join(data_dir, "results.npz"), allow_pickle=True)
E = data["E"]
T = data["T"]
wavelengths = data["wavelengths"]
# ...

# 计算指标
transmission = np.abs(T)**2
# ...

# 绘图
fig, ax = plt.subplots(figsize=(8, 5))
ax.plot(wavelengths * 1e6, transmission)
ax.set_xlabel("Wavelength (μm)")
ax.set_ylabel("Transmission")
ax.set_title("Transmission Spectrum")
fig.savefig(os.path.join(pic_dir, "transmission.png"), dpi=150)
plt.close()
```

### 3. 运行分析脚本

```bash
& 'PYTHON_PATH' 'path/to/project_analysis.py'
```

分析脚本秒级完成，可反复执行迭代图表样式。

### 4. 验证结果

检查生成的 `.png` 图表是否满足验收条件：

| 验收维度 | 检查项 |
|---------|--------|
| **透射率** | 峰值/谷值在预期波长？数值合理（0-1）？ |
| **场分布** | 模式图样是否符合物理预期？ |
| **衍射图案** | Airy 环是否可见？中央亮斑尺寸是否符合 `r₁ = 1.22λL/D`？ |
| **图表质量** | 坐标轴标注、单位、图例是否齐全？分辨率是否足够？ |

## 常用分析类型

### 透射/反射谱

```python
T = fdtd.getresult("monitor", "T")
plt.plot(wavelengths * 1e6, np.abs(T)**2)
plt.xlabel("Wavelength (μm)")
plt.ylabel("Transmission")
```

### 近场/远场分布

```python
E = np.abs(Ex**2 + Ey**2 + Ez**2)  # |E|^2 intensity
I_1d = np.sum(I, axis=1)           # Quasi-2D: 沿 y 求和 -> 1D profile
plt.plot(x * 1e6, I_1d / I_1d.max())
```

### 衍射效率

```python
P_total = np.sum(I, axis=(0, 1, 2))
P_central = np.sum(I_central_region, axis=(0, 1, 2))
efficiency = P_central / P_total
```

### 宽带波长索引

```python
# 频率线性递增 → 波长递减
wl_short_idx = n_freq - 1   # 最短波长（高频端）
wl_long_idx = 0              # 最长波长（低频端）
```

## 输出

- `*_analysis.py` — 分析脚本（可反复迭代）
- `pic/*.png` — 结果图表（dpi ≥ 150）
- 可选：更新 `REPORT.md` — 结果摘要和图表说明

## 参考文档

| 参考文件 | 何时读取 |
|---------|---------|
| `../LumericalFDTD/references/building-blocks.md` | 结果提取语法、数据形状、宽带波长索引细节 |
| `../LumericalFDTD/references/diffraction.md` | 衍射效率计算、远场投影 |
