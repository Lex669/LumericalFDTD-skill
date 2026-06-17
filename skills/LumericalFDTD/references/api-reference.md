# Lumerical Python API 参考

> 此文件在需要了解会话管理、SimObject 操作、数据传递、lumopt 优化等高级 API 功能时读取。

## 目录

1. [会话管理](#会话管理)
   - [2025 R2 初始化序列](#2025-r2-初始化序列)
2. [SimObject 类](#simobject-类)
3. [SimObjectResults](#simobjectresults)
4. [脚本命令作为方法](#脚本命令作为方法)
   - [set() vs setnamed() vs select()+set()](#set-vs-setnamed-vs-selectset)
5. [传递数据](#传递数据)
6. [lumopt 逆设计优化](#lumopt-逆设计优化)
7. [lumslurm 作业调度](#lumslurm-作业调度)
8. [Interop Server 远程 API](#interop-server-远程-api)

---

## 会话管理

### 创建会话

```python
fdtd = lumapi.FDTD()   # FDTD
mode = lumapi.MODE()    # MODE
device = lumapi.DEVICE() # DEVICE
ic = lumapi.INTERCONNECT() # INTERCONNECT
```

### 构造函数参数

```python
fdtd = lumapi.FDTD(
    hide=False,         # True=隐藏GUI/禁用弹窗
    serverArgs={},      # 命令行参数（如 'use-solve': True, 'platform': 'offscreen'）
    remoteArgs={},      # 远程连接 {hostname, port}
)
```

### 2025 R2 初始化序列

> **🔴 关键**：`lumapi.FDTD()` 构造函数在某些条件下不会自动创建 `'FDTD'` 求解器区域。必须显式调用 `fdtd.addfdtd()`。

```python
# ✅ 正确的 2025 R2 初始化
fdtd = lumapi.FDTD(hide=True)
fdtd.addfdtd()                              # ← 必须显式调用！
# 现在可以安全设置 FDTD 属性
fdtd.set("x", 0)
fdtd.set("x span", 10e-6)
```

**严禁调用 `fdtd.newproject()`**：
- `lumapi.FDTD()` 已创建新项目
- `newproject()` 重置项目 → 销毁 `'FDTD'` 求解器 → 后续所有 `setnamed('FDTD', ...)` 报 `"no items matching the name 'FDTD' can be found"`
- 如需清空项目重新开始，关闭当前会话后创建新的 `lumapi.FDTD()`

### with 语句（上下文管理器）

```python
with lumapi.FDTD(hide=True) as fdtd:
    fdtd.addrect()
    fdtd.run()
# 离开作用域后自动关闭会话
```

### 低级工作区方法

- `eval(script_string)`: 执行 Lumerical 脚本字符串
- `getv(variable_name)`: 从 Lumerical 工作区获取变量到 Python
- `putv(varname, value)`: 将 Python 变量放入 Lumerical 工作区

---

## SimObject 类

SimObject 代表对象树中的仿真对象。

### 属性访问

属性名与 Lumerical 属性名相同，空格替换为下划线：

```python
rect_obj = fdtd.addrect(x=0, y=0, z=0, x_span=2e-6)
rect_obj.y_span = 2e-6              # 属性访问
rect_obj["z span"] = 0.5e-6         # 字典访问（保留原名）
print(rect_obj.x_span)
```

> **警告**：同一名称的两个对象会导致未定义行为。

### 方法

- `getParent()`: 获取当前对象的父对象
- `getChildren()`: 获取当前对象的所有子对象列表

---

## SimObjectResults

通过 `SimObject.results` 访问：

```python
monitor = fdtd.addpower()
E_field = monitor.results.E
```

- 属性名与结果名相同，空格替换为下划线
- 可通过 `obj["result name"]` 访问
- 结果数据每次访问时重新获取，大数据应先存到本地变量

---

## 脚本命令作为方法

几乎所有 Lumerical 脚本命令都可以作为方法调用：

```python
fdtd.addfdtd()
fdtd.set("x", 0)
fdtd.set("z span", 0.5e-6)
```

### 常用命令

| 命令 | 用途 |
|------|------|
| `addfdtd()` | 添加 FDTD 仿真区域 |
| `addrect()`, `addcircle()`, `addpoly()` | 添加几何形状 |
| `addplane()`, `addgaussian()`, `adddipole()` | 添加光源 |
| `addpower()`, `addprofile()`, `addfieldmonitor()` | 添加监视器 |
| `addmesh()` | 添加网格覆盖 |
| `set()`, `get()` | 设置/获取属性 |
| `run()` | 运行仿真 |
| `save()` | 保存文件 |
| `getresult()` | 获取仿真结果 |
| `getfdtdindex()` | 获取材料折射率-频率数据 |

### 添加对象时直接设置属性

```python
fdtd.addrect(x=0, y=0, z=0, x_span=2e-6)
```

### set() vs setnamed() vs select()+set()

这三个方法容易混淆，核心区别在于**当前选中对象**：

```python
# 初始化后当前选中是根节点 'model'
fdtd = lumapi.FDTD(hide=True)
fdtd.addfdtd()                          # ← 选中变为 'FDTD'

# set() — 对当前选中对象设置属性
fdtd.set("x", 0)                        # ✅ 设置 FDTD 的 x（FDTD 是当前选中）
fdtd.set("dimension", "2D")             # ✅ 设置 FDTD 的 dimension

fdtd.addrect()                          # ← 选中变为新增的 rect！
fdtd.set("x", 0)                        # ⚠️ 设置 rect 的 x，不是 FDTD！

# setnamed() — 按名称查找并设置（不改变当前选中）
fdtd.setnamed("FDTD", "dimension", "2D")  # ✅ 始终有效，名称必须精确匹配
fdtd.setnamed("source", "wavelength start", 80e-6)  # ✅ 设置光源

# select() + set() — 手动切换选中后设置
fdtd.select("FDTD")                     # 切换到 FDTD
fdtd.set("dimension", "2D")             # 现在设置 FDTD 的属性

fdtd.select("monitor_trans")            # 切换到监视器
fdtd.set("z", 50e-6)                    # 设置监视器的 z
```

> **原则**：不确定当前选中对象时用 `setnamed()` 最安全。每次 `add*()` 调用都会改变当前选中。

---

## 传递数据

### 类型转换

| Lumerical | Python |
|-----------|--------|
| String | str |
| Real | float |
| Complex | 1×1 numpy array |
| Matrix | numpy array |
| Cell array | list |
| Struct | dict |
| Dataset | dict |

### Python → Lumerical

- **Complex**: 必须封装为 1×1 numpy 数组，Python 用 `j` 表示虚部
- **numpy array**: 转换为矩阵，支持复数
- **list**: 转换为 cell 数组
- **dict**: 转换为结构体

### Lumerical → Python

返回类型按上表自动转换。结构体示例：

```python
fdtd.eval('function return_struct(){return {"name":"MyStruct","value": 1e-6};}')
struct_returned = fdtd.return_struct()
# struct_returned = {'name': 'MyStruct', 'value': 1e-06}
```

---

## lumopt 逆设计优化

基于伴随方法的逆设计优化框架。使用 FDTD 求解麦克斯韦方程组，scipy 进行优化。

### 核心概念

- **FOM (Figure of Merit)**: 优化目标 — `ModeMatch`（导模功率耦合）、`IntensityVolume`（表面/体积光强）
- **优化参数**: 形状或拓扑参数

```python
from lumopt.optimizers import Optimizer
from lumopt.figure_of_merit import ModeMatch
from lumopt.geometries import PolygonGeometry

fom = ModeMatch(wavelength=1550e-9, target_T_fwd=0.95)
optimizer = Optimizer(max_iter=500, method='L-BFGS-B')
```

---

## lumslurm 作业调度

自动化 Slurm 集群上的作业提交和后处理。用途：HPC 集群批量仿真、参数扫描、优化迭代。

---

## Interop Server 远程 API

允许在远程 Linux 机器上运行 Lumerical，通过 IP 和端口连接。

```bash
./interop-server --port 8989
```

```python
fdtd = lumapi.FDTD(remoteArgs={"hostname": "192.168.215.129", "port": 8989})
```

---

## 相关资源链接

- [Lumerical Python API Reference](https://optics.ansys.com/hc/en-us/articles/38660003331859)
- [Session Management - Python API](https://optics.ansys.com/hc/en-us/articles/360041873053)
- [Script Commands as Methods - Python API](https://optics.ansys.com/hc/en-us/articles/360041579954)
- [Passing Data - Python API](https://optics.ansys.com/hc/en-us/articles/360041401434)
- [Working with Simulation Objects - Python API](https://optics.ansys.com/hc/en-us/articles/39744946400659)
- [Getting Started with lumopt](https://optics.ansys.com/hc/en-us/articles/360050995394)
- [Interop Server - Remote API](https://optics.ansys.com/hc/en-us/articles/15499581457811)
