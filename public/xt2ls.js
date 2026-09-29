/* xt_2_level_select - client side cascade between the two selects */
(function () {
  "use strict";

  var fillNative = function (sel, placeholder, required, items, value) {
    while (sel.firstChild) sel.removeChild(sel.firstChild);
    var empty = document.createElement("option");
    empty.value = "";
    empty.textContent = placeholder || "";
    if (required) {
      empty.disabled = true;
      empty.hidden = true;
    }
    sel.appendChild(empty);
    items.forEach(function (it) {
      var o = document.createElement("option");
      o.value = String(it.value);
      o.textContent = it.label;
      sel.appendChild(o);
    });
    var found = items.some(function (it) {
      return String(it.value) === String(value);
    });
    sel.value = found ? String(value) : "";
  };

  var makeTom = function (sel, cfg, required) {
    if (typeof window.TomSelect !== "function") return null;
    return new window.TomSelect(sel, {
      create: false,
      maxOptions: null,
      allowEmptyOption: false,
      placeholder: cfg.placeholder || undefined,
      plugins: required ? [] : ["clear_button"],
      render: {
        no_results: function () {
          return '<div class="no-results">-</div>';
        },
      },
    });
  };

  var fire = function (sel) {
    sel.dispatchEvent(new Event("change", { bubbles: true }));
  };

  window.xt2lsInit = function (wrapId) {
    var wrap = document.getElementById(wrapId);
    if (!wrap || wrap.getAttribute("data-xt2ls-ready")) return;
    wrap.setAttribute("data-xt2ls-ready", "1");

    var cfg = JSON.parse(decodeURIComponent(wrap.getAttribute("data-xt2ls")));
    var groups = cfg.groups || [];
    var sel1 = wrap.querySelector(".xt2ls-l1 select");
    var sel2 = wrap.querySelector(".xt2ls-l2 select");
    var disabled = sel2.disabled;

    var groupOf = function (gid) {
      for (var i = 0; i < groups.length; i++)
        if (String(groups[i].id) === String(gid)) return groups[i];
      return null;
    };
    var initialGroup = null;
    if (cfg.value !== "" && cfg.value !== null)
      groups.forEach(function (g) {
        (g.options || []).forEach(function (o) {
          if (String(o.value) === String(cfg.value)) initialGroup = g;
        });
      });

    var l1Items = groups.map(function (g) {
      return { value: g.id, label: g.label };
    });
    fillNative(sel1, cfg.l1.placeholder, cfg.required, l1Items, initialGroup ? initialGroup.id : "");
    fillNative(
      sel2,
      cfg.l2.placeholder,
      cfg.required,
      initialGroup ? initialGroup.options : [],
      cfg.value
    );

    var ts1 = cfg.l1.search ? makeTom(sel1, cfg.l1, cfg.required) : null;
    var ts2 = cfg.l2.search ? makeTom(sel2, cfg.l2, cfg.required) : null;

    var setL2Enabled = function (on) {
      var enable = on && !disabled;
      if (ts2) enable ? ts2.enable() : ts2.disable();
      else sel2.disabled = !enable;
    };
    setL2Enabled(!!initialGroup);

    var onL1Change = function () {
      var g = groupOf(sel1.value);
      var items = g ? g.options : [];
      var previous = sel2.value;
      if (ts2) {
        ts2.clear(true);
        ts2.clearOptions();
        items.forEach(function (it) {
          ts2.addOption({ value: String(it.value), text: it.label });
        });
        ts2.refreshOptions(false);
      } else {
        fillNative(sel2, cfg.l2.placeholder, cfg.required, items, "");
      }
      setL2Enabled(!!g);
      if (sel2.value !== previous) fire(sel2);
    };
    sel1.addEventListener("change", onL1Change);
  };
})();
