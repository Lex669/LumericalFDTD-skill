---
name: LumericalFDTD
description: 为 Ansys Lumerical FDTD 构建和调试 Python 自动化仿真脚本。当你需要创建光学仿真、光子器件设计、衍射分析、超表面、波导、光栅、TGV 结构、光场传播等 FDTD 相关任务时使用此 skill。支持 2025 R2 版本，使用内置 Python 解释器自动运行代码并迭代 debug 直到满足验收条件。
---

# Lumerical FDTD 仿真构建器

## 核心工作流（必须严格按顺序执行，不可跳过）

每次处理 FDTD 任务时严格遵循以下流水线。**创建文件只是准备阶段，运行仿真才是核心工作。**

### 阶段 A：准备

1. **理解需求** — 确认器件结构（几何参数、材料）、光源（波长范围、偏振）、监视器要求、验收条件
2. **环境探测**（本会话首次时）— 定位 Lumerical Python 解释器路径
3. **编写 `*_sim.py`** — 生成仿真脚本，包含结构构建、光源、监视器、`fdtd.run()`、数据保存

### 阶段 B：执行仿真（不可跳过，不可省略）

4. **运行仿真脚本** — 用 Bash 工具调用 Lumerical Python 解释器执行 `*_sim.py`
5. **检查输出** — 确认 `.fsp` 和 `.npz` 文件已生成，检查日志无致命错误
6. **如遇错误** — 读取 `references/common-errors.md`，修复脚本，回到步骤 4，直到仿真成功运行
7. **编写并运行 `*_analysis.py`** — 读取 `.npz` 数据，计算指标，绘图保存 `.png`

### 阶段 C：验收

8. **验证结果** — 检查 `.png` 图表是否满足验收条件（透射率、模式分布、衍射环等），不满足则调整 `*_sim.py` 参数回到步骤 4
9. **更新 REPORT.md** — 记录仿真参数、结果摘要、图表说明

### 完成定义 (Definition of Done)

以下文件**必须全部存在**才算任务完成，缺一不可：

- [ ] `fsp/*.fsp` — 仿真项目文件
- [ ] `data/*.npz` — 仿真结果数据
- [ ] `pic/*.png` — 结果图表
- [ ] `*_sim.py` — 仿真脚本
- [ ] `*_analysis.py` — 分析脚本

> **关键原则**：只创建 `.py` 文件不算完成任务。必须用 Bash 工具执行脚本、等待仿真跑完、生成 `.npz` 和 `.png` 输出。每个错误都是修正 skill 知识的机会。

## 环境适配（首次对话必须执行）

用户环境差异大（OS、安装路径、版本号各异），首次处理 FDTD 任务时必须先确认环境：

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

> 版本号 `v252` 可能不同（如 v251、v241），用通配或 `ls` 探索实际目录名。

### 3. 确认方式

用 `bash` 工具检测解释器是否存在：
```powershell
Test-Path -LiteralPath 'C:\Apps\ANSYS Inc\v252\Lumerical\python\python.exe'
```
或 Linux：
```bash
test -f /opt/ansys_inc/v252/Lumerical/python/python && echo "found"
```

若所有默认路径都不存在，**向用户询问**实际安装路径和版本号。

### 4. 构建项目内 Python 脚本

根据探测到的路径，将路径变量动态写入脚本：

```python
# {PYTHON_PATH} 和 {API_PATH} 由环境探测步骤确定
import sys
sys.path.append("{API_PATH}")
import lumapi
import numpy as np

# 无头模式避免 GUI 弹窗报错
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
```

### 5. 调用方式

**Windows PowerShell**（路径含空格时用 `&` 操作符包裹）：
```powershell
& '{PYTHON_PATH}' 'script.py'
```

**Linux / macOS**：
```bash
{PYTHON_PATH} script.py
```

> **注意**：raw string 不能以 `\` 结尾（如 `r"C:\path\"` 会报 SyntaxError），用 `"C:\\path\\"` 代替。

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
    # 3a. 仿真区域
    # 3b. 材料 / 衬底
    # 3c. 几何结构（从底到顶）
    # 3d. 网格覆盖（可选，精细结构才加）
    # 3e. 光源
    # 3f. 监视器
    # 3g. 保存 -> 运行 -> 提取结果
    fdtd.save("C:\\path\\to\\output.fsp")
    fdtd.run()
    result = fdtd.getresult("monitor_name", "E")

