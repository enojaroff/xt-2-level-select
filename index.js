const { select, option, div, script, domReady, text_attr } = require("@saltcorn/markup/tags");
const Table = require("@saltcorn/data/models/table");

const { version } = require("./package.json");
const PLUGIN_NAME = "xt_2_level_select";
const publicBase = `/plugins/public/${PLUGIN_NAME}@${version}`;

// Accept only plain CSS lengths (e.g. "8px", "0.5rem", "1em", "0") to avoid CSS injection
const safeCssLength = (s, dflt) => {
  const v = `${s ?? ""}`.trim();
  if (v === "") return dflt;
  if (/^\d+$/.test(v)) return `${v}px`;
  if (/^\d*\.?\d+(px|rem|em|%|vw|vh)$/.test(v)) return v;
  return dflt;
};

const clampWidth = (w) => {
  const n = parseInt(w, 10);
  if (!Number.isFinite(n)) return 6;
  return Math.min(11, Math.max(1, n));
};

const xt_2_level_select = {
  type: "Key",
  isEdit: true,
  blockDisplay: true,
  description:
    "Two related dropdowns (the first determines values in the second), with optional search, layout, gap, placeholders and width.",

  configFields: async ({ table, name }) => {
    if (!table) return [];
    const field = table.getFields().find((f) => f.name === name);
    if (!field) return [];
    const relOpts = [""];
    if (field.is_fkey && field.reftable_name) {
      const relTable = Table.findOne(field.reftable_name);
      if (!relTable) return [];
      relTable.getFields().forEach((relField) => {
        if (relField.is_fkey) relOpts.push(relField.name);
      });
    }
    return [
      {
        name: "relation",
        label: "Top level field",
        sublabel: "Key field in the referenced table that defines level 1",
        input_type: "select",
        options: relOpts,
        required: true,
      },
      {
        name: "orientation",
        label: "Layout",
        type: "String",
        required: true,
        default: "horizontal",
        attributes: { options: ["horizontal", "vertical"] },
      },
      {
        name: "gap",
        label: "Spacing between selects",
        sublabel: "CSS length, e.g. 8px, 0.5rem. A bare number is read as px",
        type: "String",
        default: "0.5rem",
      },
      {
        name: "l1_width",
        label: "Level 1 width (columns out of 12)",
        type: "Integer",
        default: 6,
        attributes: { min: 1, max: 11 },
        showIf: { orientation: "horizontal" },
      },
      {
        name: "l1_search",
        label: "Level 1: searchable select",
        type: "Bool",
      },
      {
        name: "l1_placeholder",
        label: "Level 1 placeholder",
        type: "String",
      },
      {
        name: "l2_search",
        label: "Level 2: searchable select",
        type: "Bool",
      },
      {
        name: "l2_placeholder",
        label: "Level 2 placeholder",
        type: "String",
      },
      {
        name: "force_required",
        label: "Force required",
        sublabel:
          "User must select a value, even if the table field is not required",
        type: "Bool",
      },
    ];
  },

  // Called by Field.fill_fkey_options instead of the core logic, which only
  // handles the built-in "two_level_select" fieldview name.
  // Result: field.options = [{ id, label, options: [{ value, label }] }]
  fill_options: async (field, force_allow_none, where, extraCtx, optionsQuery, formFieldNames, user) => {
    const relation = field.attributes?.relation;
    field.options = [];
    if (!field.is_fkey || !relation) return;

    const refTable = Table.findOne(field.reftable_name);
    if (!refTable) return;
    const relField = refTable.getFields().find((f) => f.name === relation);
    if (!relField || !relField.is_fkey) return;

    const summary = field.attributes.summary_field || refTable.pk_name;
    const relSummary = relField.attributes?.summary_field || relField.refname || "id";
    const rows = await refTable.getJoinedRows({
      where: where && typeof where === "object" ? where : {},
      forUser: user,
      forPublic: !user || user.role_id === 100,
      joinFields: {
        _xt2ls_first_level: { ref: relation, target: relSummary },
      },
    });

    const groups = new Map();
    for (const row of rows) {
      const gid = row[relation];
      if (gid === null || gid === undefined) continue;
      if (!groups.has(gid))
        groups.set(gid, {
          id: gid,
          label: `${row._xt2ls_first_level ?? gid}`,
          options: [],
        });
      groups.get(gid).options.push({
        value: row[field.refname || refTable.pk_name],
        label: `${row[summary] ?? ""}`,
      });
    }
    const byLabel = (a, b) => a.label.localeCompare(b.label, undefined, { numeric: true });
    field.options = [...groups.values()].sort(byLabel);
    field.options.forEach((g) => g.options.sort(byLabel));
  },

  run: (nm, v, attrs, cls, reqd, field) => {
    const cfg = { ...(field.attributes || {}), ...(attrs || {}) };
    const groups = Array.isArray(field.options) ? field.options : [];
    const horizontal = (cfg.orientation || "horizontal") !== "vertical";
    const gap = safeCssLength(cfg.gap, "0.5rem");
    const width = clampWidth(cfg.l1_width);
    const required = !!(reqd || cfg.force_required) && !cfg.isFilter;
    const disabled = !!(cfg.disabled || cfg.disable);
    const wrapId = `xt2ls_${text_attr(nm)}`.replace(/[^\w-]/g, "_");

    const client = {
      groups,
      value: v ?? "",
      isFilter: !!cfg.isFilter,
      required,
      l1: { search: !!cfg.l1_search, placeholder: cfg.l1_placeholder || "" },
      l2: { search: !!cfg.l2_search, placeholder: cfg.l2_placeholder || "" },
    };

    const baseCls = `form-control form-select ${cls || ""} ${field.class || ""}`;
    const layoutStyle = horizontal
      ? `display:flex;flex-direction:row;align-items:flex-start;gap:${gap};`
      : `display:flex;flex-direction:column;gap:${gap};`;
    // In horizontal mode, level 1 takes N/12 of the space left once the gap is removed
    const l1Style = horizontal
      ? `flex:0 0 calc((100% - ${gap}) * ${width} / 12);max-width:calc((100% - ${gap}) * ${width} / 12);min-width:0;`
      : "width:100%;";
    const l2Style = horizontal ? "flex:1 1 0;min-width:0;" : "width:100%;";

    return (
      div(
        {
          id: wrapId,
          class: `xt2ls ${horizontal ? "xt2ls-horizontal" : "xt2ls-vertical"}`,
          style: layoutStyle,
          "data-xt2ls": encodeURIComponent(JSON.stringify(client)),
        },
        div(
          { class: "xt2ls-l1", style: l1Style },
          select(
            {
              class: baseCls,
              "data-fieldname": `_${field.name}_toplevel`,
              id: `xt2lsfirst_${text_attr(nm)}`,
              disabled,
              autocomplete: "off",
            },
            option({ value: "" }, text_attr(client.l1.placeholder))
          )
        ),
        div(
          { class: "xt2ls-l2", style: l2Style },
          select(
            {
              class: baseCls,
              "data-fieldname": field.form_name,
              name: text_attr(nm),
              id: `input${text_attr(nm)}`,
              required,
              disabled,
              onChange: attrs?.onChange,
              autocomplete: "off",
            },
            option({ value: "" }, text_attr(client.l2.placeholder))
          )
        )
      ) +
      script(
        domReady(`window.xt2lsInit && window.xt2lsInit(${JSON.stringify(wrapId)});`)
      )
    );
  },
};

module.exports = {
  sc_plugin_api_version: 1,
  plugin_name: PLUGIN_NAME,
  headers: [
    { script: `${publicBase}/tom-select.complete.min.js` },
    { css: `${publicBase}/tom-select.bootstrap5.min.css` },
    { script: `${publicBase}/xt2ls.js` },
  ],
  fieldviews: { xt_2_level_select },
};
