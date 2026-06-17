---
name: LumericalFDTD
description: |
  端到端 Ansys Lumerical FDTD 仿真自动化 — 从零构建模型、运行仿真、自动debug、数据分析与可视化全流程。当你需要完整的光学仿真项目（建模→仿真→分析→验收）时使用此skill。
  End-to-end Ansys Lumerical FDTD simulation automation — full pipeline from modeling through simulation to analysis and verification. Use when you need a complete photonics simulation project.
  子技能（单独使用某个阶段）：建模用 LumericalFDTD-modeling / 仿真执行用 LumericalFDTD-simulation / 数据分析用 LumericalFDTD-analysis
---

# Lumerical FDTD 全流程仿真

## 核心工作流（必须严格按顺序执行，不可跳过）

每次处理完整 FDTD 任务时严格遵循以下三阶段流水线。**创建文件只是准备阶段，运行仿真才是核心工作。**

### 阶段 A：准备与建模

1. **理解需求** — 确认器件结构（几何参数、材料）、光源（波长范围、偏振）、监视器要求、验收条件
2. **环境探测**（本会话首次时）— 定位 Lumerical Python 解释器路径
3. **编写 `*_sim.py`** — 生成仿真脚本，包含结构构建、光源、监视器、`fdtd.run()`、数据保存

> 仅需建模不跑仿真 → 改用 `LumericalFDTD-modeling` skill

### 阶段 B：执行仿真（不可跳过，不可省略）

4. **运行仿真脚本** — 用 Bash 工具调用 Lumerical Python 解释器执行 `*_sim.py`
5. **检查输出** — 确认 `.fsp` 和 `.npz` 文件已生成，检查日志无致命错误
6. **如遇错误** — 读取 `references/common-errors.md`，修复脚本，回到步骤 4。**最多重试 5 次**，超过则向用户报告所有尝试过的修复及错误，请求人工介入
7. **编写并运行 `*_analysis.py`** — 读取 `.npz` 数据，计算指标，绘图保存 `.png`

> 仅需分析已有数据 → 改用 `LumericalFDTD-analysis` skill

### 阶段 C：验收

8. **验证结果** — 检查 `.png` 图表是否满足验收条件（透射率、模式分布、衍射环等），不满足则调整 `*_sim.py` 参数回到步骤 4
9. **更新 REPORT.md** — 记录仿真参数、结果摘要、图表说明

### 错误处理循环（含最大重试上限）

```
重试次数 = 0
最大重试 = 5

while 仿真未成功 and 重试次数 < 最大重试:
    运行 sim.py
    if 报错:
        读取 references/common-errors.md
        根据错误类型定位解决方案
        修复脚本
        重试次数 += 1
        log(f"第 {重试次数}/{最大重试} 次重试...")
    else:
        检查 .npz 存在 → 成功，跳出循环
        检查 .fsp 存在 → 成功，跳出循环

if 重试次数 >= 最大重试:
    向用户报告：
    - "自动修复已达 {最大重试} 次上限，需人工介入"
    - 列出每次尝试的错误信息和对应修复
    - 建议可能的排查方向
```

> **绝对禁止**：创建完 `_sim.py` 和 `_analysis.py` 后直接告诉用户"脚本已创建，请自行运行"。必须亲自执行。

> **绝对禁止**：无限循环重试。5 次上限后必须 escalate 给用户。

### 完成定义 (Definition of Done)

以下文件**必须全部存在**才算任务完成，缺一不可：

- [ ] `fsp/*.fsp` — 仿真项目文件
- [ ] `data/*.npz` — 仿真结果数据
- [ ] `pic/*.png` — 结果图表
- [ ] `*_sim.py` — 仿真脚本
- [ ] `*_analysis.py` — 分析脚本

> **关键原则**：只创建 `.py` 文件不算完成任务。必须用 Bash 工具执行脚本、等待仿真跑完、生成 `.npz` 和 `.png` 输出。每个错误都是修正 skill 知识的机会。

## 环境适配（首次对话必须执行）

### 1. 探测操作系统

通过 `sys.platform` 或环境变量判断：
- **Windows**: 路径含盘符，反斜杠分隔，Python 解释器为 `python.exe`
- **Linux**: 路径以 `/` 开头，正斜杠分隔，Python 解释器为 `python` 或 `python3`

### 2. 定位 Lumerical 安装路径

按以下优先级尝试，找到可用的 Python 解释器：

**Windows 常见路径：**
```
C:\Apps\ANSYS Inc\v252\Lumerical\python\python.exe
C:\Program Files\ANSYS Inc\v252\Lumerical\python\python.exe
C:\Program Files\Lumerical\v252\python\python.exe
```

**Linux 常见路径：**
```
/opt/ansys_inc/v252/Lumerical/python/python
/opt/lumerical/v252/python/python
/usr/local/lumerical/v252/python/python
```

