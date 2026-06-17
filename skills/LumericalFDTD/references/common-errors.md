# 常见错误速查

> 此文件在脚本运行报错时读取，按错误信息快速定位原因和解决方案。错误按类型分类，严重度标注阻塞/警告。

## 目录

- [API 函数名错误](#api-函数名错误)
- [属性/参数错误](#属性参数错误)
- [仿真行为异常](#仿真行为异常)
- [数据提取与后处理](#数据提取与后处理)
- [Python 语法 / 编码](#python-语法--编码)
- [跨平台 / Shell](#跨平台--shell)

---

## API 函数名错误

| 严重度 | 错误信息 | 原因 | 解决 |
|--------|---------|------|------|
| 🔴 阻塞 | `'FDTD' object has no attribute 'addpolygon'` | 函数名记错 | 用 `addpoly`（无 `gon`） |
| 🔴 阻塞 | `'FDTD' object has no attribute 'addcone'` | API 无此函数 | 用多层 `addcircle` 堆叠替代 |

## 属性/参数错误

| 严重度 | 错误信息 | 原因 | 解决 |
|--------|---------|------|------|
| 🔴 阻塞 | `'type' is inactive` | 用了 `addmaterial` + `set("type",...)` | 直接用内置材料名称字符串 |
| 🔴 阻塞 | `'mesh order' is inactive` | 多边形不支持此属性 | 删除该 set 语句 |
| 🟡 警告 | PEC 材料无效 | 简写 `"PEC"` | 用全名 `"PEC (Perfect Electrical Conductor)"` |
| 🟡 警告 | `vertices` 设置后 I_max=0 | 用 `set("x", arr)` 而非 vertices | 构造 N×2 矩阵用 `set("vertices", ...)` |

## 仿真行为异常

| 严重度 | 错误信息 | 原因 | 解决 |
|--------|---------|------|------|
| 🔴 阻塞 | `Can not find result 'E'` | 监视器在仿真域外 | 确认 `z_min < monitor_z < z_max` |
| 🔴 阻塞 | `dimension="2D"` 后 I 全为零 | API 接受但仿真仍按 3D 运行，E 场数据全零 | 用 quasi-2D 方案：3D + `y_span=0.2um` + `Periodic` BC |
| 🔴 阻塞 | 2D/quasi-2D 自动关断过早 | 默认 ~0.04 ps 触发，光未到达监视器 | `fdtd.set("auto shutoff min", 3000e-15)` 必须 >= 3 ps |
| 🟡 警告 | 改仿真模式后旧数据导致跳过 | skip-if-exists 检测到旧 `.npz` 不重跑 | 清除旧 `data/*.npz` 和 `fsp/*.fsp` 后再跑 |

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
