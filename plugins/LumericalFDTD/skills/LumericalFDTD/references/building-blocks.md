# FDTD 构建模块详细指南

> 此文件在需要构建仿真结构时读取。涵盖仿真区域、材料、几何体、光源、监视器、网格覆盖的详细用法。

## 仿真区域 (FDTD Region)

### 标准 3D

```python
fdtd.addfdtd()
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

**核心原则**：不要使用 `addmaterial` 后跟 `set("type", ...)` —— `type` 属性不可用。直接用内置材料名称。

**常用内置材料**：

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

用于圆度研究、多边形孔等非圆形截面。**必须用 N×2 顶点矩阵**，不能用 `set("x", array)` + `set("y", array)`：

```python
n_sides = 6
angles = np.linspace(0, 2*np.pi, n_sides, endpoint=False)
xv = radius * np.cos(angles)
yv = radius * np.sin(angles)
vertices = np.column_stack([xv, yv])  # N×2 矩阵

fdtd.addpoly()
fdtd.set("vertices", vertices)
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
