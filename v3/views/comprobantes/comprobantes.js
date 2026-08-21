// =============================================================================
// COMPROBANTES MODULE — Refactored
// =============================================================================
//
// Principios de diseño:
//   1. Event delegation: un solo listener por tipo de evento en el contenedor,
//      nunca se vuelve a enlazar aunque se reconstruya el DOM interno.
//   2. Funciones utilitarias puras al inicio, sin duplicación.
//   3. Separación clara: Utils → Config → CCosto → DOM Builders → Totals →
//      CRUD → Init → Ready.
//   4. Toda la lógica de negocio (centros de costo obligatorios, validación
//      de debe/haber, periodo contable, etc.) está preservada.
// =============================================================================

(function () {
  "use strict";

  // ===========================================================================
  // §1  UTILIDADES PURAS
  // ===========================================================================

  const Utils = {
    toText(v) {
      return v == null ? "" : String(v);
    },

    toNum(v) {
      if (typeof v === "number") return Number.isFinite(v) ? v : 0;
      let s = Utils.toText(v).trim().replace(/\s/g, "").replace(/[^\d.,-]/g, "");
      if (!s) return 0;
      if (s.includes(",")) s = s.replace(/\./g, "").replace(",", ".");
      else s = s.replace(/,/g, "");
      const n = parseFloat(s);
      return Number.isFinite(n) ? n : 0;
    },

    fmtNum(n, decimals = 0) {
      return (Number.isFinite(n) ? n : 0).toLocaleString("de-DE", {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
      });
    },

    safeDTK(t) {
      const s = Utils.toText(t).trim();
      return !s || s.toLowerCase() === "nan" ? "NONE" : s.toUpperCase();
    },

    isFn(f) {
      return typeof f === "function";
    },

    getDec() {
      return typeof currency !== "undefined" && Number.isFinite(currency?.decimals)
        ? currency.decimals
        : 0;
    },

    /** Devuelve el primer alias no-null del objeto. */
    getField(obj, key) {
      for (const alias of FIELD_MAP[key] || []) {
        if (obj?.[alias] != null) return obj[alias];
      }
      return null;
    },

    parseMoney(v) {
      const s = Utils.toText(v).trim();
      if (!s) return 0;
      const n = parseFloat(s.replace(/\./g, "").replace(",", "."));
      return Number.isFinite(n) ? n : 0;
    },
  };

  // ===========================================================================
  // §2  CONFIGURACIÓN ESTÁTICA
  // ===========================================================================

  // ---- Tipos de documento ---------------------------------------------------

  const DOC_TYPES = {
    DTC:        { name: f => `Dtc nro: ${f}`,            url: id => `${origin}/4DACTION/wbienvenidos#dtc/content.shtml?id=${id}`,             dialog: false },
    COMPROBANTE:{ name: f => `Dtc nro: ${f}`,            url: id => `${origin}/4DACTION/wbienvenidos#dtc/content.shtml?id=${id}`,             dialog: false },
    NC:         { name: f => `NC nro: ${f}`,             url: id => `${origin}/4DACTION/wbienvenidos#dtc/contentnc.shtml?id=${id}`,           dialog: false },
    NDE:        { name: f => `NC nro: ${f}`,             url: id => `${origin}/4DACTION/wbienvenidos#dtc/contentnd.shtml?id=${id}`,           dialog: false },
    DTV:        { name: f => `Dtv nro: ${f}`,            url: id => `${origin}/4DACTION/wbienvenidos#dtv/content.shtml?id=${id}`,             dialog: false },
    NDV:        { name: f => `DTV ND NRO: ${f}`,         url: id => `${origin}/4DACTION/wbienvenidos#dtv/nd/content.shtml?id=${id}`,          dialog: false },
    NCV:        { name: f => `Dtv NC nro: ${f}`,         url: id => `${origin}/4DACTION/wbienvenidos#dtv/nc/content.shtml?id=${id}`,          dialog: false },
    OP:         { name: f => `Orden de Pago nro: ${f}`,  url: id => `${origin}/4DACTION/wbienvenidos#pagos/content.shtml?id=${id}`,           dialog: false },
    OC:         { name: f => `Orden de compra nro: ${f}`,url: id => `${origin}/4DACTION/wbienvenidos#compras/content.shtml?id=${id}`,         dialog: false },
    FXR:        { name: f => `Rendición nro: ${f}`,      url: id => `${origin}/4DACTION/wbienvenidos#compras/content.shtml?id=${id}`,         dialog: false },
    FTG:        { name: f => `Factoring nro: ${f}`,      url: id => `${origin}/4DACTION/wbienvenidos#compras/content_factoring.shtml?id=${id}`,dialog: false },
    NV:         { name: f => `Negocio nro: ${f}`,        url: id => `${origin}/4DACTION/wbienvenidos#negocios/content.shtml?id=${id}`,        dialog: false },
    OCB:        { name: f => `Cobro nro: ${f}`,          url: id => `${origin}/4DACTION/wbienvenidos#pagos/dialog/pago.shtml?id=${id}`,       dialog: true },
    NONE:       { name: () => "Sin documento",           url: () => "",                                                                       dialog: false },
    UNDEFINED:  { name: () => "Sin documento",           url: () => "",                                                                       dialog: false },
  };

  // ---- Mapa de campos (aliases del backend) ---------------------------------

  const FIELD_MAP = {
    id:              ["id"],
    codigoCuenta:    ["codigoCuenta", "cuenta_actual"],
    cuentaContable:  ["cuentaContable"],
    debe:            ["debe", "debe_total"],
    haber:           ["haber", "haber_total"],
    idCont:          ["idCont"],
    auxiliar:        ["auxiliar"],
    auxiliar_rut:    ["auxiliar_rut"],
    auxiliar_desc:   ["auxiliar_desc"],
    idDoc:           ["idDoc"],
    typeDoc:         ["typeDoc"],
    documento:       ["documento"],
    folioDoc:        ["folioDoc"],
    glosa:           ["glosa"],
    param4:          ["param4"],
    c_costo:         ["c_costo", "ccosto", "centro_costo", "centroCosto", "costCenter"],
    c_costo_2:       ["c_costo_2", "centro_costo_2"],
    c_costo_desc:    ["c_costo_desc", "ccosto_desc", "centro_costo_desc", "centroCostoDesc"],
    c_costo_2_desc:  ["c_costo_2_desc", "centro_costo_2_desc"],
    isGrouped:       ["isGrouped"],
  };

  // ---- Columnas visibles de la tabla ----------------------------------------

  const COLUMNS = [
    { key: "contacto",      type: "contacto" },
    { key: "documento",     type: "documento" },
    ...(unaBase.parametros.new_dtv_accounting ? [
      { key: "c_costo",   type: "c_costo" },
      { key: "c_costo_2", type: "c_costo_2" },
    ] : []),
    { key: "codigoCuenta",  type: "input" },
    { key: "cuentaContable",type: "input_btn" },
    { key: "glosa",         type: "input" },
    { key: "debe",          type: "input_number" },
    { key: "haber",         type: "input_number" },
    { key: "actions_edit",  type: "action_edit" },
    { key: "actions_delete",type: "action_delete" },
  ];

  const DETAIL_THRESHOLD = 5000;

  // ===========================================================================
  // §3  CENTRO DE COSTO — módulo aislado
  // ===========================================================================

  const CCosto = {
    CC_FIELDS: ["c_costo", "c_costo_2"],

    _fieldToTipo(field) {
      return field === "c_costo_2" ? 2 : 1;
    },

    _normalizeRows(resp) {
      return (Array.isArray(resp?.rows) ? resp.rows : [])
        .map(r => ({
          value: Utils.toText(r?.value ?? r?.id ?? "").trim(),
          text:  Utils.toText(r?.text ?? r?.descripcion_centrocosto ?? r?.descripcion ?? "").trim(),
        }))
        .filter(r => r.value || r.text);
    },

    /** Crea/recrea TomSelect sobre un <select>, hace fetch al server. */
    initTomSelect(selectEl, currentValue, field, cb) {
      if (!selectEl) return;

      const tipo = CCosto._fieldToTipo(field);

      $.ajax({
        url: `${window.origin}/4DACTION/_V3_getCentroCostos`,
        type: "GET",
        dataType: "json",
        data: { tipo },
      })
        .done(resp => {
          try {
            const rows = CCosto._normalizeRows(resp);

            if (selectEl.tomselect) selectEl.tomselect.destroy();

            selectEl.innerHTML = '<option value="">-- Selecciona --</option>';
            rows.forEach(r => {
              const opt = document.createElement("option");
              opt.value = r.value;
              opt.textContent = r.text;
              selectEl.appendChild(opt);
            });

            new TomSelect(selectEl, {
              maxItems: 1,
              create: false,
              allowEmptyOption: true,
              closeAfterSelect: true,

              // Evita que la tabla o la celda recorten el dropdown.
              dropdownParent: "body",

              plugins: ["remove_button"],
              sortField: { field: "text", direction: "asc" },
            });

            const ts = selectEl.tomselect;

            if (ts) {
              ts.dropdown.classList.add("ccosto-dropdown");

              ts.enable();
              const safe = Utils.toText(currentValue).trim();

              if (safe) {
                // Buscar la opción por value directo.
                // Si no existe por value, buscar por text (el hidden a veces
                // guarda la descripción en vez del ID).
                let matchKey = null;

                if (ts.options[safe]) {
                  matchKey = safe;
                } else {
                  // Buscar entre todas las opciones una cuyo text coincida
                  for (const [key, opt] of Object.entries(ts.options)) {
                    if (Utils.toText(opt.text).trim() === safe) {
                      matchKey = key;
                      break;
                    }
                  }
                }

                if (matchKey) {
                  ts.setValue(matchKey, true);
                } else {
                  // Dato legacy sin coincidencia: agregar como opción temporal
                  ts.addOption({ value: safe, text: safe });
                  ts.setValue(safe, true);
                }
              } else {
                ts.clear(true);
              }

              ts.refreshOptions(false);
            }

            if (Utils.isFn(cb)) cb();
          } catch (e) {
            console.error(`initTomSelect error (${field}):`, e);
          }
        })
        .fail((xhr, status, err) => {
          console.error(`_V3_getCentroCostos (tipo ${tipo}) error:`, status, err);
        });
    },

    /** Muestra/oculta el wrapper de TomSelect o el <select> nativo. */
    setVisible(selectEl, visible) {
      if (!selectEl) return;
      const wrap = selectEl.tomselect?.wrapper || selectEl.closest(".ts-wrapper");
      if (wrap) wrap.style.display = visible ? "" : "none";
      if (!selectEl.tomselect) selectEl.style.display = visible ? "" : "none";
    },

    /**
     * Habilita o deshabilita los centros de costo en una fila.
     * - Al deshabilitar: limpia valores, oculta selectores.
     * - Al habilitar: muestra el editor, (re)crea TomSelect con fetch al server.
     */
    setEnabled(tr, enabled) {
      if (!tr) return;
      tr.dataset.ccostoEnabled = enabled ? "1" : "0";

      CCosto.CC_FIELDS.forEach(field => {
        const td = tr.querySelector(`td.${field}`);
        if (!td) return;

        const selectEl = td.querySelector(`select.${field}-select`);
        const hiddenId  = td.querySelector(`input[name="${field}"]`);
        const hiddenDsc = td.querySelector(`input[name="${field}_desc"]`);
        const label     = td.querySelector(".ccosto-label");
        const viewDiv   = td.querySelector(`.${field}-view`);
        const editDiv   = td.querySelector(`.${field}-edit`);

        if (!enabled) {
          // --- Deshabilitar: limpiar todo ---
          if (selectEl?.tomselect) {
            selectEl.tomselect.clear(true);
            selectEl.tomselect.disable();
          } else if (selectEl) {
            selectEl.value = "";
          }
          CCosto.setVisible(selectEl, false);
          if (hiddenId)  hiddenId.value  = "";
          if (hiddenDsc) hiddenDsc.value = "";
          if (label)     label.textContent = "";
          td.setAttribute("data-ccosto", "");
          if (viewDiv) viewDiv.style.display = "";
          if (editDiv) editDiv.style.display = "none";
        } else {
          // --- Habilitar: mostrar editor y (re)crear TomSelect ---
          if (viewDiv) viewDiv.style.display = "none";
          if (editDiv) editDiv.style.display = "";

          const currentValue = Utils.toText(hiddenId?.value).trim();

          CCosto.initTomSelect(selectEl, currentValue, field, () => {
            CCosto.setVisible(selectEl, true);
            requestAnimationFrame(() => {
              try { selectEl?.tomselect?.refreshOptions(false); }
              catch (e) { console.error(`refreshOptions (${field}):`, e); }
            });
          });
        }
      });
    },

    /** Abre los editores TomSelect en la fila (solo si ccostoEnabled). */
    openEditor(tr) {
      if (!tr || tr.dataset.ccostoEnabled !== "1") return;
      // setEnabled(true) ya se encarga de mostrar editDiv, ocultar viewDiv
      // y (re)crear TomSelect con fetch.
      CCosto.setEnabled(tr, true);
    },

    /** Cierra editores y vuelve a modo lectura. */
    closeEditor(tr) {
      if (!tr) return;
      CCosto.CC_FIELDS.forEach(field => {
        const td = tr.querySelector(`td.${field}`);
        if (!td) return;
        const viewDiv = td.querySelector(`.${field}-view`);
        const editDiv = td.querySelector(`.${field}-edit`);
        if (viewDiv) viewDiv.style.display = "";
        if (editDiv) editDiv.style.display = "none";
      });
    },

    /** Fuerza apertura visual (para errores de validación). */
    ensureEditorOpen(tr, focusField) {
      CCosto.CC_FIELDS.forEach(field => {
        const td = tr.querySelector(`td.${field}`);
        if (!td) return;

        const viewDiv  = td.querySelector(`.${field}-view`);
        const editDiv  = td.querySelector(`.${field}-edit`);
        const selectEl = td.querySelector(`select.${field}-select`);

        if (viewDiv) viewDiv.style.display = "none";
        if (editDiv) editDiv.style.display = "";

        if (selectEl?.tomselect) {
          selectEl.tomselect.enable();
          const wrapper = selectEl.tomselect.wrapper;
          if (wrapper) wrapper.style.display = "";
        } else if (selectEl) {
          selectEl.style.display = "";
        }
      });

      if (focusField) {
        const selectEl = tr.querySelector(`td.${focusField} select.${focusField}-select`);
        if (selectEl?.tomselect) {
          selectEl.tomselect.enable();
          setTimeout(() => {
            try { selectEl.tomselect.focus(); selectEl.tomselect.open(); }
            catch (e) { console.warn(`No se pudo enfocar ${focusField}:`, e); }
          }, 0);
        } else if (selectEl) {
          setTimeout(() => selectEl.focus(), 0);
        }
      }
    },

    /** Lee los valores seleccionados en TomSelect y los persiste en los hidden. */
    commitToHidden(tr) {
      if (!tr) return;

      CCosto.CC_FIELDS.forEach(field => {
        const td = tr.querySelector(`td.${field}`);
        if (!td) return;

        const selectEl = td.querySelector(`select.${field}-select`);
        const hiddenId  = td.querySelector(`input[name="${field}"]`);
        const hiddenDsc = td.querySelector(`input[name="${field}_desc"]`);

        if (!selectEl) return;

        const ts = selectEl.tomselect;
        const selectedId = Utils.toText(ts ? ts.getValue() : selectEl.value).trim();

        let desc = "";
        if (selectedId && ts) {
          const item = ts.options?.[selectedId];
          desc = Utils.toText(item?.text).trim();
          if (!desc) desc = Utils.toText(ts.getOption(selectedId)?.textContent).trim();
        } else if (selectedId && selectEl.selectedOptions?.length) {
          desc = Utils.toText(selectEl.selectedOptions[0].text).trim();
        }

        if (hiddenId)  hiddenId.value  = selectedId;
        if (hiddenDsc) hiddenDsc.value = desc;
      });
    },

    /** Actualiza el label visible después de un save exitoso. */
    updateLabels(tr) {
      CCosto.CC_FIELDS.forEach(field => {
        const td = tr.querySelector(`td.${field}`);
        if (!td) return;

        const idVal   = Utils.toText(td.querySelector(`input[name="${field}"]`)?.value).trim();
        const descVal = Utils.toText(td.querySelector(`input[name="${field}_desc"]`)?.value).trim();
        const label   = td.querySelector(".ccosto-label");
        const viewDiv = td.querySelector(`.${field}-view`);
        const editDiv = td.querySelector(`.${field}-edit`);

        if (label) {
          label.textContent = idVal && descVal ? `${idVal} / ${descVal}` : (descVal || idVal || "");
        }
        if (viewDiv) viewDiv.style.display = "";
        if (editDiv) editDiv.style.display = "none";
        if (td.querySelector(`select.${field}-select`)?.tomselect) {
          td.querySelector(`select.${field}-select`).tomselect.enable();
        }
      });
    },

    /** Lee valor hidden de ccosto para envío al server. */
    getHiddenValue(tr, field, suffix) {
      const name = suffix ? `${field}_${suffix}` : field;
      const input = tr.querySelector(`td.${field} input[name="${name}"]`);
      return Utils.toText(input?.value).trim();
    },
  };

  // Exponer para que autocomplete pueda llamarlo
  // (se asigna al objeto comprobantes después de crearlo)

  // ===========================================================================
  // §4  DOM BUILDERS — generan HTML para las filas
  // ===========================================================================

  const Builders = {

    /** Colspan antes de la columna "debe". */
    colspanBefore() {
      let n = 0;
      for (const c of COLUMNS) { if (c.key === "debe") break; n++; }
      return n;
    },

    /** Colspan después de la columna "haber". */
    colspanAfter() {
      let n = 0;
      let past = false;
      for (const c of COLUMNS) { if (past) n++; if (c.key === "haber") past = true; }
      return n;
    },

    cell(col, el, dec) {
      const id  = Utils.toText(el?.id);
      const val = () => Utils.toText(Utils.getField(el, col.key) ?? el?.[col.key] ?? "");
      const lupaCfg = unaBase?.parametros?.ocultar_lupa_doc_asiento;

      const map = {
        contacto() {
          const idCont = Utils.toText(el?.idCont);
          const inner = el?.auxiliar
            ? `<span readonly name="auxiliar_rut_${id}">${Utils.toText(el.auxiliar_rut)}</span><br>
               <span readonly name="auxiliar_desc_${id}">${Utils.toText(el.auxiliar_desc)}</span>
               <button style="display:none" class="search-btn" data-type="auxiliar" data-id="${id}">
                 <span class="ui-icon ui-icon-search"></span></button>`
            : "";
          return `<td class="contacto" data-idcont="${idCont}">
                    <input type="hidden" name="idAuxiliar" value="${idCont}">
                    <div>${inner}</div>
                  </td>`;
        },

        documento() {
          debugger
          const key    = Utils.safeDTK(el?.typeDoc == 'NC' ? el?.cuentaContable.includes('NACIONALES') || el?.cuentaContable.includes('EXTRANJEROS') ? "NCV" : "NC" : el?.typeDoc);
          const cfg    = DOC_TYPES[key] || null;
          const exists = el?.existe_documento === true;

          const lupa = lupaCfg ? "" :
            `<button class="search-btn" data-type="documento" style="display:none" data-id="${id}"
               ><span class="ui-icon ui-icon-search"></span></button>`;

          const inner = (el?.documento && cfg)
            ? `<a name="documento_desc_${id}" target="_blank" data-dialog="${cfg.dialog}"
                 href="${cfg.url(el.idDoc)}" ${!exists ? 'class="doc-missing"' : ""}>${cfg.name(el.folioDoc)} / ${Utils.toText(el.param4)}</a>${lupa}`
            : "";

          return `<td class="documento" data-iddoc="${Utils.toText(el?.idDoc)}"
                      data-doctype="${Utils.toText(el?.typeDoc)}"
                      data-existe-doc="${exists ? "1" : "0"}"><div>${inner}</div></td>`;
        },

        c_costo()   { return Builders._ccostoCell("c_costo",   el, id); },
        c_costo_2() { return Builders._ccostoCell("c_costo_2", el, id); },

        input() {
          const value = val();

          return `<td class="read-wrap-cell">
                    <span class="read-wrap-text">${value}</span>
                    <input readonly name="${col.key}" value="${value}" type="text"/>
                  </td>`;
        },

        input_btn() {
          const value = val();

          return `<td class="read-wrap-cell cuenta-contable-cell">
                    <button style="display:none;width:24px;z-index:0;" data-id="${id}"
                      class="show cuentaContable"><span class="ui-icon ui-icon-carat-1-s"></span></button>
                    <span class="read-wrap-text">${value}</span>
                    <input readonly name="${col.key}" value="${value}" type="text"/>
                  </td>`;
        },

        input_number() {
          const num = Utils.toNum(Utils.getField(el, col.key));
          return `<td><input class="format-all" readonly name="${col.key}"
            value="${Utils.fmtNum(num, dec)}"
            type="text"/></td>`;
        },

        action_edit() {
          return `<td>
            <button class="edit"><span class="ui-icon ui-icon-pencil"></span></button>
            <button class="save" style="display:none"><span class="ui-icon ui-icon-disk"></span></button>
          </td>`;
        },

        action_delete() {
          return `<td><button class="delete"><span class="ui-icon ui-icon-close"></span></button></td>`;
        },
      };

      return (map[col.type] || (() => "<td></td>"))();
    },

    _ccostoCell(field, el, id) {
      const ccId   = Utils.toText(Utils.getField(el, field) ?? "");
      const ccDesc = Utils.toText(Utils.getField(el, `${field}_desc`) ?? "");
      const display = ccId && ccDesc ? `${ccId} / ${ccDesc}` : (ccDesc || ccId || "");

      return `
        <td class="${field} c_costo_design" data-ccosto="${ccId}">
          <div class="${field}-view">
            <span class="ccosto-label" name="${field}_label_${id}">${display}</span>
            <input type="hidden" name="${field}" value="${ccId}">
            <input type="hidden" name="${field}_desc" value="${ccDesc}">
          </div>
          <div class="${field}-edit" style="display:none;">
            <select class="${field}-select" name="${field}_select" data-rowid="${id}">
              <option value="">-- Selecciona --</option>
            </select>
          </div>
        </td>`;
    },

    row(el, dec, style = "") {
      const cells  = COLUMNS.map(c => Builders.cell(c, el, dec)).join("");
      const codigo = Utils.toText(Utils.getField(el, "codigoCuenta") ?? el?.codigoCuenta ?? "");
      const isCosto = el?.is_centro_costo ?? false;
      return `<tr data-id="${Utils.toText(el?.id)}" data-account="${codigo}" data-iscentrocosto="${isCosto}" ${style}>${cells}</tr>`;
    },

    groupedTotalRow(el, dec) {
      const codigo = Utils.toText(el?.codigoCuenta);
      const btn = `<button type="button" class="folder-account" style="float:left;padding:10px;">
        <i class="fa-solid fa-folder" style="font-size:15px"></i></button>`;

      let cells = "";
      let first = true;

      for (const col of COLUMNS) {
        if (first) { cells += `<td>${btn}</td>`; first = false; continue; }

        switch (col.key) {
          case "codigoCuenta":
            cells += `<td><input readonly value="${codigo}" type="text"/></td>`; break;
          case "cuentaContable": {
            const value = Utils.toText(el?.cuentaContable);

            cells += `<td class="read-wrap-cell cuenta-contable-cell">
              <span class="read-wrap-text">${value}</span>
              <input readonly value="${value}" type="text"/>
            </td>`;
            break;
          }
          case "debe":
            cells += `<td><input class="format-all" readonly value="${unaBase.utilities.transformNumber(Math.abs(el.debe), "int")}" type="text"/></td>`; break;
          case "haber":
            cells += `<td><input class="format-all" readonly value="${unaBase.utilities.transformNumber(Math.abs(el.haber), "int")}" type="text"/></td>`; break;
          case "actions_edit":
            cells += `<td><button type="button" class="edit" disabled><span class="ui-icon ui-icon-pencil"></span></button></td>`; break;
          case "actions_delete":
            cells += `<td><button type="button" class="delete" disabled><span class="ui-icon ui-icon-close"></span></button></td>`; break;
          default:
            cells += "<td></td>";
        }
      }

      return `<tr style="background-color:#D0F7EB;" class="totalhector" data-account="${codigo}">${cells}</tr>`;
    },

    groupedAggregateRow(el) {
      const dTotal = Utils.toNum(el?.debe_total);
      const hTotal = Utils.toNum(el?.haber_total);
      const res    = dTotal - hTotal;

      const btn = `<button type="button" style="float:left;padding:10px;" class="folder-detail">
        <i class="fa-solid fa-folder" style="font-size:15px"></i></button>`;

      let cells = "";
      let first = true;

      for (const col of COLUMNS) {
        if (first) { cells += `<td>${btn}</td>`; first = false; continue; }

        switch (col.key) {
          case "codigoCuenta":
            cells += `<td><input readonly value="${Utils.toText(el?.cuenta_actual)}" type="text"/></td>`; break;
          case "cuentaContable": {
            const value = Utils.toText(el?.cuentaContable);

            cells += `<td class="read-wrap-cell cuenta-contable-cell">
              <span class="read-wrap-text">${value}</span>
              <input readonly value="${value}" type="text"/>
            </td>`;
            break;
          }
          case "debe":
            cells += `<td><input class="format-all" name="debe-agrupado" readonly value="${unaBase.utilities.transformNumber(res > 0 ? Math.abs(res) : 0, "int")}" type="text"/></td>`; break;
          case "haber":
            cells += `<td><input class="format-all" name="haber-agrupado" readonly value="${unaBase.utilities.transformNumber(res < 0 ? Math.abs(res) : 0, "int")}" type="text"/></td>`; break;
          case "actions_edit":
            cells += `<td><button type="button" class="edit" disabled><span class="ui-icon ui-icon-pencil"></span></button></td>`; break;
          case "actions_delete":
            cells += `<td><button type="button" class="delete" disabled><span class="ui-icon ui-icon-close"></span></button></td>`; break;
          default:
            cells += "<td></td>";
        }
      }

      return `
        <tr style="background-color:#D0F7EB;"
            data-account="${Utils.toText(el?.cuenta_actual)}"
            class="tr-total"
            data-totalHaber="${Utils.toText(el?.haber_total)}"
            data-totalDebe="${Utils.toText(el?.debe_total)}">
          ${cells}
        </tr>`;
    },

    totalsRow() {
      return `
        <tr class="totals">
          <td colspan="${Builders.colspanBefore()}">Total:</td>
          <td><input disabled value="" class="debe" type="text"/></td>
          <td><input disabled value="" class="haber" type="text"/></td>
          <td colspan="${Builders.colspanAfter()}"><input disabled value="" class="total" type="text"/></td>
        </tr>`;
    },
  };

  // ===========================================================================
  // §5  TOTALES
  // ===========================================================================

  const Totals = {
    apply({ totalDebe, totalHaber }) {
      const body = document.querySelector("table#detail tbody");
      if (!body) return;

      const dec = Utils.getDec();
      const dInput = body.querySelector("tr.totals input.debe");
      const hInput = body.querySelector("tr.totals input.haber");
      const tInput = body.querySelector("tr.totals input.total");
      if (!dInput || !hInput || !tInput) return;

      dInput.value = Utils.fmtNum(totalDebe, dec);
      hInput.value = Utils.fmtNum(totalHaber, dec);

      const diff = Math.abs(totalDebe - totalHaber);
      tInput.value = Utils.fmtNum(diff, dec);
      tInput.classList.toggle("redBold", diff !== 0);
      dInput.classList.toggle("redBold", totalDebe < totalHaber);
      hInput.classList.toggle("redBold", totalHaber < totalDebe);
    },

    recalc() {
      const body = document.querySelector("table#detail tbody");
      if (!body) return;

      let totalDebe = 0;
      let totalHaber = 0;

      const grouped = body.querySelectorAll("tr.tr-total");
      if (grouped.length) {
        grouped.forEach(tr => {
          totalDebe  += Utils.toNum(tr.getAttribute("data-totalDebe"));
          totalHaber += Utils.toNum(tr.getAttribute("data-totalHaber"));
        });
        Totals.apply({ totalDebe, totalHaber });
        return;
      }

      const isVisible = el => {
        const tr = el?.closest?.("tr");
        return !tr || tr.style.display !== "none";
      };

      body.querySelectorAll('input[name="debe"], input[name="debe-agrupado"]')
        .forEach(i => { if (isVisible(i)) totalDebe += Utils.toNum(i.value); });

      body.querySelectorAll('input[name="haber"], input[name="haber-agrupado"]')
        .forEach(i => { if (isVisible(i)) totalHaber += Utils.toNum(i.value); });

      Totals.apply({ totalDebe, totalHaber });
    },

    /** Versión pública compatible con código externo que usa `currency`. */
    calculate() {
      let debe = 0, haber = 0;

      document.querySelectorAll(".tr-total").forEach(tr => {
        debe  += parseFloat(tr.dataset.totaldebe) || 0;
        haber += parseFloat(tr.dataset.totalhaber) || 0;
      });

      document.querySelectorAll('input[name="debe"]').forEach(i => {
        debe += parseStrToInt(i.value, currency) || 0;
      });
      document.querySelectorAll('input[name="haber"]').forEach(i => {
        haber += parseStrToInt(i.value, currency) || 0;
      });

      const dec  = currency.decimals;
      const diff = Math.abs(debe - haber);

      const dInput = document.querySelector("tr.totals input.debe");
      const hInput = document.querySelector("tr.totals input.haber");
      const tInput = document.querySelector("tr.totals input.total");
      if (!dInput || !hInput || !tInput) return;

      dInput.value = Utils.fmtNum(debe, dec);
      hInput.value = Utils.fmtNum(haber, dec);
      tInput.value = Utils.fmtNum(diff, dec);
      tInput.classList.toggle("redBold", diff !== 0);
      dInput.classList.toggle("redBold", debe < haber);
      hInput.classList.toggle("redBold", haber < debe);
    },
  };

  // ===========================================================================
  // §6  EVENT DELEGATION — se enlaza UNA sola vez
  // ===========================================================================

  const Events = {
    _bound: false,

    /**
     * Registra todos los listeners delegados sobre el contenedor de la tabla.
     * Es seguro llamarla múltiples veces: solo actúa la primera.
     */
    bind() {
      if (Events._bound) return;
      Events._bound = true;

      const container = document.querySelector("table#detail");
      if (!container) return;

      // --- Click delegation --------------------------------------------------
      container.addEventListener("click", (ev) => {
        const target = ev.target;

        // Botón EDIT
        const editBtn = target.closest("button.edit");
        if (editBtn && !editBtn.disabled) {
          ev.stopPropagation();
          comprobantes.edit(ev);
          return;
        }

        // Botón SAVE
        const saveBtn = target.closest("button.save");
        if (saveBtn) {
          ev.stopPropagation();
          comprobantes.save(ev);
          return;
        }

        // Botón DELETE
        const deleteBtn = target.closest("button.delete");
        if (deleteBtn && !deleteBtn.disabled) {
          ev.stopPropagation();
          comprobantes.delete(ev);
          return;
        }

        // Botón SEARCH (auxiliar / documento)
        const searchBtn = target.closest("button.search-btn");
        if (searchBtn) {
          ev.stopPropagation();
          comprobantes.showDialogDTC(searchBtn);
          return;
        }

        // Botón CUENTA CONTABLE dropdown
        const ccBtn = target.closest("button.show.cuentaContable");
        if (ccBtn) {
          ev.stopPropagation();
          comprobantes.showCuentaContable(ev);
          return;
        }

        // Botón FOLDER (collapse rows)
        const folderBtn = target.closest("button.folder-account");
        if (folderBtn) {
          ev.stopPropagation();
          collapseRow(folderBtn);
          return;
        }

        // Botón FOLDER DETAIL (modo agrupado >5000)
        const folderDetail = target.closest("button.folder-detail");
        if (folderDetail) {
          ev.stopPropagation();
          loadDetalleAsientos(folderDetail);
          return;
        }

        // Input select-on-click (debe/haber)
        const fmtInput = target.closest("input.format-all");
        if (fmtInput) {
          fmtInput.select();
          return;
        }
      });

      // --- Keyup delegation (formater + signo negativo) ----------------------
      container.addEventListener("keyup", (ev) => {
        const input = ev.target.closest("input.format-all");
        if (input) {
          unaBase.utilities.general.formater(input);
          const kc = ev.keyCode || ev.which;
          if (kc !== 13 && input.value !== "") {
            if (input.value.includes("-") && input.value.length > 1) {
              input.value = "-" + unaBase.utilities.transformNumber(input.value, "format-all");
            }
          }
        }
      });

      // --- Keypress delegation (Enter → save) --------------------------------
      container.addEventListener("keypress", (ev) => {
        if (ev.target.tagName === "INPUT" && (ev.keyCode || ev.which) === 13) {
          comprobantes.save(ev);
        }
      });

      // --- Escape → cerrar editor ccosto ------------------------------------
      container.addEventListener("keydown", (ev) => {
        if (ev.key === "Escape") {
          const tr = ev.target?.closest?.("tr");
          if (tr) CCosto.closeEditor(tr);
        }
      });

      // --- Links con data-dialog="true" ------------------------------------
      container.addEventListener("click", (ev) => {
        const link = ev.target.closest('a[data-dialog="true"]');
        if (link) {
          ev.preventDefault();
          const idComp = comprobantes.id;
          unaBase.loadInto.dialog(
            `/v3/views/ingresos/dialog/ingreso.shtml?id=${idComp}`,
            "Ingreso",
            "large"
          );
        }
      });
    },

    /** Enlaza tabs una sola vez. */
    bindTabs() {
      document.querySelectorAll(".ub-tab").forEach(tab => {
        if (tab.dataset.bound === "1") return;
        tab.dataset.bound = "1";

        tab.addEventListener("click", () => {
          document.querySelectorAll(".ub-tab").forEach(t => t.classList.remove("ub-active-tab"));
          tab.classList.add("ub-active-tab");
          document.querySelectorAll(".ub-content-container").forEach(c => c.style.display = "none");

          const contentId = tab.getAttribute("data-content");
          const cont = contentId ? document.getElementById(contentId) : null;
          if (cont) cont.style.display = "block";

          if (contentId === "historial" && cont) {
            fetch(`/v3/views/historial/index.shtml?id=${comprobantes.id}&mod=Comprobantes`)
              .then(r => r.text())
              .then(html => { cont.innerHTML = html; })
              .catch(e => console.error("historial error:", e));
          }
        });
      });
    },

    /** Back button (modo agrupado). */
    bindBackButton() {
      const backBtn = document.querySelector(".back");
      if (!backBtn || backBtn.dataset.bound === "1") return;
      backBtn.dataset.bound = "1";

      backBtn.addEventListener("click", () => {
        const main   = document.querySelector("#detail");
        const detail = document.querySelector("#detail-asiento");
        if (main)   main.style.display = "";
        if (detail) detail.style.display = "none";
      });
    },
  };

  // ===========================================================================
  // §7  FUNCIONES GLOBALES PRESERVADAS (collapseRow, loadDetalleAsientos)
  // ===========================================================================

  function collapseRow(buttonEl) {
    const parentTr     = buttonEl.closest("tr");
    const numeroCuenta = parentTr?.querySelector('input[name="codigoCuenta"], input[readonly]')?.value
                      || parentTr?.children[4]?.children[0]?.value;
    const table = document.getElementById("detail-data") || document.querySelector("table#detail tbody");
    if (!table) return;

    const rows        = table.getElementsByTagName("tr");
    const targetIndex = parentTr.rowIndex;

    const makeIcon = (type) => {
      const i = document.createElement("i");
      i.classList.add("fas", type === "open" ? "fa-folder-open" : "fa-folder");
      i.style.fontSize = "15px";
      return i;
    };

    for (const tr of rows) {
      const td = tr.getElementsByTagName("td")[0];
      if (!td) continue;

      const firstChild = tr.children[0]?.children[0];
      const ic         = firstChild?.tagName || "";
      const rowIndex   = tr.rowIndex;

      // Toggle icon en la fila clicada
      if (ic === "BUTTON" && rowIndex === targetIndex) {
        const iconEl = firstChild.querySelector("i");
        const isOpen = iconEl?.classList.contains("fa-folder-open");
        if (iconEl) iconEl.remove();
        firstChild.appendChild(makeIcon(isOpen ? "close" : "open"));
      }

      // Toggle visibilidad de filas hijas
      const n = tr.querySelector('input[name="codigoCuenta"], input[readonly]')?.value
             || tr.children[4]?.children[0]?.value;
      if (n === numeroCuenta && ic !== "BUTTON") {
        const isHidden = tr.style.display === "none";
        tr.style.backgroundColor = isHidden ? "#CAF0F8" : "";
        tr.style.display = isHidden ? "" : "none";
      }
    }
  }

  async function loadDetalleAsientos(btnEl) {
    const tr      = btnEl.closest("tr");
    const idComp  = document.querySelector(".sheet")?.dataset?.id;
    const account = tr?.dataset?.account;

    const table     = document.getElementById("detail-asiento");
    const tableMain = document.getElementById("detail");
    if (!table || !tableMain) return;

    const url = new URL("/4DACTION/_force_getDetalleAsientos", window.location.origin);
    Object.entries({ idComp, account, sid: unaBase.sid.encoded(), page: 1, pageSize: 50000 })
      .forEach(([k, v]) => url.searchParams.append(k, v));

    unaBase.ui.block();
    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error("Network error");
      const result = await response.json();

      if (!result?.details) { console.warn("No details available"); return; }

      const tbody = table.querySelector("tbody#detail-data");
      tbody.innerHTML = "";
      tableMain.style.display = "none";
      table.style.display = "";

      let totalDebe = 0, totalHaber = 0;

      result.details.forEach(detail => {
        const debe  = Math.abs(detail.debe.replace(",", "."));
        const haber = Math.abs(detail.haber.replace(",", "."));
        totalDebe  += debe;
        totalHaber += haber;

        const typeDocRaw = detail.typeDoc && detail.typeDoc !== "NaN" && detail.typeDoc !== "nan"
          ? detail.typeDoc.toUpperCase() : "NONE";
        const docCfg = DOC_TYPES[typeDocRaw] || DOC_TYPES["NONE"];

        const row = document.createElement("tr");
        const idCont = Utils.toText(detail.idCont);
        row.dataset.id = detail.id_detalle;
        row.innerHTML = `
          <td class="contacto" data-idcont="${idCont}">
            <input type="hidden" name="idAuxiliar" value="${idCont}">
            <div>${detail.auxiliar
              ? `<span readonly name="auxiliar_rut_${detail.id_detalle}">${detail.auxiliar_rut}</span><br>
                 <span readonly name="auxiliar_desc_${detail.id_detalle}">${detail.auxiliar_desc}</span>
                 <button style="display:none" class="search-btn" data-type="auxiliar" data-id="${detail.id_detalle}">
                   <span class="ui-icon ui-icon-search"></span></button>`
              : ""}</div>
          </td>
          <td class="documento" data-iddoc="${detail.idDoc}" data-doctype="${detail.typeDoc}">
            <div>${detail.documento
              ? `<a name="documento_desc_${detail.id_detalle}" target="_blank" data-dialog="${docCfg.dialog}"
                   href="${docCfg.url(detail.idDoc)}">${docCfg.name(detail.folioDoc)} / ${detail.param4}</a>
                 ${unaBase.parametros.ocultar_lupa_doc_asiento ? "" :
                   `<button class="search-btn" data-type="documento" style="display:none" data-id="${detail.id_detalle}">
                      <span class="ui-icon ui-icon-search"></span></button>`}`
              : ""}</div>
          </td>
          <td>${detail.codigoCuenta || ""}</td>
          <td><button style="display:none;width:24px;z-index:0;" data-id="${detail.id_detalle}" class="show cuentaContable">
                <span class="ui-icon ui-icon-carat-1-s"></span></button>
              <input readonly name="cuentaContable" value="${detail.cuentaContable}" type="text"/></td>
          <td><input readonly name="glosa" placeholder="Inserte Glosa" value="${detail.glosa ?? ""}" type="text"/></td>
          <td><input class="format-all" readonly name="debe"
            value="${unaBase.utilities.transformNumber(debe, "int")}" type="text"/></td>
          <td><input class="format-all" readonly name="haber"
            value="${unaBase.utilities.transformNumber(haber, "int")}" type="text"/></td>
          <td>
            <button class="edit"><span class="ui-icon ui-icon-pencil"></span></button>
            <button style="display:none" class="save"><span class="ui-icon ui-icon-disk"></span></button>
          </td>
          <td><button class="delete"><span class="ui-icon ui-icon-close"></span></button></td>
        `;
        tbody.appendChild(row);
      });

      const totalRow = document.createElement("tr");
      totalRow.className = "totals";
      totalRow.innerHTML = `
        <td colspan="5">Total:</td>
        <td><input disabled value="${unaBase.utilities.transformNumber(totalDebe, "int")}" class="debe redBold" type="text"></td>
        <td><input disabled value="${unaBase.utilities.transformNumber(totalHaber, "int")}" class="haber" type="text"></td>
        <td colspan="2"></td>
      `;
      tbody.appendChild(totalRow);
    } catch (err) {
      console.error("Error fetching asientos:", err);
    } finally {
      unaBase.ui.unblock();
    }
  }

  // ===========================================================================
  // §8  CHECKBOX UTILITY (global)
  // ===========================================================================

  function verifyCheck(event) {
    const inputs = document.querySelectorAll("#dialog-viewport input[type=checkbox]");
    inputs.forEach(input => {
      if (event.target.checked) {
        input.disabled = !input.disabled && !input.checked;
      } else {
        input.disabled = false;
      }
    });
  }

  // ===========================================================================
  // §9  OBJETO PRINCIPAL — comprobantes
  // ===========================================================================

  var comprobantes = {
    data: {
      active: null, description: null, docType: null,
      registryDate: null, registryHour: null, docDate: null,
      docHour: null, id: 0, ok: false,
    },
    id: 0,
    container: null, // se asigna en ready

    // ---- Exponer CCosto.setEnabled para autocomplete select callback --------
    setCCostoEnabled: CCosto.setEnabled,

    // ---- Totales públicos ---------------------------------------------------
    calculateTotals: Totals.calculate,

    // =========================================================================
    // INIT
    // =========================================================================

    init(id) {
      const safeId = id ?? 0;

      // Enlazar event delegation (idempotente)
      Events.bind();
      Events.bindBackButton();

      $.ajax({
        url: "/4DACTION/_V3_proxy_getComprobante",
        data: { id: safeId },
        dataType: "json",
        async: false,
        success: (data) => this._onInitSuccess(data, safeId),
        error(xhr, status, err) {
          console.error("_V3_proxy_getComprobante:", status, err);
          typeof toastr !== "undefined" && toastr.error("No se pudo cargar el comprobante.");
        },
      });
    },

    _onInitSuccess(data, safeId) {
      try {
        const safeData = data || {};
        const details  = Array.isArray(safeData.details) ? safeData.details : [];
        const body     = document.querySelector("table#detail tbody");
        if (!body) return;

        this.data = safeData;
        this.data.docType = Utils.toText(safeData.docType).toLowerCase();
        this.id = safeData.id || 0;

        if (!safeData.id) safeData.active = true;

        // Menú contextual provisión
        $(`li[data-name="generate_reverse_provision"]`).toggle(
          !!(safeData.provision_sale || safeData.provision_expense) && !safeData.reverse_generated
        );

        // Permisos periodo contable
        if (typeof access !== "undefined") {
          ["create_accounting_period", "status_accounting_period",
           "close_accounting_period", "open_accounting_period"].forEach(n => {
            if (!access._663) $(`li[data-name="${n}"]`).remove();
          });
        }

        // Limpiar tabla
        body.innerHTML = "";
        const dec = Utils.getDec();
        const recordsTotal = safeData.records?.total ?? 0;
        const backBtn = document.querySelector(".back");

        // --- Renderizar filas ------------------------------------------------
        if (recordsTotal < DETAIL_THRESHOLD) {
          this._renderNormalMode(details, body, dec, backBtn);
        } else {
          this._renderGroupedMode(details, body, dec, backBtn);
        }

        // --- Form binding (jQuery UI) ----------------------------------------
        if (Utils.isFn(domFunc?.setFormJquery)) {
          domFunc.setFormJquery({ data: safeData, disabled: ["registryDate"], extraData: true });
        }

        if (Utils.isFn($("#docDate").datepicker)) $("#docDate").datepicker();

        const docDateEl = document.querySelector("#docDate");
        if (docDateEl && (!docDateEl.value || docDateEl.value === "00-00-00")) {
          const now = new Date();
          docDateEl.value = [
            String(now.getDate()).padStart(2, "0"),
            String(now.getMonth() + 1).padStart(2, "0"),
            now.getFullYear(),
          ].join("/");
        }

        // --- Estado periodo contable -----------------------------------------
        this._checkPeriodoContableOnLoad(safeData.registryDate);

        // --- Tabs ------------------------------------------------------------
        Events.bindTabs();
      } catch (err) {
        console.error("init error:", err);
        typeof toastr !== "undefined" && toastr.error("Ocurrió un error cargando el comprobante.");
      }
    },

    _renderNormalMode(details, body, dec, backBtn) {
      if (backBtn) backBtn.style.display = "none";

      // Agrupar por código de cuenta
      const grouped = {};
      for (const row of details) {
        const cod = Utils.toText(row?.codigoCuenta);
        if (!grouped[cod]) grouped[cod] = { count: 0, debe: 0, haber: 0, sample: row };
        grouped[cod].count++;
        grouped[cod].debe  += Utils.toNum(row?.debe);
        grouped[cod].haber += Utils.toNum(row?.haber);
      }

      let lastCod = null;
      const insertedGroups = new Set();

      for (const el of details) {
        const cod = Utils.toText(el?.codigoCuenta);
        const g   = grouped[cod] || { count: 0, debe: 0, haber: 0, sample: el };
        let style   = "";
        let trGroup = "";

        if (cod !== lastCod && g.count > 1 && !insertedGroups.has(cod)) {
          insertedGroups.add(cod);
          trGroup = Builders.groupedTotalRow({ ...g.sample, debe: g.debe, haber: g.haber }, dec);
        }

        if (g.count > 1 && cod !== "") style = 'style="display:none;"';
        lastCod = cod;

        this._appendRow(body, trGroup + Builders.row(el, dec, style));
      }

      this._appendRow(body, Builders.totalsRow());
      Utils.isFn(this.calculateTotals) ? this.calculateTotals() : Totals.recalc();
    },

    _renderGroupedMode(details, body, dec, backBtn) {
      if (backBtn) backBtn.style.display = "";

      for (const el of details) {
        if (el?.isGrouped) {
          this._appendRow(body, Builders.groupedAggregateRow(el));
        } else {
          this._appendRow(body, Builders.row(el, dec));
        }
      }

      this._appendRow(body, Builders.totalsRow());
      Totals.recalc();
    },

    _appendRow(body, htmlStr) {
      if (!htmlStr) return;
      const $row = $(htmlStr);
      $(body).append($row);

      // Los links dialog se manejan por delegación en Events.bind()
      // El saveAndAdd queda reservado para extensión futura
    },

    _checkPeriodoContableOnLoad(registryDate) {
      $.ajax({
        url: "/4DACTION/_V3_get_estadoPeriodoContable",
        data: { periodo: registryDate, origen: "ext modulos" },
        dataType: "json",
        async: false,
        success(sub) {
          try {
            if (sub?.exists == 1) {
              if (sub.closed == 1) {
                const vp = $("#viewport");
                vp.find("input").prop("readonly", true).prop("disabled", true);
                vp.find("button.detail.item, button.profile.item").hide();
                vp.find('input[type="checkbox"], input[type="text"], input[type="search"].datepicker, select').prop("disabled", true);
                vp.find("button:not(.folder-account):not(.folder-detail)").prop("disabled", true).remove();
                $('[data-name="save"], [data-name="addDetails"]').remove();
                toastr.warning("El periodo seleccionado se encuentra cerrado, no puede modificar este comprobante.");
              }
            } else {
              toastr.warning("El periodo contable para este comprobante no está creado.");
            }
          } catch (e) {
            console.error("estadoPeriodoContable error:", e);
          }
        },
        error(xhr, status, err) {
          console.error("_V3_get_estadoPeriodoContable:", status, err);
        },
      });
    },

    // =========================================================================
    // AUTOCOMPLETE
    // =========================================================================

    addAutocomplete(item) {
      $(item).autocomplete({
        source(request, response) {
          $.ajax({
            url: "/4DACTION/_V3_getParamContable",
            dataType: "json",
            data: { q: request.term },
            success: data => response($.map(data.rows, r => r)),
          });
        },
        minLength: 0,
        autoFocus: true,
        delay: 0,
        position: { my: "left top", at: "left bottom", collision: "flip" },
        open()  { $(this).removeClass("ui-corner-all").addClass("ui-corner-top"); },
        close() { $(this).removeClass("ui-corner-top").addClass("ui-corner-all"); },
        focus() { return false; },
        select(event, ui) {
          const trEl = event.target.closest("tr");
          if (!trEl) return;

          const prevAccount = Utils.toText(trEl.querySelector('input[name="codigoCuenta"]')?.value).trim();
          const nextAccount = Utils.toText(ui.item.number).trim();
          const accountChanged = prevAccount !== nextAccount;

          // --- Cuenta contable ---
          trEl.querySelector('input[name="codigoCuenta"]').value = ui.item.number;
          trEl.querySelector('input[name="cuentaContable"]').value = ui.item.name;
          $(trEl).find('input[name="cuentaContable"]').css("background-color", "inherit");

          // --- Auxiliar / Contacto ---
          const contactoDiv = trEl.querySelector("td.contacto div");
          const contactoTd  = trEl.querySelector("td.contacto");
          if (contactoDiv) {
            contactoDiv.style.display = ui.item.auxiliar ? "" : "none";
          }
          if (contactoTd && (accountChanged || !ui.item.auxiliar)) {
            comprobantes._clearAuxiliarCell(trEl);
          }

          // --- Documento ---
          const documentoDiv = trEl.querySelector("td.documento div");
          const documentoTd  = trEl.querySelector("td.documento");
          if (documentoDiv) {
            documentoDiv.style.display = ui.item.documento ? "" : "none";
          }
          if (documentoTd && (accountChanged || !ui.item.documento)) {
            comprobantes._clearDocumentoCell(trEl);
          }

          // --- Centro de costo ---
          const needsCCosto = !!ui.item.c_costo;
          trEl.dataset.iscentrocosto = needsCCosto ? "true" : "false";

          // setEnabled(true) recrea TomSelect y muestra los selectores.
          // setEnabled(false) los oculta y limpia.
          CCosto.setEnabled(trEl, needsCCosto);
        },
      }).data("ui-autocomplete")._renderItem = (ul, item) =>
        $(`<li><a><strong class="highlight">${item.name}</strong><em>${item.number}</em><span>${item.type}</span></a></li>`).appendTo(ul);
    },

    showCuentaContable(event) {
      const btn = event.target.closest("button") || event.target;
      const id = btn.dataset.id;
      $(`tr[data-id="${id}"] input[name="cuentaContable"]`).autocomplete("search", "@").focus();
    },

    // =========================================================================
    // VALIDACIONES
    // =========================================================================

    checkPeriodoContable() {
      return new Promise((resolve, reject) => {
        $.ajax({
          url: "/4DACTION/_V3_get_estadoPeriodoContable",
          data: { periodo: $('#comprobantes [name="docDate"]').val(), origen: "ext modulos" },
          dataType: "json",
          async: false,
          success(sub) {
            if (sub?.exists == 1) {
              sub.closed == 1
                ? (reject(), toastr.warning("El periodo seleccionado se encuentra cerrado."))
                : resolve();
            } else {
              reject();
              toastr.warning("El periodo contable para este comprobante no está creado.");
            }
          },
        });
      });
    },

    checkComprobante(type) {
      return new Promise((resolve, reject) => {
        $.ajax({
          url: "/4DACTION/_force_check_comprobante",
          data: { id: comprobantes.data.id, type_check: type },
          dataType: "json",
          async: false,
          success: d => d.success ? resolve(true) : reject(false),
        });
      });
    },

    validate() {
      const docType = document.querySelector('select[name="docType"]');
      const desc    = document.querySelector('[name="description"]');
      if (desc?.value === "")    desc.style.border = "2px solid #F47975";
      if (docType?.value === "") docType.style.border = "2px solid #F47975";
      return docType?.value !== "" && desc?.value !== "";
    },

    validateNumbers() {
      let debe = 0, haber = 0;
      document.querySelectorAll('input[name="debe"]').forEach(i => {
        debe += parseStrToInt(i.value, currency) || 0;
      });
      document.querySelectorAll('input[name="haber"]').forEach(i => {
        haber += parseStrToInt(i.value, currency) || 0;
      });
      debe  = debe.toFixed(2);
      haber = haber.toFixed(2);

      if ((comprobantes.data.records?.total ?? 0) < 5000) return debe === haber;

      const dv = Number(document.querySelector("tr.totals input.debe")?.value.replace(/\./g, "") || 0);
      const hv = Number(document.querySelector("tr.totals input.haber")?.value.replace(/\./g, "") || 0);
      return dv === hv;
    },

    _syncAuxiliarHidden(tr) {
      const td = tr?.querySelector("td.contacto");
      if (!td) return "";

      let hidden = td.querySelector('input[name="idAuxiliar"]');
      if (!hidden) {
        hidden = document.createElement("input");
        hidden.type = "hidden";
        hidden.name = "idAuxiliar";
        td.insertBefore(hidden, td.firstChild);
      }

      const datasetId = Utils.toText(td.dataset?.idcont).trim();
      const hiddenId = Utils.toText(hidden?.value).trim();
      const id = datasetId || hiddenId;

      td.dataset.idcont = id;
      if (hidden) hidden.value = id;

      return id;
    },

    _clearAuxiliarCell(tr) {
      const td = tr?.querySelector("td.contacto");
      if (!td) return;

      td.dataset.idcont = "";
      const hidden = td.querySelector('input[name="idAuxiliar"]');
      if (hidden) hidden.value = "";

      const rutSpan  = td.querySelector('[name^="auxiliar_rut_"]');
      const descSpan = td.querySelector('[name^="auxiliar_desc_"]');
      if (rutSpan) rutSpan.textContent = "";
      if (descSpan) descSpan.textContent = "";
    },

    _clearDocumentoCell(tr) {
      const td = tr?.querySelector("td.documento");
      if (!td) return;

      td.dataset.iddoc = "0";
      td.dataset.doctype = "none";

      const docLink = td.querySelector('[name^="documento_desc_"]');
      if (docLink) {
        docLink.textContent = "Sin documento";
        docLink.href = "";
      }
    },

    _syncRowIds(row, id) {
      const safeId = Utils.toText(id).trim();
      if (!row || !safeId) return;

      row.querySelectorAll("button[data-id]").forEach(btn => { btn.dataset.id = safeId; });
      row.querySelectorAll("select[data-rowid]").forEach(select => { select.dataset.rowid = safeId; });

      row.querySelectorAll("[name]").forEach(el => {
        const name = Utils.toText(el.getAttribute("name"));
        const match = name.match(/^(auxiliar_rut|auxiliar_desc|documento_desc|c_costo_label|c_costo_2_label)_/);
        if (match) el.setAttribute("name", `${match[1]}_${safeId}`);
      });
    },

    // =========================================================================
    // CRUD
    // =========================================================================

    edit(event) {
      comprobantes.checkPeriodoContable(); // dispara advertencia si cerrado

      const tr = event.target.closest("tr");
      if (!tr) return;

      tr.classList.add("is-editing");

      tr.querySelectorAll("button.search-btn").forEach(b => b.style.display = "");

      const btnEdit = tr.querySelector("button.edit");
      const btnShow = tr.querySelector("button.show.cuentaContable");
      const btnSave = tr.querySelector("button.save");

      if (btnEdit) btnEdit.style.display = "none";
      if (btnShow) btnShow.style.display = "";
      if (btnSave) btnSave.style.display = "";

      this.block(tr.dataset.id);

      // Habilitar ccosto si la cuenta lo requiere (una sola llamada).
      // setEnabled(true) lee los hidden inputs, muestra el editor y
      // recrea TomSelect con el valor previo preservado.
      const hasCCosto = tr.dataset.iscentrocosto === "true";
      CCosto.setEnabled(tr, hasCCosto);
    },

    save(event) {
      try {
        if (!(this.id > 0)) {
          toastr.warning("Debes guardar el comprobante antes de agregar un detalle.");
          return;
        }

        const tr = event?.target?.closest("tr");
        if (!tr) return;

        const rowId  = Utils.toText(tr.dataset?.id || "0").trim();
        const isNew  = tr.classList.contains("new");
        const iddetalle = isNew ? 0 : rowId;

        const $tr       = $(tr);
        const cuentaInp = $tr.find('input[name="cuentaContable"]');
        const debe      = Utils.parseMoney($tr.find('input[name="debe"]').val());
        const haber     = Utils.parseMoney($tr.find('input[name="haber"]').val());

        // --- Validación: cuenta contable obligatoria ---
        if (!cuentaInp.length || !Utils.toText(cuentaInp.val()).trim()) {
          cuentaInp.css("background-color", "red");
          toastr.warning("Debes seleccionar una cuenta contable.");
          return;
        }

        // --- Validación: debe XOR haber ---
        if ((debe && haber)) {
          toastr.warning("Debes agregar un valor en debe O haber (no ambos).");
          return;
        }

        // Sincronizar TomSelect → hidden inputs
        CCosto.commitToHidden(tr);
        const idAuxiliar = this._syncAuxiliarHidden(tr);

        // Leer datos del formulario
        const detail = this.getDetail(rowId);
        const data   = domFunc.getObjectFromNodes(detail?.inputs || []) || {};

        // Centros de costo
        data.c_costo      = CCosto.getHiddenValue(tr, "c_costo");
        data.c_costo_desc = CCosto.getHiddenValue(tr, "c_costo", "desc");
        data.c_costo_2      = CCosto.getHiddenValue(tr, "c_costo_2");
        data.c_costo_2_desc = CCosto.getHiddenValue(tr, "c_costo_2", "desc");

        // Compatibilidad legacy
        data.centro_costo       = data.c_costo;
        data.centro_costo_desc  = data.c_costo_desc;
        data.centro_costo_2     = data.c_costo_2;
        data.centro_costo_2_desc = data.c_costo_2_desc;

        // Auxiliar y documento
        const documentoTd = tr.querySelector("td.documento");
        if (this.data?.docType) {
          data.idAuxiliar    = idAuxiliar;
          data.idDocumento   = documentoTd?.dataset?.iddoc || "";
          data.tipoDocumento = Utils.toText(documentoTd?.dataset?.doctype || "").toLowerCase();
        }

        // --- Validación: centros de costo obligatorios ---
        const isCCRequired = ["1", "true"].includes(
          String(tr.dataset.iscentrocosto || "").toLowerCase().trim()
        );
        const cc1 = String(data.c_costo   || "").trim();
        const cc2 = String(data.c_costo_2 || "").trim();

        if (unaBase.parametros.new_dtv_accounting && isCCRequired && (!cc1 || !cc2)) {
          toastr.warning("Debe agregar ambos centros de costo para guardar la cuenta.");
          this._keepEditing(tr, !cc1 ? "c_costo" : "c_costo_2");
          return;
        }

        // --- AJAX save ---
        $.ajax({
          url: "/4DACTION/_V3_setComprobanteDetalle",
          dataType: "json",
          type: "POST",
          async: false,
          data: { id: iddetalle, ...data, idComprobante: this.id },
          success: (d) => this._onSaveSuccess(d, tr, rowId, event),
          error: (xhr, status, err) => {
            console.error("save ajax error:", status, err, xhr?.responseText);
            toastr.error("Error interno. Inténtalo de nuevo.");
            this._keepEditing(tr);
          },
        });
      } catch (e) {
        console.error("save error:", e);
        toastr.error("Ocurrió un error al guardar el detalle.");
      }
    },

    _onSaveSuccess(d, tr, rowId, event) {
      try {
        if (!d?.success) {
          toastr.warning(d?.errorMsg || NOTIFY.get("ERROR_INTERNAL"));
          this._keepEditing(tr);
          return;
        }

        const savedId = Utils.toText(d?.id || rowId).trim();
        const row = document.querySelector(`tr[data-id="${rowId}"]`) || tr;

        this._syncReadWrapLabels(row);

        row.classList.remove("is-editing", "new");
        row.dataset.id = savedId;
        this._syncRowIds(row, savedId);

        row.querySelectorAll("button.search-btn").forEach(b => b.style.display = "none");

        const btnEdit = row.querySelector("button.edit");
        const btnShow = row.querySelector("button.show.cuentaContable");
        const btnSave = row.querySelector("button.save");

        if (btnEdit) btnEdit.style.display = "";
        if (btnShow) btnShow.style.display = "none";
        if (btnSave) btnSave.style.display = "none";

        // Actualizar labels de ccosto y cerrar editor
        CCosto.updateLabels(row);

        this.block(savedId);

        const active = document.getElementById("active");
        if (active && d.activo != null) active.checked = !!d.activo;

        // Recalcular totales
        this.calculateTotals();

        toastr.success(
          this.validate() ? NOTIFY.get("SUCCESS_SAVE") : NOTIFY.get("ACCOUNT_WARNING_EQUAL")
        );

        // Enter → agregar nuevo detalle
        if (event?.keyCode === 13) {
          $('li[data-name="addDetails"] button').trigger("click");
        }
      } catch (e) {
        console.error("save success error:", e);
        toastr.error("Error procesando respuesta del servidor.");
        this._keepEditing(tr);
      }
    },

    /** Acualiza la glosa una vez guardada */
    _syncReadWrapLabels(tr) {
      tr?.querySelectorAll("td.read-wrap-cell").forEach(td => {
        const input = td.querySelector("input[name]");
        const label = td.querySelector(".read-wrap-text");

        if (input && label) label.textContent = input.value || "";
      });
    },

    /** Mantiene la fila en modo edición (para errores). */
    _keepEditing(tr, focusCCField) {
      tr.classList.add("is-editing");

      const btnEdit = tr.querySelector("button.edit");
      const btnShow = tr.querySelector("button.show.cuentaContable");
      const btnSave = tr.querySelector("button.save");

      if (btnEdit) btnEdit.style.display = "none";
      if (btnShow) btnShow.style.display = "";
      if (btnSave) btnSave.style.display = "";

      CCosto.ensureEditorOpen(tr, focusCCField);
    },

    delete(event) {
      const id = event.target.closest("tr")?.dataset?.id;
      if (!id) return;

      $.ajax({
        url: "/4DACTION/_V3_setComprobanteDetalle",
        dataType: "json",
        type: "POST",
        data: { delete: true, id },
      }).done(d => {
        if (d.success) {
          document.querySelector(`tr[data-id="${id}"]`)?.remove();
          comprobantes.calculateTotals();
          toastr.success(NOTIFY.get("SUCCESS_DELETE"));
        } else {
          toastr.error(NOTIFY.get("ERROR_INTERNAL"));
        }
      });
    },

    // =========================================================================
    // MISC
    // =========================================================================

    duplicate() {
      $.ajax({
        url: "/4DACTION/_V3_duplicateAsientos",
        type: "POST",
        dataType: "json",
        data: { idAsiento: this.id },
      }).done(d => {
        if (d.success) {
          window.open(
            `http://${window.location.host}/4DACTION/wbienvenidos#comprobantes/content.shtml?id=${encodeURIComponent(d.idAsiento)}`,
            "_blank"
          );
        } else {
          toastr.error("Error al duplicar, intente nuevamente.");
        }
      }).fail(() => toastr.error("Error al duplicar, intente nuevamente."));
    },

    showDialogDTC(object) {
      const row = object?.closest("tr");
      const id = Utils.toText(row?.dataset?.id || object?.dataset?.id).trim();
      if (!id) return;

      this._syncRowIds(row, id);
      object.dataset.id = id;
      localStorage.removeItem("id_detalle_comp");
      localStorage.setItem("id_detalle_comp", id);
      const isDoc = object.dataset.type === "documento";
      unaBase.loadInto.dialog(
        `/v3/views/comprobantes/dialog/${isDoc ? "asignar_dtc.shtml" : "asignar_contacto.shtml"}?id=`,
        isDoc ? "SELECCIONAR DOCUMENTOS DE COMPRA / VENTA" : "SELECCIONAR CONTACTO",
        "x-large"
      );
    },

    getDetail(id) {
      const el = document.querySelector(`tr[data-id="${id}"]`);
      return { line: el, inputs: el?.querySelectorAll("input"), tds: el?.querySelectorAll("td") };
    },

    block(id) {
      document.querySelectorAll(`tr[data-id="${id}"] input`).forEach(inp => {
        if (inp.name !== "codigoCuenta") inp.toggleAttribute("readOnly");
      });
    },

    formatInput(el) {
      el.value = unaBase.utilities.transformNumber(el.value, "int");
    },

    onClickInput(e) { e.select(); },

    /** No-op. Código externo (toolbox, addDetails legacy) puede invocarlo. */
    saveAndAdd() {},

    /**
     * Inicializa TomSelect en una celda de ccosto para una fila nueva.
     * Expuesto para que addDetails (externo al IIFE) pueda reutilizar
     * la lógica de CCosto sin duplicarla.
     */
    _initCCostoForNewRow(selectEl, field) {
      CCosto.initTomSelect(selectEl, "", field);
    },

    menu() {
      unaBase.toolbox.init();
      unaBase.toolbox.menu.init({
        entity: "Comprobantes",
        buttons: ["saveComprobante", "exit", "addDetails", "exportExcel", "generate_reverse_provision", "duplicateAsiento"],
        data: () => { comprobantes.data = domFunc.getDataByClassName("item"); return comprobantes.data; },
        validate: () => comprobantes.validate(),
      });
    },
  };

  // ===========================================================================
  // §10  GLOBALS — exponer al scope global lo necesario
  // ===========================================================================

  window.comprobantes = comprobantes;
  window.verifyCheck  = verifyCheck;

  // Variables legacy que otros scripts esperan
  window.setter     = item => (typeof item === "boolean" ? "checked" : "value");
  window.setterType = type => (type === "checkbox" ? "checked" : "value");
  window.docTypes   = DOC_TYPES;

  // loadDetalleAsientos se usa como onclick en HTML generado
  window.loadDetalleAsientos = loadDetalleAsientos;
  window.collapseRow         = collapseRow;

  // ===========================================================================
  // §11  DOCUMENT READY
  // ===========================================================================

  $(document).ready(function () {
    comprobantes.container = $("#comprobantes");

    unaBase.ui.block();
    comprobantes.menu();
    comprobantes.init($("#comprobantes").data("id"));
    unaBase.ui.unblock();
    unaBase.ui.expandable.init();

    document.querySelector("#excluir").checked       = comprobantes.data.excluir;
    document.querySelector("#check_apertura").checked = comprobantes.data.apertura;

    if (!access._650) $("#excluir-check").hide();
    if (!access._682) $("#check-active").hide();
  });

})();
