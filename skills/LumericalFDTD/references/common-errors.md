# 常见错误速查

> 此文件在脚本运行报错时读取，按错误信息快速定位原因和解决方案。错误按类型分类，严重度标注阻塞/警告。

## 目录

- [API 初始化/生命周期](#api-初始化生命周期)
- [API 函数名错误](#api-函数名错误)
- [API 调用模式](#api-调用模式)
- [属性/参数错误](#属性参数错误)
- [材料系统](#材料系统)
- [仿真行为异常](#仿真行为异常)
- [监视器属性兼容性](#监视器属性兼容性)
- [数据提取与后处理](#数据提取与后处理)
- [Python 语法 / 编码](#python-语法--编码)
- [跨平台 / Shell](#跨平台--shell)

---

## API 初始化/生命周期

| 严重度 | 错误信息 | 原因 | 解决 |
|--------|---------|------|------|
| 🔴 阻塞 | `"in setnamed, no items matching the name 'FDTD' can be found."` | `lumapi.FDTD()` 后调用了 `fdtd.newproject()`，重置项目导致 `'FDTD'` 求解器对象被销毁 | **删除 `fdtd.newproject()` 调用**。`lumapi.FDTD()` 构造函数已创建新项目，无需手动 newproject |
| 🔴 阻塞 | `"in set, no items are currently selected"` 或对 `'FDTD'` 的 set 报 not found | 2025 R2 的 `lumapi.FDTD()` 构造函数在某些条件下不会自动创建 `'FDTD'` 求解器区域。`select('FDTD')` 表面上成功但实际未初始化 | 在构造函数后**立即显式调用 `fdtd.addfdtd()`**，再进行任何 set 操作。正确初始化序列见下方 |

### 2025 R2 正确初始化序列

```python
# ✅ 正确：2025 R2 标准初始化
fdtd = lumapi.FDTD(hide=True)
fdtd.addfdtd()                              # ← 必须显式调用！
fdtd.set("x", 0)                            # 然后才能 set FDTD 属性
fdtd.set("x span", x_span)
# ... 后续构建 ...

# ❌ 错误：缺少 addfdtd()
fdtd = lumapi.FDTD(hide=True)
fdtd.set("x", 0)                            # ← 报错：当前选中是 'model'，无此属性
```

---

## API 函数名错误

| 严重度 | 错误信息 | 原因 | 解决 |
|--------|---------|------|------|
| 🔴 阻塞 | `'FDTD' object has no attribute 'addpolygon'` | 函数名记错 | 用 `addpoly`（无 `gon`） |
| 🔴 阻塞 | `'FDTD' object has no attribute 'addcone'` | API 无此函数 | 用多层 `addcircle` 堆叠替代 |

## API 调用模式

| 严重度 | 错误信息 | 原因 | 解决 |
|--------|---------|------|------|
| 🔴 阻塞 | `"in set, the requested property 'dimension' was not found"` | `fdtd.set()` 对**当前选中对象**操作。`lumapi.FDTD()` 后当前选中是根节点 `'model'`，根节点无 `'dimension'` 属性 | 用 `fdtd.setnamed('FDTD', 'dimension', '2D')` 或先 `fdtd.select('FDTD')` 再 `fdtd.set(...)` |

### set() vs setnamed() vs select()+set()

```python
# set() — 对当前选中对象设置属性
fdtd.addfdtd()                      # ← 这会把 'FDTD' 设为当前选中
fdtd.set("x", 0)                    # ✅ 现在可以：FDTD 是当前选中
fdtd.set("dimension", "2D")         # ✅ 可以

fdtd.addrect()                      # ← 这会把新增 rect 设为当前选中
fdtd.set("x", 0)                    # ⚠️ 这是设置 rect 的 x，不是 FDTD！

# setnamed() — 按名称查找并设置（不需要选中该对象）
fdtd.setnamed("FDTD", "dimension", "2D")  # ✅ 始终有效，名称精确匹配

# select() + set() — 先切换选中再设置
fdtd.select("FDTD")                 # 切换到 FDTD 求解器
fdtd.set("dimension", "2D")         # ✅ 现在设置 FDTD 的属性
```

> **原则**：不确定当前选中什么对象时，用 `setnamed()` 最安全。`add*()` 调用会改变当前选中。

## 属性/参数错误

| 严重度 | 错误信息 | 原因 | 解决 |
|--------|---------|------|------|
| 🔴 阻塞 | `'type' is inactive` | 用了 `addmaterial` + `set("type",...)` | 直接用内置材料名称字符串 |
| 🔴 阻塞 | `'mesh order' is inactive` | 多边形不支持此属性 | 删除该 set 语句 |
| 🟡 警告 | PEC 材料无效 | 简写 `"PEC"` | 用全名 `"PEC (Perfect Electrical Conductor)"` |
| 🔴 阻塞 | `vertices` 设置后 I_max=0 | 用 `set("x", arr)` 而非 vertices | 构造 N×2 矩阵用 `set("vertices", ...)` |
| 🔴 阻塞 | `"Unsupported data type"` 设置 vertices | Python `list of tuples` 不是 Lumerical Matrix 类型 | 必须转换为 NumPy 数组：`np.array(vertices_list)`。`list of tuples` 和 `flat list` 均报错 |
| 🟡 警告 | raw string 尾反斜杠 SyntaxError | `r"C:\path\"` 中 `\"` 转义了引号 | 全部用双反斜杠：`"C:\\path\\"` |

### 多边形顶点类型对照

| 格式 | 结果 |
|------|------|
| `[(x1,y1), (x2,y2), ...]` (list of tuples) | ❌ `Unsupported data type` |
| `[x1, y1, x2, y2, ...]` (flat list) | ❌ `Expected type is: Matrix` |
| `np.array([[x1,y1], [x2,y2], ...])` 或 `np.column_stack([xv, yv])` | ✅ 通过 |

## 材料系统

| 严重度 | 错误信息 | 原因 | 解决 |
|--------|---------|------|------|
| 🔴 阻塞 | `"Failed to create material of type SiO2 (Glass) - Palik."` | `addmaterial()` 的参数是**材料基类型**（`'Dielectric'`、`'Metal'`、`'Semiconductor'` 等），不是材料数据库中的实例名称 | 内置材料直接引用名称即可：`fdtd.set('material', 'SiO2 (Glass) - Palik')`，无需 `addmaterial()` |
| 🔴 阻塞 | `"Failed to create material of type (n=1.47)."` | `'(n=1.47)'` 是 Lumerical **脚本语言** (.lsf) 的快捷语法，Python `lumapi` API 不支持 | 改用内置材料名，或通过正确两步创建自定义材料（见下方） |

### 材料系统核心概念

```python
# addmaterial('<BaseType>') — 添加新材料到项目
#   参数必须是一个标准基类型名称：
fdtd.addmaterial('Dielectric')      # ✅ 创建新的介质材料
fdtd.addmaterial('Metal')           # ✅ 创建新的金属材料
fdtd.addmaterial('Semiconductor')   # ✅ 创建新的半导体材料

# ❌ 错误：这些不是基类型
fdtd.addmaterial('SiO2 (Glass) - Palik')  # 这是内置材料实例名，不是基类型
fdtd.addmaterial('(n=1.47)')              # 这是 .lsf 语法，Python API 不支持

# set('material', '<Name>') — 引用材料（给结构赋材料）
#   参数可以是内置材料名或自定义材料名：
fdtd.set('material', 'SiO2 (Glass) - Palik')   # ✅ 引用内置材料
fdtd.set('material', 'Au (Gold) - CRC')        # ✅ 引用内置材料
fdtd.set('material', 'PEC (Perfect Electrical Conductor)')  # ✅ 引用内置材料

# 创建自定义折射率材料的正确方式：
fdtd.addmaterial('Dielectric')                      # 步骤 1：创建基类型
fdtd.set('name', 'my_custom_material')              # 步骤 2：命名
fdtd.set('index', 1.47)                             # 步骤 3：设置折射率
# 此后其他结构可用 fdtd.set('material', 'my_custom_material')
```

> **记忆口诀**：`addmaterial` 问"你是什么类型"（Dielectric/Metal），`set('material',...)` 问"你叫什么名字"（SiO2/Au/PEC/my_custom）。

## 仿真行为异常

| 严重度 | 错误信息 | 原因 | 解决 |
|--------|---------|------|------|
| 🔴 阻塞 | `Can not find result 'E'` | 监视器在仿真域外 | 确认 `z_min < monitor_z < z_max` |
| 🔴 阻塞 | `dimension="2D"` 后 I 全为零 | API 接受但仿真仍按 3D 运行，E 场数据全零 | 用 quasi-2D 方案：3D + `y_span=0.2um` + `Periodic` BC |
| 🔴 阻塞 | 2D/quasi-2D 自动关断过早 | 默认 ~0.04 ps 触发，光未到达监视器 | `fdtd.set("auto shutoff min", 3000e-15)` 必须 >= 3 ps |
| 🟡 警告 | 改仿真模式后旧数据导致跳过 | skip-if-exists 检测到旧 `.npz` 不重跑 | 清除旧 `data/*.npz` 和 `fsp/*.fsp` 后再跑 |

## 监视器属性兼容性

| 严重度 | 错误信息 | 原因 | 解决 |
|--------|---------|------|------|
| 🔴 阻塞 | `"the requested property 'far field filter' was not found"` (在 addpower 后) | `'far field filter'` 和 `'far field filter a'` 是 3D FDTD 监视器的属性，2D FDTD 的频域功率监视器没有这些属性 | 2D 仿真移除 `far field filter` / `far field filter a` / `far field points`，仅保留 `frequency points`。远场投影通过脚本后处理实现 |
| 🔴 阻塞 | `"the requested property 'record field in time' was not found"` (在 addprofile 后) | `'record field in time'` 是时域监视器（`addtime()`）的属性，频域剖面监视器（`addprofile()`）不支持 | 改用 `addprofile()` + `set('frequency points', N)` 做频域采样 |

### 2D vs 3D 监视器属性速查

| 属性 | 3D addpower | 2D addpower | addprofile | addtime |
|------|:-----------:|:-----------:|:----------:|:-------:|
| `far field filter` | ✅ | ❌ | ❌ | ❌ |
| `far field filter a` | ✅ | ❌ | ❌ | ❌ |
| `far field points` | ✅ | ❌ | ❌ | ❌ |
| `frequency points` | ✅ | ✅ | ✅ | ❌ |
| `record field in time` | ❌ | ❌ | ❌ | ✅ |
| `output Ez` | ❌ | ❌ | ✅ | ✅ |

## 数据提取与后处理

| 严重度 | 错误信息 | 原因 | 解决 |
|--------|---------|------|------|
| 🟡 警告 | Quasi-2D 数据有 y 维度 | 数据形状 `[nx, ny, 1, nfreq]`，ny > 1 | 沿 y 求和得 1D profile：`np.sum(I, axis=1)` |
| 🟡 警告 | 宽带波长顺序反直觉 | `wavelengths[0]` = 最长波，`[-1]` = 最短波 | 明确设 `wl_short_idx = nfreq-1`，`wl_long_idx = 0` |
| 🟡 警告 | view 操作污染原数组 | 切片原地归一化 | 用 `.copy()` 创建副本 |

## Python 语法 / 编码

| 严重度 | 错误信息 | 原因 | 解决 |
|--------|---------|------|------|
| 🔴 阻塞 | `SyntaxError: unterminated string` | raw string 以 `\` 结尾（`\"` 转义了引号） | 全部用双反斜杠：`"C:\\path\\"` |
| 🟡 警告 | `UnicodeEncodeError: 'gbk'` | print 含 `²` `→` `λ` `Δ` `µ` 等特殊字符 | Windows GBK 终端用纯 ASCII 替代：`lambda` `delta` `um` 等 |

## 跨平台 / Shell

| 严重度 | 错误信息 | 原因 | 解决 |
|--------|---------|------|------|
| 🔴 阻塞 | PowerShell 解析错误 | 路径含空格时引号处理不当 | 用 `& 'path' 'script'` 而非 `"path"` |
| 🔴 阻塞 | Bash 中 `& 'path'` 报语法错 | `&` 是 PowerShell 操作符，bash 不支持 | 直接 `'path/to/python.exe' 'script.py'` |
| 🟡 警告 | Python -c 一行脚本报 SyntaxError | 单双引号与反斜杠转义冲突 | 写临时 `.py` 文件再执行，不要用 `-c` 跑复杂脚本 |
