# 衍射仿真要点

> 此文件在涉及孔衍射、Airy 环、远场/近场分析时读取。

## 目录

- [衬底材料选择](#衬底材料选择)
- [远场衍射条纹捕捉](#远场衍射条纹捕捉)
- [近场→远场投影（FFT 方法）](#近场远场投影fft-方法)
- [衍射效率计算](#衍射效率计算)
- [多距离监视器策略](#多距离监视器策略)
- [矢量衍射 vs 标量衍射](#矢量衍射-vs-标量衍射)

---

## 衬底材料选择

| 场景 | 衬底材料 | 说明 |
|------|---------|------|
| 纯孔衍射 | `"PEC (Perfect Electrical Conductor)"` | 光只从孔通过，得到纯净衍射图案 |
| 真实 TGV 场景 | `"SiO2 (Glass) - Palik"` | 光同时通过玻璃和孔 |
| 孔衍射+反射 | `"Au (Gold) - CRC"` | 高反射金属，类似 PEC 但考虑损耗 |

## 远场衍射条纹捕捉

要看到 Airy 环，监视器需足够大以包含第一极小值：

```
r₁ = 1.22 × λ × L / D
```

- λ = 波长, L = 传播距离, D = 孔径
- 若 r₁ 超出监视器 → 只看得到中央亮斑
- 建议在多个 z 位置放置监视器（近、中、远场）观察衍射演化

## 近场→远场投影（FFT 方法）

Lumerical 提供 `farfield3d` 脚本命令将近场监视器数据投影到远场：

```python
# 在仿真中设置近场监视器
fdtd.addpower()
fdtd.set("name", "near_field")
fdtd.set("monitor type", "2D Z-normal")
fdtd.set("x span", x_span)
fdtd.set("y span", y_span)
fdtd.set("z", z_near)

# 运行仿真后，使用投影得到远场
fdtd.run()
fdtd.farfield3d("near_field")   # 投影近场到远场半球
```

### 手动 FFT 远场投影（对照验证）

若需手动计算远场（如 Lumerical 版本不支持 `farfield3d`，或需自定义投影面）：

```python
import numpy as np
from numpy.fft import fft2, fftshift

# 1. 提取近场复振幅（在监视器平面上）
E_near = fdtd.getresult("near_field", "E")
Ex = E_near["Ex"]  # 形状: [nx, ny, 1, nfreq]

# 2. 对每个频率做 2D FFT
k = 2 * np.pi / wavelength
for i_freq in range(n_freq):
    field_2d = Ex[:, :, 0, i_freq]  # [nx, ny]
    E_far = fftshift(fft2(field_2d))
    I_far = np.abs(E_far)**2

# 3. 空间频率坐标映射
# Δk_x = 2π / (N_x * dx), Δk_y = 2π / (N_y * dy)
# θ_x = arcsin(k_x / k), θ_y = arcsin(k_y / k)
```

### key 注意事项
- 近场监视器需放置在高透射区域后方（避免倏逝波污染）
- 监视器 span 必须足够大以捕获全部近场信息（截断导致 Gibbs 振荡）
- FFT 得到的是角谱（角空间），需转换为真实角度或空间坐标

## 衍射效率计算

```python
# 总功率（所有角度）
P_total = np.sum(I_far)

# 中央主瓣功率（角度范围内）
theta_max = 1.22 * wavelength / D  # 第一极小值角度
# 筛选 θ < θ_max 的区域
mask = (theta_x**2 + theta_y**2) < theta_max**2
P_main_lobe = np.sum(I_far[mask])

diffraction_efficiency = P_main_lobe / P_total
```

## 多距离监视器策略

观察近场→中远场→远场的衍射演化：

```python
z_positions = [1e-6, 10e-6, 50e-6, 200e-6]  # 近到远

# Fresnel 数判据
# F = D² / (λ × L)
# F >> 1 → 近场（几何光学）
# F ≈ 1 → Fresnel 衍射
# F << 1 → Fraunhofer（远场）

D = hole_diameter
for z_pos in z_positions:
    F = D**2 / (wavelength * z_pos)
    print(f"z={z_pos*1e6:.0f}um: Fresnel number = {F:.2f}")

    fdtd.addpower()
    fdtd.set("name", f"monitor_z{z_pos*1e6:.0f}um")
    fdtd.set("z", z_pos)
    fdtd.set("monitor type", "2D Z-normal")
    fdtd.set("x span", x_span)
    fdtd.set("y span", y_span)
```

## 矢量衍射 vs 标量衍射

| 条件 | 适用方法 | 说明 |
|------|---------|------|
| 孔径 >> 波长（D > 5λ） | 标量衍射（Fresnel/Fraunhofer） | 偏振效应可忽略 |
| 孔径 ≈ 波长（D ~ λ） | 矢量衍射（FDTD 全波） | 必须用 FDTD 求解麦克斯韦方程 |
| 亚波长孔径（D < λ/2） | 矢量衍射 + 表面等离子激元 | 金属孔需考虑 SPP 效应 |

> **本插件使用 FDTD（全波矢量）**，对任何尺寸都准确。上述分类用于理解物理机制和验证结果时选择适当解析对照。
