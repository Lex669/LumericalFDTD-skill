# FDTD 构建模块详细指南

> 此文件在需要构建仿真结构时读取。涵盖仿真区域、材料、几何体、光源、监视器、网格覆盖的详细用法。

## 目录

- [仿真区域 (FDTD Region)](#仿真区域-fdtd-region)
  - [标准 3D](#标准-3d)
  - [Quasi-2D](#quasi-2dxy-截面为无限仅-xz-平面有效)
- [材料设置](#材料设置)
  - [addmaterial() vs set('material', ...)](#addmaterial-vs-setmaterial-)
  - [创建自定义折射率材料](#创建自定义折射率材料的正确方式)
  - [常用内置材料](#常用内置材料-1)
- [几何结构](#几何结构)
  - [矩形块 (addrect)](#矩形块-addrect)
  - [圆形孔 (addcircle)](#圆形孔-addcircle)
  - [多边形孔 (addpoly)](#多边形孔-addpoly)
  - [锥形/渐变结构（addcone 替代方案）](#锥形渐变结构addcone-替代方案)
- [光源](#光源)
  - [平面波 (addplane)](#平面波-addplane)
  - [高斯光束 (addgaussian)](#高斯光束-addgaussian)
- [监视器](#监视器)
  - [功率监视器 (addpower)](#功率监视器-addpower)
  - [场分布监视器 (addprofile)](#场分布监视器-addprofile)
  - [2D 监视器属性限制](#2d-监视器属性限制)
- [结果提取](#结果提取)
- [网格覆盖 (Mesh Override)](#网格覆盖-mesh-override)
- [参数扫描模式](#参数扫描模式)
- [多监视器同时观察](#多监视器同时观察)

---

## 仿真区域 (FDTD Region)

> **🔴 2025 R2 关键**：`lumapi.FDTD()` 构造函数后**必须立即显式调用 `fdtd.addfdtd()`** 才能创建 FDTD 求解器区域。构造函数返回后当前选中对象是根节点 `'model'`，在 `addfdtd()` 之前任何 `fdtd.set(...)` 都会报错（`"no items are currently selected"` 或 `"property 'x' was not found"`）。
>
> **严禁调用 `fdtd.newproject()`**：它会重置整个项目，销毁构造函数已创建的所有对象，导致 `'FDTD'` 求解器丢失。

### 标准 3D

```python
# 2025 R2 正确初始化
fdtd = lumapi.FDTD(hide=True)
fdtd.addfdtd()                          # ← 必须显式调用！不可省略
fdtd.set("x", 0)
fdtd.set("y", 0)
fdtd.set("z", 0)
fdtd.set("x span", x_span)
fdtd.set("y span", y_span)
fdtd.set("z span", z_span)
fdtd.set("mesh accuracy", 2)        # 1-8，越高越精细
fdtd.set("pml layers", 8)           # PML 吸收边界层数
fdtd.set("simulation time", t_sim)  # 仿真时间（秒），默认自动
```

**尺寸估算**：区域 span 应包含所有结构 + PML 余量（每边至少 2-3 个网格）。

**加速仿真**：减小区大小、降低 mesh accuracy、缩短 simulation time。

### Quasi-2D（xy 截面为无限，仅 xz 平面有效）

> **严禁使用 `fdtd.set("dimension", "2D")`**：虽然 `get("dimension")` 会返回 `"2D"`，但仿真实际上仍按 3D 运行，导致所有监视器 E 场数据全为零。必须使用下面的 quasi-2D 方案。

**正确做法 — Quasi-2D**（3D 求解器 + 单网格 y 维度 + 周期性边界）：

```python
fdtd.addfdtd()
fdtd.set("x", 0)
fdtd.set("x span", x_span)
fdtd.set("y", 0)
fdtd.set("y span", 0.2e-6)          # 极薄 y 方向（1-2 个网格）
fdtd.set("z", 0)
fdtd.set("z span", z_span)
fdtd.set("y min bc", "Periodic")     # 周期性边界 → 等效无限大
fdtd.set("y max bc", "Periodic")
fdtd.set("mesh accuracy", 3)
fdtd.set("pml layers", 8)
fdtd.set("simulation time", 5000e-15)
fdtd.set("auto shutoff min", 3000e-15)  # 必须设！quasi-2D 自动关断过早
```

**关键点**：
- **`auto shutoff min` 必须 >= 3 ps**：quasi-2D 默认自动关断在 ~0.04 ps 触发（远早于光到达监视器），导致所有数据为零
- y_span 设为 0.2 um 保证 1-2 个网格（足够容纳 PML 和周期性边界）
- 光源和监视器的 y_span 设为对应 FDTD 区域 y_span 的 0.8-0.95 倍
- Mesh override 的 dy 设为 y_span（单网格）
- 几何结构（plate、etch circles）的 y_span 同样需要设置

**Quasi-2D 数据形状**：监视器 I 数组形状为 `[nx, ny, 1, nfreq]`，其中 `ny` 通常为 1-3。分析时沿 y 轴求和（`np.sum(I, axis=1)`）得到 1D x-profile。

---

## 材料设置

**核心原则**：内置材料直接引用名称字符串，不需要 `addmaterial()`。`addmaterial()` 仅用于创建全新的自定义材料。

### addmaterial() vs set('material', ...) — 两个不同的概念

```python
# addmaterial('<BaseType>') — 创建新材料到项目
#   参数是 Lumerical 基类型，不是材料实例名！
fdtd.addmaterial('Dielectric')      # ✅ 创建新的介质材料
fdtd.addmaterial('Metal')           # ✅ 创建新的金属材料
fdtd.addmaterial('Semiconductor')   # ✅ 创建新的半导体材料

# ❌ 常见错误：
fdtd.addmaterial('SiO2 (Glass) - Palik')  # 这是材料实例名，不是基类型！
fdtd.addmaterial('(n=1.47)')              # 这是 .lsf 脚本语法，Python API 不支持！

# set('material', '<Name>') — 给结构赋材料
#   参数是材料名称（内置材料实例名或自定义材料名）：
fdtd.set('material', 'SiO2 (Glass) - Palik')                    # ✅ 引用内置
fdtd.set('material', 'PEC (Perfect Electrical Conductor)')      # ✅ 引用内置
fdtd.set('material', 'etch')                                    # ✅ 挖空
```

### 创建自定义折射率材料的正确方式

```python
fdtd.addmaterial('Dielectric')          # 步骤 1：创建基类型 Dielectric
fdtd.set('name', 'my_custom')           # 步骤 2：命名
fdtd.set('index', 1.47)                 # 步骤 3：设置折射率
# 此后可 fdtd.set('material', 'my_custom')
```

### 常用内置材料

| 类别 | 材料名 |
|------|--------|
| 介质 | `"SiO2 (Glass) - Palik"`, `"Si (Silicon) - Palik"` |
| 金属 | `"Au (Gold) - CRC"`, `"Al (Aluminum) - CRC"`, `"Ag (Silver) - CRC"` |
| 理想导体 | `"PEC (Perfect Electrical Conductor)"`（不可简写为 `"PEC"`） |
| 挖空（孔洞） | `material="etch"` |

**获取材料折射率：**
```python
c = 2.99792458e8
f_range = c / lambda_range  # 频率数组
n_data = fdtd.getfdtdindex("Au (Gold) - CRC", f_range, min(f_range), max(f_range))
```

---

## 几何结构

### 矩形块 (addrect)

```python
fdtd.addrect()
fdtd.set("name", "substrate")
fdtd.set("x span", x_span)
fdtd.set("y span", y_span)
fdtd.set("z span", thickness)
fdtd.set("z", z_center)
fdtd.set("material", "SiO2 (Glass) - Palik")
```

### 圆形孔 (addcircle)

```python
fdtd.addcircle()
fdtd.set("radius", hole_diameter / 2)
fdtd.set("z span", thickness + 2e-6)  # 略大于衬底以完全穿透
fdtd.set("z", 0)
fdtd.set("material", "etch")
```

### 多边形孔 (addpoly)

> 函数名是 `addpoly`，不是 `addpolygon`。

用于圆度研究、多边形孔等非圆形截面。**必须用 N×2 NumPy 数组**，不能用 `set("x", array)` + `set("y", array)`，也不能用 Python `list of tuples`：

```python
n_sides = 6
angles = np.linspace(0, 2*np.pi, n_sides, endpoint=False)
xv = radius * np.cos(angles)
yv = radius * np.sin(angles)
vertices = np.column_stack([xv, yv])  # N×2 NumPy 数组 — ✅ 唯一可用格式

fdtd.addpoly()
fdtd.set("vertices", vertices)        # ✅ np.array → Lumerical Matrix
```

> **🔴 顶点类型陷阱**：`fdtd.set("vertices", ...)` 只接受 NumPy 数组。Python `list of tuples` `[(x1,y1), ...]` 报 `"Unsupported data type"`，`flat list` `[x1,y1,x2,y2,...]` 报 `"Expected type is: Matrix"`。
fdtd.set("z", 0)
fdtd.set("z span", thickness + 10e-6)
fdtd.set("material", "etch")
```

> **限制**：多边形**不支持** `mesh order` 属性（会报 inactive 错误）。

### 锥形/渐变结构（addcone 替代方案）

`addcone` 在 Python API 中不存在。用多层薄圆柱 (`addcircle`) 堆叠近似：

```python
layers = 15  # 层数越多越平滑
dz = total_thickness / layers
z_centers = np.linspace(-total_thickness/2 + dz/2, total_thickness/2 - dz/2, layers)

for i, zc in enumerate(z_centers):
    r = r_start + (zc + total_thickness/2) * (r_end - r_start) / total_thickness
    fdtd.addcircle()
    fdtd.set("z", zc)
    fdtd.set("radius", max(r, 0.1e-6))
    fdtd.set("z span", dz)
    fdtd.set("material", "etch")
```

---

## 光源

### 平面波 (addplane)

```python
fdtd.addplane()
fdtd.set("name", "source")
fdtd.set("injection axis", "z")
fdtd.set("direction", "forward")     # Forward 或 Backward
fdtd.set("x span", x_span)
fdtd.set("y span", y_span)
fdtd.set("z", z_source)
fdtd.set("wavelength start", wl_start)
fdtd.set("wavelength stop", wl_stop)
```

### 高斯光束 (addgaussian)

```python
fdtd.addgaussian()
fdtd.set("injection axis", "z")
fdtd.set("direction", "forward")
fdtd.set("x span", x_span)
fdtd.set("y span", y_span)
fdtd.set("z", z_source)
fdtd.set("waist radius w0", w0)
fdtd.set("distance from waist", 0)
fdtd.set("use scalar approximation", 1)
fdtd.setglobalsource("wavelength start", wl)
fdtd.setglobalsource("wavelength stop", wl)
```

---

## 监视器

### 功率监视器 (addpower)

```python
fdtd.addpower()
fdtd.set("name", "monitor_trans")
fdtd.set("monitor type", "2D Z-normal")
fdtd.set("x span", x_span)
fdtd.set("y span", y_span)
fdtd.set("z", z_monitor)
```

### 场分布监视器 (addprofile)

用于查看横截面光场分布：

```python
fdtd.addprofile()
fdtd.set("name", "field_xy")
fdtd.set("monitor type", "2D Z-normal")
fdtd.set("x span", x_span)
fdtd.set("y span", y_span)
fdtd.set("z", z_monitor)
```

> **关键约束**：监视器 z 位置必须在仿真域 z_span 范围内（`z_min < z_monitor < z_max`），否则会报 `Can not find result 'E'`。

### 2D 监视器属性限制

2D FDTD 的监视器比 3D 少一些属性。以下属性在 2D 模式下**不可用**：

| 不可用属性 | 适用监视器类型 | 替代方案 |
|-----------|--------------|---------|
| `far field filter` | 仅 3D addpower | 2D 远场需通过脚本后处理（FFT 投影） |
| `far field filter a` | 仅 3D addpower | 同上 |
| `far field points` | 仅 3D addpower | 改用 `frequency points` |
| `record field in time` | 仅 addtime（时域监视器） | addprofile 改用 `frequency points` + `output Ez` |

```python
# ✅ 正确的 2D 功率监视器（不含远场属性）
fdtd.addpower()
fdtd.set("name", "monitor_trans")
fdtd.set("monitor type", "2D Z-normal")
fdtd.set("x span", x_span)
fdtd.set("y span", y_span)
fdtd.set("z", z_monitor)
fdtd.set("frequency points", 200)       # 频域采样（而非 far field points）

# ✅ 正确的 2D 场分布监视器（不含时域记录属性）
fdtd.addprofile()
fdtd.set("name", "field_xy")
fdtd.set("monitor type", "2D Z-normal")
fdtd.set("x span", x_span)
fdtd.set("y span", y_span)
fdtd.set("z", z_monitor)
fdtd.set("frequency points", 100)       # 频域采样（而非 record field in time）
fdtd.set("output Ez", 1)                # 输出 Ez 分量
```

---

## 结果提取

```python
# 提取结果
E = fdtd.getresult("monitor_name", "E")
Ex = fdtd.getresult("monitor_name", "Ex")
T = fdtd.getresult("monitor_name", "T")   # 透射率

# getresult 返回 numpy 数组或 dict
# 大数据先存到本地变量，避免重复获取
```

**Quasi-2D 数据形状**：
- 2D Z-normal 监视器 I 数组：`[nx, ny, 1, nfreq]`
- `ny` 通常为 1-3，沿 y 求和得 1D profile：`prof_1d = np.sum(I, axis=1)`
- 总功率：`P = np.sum(I, axis=(0, 1)).ravel()` → 得到 `[nfreq]` 数组

**宽带波长顺序**：
- 频率为线性递增：`freqs = linspace(c/wl_stop, c/wl_start, nfreq)`
- 波长不线性：`wavelengths = c / freqs`，`wavelengths[0]` = 最长波长，`wavelengths[-1]` = 最短波长
- 标注索引时：`wl_short_idx = n_freq - 1`（~4um），`wl_long_idx = 0`（~14um）

**NumPy 坑点**：对 `getresult` 返回数组切片后原地操作（如 `/=`）会污染原始数据，务必用 `.copy()`：

```python
profile = I[:, idx].copy()  # 正确：独立副本
profile /= profile.max()
```

---

## 网格覆盖 (Mesh Override)

用于局部加密精细结构（如小孔、渐变区域）的网格。**慎用**：

### 3D

```python
fdtd.addmesh()
fdtd.set("name", "mesh_hole")
fdtd.set("x span", hole_diameter * 1.5)
fdtd.set("y span", hole_diameter * 1.5)
fdtd.set("z span", thickness * 1.2)
fdtd.set("dx", grid_size)
fdtd.set("dy", grid_size)
fdtd.set("dz", grid_size)
```

### Quasi-2D

```python
fdtd.addmesh()
fdtd.set("name", "mesh_hole")
fdtd.set("x span", hole_diameter * 1.5)
fdtd.set("y span", y_span)          # 覆盖整个 y 方向
fdtd.set("z span", thickness * 1.2)
fdtd.set("dx", 0.5e-6)              # 2D 模式下可承受更细网格
fdtd.set("dy", y_span)              # 单网格
fdtd.set("dz", 0.5e-6)
```

> **关键警告**：mesh override 的 dx/dy/dz 必须**小于或等于**自动网格间距，否则会反向降低精度。不确定时直接不设 mesh override，信赖自动网格。

---

## 参数扫描模式

```python
for wl in [80e-6, 100e-6, 120e-6]:
    with lumapi.FDTD(hide=True) as fdtd:
        # ... 构建仿真，使用 wl 作为波长 ...
        fdtd.save(f"C:\\path\\result_{wl*1e6:.0f}um.fsp")
        fdtd.run()
```

## 多监视器同时观察

```python
for z_pos in [5e-6, 30e-6, 60e-6]:
    fdtd.addpower()
    fdtd.set("name", f"monitor_z{z_pos*1e6:.0f}um")
    fdtd.set("z", z_pos)
    # ...
```
