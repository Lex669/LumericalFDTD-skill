---
name: LumericalFDTD-modeling
description: |
  为 Ansys Lumerical FDTD 构建光学仿真模型（几何结构、材料、光源、监视器）。当你需要创建FDTD几何模型、设置材料属性、配置光源和监视器、定义网格覆盖时使用此skill。
  Build optical simulation models for Ansys Lumerical FDTD (geometry, materials, sources, monitors). Use when creating FDTD geometry, setting material properties, configuring sources and monitors, defining mesh overrides.
---

# FDTD 结构建模器

## 职责范围

本 skill **仅负责**结构建模阶段：构建几何、设置材料、配置光源和监视器、定义网格覆盖。输出纯建模脚本（不含 `fdtd.run()`），供后续仿真 skill 使用。

**不负责**：运行仿真（→ `LumericalFDTD-simulation`）、数据分析（→ `LumericalFDTD-analysis`）、端到端全流程（→ `LumericalFDTD`）。

## 工作流

### 1. 理解需求

确认以下信息后开始编写脚本。若用户未明确提供，主动询问：

| 类别 | 需确认的参数 |
|------|-------------|
| **器件结构** | 几何形状、尺寸、（x/y/z span / radius / thickness）、排列方式（单孔/阵列/周期） |
| **材料** | 衬底材料、金属层材料、蚀刻区域 |
| **光源** | 波长范围（start/stop）、偏振方向、入射方向、光束类型（平面波/高斯/偶极子） |
| **监视器** | 类型（功率/场分布/折射率）、位置、覆盖范围 |
| **仿真域** | x/y/z span、边界条件、网格精度 |

### 2. 构建脚本

按以下结构生成 `*_model.py`：

```python
# 1. 导入
import sys; sys.path.append("{API_PATH}")
import lumapi; import numpy as np
import matplotlib; matplotlib.use('Agg'); import matplotlib.pyplot as plt

# 2. 参数定义（集中管理）
wavelength = 100e-6
x_span = 200e-6; y_span = 200e-6; z_span = 100e-6
# ... 结构参数 ...

# 3. 仿真会话 — 仅构建，不运行
with lumapi.FDTD(hide=True) as fdtd:
    # 3a. 仿真区域
    fdtd.addfdtd()
    # ...

    # 3b. 材料 / 衬底
    # ...

    # 3c. 几何结构（从底到顶）
    # ...

    # 3d. 网格覆盖（可选，精细结构才加）
    # ...

    # 3e. 光源
    # ...

    # 3f. 监视器
    # ...

    # 3g. 保存模型（不运行）
    fdtd.save(os.path.join(fsp_dir, "model.fsp"))
```

### 3. 输出

- `*_model.py` — 建模脚本（纯结构构建）
- 可选：`.fsp` 模型文件（供手动打开检查）

## 参考文档

根据构建需要读取：

| 参考文件 | 何时读取 |
|---------|---------|
| `../LumericalFDTD/references/building-blocks.md` | 需要几何结构、光源、监视器、网格覆盖的详细 API 用法 |
| `../LumericalFDTD/references/diffraction.md` | 涉及孔衍射结构时 |

## 关键约束（与主 skill 一致）

| 约束 | 说明 |
|------|------|
| **2025 R2 必须显式 `addfdtd()`** | `lumapi.FDTD()` 后立即调用 `fdtd.addfdtd()`，否则所有 set 报错 |
| **严禁 `fdtd.newproject()`** | 重置项目会销毁 `'FDTD'` 求解器 |
| `set()` vs `setnamed()` 区别 | `set()` 对当前选中对象操作；`add*()` 会改变当前选中。不确定时用 `setnamed()` |
| 不用 `addmaterial` 创建已有材料 | `addmaterial()` 参数是基类型（`'Dielectric'`），不是材料实例名。内置材料直接用 `set('material', '全名')` |
| 材料全名不可简写 | `"PEC (Perfect Electrical Conductor)"` 不是 `"PEC"` |
| `addmaterial('(n=1.47)')` 不支持 | 这是 .lsf 语法，Python API 不接受。用内置材料或 `addmaterial('Dielectric')` + `set('index', 1.47)` |
| 多边形函数名是 `addpoly` | 不是 `addpolygon` |
| `addcone` 不存在 | 用多层 `addcircle` 堆叠替代 |
| 多边形不支持 `mesh order` | 省略该 set 语句 |
| 多边形顶点用 N×2 **NumPy 数组** | `set("vertices", np.array(...))`，Python `list of tuples` 报 `Unsupported data type` |
| **严禁 `fdtd.set("dimension", "2D")`** | 用 quasi-2D 方案：3D + `y_span=0.2um` + Periodic BC |
| 2D 监视器无 `far field filter` | 仅用 `frequency points` 做频域采样 |
| 2D 监视器无 `record field in time` | addprofile 改用 `frequency points` |
| raw string 不能以反斜杠结尾 | 用 `"C:\\path\\"` 双反斜杠 |

## 2D / Quasi-2D 建模

参见 `../LumericalFDTD/references/building-blocks.md` 完整 quasi-2D 模板。
