# 常见错误速查

> 此文件在脚本运行报错时读取，按错误信息快速定位原因和解决方案。

| 错误信息 | 原因 | 解决 |
|---------|------|------|
| `'type' is inactive` | 用了 `addmaterial` + `set("type",...)` | 直接用内置材料名称字符串 |
| `'FDTD' object has no attribute 'addpolygon'` | 函数名记错 | 用 `addpoly`（无 `gon`） |
| `'FDTD' object has no attribute 'addcone'` | API 无此函数 | 用多层 `addcircle` 堆叠替代 |
| `'mesh order' is inactive` | 多边形不支持此属性 | 删除该 set 语句 |
| `Can not find result 'E'` | 监视器在仿真域外 | 确认 `z_min < monitor_z < z_max` |
| `vertices` 设置后 I_max=0 | 用 `set("x", arr)` 而非 vertices | 构造 N×2 矩阵用 `set("vertices", ...)` |
| PEC 材料无效 | 简写 `"PEC"` | 用全名 `"PEC (Perfect Electrical Conductor)"` |
| `SyntaxError: unterminated string` | raw string 以 `\` 结尾 | 用 `"C:\\path\\"` 双反斜杠 |
| view 操作污染原数组 | 切片原地归一化 | 用 `.copy()` 创建副本 |
| PowerShell 解析错误 | 路径含空格时用双引号包裹 | 用 `& 'path' 'script'` 而非 `"path"` |
| `dimension="2D"` 后 I 全为零 | API 接受但仿真仍按 3D 运行，E 场数据全零 | 用 quasi-2D 方案：3D + `y_span=0.2um` + `Periodic` BC |
| 2D/quasi-2D 自动关断过早 | 默认 ~0.04 ps 触发，光未到达监视器 | `fdtd.set("auto shutoff min", 3000e-15)` 必须 >= 3 ps |
| Quasi-2D 数据有 y 维度 | 数据形状 `[nx, ny, 1, nfreq]`，ny > 1 | 沿 y 求和得 1D profile：`np.sum(I, axis=1)` |
| 宽带波长顺序反直觉 | `wavelengths[0]` = 最长波，`[-1]` = 最短波 | 明确设 `wl_short_idx = nfreq-1`，`wl_long_idx = 0` |
| `UnicodeEncodeError: 'gbk'` | print 含 `²` `→` `λ` `Δ` `µ` 等特殊字符 | Windows GBK 终端用纯 ASCII 替代：`lambda` `delta` `um` 等 |
| Bash 中 `& 'path'` 报语法错 | `&` 是 PowerShell 操作符，bash 不支持 | 直接 `'path/to/python.exe' 'script.py'` |
| Python -c 一行脚本报 SyntaxError | 单双引号与反斜杠转义冲突 | 写临时 `.py` 文件再执行，不要用 `-c` 跑复杂脚本 |
| 改仿真模式后旧数据导致跳过 | skip-if-exists 检测到旧 `.npz` 不重跑 | 清除旧 `data/*.npz` 和 `fsp/*.fsp` 后再跑 |
| raw string 尾反斜杠 SyntaxError | `r"C:\path\"` 中 `\"` 转义了引号 | 全部用双反斜杠：`"C:\\path\\"` |
