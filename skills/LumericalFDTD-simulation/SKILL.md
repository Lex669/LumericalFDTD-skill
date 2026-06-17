---
name: LumericalFDTD-simulation
description: |
  执行 Ansys Lumerical FDTD 仿真脚本、自动迭代 debug、提取结果数据。当你需要运行FDTD仿真、调试仿真错误、提取.npz结果时使用此skill。
  Execute Ansys Lumerical FDTD simulation scripts with automated debug loops and result extraction. Use when running FDTD simulations, debugging errors, or extracting .npz results.
---

# FDTD 仿真执行器

## 职责范围

本 skill **仅负责**仿真执行阶段：环境探测、运行仿真、错误修复、结果提取。输出 `.fsp` 和 `.npz` 文件。

**不负责**：结构建模（→ `LumericalFDTD-modeling`）、数据分析与绘图（→ `LumericalFDTD-analysis`）、端到端全流程（→ `LumericalFDTD`）。

## 前置条件

仿真脚本 `*_sim.py`（或 `*_model.py` 加上 `fdtd.run()` 和 `fdtd.save()` 调用）必须已存在。若不存在，先使用建模 skill。

## 环境探测（本会话首次执行）

### 1. 探测操作系统

- **Windows**: `python.exe`，路径含盘符，反斜杠分隔
- **Linux**: `python` 或 `python3`，正斜杠分隔

### 2. 定位 Lumerical Python 解释器

按以下优先级尝试：

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

若所有默认路径都不存在，**向用户询问**实际安装路径和版本号。

### 3. 调用方式

**PowerShell**（路径含空格时用 `&` 操作符）：
```powershell
& '{PYTHON_PATH}' 'script.py'
```

**Bash / Git Bash**（`&` 不支持，直接调用）：
```bash
'path/to/python.exe' 'script.py'
```

## 仿真执行

### 执行步骤

```
# 步骤 1：运行仿真脚本（耗时最长）
bash: & 'PYTHON_PATH' 'path/to/project_sim.py'

# 步骤 2：确认输出
bash: ls path/to/project/data/
# 预期：results.npz 等文件

# 步骤 3：检查日志
bash: cat path/to/project/fsp/*_p0.log
# 确认无致命错误
```

### 超时设置

| 仿真规模 | timeout |
|---------|---------|
| 简单 2D | 300,000ms (5 分钟) |
| 中等 3D | 1,200,000ms (20 分钟) |
| 大型参数扫描 | 6,000,000ms (100 分钟) |

## 错误处理循环（最多 5 次重试）

```
重试次数 = 0
while 仿真未成功 and 重试次数 < 5:
    运行 sim.py
    if 报错:
        读取 ../LumericalFDTD/references/common-errors.md
        根据错误类型定位解决方案
        修复脚本
        重试次数 += 1
    else:
        检查 .npz 存在 → 继续
        检查 .fsp 存在 → 继续

if 重试次数 >= 5:
    向用户报告：自动修复已达上限，需人工介入
    列出所有尝试过的修复及对应错误信息
```

> **绝对禁止**：创建完 `.py` 文件后直接告诉用户"脚本已创建，请自行运行"。必须亲自执行。

## 结果提取

仿真成功后提取关键数据：

```python
# 在 with 块内提取
E = fdtd.getresult("monitor_name", "E")       # 电场
Ex = fdtd.getresult("monitor_name", "Ex")     # x 分量
T = fdtd.getresult("monitor_name", "T")       # 透射率

# 保存为 .npz
np.savez(os.path.join(data_dir, "results.npz"),
         E=E, Ex=Ex, T=T,
         x=x, y=y, z=z,
         wavelengths=wavelengths,
         metadata={...})
```

**关键注意事项**：
- `getresult` 返回大数据时先存到本地变量，避免重复获取
- Quasi-2D 数据形状：`I = [nx, ny, 1, nfreq]`，沿 y 求和得 1D profile
- 宽带波长：`wavelengths[0]` = 最长波，`[-1]` = 最短波
- 切片结果用 `.copy()` 避免污染原始数据

## 完成定义

- [ ] `.fsp` 文件已生成于 `fsp/` 目录
- [ ] `.npz` 数据文件已生成于 `data/` 目录
- [ ] 仿真日志无致命错误
- [ ] （可选）生成 `_sim.py` 完整脚本（含 run 和数据保存）

## 参考文档

| 参考文件 | 何时读取 |
|---------|---------|
| `../LumericalFDTD/references/common-errors.md` | 运行报错排查时 |
| `../LumericalFDTD/references/api-reference.md` | 需要会话管理、数据传递、远程 API 等高级功能时 |