> 版本号 `v252` 可能不同（v251、v241），用 glob 或 `ls` 探索实际目录名。

### 3. 确认方式

```powershell
Test-Path -LiteralPath 'C:\Apps\ANSYS Inc\v252\Lumerical\python\python.exe'
```
或 Linux：
```bash
test -f /opt/ansys_inc/v252/Lumerical/python/python && echo "found"
```

若所有默认路径都不存在，**向用户询问**实际安装路径和版本号。

### 4. 调用方式

**Windows PowerShell**（路径含空格时用 `&` 操作符）：
```powershell
& '{PYTHON_PATH}' 'script.py'
```

**Git Bash**（`&` 不支持，直接调用）：
```bash
'C:/path/to/python.exe' 'script.py'
```

## 脚本总体结构

```python
# 1. 导入
import sys; sys.path.append("C:\\Apps\\ANSYS Inc\\v252\\api\\python\\")
import lumapi; import numpy as np
import matplotlib; matplotlib.use('Agg'); import matplotlib.pyplot as plt

# 2. 参数定义（集中管理，便于调参）
wavelength = 100e-6
structure_params = {...}

# 3. 创建仿真会话
with lumapi.FDTD(hide=True) as fdtd:
    # 3a. 仿真区域 — 2025 R2 必须显式调用 addfdtd()！
    fdtd.addfdtd()
    fdtd.set("x", 0)
    fdtd.set("x span", x_span)
    # ... 其余 FDTD 属性 ...

    # 3b. 材料 / 衬底 — 内置材料直接用 set("material", "全名")
    # 3c. 几何结构（从底到顶）
    # 3d. 网格覆盖（可选，精细结构才加）
    # 3e. 光源
    # 3f. 监视器 — 2D 模式下勿用 far field filter / record field in time
    # 3g. 保存 -> 运行 -> 提取结果
    fdtd.save(os.path.join(fsp_dir, "simulation.fsp"))
    fdtd.run()
    result = fdtd.getresult("monitor_name", "E")

# 4. 后处理与可视化（在 with 块外，此时会话已关闭）
```

> 现成模板见 `scripts/template.py`

## 用 Bash 执行脚本（阶段 B 核心操作）

### 超时设置

| 仿真规模 | timeout |
|---------|---------|
| 简单 2D | 300,000ms (5 分钟) |
| 中等 3D | 1,200,000ms (20 分钟) |
| 大型参数扫描 | 6,000,000ms (100 分钟) |

## 仿真与后处理分离（必须遵守）

仿真（耗时长）和数据分析/绘图（秒级完成）**必须写在两个独立 `.py` 文件中**，禁止合并：

| 文件 | 职责 | 执行时间 |
|------|------|---------|
| `*_sim.py` | 构建结构、运行 FDTD、保存 `.npz`/`.fsp` | 分钟~小时 |
| `*_analysis.py` | 读取 `.npz`、计算指标、绘图保存 `.png` | 秒级 |

### 命名规范
```
project_name_sim.py       # 仿真（含 skip-if-exists 逻辑）
project_name_analysis.py  # 分析（纯数据读取，不调 lumapi.FDTD）
```

### 原因
- 修改配色/图例/坐标轴时不应重跑整个仿真
- `.npz` 数据是仿真和分析之间的唯一接口
- 分析脚本可在仿真运行后反复执行、迭代调参

## 2D 与 Quasi-2D 陷阱（高频错误！）

**绝对不要用 `fdtd.set("dimension", "2D")`：**
- API 接受该属性（`get("dimension")` 返回 `"2D"`），但底层求解器保持 3D 运行模式
- 监视器 `getresult("far", "Ex")` 等返回全零数组
- 数据仍含 y 维度（如 ny=74）

**正确方案 — Quasi-2D：**
- 使用 3D FDTD 求解器，设置 `y_span=0.2e-6`（1-2 个网格）
- 设置 `y min bc = "Periodic"`, `y max bc = "Periodic"`
- 所有结构、光源、监视器、网格覆盖均需设置对应的 `y span`
- **必须**设置 `auto shutoff min = 3000e-15`（>= 3 ps），否则自动关断在 ~0.04 ps 触发
- Quasi-2D 数据形状：`I` = `[nx, ny, 1, nfreq]`（ny=1-3），沿 y 求和得 1D profile

> 完整 quasi-2D 代码模板见 `references/building-blocks.md`

## 关键约束（必须遵守）