# 4. 后处理与可视化（在 with 块外，此时会话已关闭）
```

> 现成模板见 `scripts/template.py`

## 用 Bash 执行脚本（阶段 B 核心操作）

仿真脚本写完后，**必须立刻用 Bash 工具执行**，不能只创建文件就结束。

### 执行步骤

```
# 步骤 1：先运行仿真脚本（耗时，必须等待完成）
bash: & 'PYTHON_PATH' 'path/to/project_sim.py'

# 步骤 2：确认 .npz 文件已生成
bash: ls path/to/project/data/

# 步骤 3：运行分析脚本（秒级）
bash: & 'PYTHON_PATH' 'path/to/project_analysis.py'

# 步骤 4：确认 .png 图表已生成
bash: ls path/to/project/pic/
```

### 超时设置

仿真脚本可能运行数分钟到数小时，Bash 调用时设置足够长的 timeout：
- 简单 2D 仿真：300000ms (5 分钟)
- 中等 3D 仿真：1200000ms (20 分钟)
- 大型参数扫描：6000000ms (100 分钟)

### 错误处理循环

```
while 仿真未成功:
    运行 sim.py
    if 报错:
        读取 references/common-errors.md
        修复脚本
        重新运行
    else:
        检查 .npz 存在 → 继续
```

> **绝对禁止**：创建完 `_sim.py` 和 `_analysis.py` 后直接告诉用户"脚本已创建，请自行运行"。必须亲自执行。

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

### 示例

```python
# myproject_sim.py —— 只做仿真
with lumapi.FDTD(hide=True) as fdtd:
    ...
    fdtd.run()
    np.savez(os.path.join(data_dir, "results.npz"), I=I, x=x, y=y)

# myproject_analysis.py —— 只做分析
data = np.load(os.path.join(data_dir, "results.npz"))
plt.plot(data["x"], data["I"])
plt.savefig(os.path.join(pic_dir, "plot.png"))
```

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

见 `references/building-blocks.md` 完整 quasi-2D 模板。

## 关键约束（必须遵守）

| 约束 | 说明 |
|------|------|
| 不用 `addmaterial` + `set("type",...)` | `type` 属性不可用，直接用内置材料名称字符串 |
| 材料全名不可简写 | `"PEC (Perfect Electrical Conductor)"` 不是 `"PEC"` |
| 多边形函数名是 `addpoly` | 不是 `addpolygon` |
| `addcone` 不存在 | 用多层 `addcircle` 堆叠替代 |
| 多边形不支持 `mesh order` | 省略该 set 语句 |
| 监视器必须在仿真域内 | `z_min < monitor_z < z_max`，否则 `Can not find result 'E'` |
| 多边形顶点用 N×2 矩阵 | `set("vertices", vertices)` 而非分别 set x/y |
| 切片结果用 `.copy()` | NumPy 视图原地操作会污染原始数据 |
| raw string 不能以反斜杠结尾 | 用双反斜杠 `"C:\\path\\"` |
| **严禁 `fdtd.set("dimension", "2D")`** | API 接受但仿真仍按 3D 运行，监视器数据全为零 | 用 quasi-2D：3D + `y_span=0.2um` + `y min/max bc = Periodic` |
| **2D/quasi-2D 必须设 `auto shutoff min`** | 默认自动关断 ~0.04 ps，光未到达监视器 | `fdtd.set("auto shutoff min", 3000e-15)` >= 3 ps |
| **宽带波长 `wavelengths[0]` 是最长波** | 频率线性递增，波长递减 | 设 `wl_short_idx = nfreq-1`, `wl_long_idx = 0` |
| **print 特殊字符 -> GBK 乱码** | Windows 终端 GBK 编码报错 | 用纯 ASCII：`lambda` `delta` `um` 替代 superscript/arrow |
| **Bash 不支持 `&` 操作符** | `&` 是 PowerShell 语法 | 直接 `'path/to/python.exe' 'script.py'` |
| **改仿真模式后清除旧数据** | skip-if-exists 跳过所有重跑 | `rm data/*.npz fsp/*.fsp` 后再启动 |
| **不用 `-c` 跑复杂 Python** | 引号嵌套与反斜杠冲突 | 写临时 `.py` 文件执行 |

## 参考文档索引

根据当前任务需要读取对应的参考文件：

| 参考文件 | 何时读取 |
|---------|---------|
| `references/building-blocks.md` | 需要构建几何结构、设置光源/监视器/网格时 |
| `references/api-reference.md` | 需要了解会话管理、SimObject、数据传递、lumopt 等高级 API 时 |
| `references/common-errors.md` | 运行报错需要排查时 |
| `references/diffraction.md` | 涉及孔衍射、Airy 环、远场/近场分析时 |

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
