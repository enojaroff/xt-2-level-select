# xt-2-level-select

Enhanced version of Saltcorn's built-in `two_level_select` fieldview for **Key** fields.

The first select (level 1) filters the values of the second one (level 2). Level 1 is a foreign key of the referenced table, chosen with the *Top level field* option.

French documentation: [README-FR.md](README-FR.md)

## Options

| Option                         | Description                                                            |
| ------------------------------ | ---------------------------------------------------------------------- |
| Top level field                | Foreign key in the referenced table that defines level 1               |
| Layout                         | `horizontal` (side by side) or `vertical` (stacked)                    |
| Spacing between selects        | CSS length (`8px`, `0.5rem`…). A bare number is read as px             |
| Level 1 width                  | Horizontal only: width of level 1, from 1 to 11 columns out of 12      |
| Level 1 / 2: searchable select | Replaces the native select with a searchable one (Tom Select)          |
| Level 1 / 2 placeholder        | Text shown when nothing is selected                                    |
| Force required                 | Makes a selection mandatory even if the field itself is not required   |

## Installation

In Saltcorn: *Settings → Modules → Add another module*, source **github**, location `enojaroff/xt-2-level-select`.

For local development: `saltcorn install-plugin -d /path/to/xt-2-level-select`

## Notes

- Tom Select 2.6.2 is bundled in `public/` (Apache-2.0, see `public/tom-select.LICENSE`). No CDN required.