| 约束 | 说明 |
|------|------|
| **2025 R2 必须显式 `addfdtd()`** | `lumapi.FDTD()` 后立即调用 `fdtd.addfdtd()`，否则所有 set 报 "no items selected" |
| **严禁 `fdtd.newproject()`** | 重置项目销毁 `'FDTD'` 求解器，导致 "no items matching the name 'FDTD'" |
| `set()` vs `setnamed()` 区别 | `set()` 对当前选中对象操作，`setnamed('name', ...)` 按名称查找。`add*()` 会改变当前选中 |
| 不用 `addmaterial` + `set("type",...)` | `type` 属性不可用；`addmaterial()` 参数是基类型（`'Dielectric'`），不是材料实例名 |
| 材料全名不可简写 | `"PEC (Perfect Electrical Conductor)"` 不是 `"PEC"` |
| `addmaterial('(n=1.47)')` 不支持 | `.lsf` 语法在 Python API 无效，用内置材料或 `addmaterial('Dielectric')` + `set('index', 1.47)` |
| 多边形函数名是 `addpoly` | 不是 `addpolygon` |
| `addcone` 不存在 | 用多层 `addcircle` 堆叠替代 |
| 多边形不支持 `mesh order` | 省略该 set 语句 |
| 监视器必须在仿真域内 | `z_min < monitor_z < z_max`，否则 `Can not find result 'E'` |
| 多边形顶点用 N×2 **NumPy 数组** | `set("vertices", np.array(...))`，Python list/tuple 报 `Unsupported data type` |
| 切片结果用 `.copy()` | NumPy 视图原地操作会污染原始数据 |
| 2D 监视器无 `far field filter` | 2D addpower 不支持远场投影属性，仅用 `frequency points` |
| 2D 监视器无 `record field in time` | addprofile 不支持时域记录，改用 `frequency points` |
| raw string 不能以反斜杠结尾 | 用双反斜杠 `"C:\\path\\"` |
| **严禁 `fdtd.set("dimension", "2D")`** | API 接受但仿真仍按 3D 运行，监视器数据全为零 |
| **2D/quasi-2D 必须设 `auto shutoff min`** | 默认自动关断 ~0.04 ps，光未到达监视器 |
| **宽带波长 `wavelengths[0]` 是最长波** | 频率线性递增，波长递减 |
| **print 特殊字符 -> GBK 乱码** | Windows 终端 GBK 编码报错 |
| **Bash 不支持 `&` 操作符** | `&` 是 PowerShell 语法 |
| **改仿真模式后清除旧数据** | skip-if-exists 跳过所有重跑 |
| **不用 `-c` 跑复杂 Python** | 引号嵌套与反斜杠冲突 |

## 参考文档索引

根据当前任务需要读取对应的参考文件：

| 参考文件 | 何时读取 |
|---------|---------|
| `references/building-blocks.md` | 需要构建几何结构、设置光源/监视器/网格时 |
| `references/api-reference.md` | 需要了解会话管理、SimObject、数据传递、lumopt 等高级 API 时 |
| `references/common-errors.md` | 运行报错需要排查时 |
| `references/diffraction.md` | 涉及孔衍射、Airy 环、远场/近场分析时 |

## 子技能索引

全流程过大时可按阶段拆开使用：

| 子技能 | 用途 | 命令 |
|--------|------|------|
| `LumericalFDTD-modeling` | 仅构建几何模型，输出建模脚本 | `/fdtd-model` |
| `LumericalFDTD-simulation` | 仅执行仿真 + debug，输出 .fsp/.npz | `/fdtd-simulate` |
| `LumericalFDTD-analysis` | 仅分析数据 + 绘图，输出 .png | `/fdtd-analyze` |

## 文件管理规则（必须遵守）

每个仿真项目目录内严格按以下规则分类，不得将输出文件散落在根目录：

| 目录 | 存放内容 |
|------|---------|
| `fsp/` | `.fsp` 仿真项目文件 + `*_p0.log` 仿真日志 |
| `data/` | `.npz` 仿真结果数据 + `.json` 元数据 |
| `pic/` | `.png/.jpg` 图片和图表 |
| 根目录 | `.py` Python脚本 + `.md` 文档 |

### 规则细节
1. 创建新项目时，必须先在项目目录内建立 `fsp/`、`data/`、`pic/` 三个子目录
2. Python 脚本中 `fdtd.save()` 保存 `.fsp` 到 `fsp/` 目录，图表 `plt.savefig()` 保存到 `pic/` 目录，数据 `np.savez()` 保存到 `data/` 目录
3. 子实验目录（如 `TGV_Waist_vs_Lambda/`）内部也遵循同样的 `fsp/data/pic` 分类
4. 禁止将 `.fsp`、`.npz`、`.png` 文件散落在项目根目录
5. 每次完成仿真+分析后，更新项目根目录的 `REPORT.md`，追加新结果和图表说明

### 脚本示例路径

```python
project_dir = r"C:\Users\Lex\Documents\FDTD\MyProject"
# 确保目录存在
for sub in ["fsp", "data", "pic"]:
    os.makedirs(os.path.join(project_dir, sub), exist_ok=True)

# 文件保存
fdtd.save(os.path.join(project_dir, "fsp", "simulation.fsp"))
np.savez(os.path.join(project_dir, "data", "results.npz"), E=Ex, ...)
plt.savefig(os.path.join(project_dir, "pic", "field.png"), dpi=150)
```
