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

按模板生成 `*_analysis.py`（纯数据分析，不调 `lumapi.FDTD`）。

> **每次运行分析脚本必须新建独立的 run 子目录保存图表（`pic/<label>_run_<NN>/`），禁止直接写入 `pic/` 根目录**。下方模板内嵌的 `new_run_dir()` 辅助函数及调用**必须完整保留**，不得删除或改写；`label` 需按本次仿真内容填写（规则见「图表归档约定」）。

```python
import os
import glob
import numpy as np
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt

def new_run_dir(pic_dir, label):
    """本次运行的图表目录 pic/<label>_run_<NN>（NN 自动递增，从 01 起补零）"""
    n = 0
    for d in glob.glob(os.path.join(pic_dir, label + "_run_*")):
        suffix = os.path.basename(d)[len(label) + 5:]  # 去掉 "<label>_run_" 前缀
        if suffix.isdigit():
            n = max(n, int(suffix))
    run_dir = os.path.join(pic_dir, f"{label}_run_{n + 1:02d}")
    os.makedirs(run_dir, exist_ok=True)
    return run_dir

# label = 本次仿真内容的 1-3 个区分关键词（snake_case，如 glass_gaussian / si_planewave_1550nm）
pic_dir = os.path.join(project_dir, "pic")
run_dir = new_run_dir(pic_dir, "glass_gaussian")

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
fig.savefig(os.path.join(run_dir, "transmission.png"), dpi=150)
plt.close()
```

### 3. 运行分析脚本

```bash
& 'PYTHON_PATH' 'path/to/project_analysis.py'
```

分析脚本秒级完成，可反复执行迭代图表样式；**每次运行都会在 `pic/` 下新建一个递增序号的 run 子目录**，历史图表自动保留、不会被覆盖，最新一版在序号最大（`NN` 最大）的目录中。

### 4. 验证结果

进入**最新 run 子目录**（`NN` 最大者，如 `pic/glass_gaussian_run_02/`），检查其中的 `.png` 图表是否满足验收条件：

| 验收维度 | 检查项 |
|---------|--------|
| **透射率** | 峰值/谷值在预期波长？数值合理（0-1）？ |
| **场分布** | 模式图样是否符合物理预期？ |
| **衍射图案** | Airy 环是否可见？中央亮斑尺寸是否符合 `r₁ = 1.22λL/D`？ |
| **图表质量** | 坐标轴标注、单位、图例是否齐全？分辨率是否足够？ |

## 图表归档约定（必须遵守）

1. **每次运行一个目录**：运行分析脚本即新建 `pic/<label>_run_<NN>/` 子目录，所有图表保存其中。子目录内保留固定文件名（`transmission.png`、`field.png` 等）不再改动——由目录区分内容与版本。**禁止直接 `savefig` 到 `pic/` 根目录**。本文件「常用分析类型」中的代码片段仅为绘图逻辑，成文脚本必须补 `plt.savefig(os.path.join(run_dir, "xxx.png"), dpi=150)`。
2. **标签由内容生成**：若用户未指定标签，由模型根据本次仿真内容取 1–3 个最具区分度的关键词——材料（`glass`/`si`）、光源类型（`gaussian`/`planewave`）、短关键参数（`1550nm`），用下划线连接，如 `glass_gaussian`。**默认小写 ASCII snake_case**（仅字母/数字/下划线，无空格无标点），保证跨平台兼容；用户偏好中文标签（如 `玻璃_高斯`）亦可。同一内容的后续运行复用同一标签。
3. **序号自动递增**：`NN` 从 `01` 起两位补零；同标签第 N 次运行取 `pic/<label>_run_*` 中最大序号 + 1——由 `new_run_dir()` 自动扫描完成，禁止人工猜测序号。判断"最新运行"一律以最大 `NN` 为准（数值比较，勿用字符串排序）。

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
- `pic/<label>_run_<NN>/` — 每次运行一个子目录，内含固定名图表（`transmission.png`、`field.png` 等，dpi ≥ 150）
- 可选：更新 `REPORT.md` — 结果摘要和图表说明，注明本次图表的 run 目录（如 `pic/glass_gaussian_run_02/`）

## 参考文档

| 参考文件 | 何时读取 |
|---------|---------|
| `../LumericalFDTD/references/building-blocks.md` | 结果提取语法、数据形状、宽带波长索引细节 |
| `../LumericalFDTD/references/diffraction.md` | 衍射效率计算、远场投影 |
