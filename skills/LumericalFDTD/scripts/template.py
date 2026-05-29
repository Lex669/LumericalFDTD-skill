# FDTD 仿真脚本模板
# 用法：修改参数定义区的变量，运行脚本
# 注意：API_PATH 需要替换为实际 Lumerical 安装路径（由环境探测步骤确定）

import sys
# API_PATH 示例（Windows）： C:\\Program Files\\ANSYS Inc\\v252\\api\\python\\
# API_PATH 示例（Linux）：   /opt/ansys_inc/v252/api/python/
sys.path.append("__API_PATH__")
import lumapi
import numpy as np
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt

# ==========================================
# 参数定义区
# ==========================================
wavelength = 100e-6          # 中心波长 (m)
wl_start = 80e-6             # 波长范围起始
wl_stop = 120e-6             # 波长范围终止

# 仿真区域
x_span = 200e-6
y_span = 200e-6
z_span = 100e-6

# 结构参数（示例：衬底+通孔）
substrate_thickness = 50e-6
hole_diameter = 30e-6

# 监视器位置
z_monitor = 20e-6

# 输出路径（根据 OS 使用对应格式）
# Windows: "C:\\path\\to\\output"
# Linux:   "/path/to/output"
output_dir = "__OUTPUT_DIR__"

# ==========================================
# 仿真构建
# ==========================================
with lumapi.FDTD(hide=True) as fdtd:
    # --- 仿真区域 ---
    fdtd.addfdtd()
    fdtd.set("x", 0)
    fdtd.set("y", 0)
    fdtd.set("z", 0)
    fdtd.set("x span", x_span)
    fdtd.set("y span", y_span)
    fdtd.set("z span", z_span)
    fdtd.set("mesh accuracy", 2)
    fdtd.set("pml layers", 8)

    # --- 衬底 ---
    fdtd.addrect()
    fdtd.set("name", "substrate")
    fdtd.set("x span", x_span)
    fdtd.set("y span", y_span)
    fdtd.set("z span", substrate_thickness)
    fdtd.set("z", -substrate_thickness / 2)
    fdtd.set("material", "SiO2 (Glass) - Palik")

    # --- 通孔 ---
    fdtd.addcircle()
    fdtd.set("name", "hole")
    fdtd.set("radius", hole_diameter / 2)
    fdtd.set("z span", substrate_thickness + 2e-6)
    fdtd.set("z", -substrate_thickness / 2)
    fdtd.set("material", "etch")

    # --- 光源 ---
    fdtd.addplane()
    fdtd.set("name", "source")
    fdtd.set("injection axis", "z")
    fdtd.set("direction", "forward")
    fdtd.set("x span", x_span * 0.8)
    fdtd.set("y span", y_span * 0.8)
    fdtd.set("z", -z_span / 2 + 1e-6)
    fdtd.set("wavelength start", wl_start)
    fdtd.set("wavelength stop", wl_stop)

    # --- 监视器 ---
    fdtd.addpower()
    fdtd.set("name", "monitor")
    fdtd.set("monitor type", "2D Z-normal")
    fdtd.set("x span", x_span)
    fdtd.set("y span", y_span)
    fdtd.set("z", z_monitor)

    # --- 保存并运行 ---
    fdtd.save(f"{output_dir}\\simulation.fsp")
    fdtd.run()

    # --- 提取结果 ---
    E = fdtd.getresult("monitor", "E")
    T = fdtd.getresult("monitor", "T")

# ==========================================
# 后处理（with 块外）
# ==========================================
# E 和 T 在此可用
print("Simulation completed.")
