# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## This is a Claude Code Skill

This repo defines the **LumericalFDTD** skill — a Superpowers skill that automates Ansys Lumerical FDTD simulation workflows. When loaded by Claude Code, `SKILL.md` becomes the system prompt for handling photonics simulation tasks. The skill generates Python scripts, runs them against Lumerical's built-in Python interpreter, debugs errors autonomously, and delivers `.fsp` files and result charts.

**There is no build, lint, test suite, or traditional CI pipeline.** "Development" means editing the skill definition (`plugins/LumericalFDTD/skills/LumericalFDTD/SKILL.md`), reference files (`plugins/LumericalFDTD/skills/LumericalFDTD/references/`), and template scripts (`plugins/LumericalFDTD/skills/LumericalFDTD/scripts/`).

## Architecture

```
.claude-plugin/
  marketplace.json                    # Marketplace manifest
plugins/LumericalFDTD/
  .claude-plugin/
    plugin.json                       # Plugin manifest
  skills/LumericalFDTD/
    SKILL.md                          # Skill definition (frontmatter + instructions loaded at runtime)
    references/
      building-blocks.md              # Geometry, sources, monitors, mesh override recipes
      api-reference.md                # Session management, SimObject, data passing, lumopt
      common-errors.md                # Error→cause→fix lookup table for known Lumerical quirks
      diffraction.md                  # Aperture diffraction, Airy rings, near/far-field analysis
    scripts/
      template.py                     # Skeleton Python script with __API_PATH__ and __OUTPUT_DIR__ placeholders
    assets/                           # (currently empty — reserved for images/diagrams)
```

**How it works at runtime:**
1. The `Skill` tool loads `SKILL.md` as task instructions when the user's request matches the skill description
2. `SKILL.md` defines a rigid 5-step pipeline (understand → write script → run & debug → verify → save)
3. During script generation, the model reads the relevant `references/*.md` files based on the task type
4. `plugins/LumericalFDTD/skills/LumericalFDTD/scripts/template.py` provides the starting structure; `__API_PATH__` and `__OUTPUT_DIR__` are replaced dynamically after environment probing

## Key Design Decisions

- **Simulation/analysis separation is mandatory.** Heavy FDTD runs go in `*_sim.py`; data processing and plotting go in `*_analysis.py`. The intermediate interface is `.npz` files. This lets users tweak plots without re-running simulations.
- **First-use environment probing.** Each session starts by probing the OS and locating the Lumerical Python interpreter (`python.exe` on Windows, `python` on Linux). Common paths are tried first; if none work, the user is asked.
- **Fixed directory structure per project.** Every simulation project must have `fsp/`, `data/`, `pic/` subdirectories. No output files in the root.
- **No `addmaterial` + `set("type",...)`.** Use built-in material name strings directly (e.g., `"SiO2 (Glass) - Palik"`, `"PEC (Perfect Electrical Conductor)"`). Several API methods have non-obvious names or don't exist — see `references/common-errors.md` for the full list.

## Common Operations

- **Editing skill instructions:** Edit `plugins/LumericalFDTD/skills/LumericalFDTD/SKILL.md`. The frontmatter `name` and `description` fields control when the skill triggers.
- **Adding a new API quirk:** Add a row to the table in `plugins/LumericalFDTD/skills/LumericalFDTD/references/common-errors.md`.
- **Adding a new geometry pattern:** Add a section to `plugins/LumericalFDTD/skills/LumericalFDTD/references/building-blocks.md`.
- **Updating the template:** Edit `plugins/LumericalFDTD/skills/LumericalFDTD/scripts/template.py`. Keep `__API_PATH__` and `__OUTPUT_DIR__` as placeholders.
- **Validating the skill:** Install it in your Claude Code via `/plugin marketplace add Lex669/LumericalFDTD-skill` + `/plugin install LumericalFDTD@LumericalFDTD` and test with a real Lumerical task. There is no automated test suite — validation requires the Lumerical license and installation.
