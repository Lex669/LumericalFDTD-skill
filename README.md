# LumericalFDTD

A [Claude Code](https://claude.ai/code) plugin that automates Ansys Lumerical FDTD simulation workflows and provides deep academic paper analysis. Describe your photonic device or drop in a PDF — the plugin generates Python scripts, runs simulations, debugs errors, and delivers result charts and structured paper summaries.

## What is a Claude Code Plugin?

This repository is a **plugin** — a packaged extension for Claude Code containing multiple skills. When installed, each skill's description is always in context; Claude loads the full `SKILL.md` when a user's request matches. This plugin contains two skills:

| Skill | Purpose |
|-------|---------|
| LumericalFDTD | FDTD simulation automation — build, run, debug, output `.fsp` / `.npz` / `.png` |
| paper-summarizer | Deep academic paper summarization in Chinese with figure-by-figure analysis |

## Installation

```bash
# Step 1: Add the marketplace
/plugin marketplace add Lex669/AutoSim

# Step 2: Install the plugin
/plugin install LumericalFDTD@AutoSim
```

Once installed, skills are auto-discovered on next launch. Run `/skills` in Claude Code to verify.

## Requirements

- [Ansys Lumerical FDTD](https://www.ansys.com/products/optics/fdtd) (tested with 2025 R2 / v252)
- Lumerical's built-in Python API (`lumapi`), included with the standard installation
- Windows or Linux (macOS not officially supported by Ansys for FDTD)

## How It Works

```
User describes device → Plugin probes environment → Generates Python scripts → Runs via Lumerical's Python → Debugs errors → Saves .fsp + charts
```

The FDTD skill separates **simulation** (heavy FDTD run, minutes to hours) from **analysis** (data processing and plotting, seconds). This lets you tweak colors, labels, and figure layout without re-running the simulation.

## Repository Structure

```
├── .claude-plugin/
│   └── plugin.json                 # Plugin manifest — registers skills
├── skills/
│   ├── LumericalFDTD/
│   │   ├── SKILL.md                # FDTD skill definition and runtime instructions
│   │   ├── scripts/
│   │   │   └── template.py         # Python script skeleton
│   │   └── references/
│   │       ├── building-blocks.md  # Geometry, sources, monitors, and mesh recipes
│   │       ├── api-reference.md    # Session management, SimObject, data passing, lumopt
│   │       ├── common-errors.md    # Error → cause → fix lookup for known Lumerical quirks
│   │       └── diffraction.md      # Aperture diffraction, Airy rings, near/far-field analysis
│   └── paper-summarizer/
│       ├── SKILL.md                # Paper summarization skill definition
│       └── references/
│           ├── output-template.md  # Chinese output report template
│           └── chart-analysis.md   # Figure/chart analysis methodology
├── CLAUDE.md                       # Development guidance for working in this repo
├── LICENSE.txt                     # MIT
└── README.md
```

## Supported Use Cases

**FDTD simulation:** Photonics device design, diffraction analysis, metasurfaces, waveguides, gratings, TGV (Through Glass Via) structures, optical field propagation.

**Paper analysis:** Deep structured summaries of academic papers (especially infrared, optics, thermal imaging, machine vision, physics, and engineering), with per-figure interpretation and cross-paper comparison.

## Example Prompts

Once the plugin is installed, describe your task in natural language:

- "Design a 30 μm diameter circular aperture in a 50 μm thick SiO2 substrate, illuminated by a 100 μm plane wave, and observe the transmitted diffraction pattern"
- "Simulate the reflection spectrum of a gold grating — period 10 μm, duty cycle 0.5, wavelength 1–2 μm"
- "Parameter sweep: circular aperture diameter from 20 μm to 60 μm, step 10 μm, compare transmittance"
- "Summarize this paper in Chinese, explaining each figure in detail"

## Project Directory Convention

Every simulation the skill creates follows this structure:

| Directory | Contents |
|-----------|----------|
| `fsp/` | `.fsp` project files and simulation logs |
| `data/` | `.npz` result data and `.json` metadata |
| `pic/` | `.png` / `.jpg` charts and figures |
| root | `.py` scripts and `REPORT.md` documentation |

## Known Lumerical API Quirks

The Lumerical Python API has several non-obvious behaviors documented in `skills/LumericalFDTD/references/common-errors.md`:

- Material names must be full strings: `"PEC (Perfect Electrical Conductor)"`, not `"PEC"`
- Polygon function is `addpoly`, not `addpolygon`
- `addcone` does not exist — stack `addcircle` layers instead
- Monitors must stay within the simulation domain or fail silently
- Raw strings cannot end with `\` on Windows

## Script Template

`skills/LumericalFDTD/scripts/template.py` provides the base structure all generated scripts follow:

```python
# 1. Imports (API path, lumapi, numpy, matplotlib)
# 2. Parameter definitions (wavelength, geometry, monitors)
# 3. Simulation session (with lumapi.FDTD block):
#    - Simulation region → Materials → Geometry (bottom to top)
#    - Source → Monitors → Save → Run → Extract results
# 4. Post-processing (outside the session block)

with lumapi.FDTD(hide=True) as fdtd:
    fdtd.addfdtd()
    # ... build structure ...
    fdtd.save("fsp/simulation.fsp")
    fdtd.run()
```

## References

| File | Purpose |
|------|---------|
| `skills/LumericalFDTD/references/building-blocks.md` | Building geometry, setting up sources, monitors, and mesh |
| `skills/LumericalFDTD/references/api-reference.md` | Session management, SimObject, data passing, lumopt |
| `skills/LumericalFDTD/references/common-errors.md` | Troubleshooting runtime errors |
| `skills/LumericalFDTD/references/diffraction.md` | Aperture diffraction, Airy rings, near-field / far-field analysis |

## Contributing

This plugin follows the [skill-creator](https://github.com/anthropics/claude-code/tree/main/skills/skill-creator) framework. To modify or extend it:

1. Edit `skills/*/SKILL.md` to change instructions or workflows
2. Add API quirks to `skills/LumericalFDTD/references/common-errors.md`
3. Add geometry patterns to `skills/LumericalFDTD/references/building-blocks.md`
4. Update `skills/LumericalFDTD/scripts/template.py` if the base script structure needs to change
5. Register new skills in `.claude-plugin/plugin.json`
6. Validate by running real Lumerical tasks with the modified plugin

The `CLAUDE.md` at the root provides additional guidance for Claude instances working in this repository.
