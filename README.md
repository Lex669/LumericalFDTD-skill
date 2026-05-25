# LumericalFDTD

A [Claude Code](https://claude.ai/code) skill that automates Ansys Lumerical FDTD simulation workflows. Describe your photonic device in natural language — the skill generates Python scripts, runs them against Lumerical's built-in interpreter, debugs errors autonomously, and delivers `.fsp` files and result charts.

## What is a Claude Code Skill?

This repository is a **skill** — a specialized instruction pack that extends Claude Code's capabilities. When installed, `SKILL.md` is loaded into Claude's context whenever a user's request matches photonics simulation, FDTD, or related optics topics. Claude then follows the skill's 5-step pipeline to build, run, debug, and verify simulations automatically.

## Installation

```bash
# Step 1: Add the marketplace
/plugin marketplace add Lex669/LumericalFDTD-skill

# Step 2: Install the plugin
/plugin install LumericalFDTD@LumericalFDTD
```

Once installed, the skill will be auto-discovered on next launch. You can also run `/skills` in Claude Code to verify it's available.

## Requirements

- [Ansys Lumerical FDTD](https://www.ansys.com/products/optics/fdtd) (tested with 2025 R2 / v252)
- Lumerical's built-in Python API (`lumapi`), included with the standard installation
- Windows or Linux (macOS not officially supported by Ansys for FDTD)

## How It Works

```
User describes device → Skill probes environment → Generates Python scripts → Runs via Lumerical's Python → Debugs errors → Saves .fsp + charts
```

The skill separates **simulation** (heavy FDTD run, minutes to hours) from **analysis** (data processing and plotting, seconds). This lets you tweak colors, labels, and figure layout without re-running the simulation.

## Repository Structure

```
├── SKILL.md                       # Skill definition and runtime instructions
├── LICENSE.txt                    # MIT license
├── scripts/
│   └── template.py                # Python script skeleton (placeholders replaced at runtime)
├── references/
│   ├── building-blocks.md         # Geometry, sources, monitors, and mesh recipes
│   ├── api-reference.md           # Session management, SimObject, data passing, lumopt
│   ├── common-errors.md           # Error → cause → fix lookup for known Lumerical quirks
│   └── diffraction.md             # Aperture diffraction, Airy rings, near/far-field analysis
└── assets/                        # Images and diagrams (reserved)
```

## Supported Use Cases

Photonics device design, diffraction analysis, metasurfaces, waveguides, gratings, TGV (Through Glass Via) structures, optical field propagation — any task requiring FDTD simulation with Ansys Lumerical.

## Example Prompts

Once the skill is installed, describe your simulation in natural language:

- "Design a 30 μm diameter circular aperture in a 50 μm thick SiO2 substrate, illuminated by a 100 μm plane wave, and observe the transmitted diffraction pattern"
- "Simulate the reflection spectrum of a gold grating — period 10 μm, duty cycle 0.5, wavelength 1–2 μm"
- "Parameter sweep: circular aperture diameter from 20 μm to 60 μm, step 10 μm, compare transmittance"

## Project Directory Convention

Every simulation the skill creates follows this structure:

| Directory | Contents |
|-----------|----------|
| `fsp/` | `.fsp` project files and simulation logs |
| `data/` | `.npz` result data and `.json` metadata |
| `pic/` | `.png` / `.jpg` charts and figures |
| root | `.py` scripts and `REPORT.md` documentation |

## Known Lumerical API Quirks

The Lumerical Python API has several non-obvious behaviors documented in `references/common-errors.md`:

- Material names must be full strings: `"PEC (Perfect Electrical Conductor)"`, not `"PEC"`
- Polygon function is `addpoly`, not `addpolygon`
- `addcone` does not exist — stack `addcircle` layers instead
- Monitors must stay within the simulation domain or fail silently
- Raw strings cannot end with `\` on Windows

## Script Template

`scripts/template.py` provides the base structure all generated scripts follow:

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
| `references/building-blocks.md` | Building geometry, setting up sources, monitors, and mesh |
| `references/api-reference.md` | Session management, SimObject, data passing, lumopt |
| `references/common-errors.md` | Troubleshooting runtime errors |
| `references/diffraction.md` | Aperture diffraction, Airy rings, near-field / far-field analysis |

## Contributing

This skill follows the [skill-creator](https://github.com/anthropics/claude-code/tree/main/skills/skill-creator) framework. To modify or extend it:

1. Edit `SKILL.md` to change instructions or workflows
2. Add API quirks to `references/common-errors.md`
3. Add geometry patterns to `references/building-blocks.md`
4. Update `scripts/template.py` if the base script structure needs to change
5. Validate by running real Lumerical tasks with the modified skill

The CLAUDE.md at the root provides additional guidance for Claude instances working in this repository.
