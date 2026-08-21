var setter = item => (typeof item === "boolean" ? "checked" : "value");
var setterType = type => (type === "checkbox" ? "checked" : "value");

function verifyCheck(event) {
  var inputs = document.querySelectorAll("#dialog-viewport input[type=checkbox]");
  for (var i = 0; i < inputs.length; i++) {
    let des = false;
    if (event.target.checked) {
      if (!inputs[i].disabled && !inputs[i].checked) {
        des = true
      }

    } else {
      des = false
    }
    inputs[i].disabled = des;
  }
}

function collapseRow(event) {
  let numero_cuenta = event.parentNode.parentNode.children[2].children[0].value
  let table = document.getElementById('detail-data')
  tr = table.getElementsByTagName("tr");

  let n = '', ic = ''

  let il_open = document.createElement("i");
  il_open.classList.add("fas");
  il_open.classList.add("fa-folder-open");
  il_open.style.fontSize = '15px'

  let il_close = document.createElement("i");
  il_close.classList.add("fas");
  il_close.classList.add("fa-folder");
  il_close.style.fontSize = '15px'

  let indexOf, index, e
  index = event.parentNode.parentNode.rowIndex;
  let total_debe, total_haber, debe, haber


  for (i = 0; i < tr.length; i++) {
    td = tr[i].getElementsByTagName("td")[0]
    if (td) {
      n = td.parentNode.children[2].children[0].value
      ic = td.parentNode.children[0].children[0] != undefined ? td.parentNode.children[0].children[0].tagName : ''
      indexOf = td.parentNode.rowIndex

      if (ic === 'BUTTON' && indexOf == index) {

        e = td.parentNode.children[0].children[0].children[0].classList
        if (e.contains("fa-folder-open")) {

          td.parentNode.children[0].children[0].children[0].remove()
          td.parentNode.children[0].children[0].appendChild(il_close)
        } else {

          td.parentNode.children[0].children[0].children[0].remove()
          td.parentNode.children[0].children[0].appendChild(il_open)
        }
      }

      if (n === numero_cuenta && ic !== 'BUTTON') {

        if (tr[i].style.display === 'none') {

          //background-color: aquamarine;
          tr[i].style.backgroundColor = "#CAF0F8";
          tr[i].style.display = "";
        } else {
          tr[i].style.display = "none";

        }
      }
    }


  }

}

var docTypes = {
  DTC: {
    name: folio => `Dtc nro: ${folio}`,
    url: id => `${window.location.origin}/4DACTION/wbienvenidos#dtc/content.shtml?id=${id}`,
    dialog: false
  },
  COMPROBANTE: {
    name: folio => `Dtc nro: ${folio}`,
    url: id => `${window.location.origin}/4DACTION/wbienvenidos#dtc/content.shtml?id=${id}`,
    dialog: false
  },
  NC: {
    name: folio => `NC nro: ${folio}`,
    url: id => `${window.location.origin}/4DACTION/wbienvenidos#dtc/contentnc.shtml?id=${id}`,
    dialog: false
  },
  NDE: {
    name: folio => `NC nro: ${folio}`,
    url: id => `${window.location.origin}/4DACTION/wbienvenidos#dtc/contentnd.shtml?id=${id}`,
    dialog: false
  },
  DTV: {
    name: folio => `Dtv nro: ${folio}`,
    url: id => `${window.location.origin}/4DACTION/wbienvenidos#dtv/content.shtml?id=${id}`,
    dialog: false
  },
  NCV: {
    name: folio => `Dtv NC nro: ${folio}`,
    url: id => `${window.location.origin}/4DACTION/wbienvenidos#dtv/nc/content.shtml?id=${id}`,
    dialog: false
  },
  OP: {
    name: folio => `Orden de Pago nro: ${folio}`,
    url: id => `${window.location.origin}/4DACTION/wbienvenidos#pagos/content.shtml?id=${id}`,
    dialog: false
  },
  OC: {
    name: folio => `Orden de compra nro: ${folio}`,
    url: id => `${window.location.origin}/4DACTION/wbienvenidos#compras/content.shtml?id=${id}`,
    dialog: false
  },
  FXR: {
    name: folio => `Rendición nro: ${folio}`,
    url: id => `${window.location.origin}/4DACTION/wbienvenidos#compras/content.shtml?id=${id}`,
    dialog: false
  },
  FTG: {
    name: folio => `Factoring nro: ${folio}`,
    url: id => `${window.location.origin}/4DACTION/wbienvenidos#compras/content_factoring.shtml?id=${id}`,
    dialog: false
  },
  NV: {
    name: folio => `Negocio nro: ${folio}`,
    url: id => `${window.location.origin}/4DACTION/wbienvenidos#negocios/content.shtml?id=${id}`,
    dialog: false
  },
  OCB: {
    name: folio => `Cobro nro: ${folio}`,
    url: id => `${window.location.origin}/4DACTION/wbienvenidos#pagos/dialog/pago.shtml?id=${id}`,
    dialog: true
  },
  NONE: {
    name: folio => `Sin documento`,
    url: id => ``,
    dialog: false
  }
}

var comprobantes = {
  data: {
    active: null,
    description: null,
    docType: null,
    registryDate: null,
    registryHour: null,
    docDate: null,
    docHour: null,
    id: 0,
    ok: false
  },
  container: $("#comprobantes"),
  menubar: $("#menu ul"),
  init: function (id) {
    $.ajax({
      url: "/4DACTION/_V3_proxy_getComprobante",
      data: {
        id: id
      },
      dataType: "json",
      async: false,
      success: function (data) {


        comprobantes.data = data;
        comprobantes.data.docType = comprobantes.data.docType.toLocaleLowerCase()
        comprobantes.id = data.id;
        if (data.id === 0) {
          data.active = true;
        }
        $(`li[data-name="generate_reverse_provision"]`).hide();

        
        if (data.provision_sale === true || data.provision_expense === true) {
          $("li[data-name='generate_reverse_provision']").show();
        }

        if(data.reverse_generated === true){
          $("li[data-name='generate_reverse_provision']").hide();
        }

        // domFunc.setList({
        // 	data: data.details,
        // 	selector: "table#detail tbody",
        // 	type: "tr",
        // 	showId: false,
        // 	readOnly: ["codigoCuenta"]
        // });
        let html = "";
        let innerLine = "";
        let btn_plus = "";
        let style = ""
        const container = document.querySelector("table#detail tbody");
        let debe = 0;
        let haber = 0;
        let codigo_cuenta = ""
        const formatearNumero = (numeroTexto, decimales) => {
          const numero = parseFloat(String(numeroTexto).replace(',', '.'));
          return numero.toLocaleString('de-DE', { minimumFractionDigits: decimales, maximumFractionDigits: decimales });
        };

        const result = data.details.reduce((acc, { haber, debe, ...r }) => {
          const key = r.codigoCuenta;

          if (!acc[key]) {
            acc[key] = { ...r, debe: 0, haber: 0, count: 0 };
          }

          acc[key].debe += parseFloat(debe.replaceAll(',', '.'));
          acc[key].haber += parseFloat(haber.replaceAll(',', '.'));
          acc[key].count++;

          return acc;
        }, {});

        const grouped = Object.values(result);

        let tr_total = ""


        for (let element of data.details) {
          if (codigo_cuenta !== element.codigoCuenta) {
            grouped.map(val => {
              if (val.codigoCuenta === element.codigoCuenta) {
                if (val.count > 1) {
                  btn_plus = '<button type="button" style="float: left; padding: 10px;" onclick="collapseRow(this)"><i class="fa-solid fa-folder" style="font-size: 15px"></i><button/>'
                  let res = Math.abs(val.debe) - Math.abs(val.haber)
                  debe = res >= 0 ? res : 0
                  haber = res < 0 ? res : 0
                  tr_total = `<tr style="background-color: #D0F7EB;">
                    <td>${btn_plus}</td>
                    <td></td>
                    <td><input readonly value="${element.codigoCuenta}" type="text" /></td>
                    <td><input readonly value="${element.cuentaContable}" type="text" /></td>
                    <td><input class="format-all" readonly  value="${unaBase.utilities.transformNumber(Math.abs(debe), 'int')}" onkeyup="unaBase.utilities.general.formater(this)" type="text"/></td>
                    <td><input class="format-all" readonly value="${unaBase.utilities.transformNumber(Math.abs(haber), 'int')}" onkeyup="unaBase.utilities.general.formater(this)" type="text"/></td>
                    <td></td>                                          
                    <td></td>                       
                  </tr>`
                  style = 'style="display:none;"'

                } else {
                  tr_total = ``
                  debe = val.debe
                  haber = val.haber
                  btn_plus = ''
                  style = ''
                }
              }
            })


          } else {
            debe = element.debe
            haber = element.haber
            btn_plus = ''
            style = element.codigoCuenta === '' ? '' : 'style="display:none;"'
          }

          codigo_cuenta = element.codigoCuenta;

          cuentaContableButton = `<button style="display:none; width: 24px; z-index: 0;"  data-id="${element.id}" class="show cuentaContable" onClick="comprobantes.showCuentaContable(event)"><span class="ui-icon ui-icon-carat-1-s"></span></button>`;

          let typeDoc = element.typeDoc !== "" && element.typeDoc != "NaN" && element.typeDoc != "nan" ? element.typeDoc : "none";
          typeDoc = typeDoc.toUpperCase()

          innerLine = `
    <td class="contacto" data-idcont="${element.idCont}"><div>${element.auxiliar ? '<span readonly name="auxiliar_rut_' + element.id + '">' + element.auxiliar_rut + '</span><br><span readonly name="auxiliar_desc_' + element.id + '">' + element.auxiliar_desc + '</span><button style="display: none" class="search-btn" data-type="auxiliar" data-id="' + element.id + '" onClick="comprobantes.showDialogDTC(this)"><span class="ui-icon ui-icon-search"></span></button>' : ''}</div></td>
    <td class="documento" data-iddoc="${element.idDoc}" data-doctype=${element.typeDoc}><div>${element.documento ? '<a name="documento_desc_' + element.id + '" target="_blank" data-dialog="' + docTypes[typeDoc].dialog + '" href="' + docTypes[typeDoc].url(element.idDoc) + '" >' + docTypes[typeDoc].name(element.folioDoc) + ' / ' + element.param4 + '</a>' + (unaBase.parametros.ocultar_lupa_doc_asiento ? '' : '<button class="search-btn" data-type="documento" style="display: none"  data-id="' + element.id + '" onClick="comprobantes.showDialogDTC(this)"><span class="ui-icon ui-icon-search"></span></button>') : ''}</div></td>

    <td><input readonly name="codigoCuenta" value="${element.codigoCuenta}" type="text" /></td>
    <td style="display: flex;align-items: center;height: 39px;flex-direction: row-reverse;">${cuentaContableButton}<input readonly name="cuentaContable" value="${element.cuentaContable}" type="text" /></td>

    <td class=""><input class="format-all" readonly name="debe" value="${formatearNumero(element.debe, currency.decimals)}"  onkeyup="unaBase.utilities.general.formater(this)" onkeydown="comprobantes.formatInput(this)" onclick="comprobantes.onClickInput(this)" type="text" /></td>
    <td class=""><input class="format-all" readonly name="haber" value="${formatearNumero(element.haber, currency.decimals)}" onkeyup="unaBase.utilities.general.formater(this)" onkeydown="comprobantes.formatInput(this)" onclick="comprobantes.onClickInput(this)" type="text" /></td>`;



          html = $(`${tr_total}<tr data-id="${element.id}" ${style}>
                                ${innerLine}
                                <td><button class="edit" onClick="comprobantes.edit(event)"><span class="ui-icon ui-icon-pencil"></span></button><button style="display:none" class="save" onClick="comprobantes.save(event)"><span class="ui-icon ui-icon-disk"></span></button></td>                       
                                                       
                                <td><button class="delete" onClick="comprobantes.delete(event)"><span class="ui-icon ui-icon-close"></span></button></td>                       
                            </tr>`);
          innerLine = "";
          tr_total = ""






          $(container).append(html);
          let line = $(html).find('a');
          if (line.length > 0) {
            if (line[0].dataset.dialog === "true") {
              line[0].href = "#";
              line[0].addEventListener("click", function (event) {
                event.preventDefault()
                unaBase.loadInto.dialog('/v3/views/ingresos/dialog/ingreso.shtml?id=' + data.id, 'Ingreso', 'large');
              })
            }
          }

          comprobantes.saveAndAdd($(html));
        }
        // html += `<tr class="totals" >
        //                         <td colspan=2>Total:</td>                                     
        //                         <td ><input disabled value="" class="debe" type="number" /></td>                                     
        //                         <td ><input disabled value="" class="haber" type="number" /></td>  
        //                         <td colspan=2 ><input disabled value="" class="total" type="number" /></td>                                                               
        //                     </tr>`;
        //                     </tr>`;
        html = $(`<tr class="totals" >
                                <td colspan="4">Total:</td>                                     
                                <td><input disabled value="" class="debe" type="text" /></td>                                     
                                <td><input disabled value="" class="haber" type="text" /></td>  
                                <td colspan=2><input disabled value="" class="total" type="text" /></td>                                                               
                            </tr>`);
        $(container).append(html);
        // container.innerHTML = html;
        // comprobantes.saveAndAdd($(html));
        comprobantes.calculateTotals();

        domFunc.setFormJquery({
          data,
          disabled: ["registryDate"],
          extraData: true
        });
        $("#docDate").datepicker();
        const docDate = document.querySelector('#docDate');

        const getFormattedDate = () => {
          var date = new Date();
          var day = date.getDate().toString().padStart(2, '0');
          var month = (date.getMonth() + 1).toString().padStart(2, '0');
          var year = date.getFullYear();
          return `${day}/${month}/${year}`;
        }

        let currentDate = getFormattedDate();

        if (!docDate.value || docDate.value === '00-00-00') {
          docDate.value = currentDate;
        }
        // $(".numeric.currency input").number(true, currency.decimals, currency.decimals_sep, currency.thousands_sep);

        comprobantes.addEvent13();
        comprobantes.addFormatAll();

        $.ajax({
          url: "/4DACTION/_V3_get_estadoPeriodoContable",
          data: {
            periodo: data.registryDate,
            origen: "ext modulos"
          },
          dataType: "json",
          async: false,
          success: function (subdata) {

            if (subdata.exists == 1) {
              if (subdata.closed == 1) {
                cierreContable = true;
                $('#menu [data-name="save"]').remove();

                $('#menu [data-name="addDetails"]').remove();


                let all = $("#viewport");

                all.find("input").prop("readonly", true);
                all.find("input").prop("disabled", true);
                all.find("button.detail.item").hide();
                all.find("button.profile.item").hide();
                all.find(`input[type="checkbox"]`).prop("disabled", true);
                all.find(`input[type="text"]`).prop("disabled", true);
                all.find(`input[type="search"].datepicker`).prop("disabled", true);
                all.find(`select`).prop("disabled", true);
                all.find(`button[type="button"]`).prop("disabled", true);
                all.find("button").prop("disabled", true);
                all.find("button").remove();

                // $('#menu [data-name="new_payment"]').remove();
                // $('#menu [data-name="discard"]').remove();

                toastr.warning(
                  "El periodo seleccionado  se encuentra cerrado por tanto no puede modificar este comprobente."
                );


              }

            } else {
              toastr.warning(
                "El periodo contable para este comprobante no está creado.");

            }
          }
        });

        if (!access._663) {


          ('#menu [data-name="create_accounting_period"]').remove();
          ('#menu [data-name="status_accounting_period"]').remove();
          ('#menu [data-name="close_accounting_period"]').remove();
          ('#menu [data-name="open_accounting_period"]').remove();

        }




      }
    });


    const tabs = document.querySelectorAll('.ub-tab');
    const contentContainers = document.querySelectorAll('.ub-content-container');

    tabs.forEach(tab => {
      tab.addEventListener('click', () => {
          // Remover la clase activa de todas las pestañas
          tabs.forEach(tab => tab.classList.remove('ub-active-tab'));
          
          // Añadir la clase activa a la pestaña seleccionada
          tab.classList.add('ub-active-tab');
          
          // Ocultar todos los contenedores de contenido
          contentContainers.forEach(container => container.style.display = 'none');
          
          // Mostrar el contenedor de contenido correspondiente
          const contentId = tab.getAttribute('data-content');
          const contentContainer = document.getElementById(contentId);
          contentContainer.style.display = 'block';
          
          // Cargar contenido dinámico si es la pestaña 'historial'
          if (contentId === 'historial') {
              fetch(`/v3/views/historial/index.shtml?id=${comprobantes.id}&mod=Comprobantes`)
                  .then(response => response.text())
                  .then(data => {
                      contentContainer.innerHTML = data;
                  })
                  .catch(error => console.error('Error al cargar el contenido:', error));
          }
      });
     });
  

  },
  addAutocomplete(item) {
    $(item)
      .autocomplete({
        source: function (request, response) {
          $.ajax({
            url: "/4DACTION/_V3_getParamContable",
            dataType: "json",
            data: {
              q: request.term
            },
            success: function (data) {
              response(
                $.map(data.rows, function (item) {

                  return item;
                })
              );
            }
          });
        },
        minLength: 0,
        autoFocus: true,
        delay: 0,
        position: {
          my: "left top",
          at: "left bottom",
          collision: "flip"
        },
        open: function () {
          $(this)
            .removeClass("ui-corner-all")
            .addClass("ui-corner-top");
        },
        close: function () {
          $(this)
            .removeClass("ui-corner-top")
            .addClass("ui-corner-all");
        },
        focus: function (event, ui) {
          //$(this).val(ui.item.text);
          return false;
        },
        response: function (event, ui) { },
        select: function (event, ui) {
          const trId = $(event.target).closest("tr")[0].dataset.id;
          const tr = document.querySelector(`tr[data-id="${trId}"]`);

          tr.querySelector(`td input[name="codigoCuenta"]`).value = ui.item.number;
          tr.querySelector(`td input[name="cuentaContable"]`).value = ui.item.name;

          const cuentaContable = $(tr).find(`input[name="cuentaContable"]`);
          cuentaContable.css("background-color", "inherit");

          if (ui.item.auxiliar)
            tr.querySelector(`td.contacto div`).style.display = ""
          else
            tr.querySelector(`td.contacto div`).style.display = "none"

          if (ui.item.documento)
            tr.querySelector(`td.documento div`).style.display = ""
          else
            tr.querySelector(`td.documento div`).style.display = "none"
        }
      })
      .data("ui-autocomplete")._renderItem = function (ul, item) {
        return $(
          '<li><a><strong class="highlight">' +
          item.name +
          "</strong><em>" +
          item.number +
          "</em><span>" +
          item.type +
          "</span></a></li>"
        ).appendTo(ul);
      };
  },
  showCuentaContable(event) {
    const id = event.target.parentNode.dataset.id;
    $(`tr[data-id="${id}"] input[name="cuentaContable"]`)
      .autocomplete("search", "@")
      .focus();
  },

  checkPeriodoContable() {
    return new Promise((resolve, reject) => {

      $.ajax({
        url: "/4DACTION/_V3_get_estadoPeriodoContable",
        data: {
          periodo: $('#comprobantes [name="docDate"]').val(),
          origen: "ext modulos"
        },
        dataType: "json",
        async: false,
        success: function (subdata) {

          if (subdata.exists == 1) {
            if (subdata.closed == 1) {
              reject()

              toastr.warning(
                "El periodo seleccionado se encuentra cerrado, por tanto no puede guardar este comprobante ."
              );


            } else {
              resolve()
            }

          } else {
            reject()
            toastr.warning(
              "El periodo contable para este comprobante no está creado.");
          }
        }
      });



    });
  },

  checkComprobante(type) {
    return new Promise((resolve, reject) => {

      $.ajax({
        url: "/4DACTION/_force_check_comprobante",
        data: {
          id: comprobantes.data.id,
          type_check: type
        },
        dataType: "json",
        async: false,
        success: function (subdata) {
            
            if (subdata.success) {
              resolve(true)
            } else {
              reject(false)
            }
          
        }
      });



    });
  },
  showDialogDTC(object) {
    localStorage.removeItem("id_detalle_comp")

    let id = object.dataset.id
    localStorage.setItem("id_detalle_comp", id)


    unaBase.loadInto.dialog(
      `/v3/views/comprobantes/dialog/${object.dataset.type == "documento" ? 'asignar_dtc.shtml' : 'asignar_contacto.shtml'}?id=`,
      `${object.dataset.type == "documento" ? 'SELECCIONAR DOCUMENTOS DE COMPRA / VENTA' : 'SELECCIONAR CONTACTO'}`,
      "x-large"
    );
  },
  calculateTotals() {

    const debeValues = document.querySelectorAll('input[name="debe"]');
    const haberValues = document.querySelectorAll('input[name="haber"]');
    let debe = 0;
    let haber = 0;
    // let re = reFromCurrency(currency);
    for (const item of debeValues) {
      // debe += parseFloat(item.value.replace(reThousand,"").replace(reDecimal, ".")) || 0;
      debe += parseStrToInt(item.value, currency) || 0;
    }
    for (const item of haberValues) {
      // haber += parseFloat(item.value.replace(reThousand,"").replace(reDecimal, ".")) || 0;
      haber += parseStrToInt(item.value, currency) || 0;
    }

    const formatearNumero = (numeroTexto, decimales) => {
      const numero = parseFloat(String(numeroTexto).replace(',', '.'));
      return numero.toLocaleString('de-DE', { minimumFractionDigits: decimales, maximumFractionDigits: decimales });
    };


    debe = formatearNumero(debe, currency.decimals)
    haber = formatearNumero(haber, currency.decimals)

    const debeInput = document.querySelector("tr.totals input.debe");
    const haberInput = document.querySelector("tr.totals input.haber");
    const totalInput = document.querySelector("tr.totals input.total");

    debeInput.value = debe
    haberInput.value = haber
    totalInput.value = formatearNumero(Math.abs(parseFloat(debe.replace(/\./g, '')) - parseFloat(haber.replace(/\./g, ''))), currency.decimals);

    const debeRaw = debe.replace(/[.,]/g, "");
    const haberRaw = haber.replace(/[.,]/g, "");

    if (Math.abs(debeRaw - haberRaw) !== 0) totalInput.classList.add("redBold");
    else totalInput.classList.remove("redBold");


    if (debeRaw > haberRaw) {
      haberInput.classList.add("redBold");
      debeInput.classList.remove("redBold");
    } else if (debeRaw < haberRaw) {
      haberInput.classList.remove("redBold");
      debeInput.classList.add("redBold");
    } else {
      haberInput.classList.remove("redBold");
      debeInput.classList.remove("redBold");
    }
  },

  formatInput(event) {
    let input_value = event.value
    input_value = unaBase.utilities.transformNumber(input_value, 'int');
    //comprobantes.calculateTotals();

  },

  onClickInput(e) {
    e.select();
  },
  getDetail(id) {

    const detail = document.querySelector(`tr[data-id="${id}"]`);
    return {
      line: detail,
      inputs: detail.querySelectorAll("input"),
      tds: detail.querySelectorAll("td"),
    };
  },
  block(id) {
    console.log("block");
    const items = document.querySelectorAll(`tr[data-id="${id}"] input`);
    for (const item of items) {
      if (item.name !== "codigoCuenta") item.toggleAttribute("readOnly");
    }
  },
  saveAndAdd(html) {
    // html.find(`input[name="haber"]`).keydown(function (event) {
    //   console.log("on key down");
    //   console.log(event);
    //   const keyDown = event.keyCode;

    //   const cuentaContable = $(this)
    //     .closest("tr")
    //     .find(`input[name="cuentaContable"]`);
    //   if (keyDown === 13 && cuentaContable.val() !== "") {
    //     // $(this)
    //     //   .closest("td")
    //     //   .next()
    //     //   .find("button.save")
    //     //   .click();
    //     unaBase.ui.block();
    //     setTimeout(() => {
    //       $(`li[data-name="addDetails"] button`).click();

    //       unaBase.ui.unblock();
    //     }, 1000);
    //   } else if (keyDown === 13 && cuentaContable.val() === "") {
    //     cuentaContable.css("background-color", "red");
    //     toastr.warning("Debes seleccionar una cuenta contable.");
    //   }
    // });
  },
  edit: function (event) {

    let res = comprobantes.checkPeriodoContable()

    const id = $(event.target).closest("tr")[0].dataset.id;

    $(`tr[data-id="${id}"] button.search-btn`).css("display", "");

    document.querySelector(`tr[data-id="${id}"] button.edit`).style.display = "none";
    document.querySelector(`tr[data-id="${id}"] button.show.cuentaContable`).style.display = "";
    document.querySelector(`tr[data-id="${id}"] button.save`).style.display = "";


    comprobantes.block(id);
  },
  save: function (event) {
    if (comprobantes.id > 0) {
      console.log('Se guardo comprobante')
      const tr = $(event.target).closest("tr");
      const id = tr[0].dataset.id;
      let iddetalle = id
      const cuentaContable = tr.find(`input[name="cuentaContable"]`);
      const debe = parseFloat(tr.find(`input[name="debe"]`).val().replaceAll(',', '.'));
      const haber = parseFloat(tr.find(`input[name="haber"]`).val().replaceAll(',', '.'));

      if (cuentaContable.val() == "") {
        toastr.warning(
          "Debes seleccionar una cuenta contable para agregar otro detalle."
        );
        return
      }

      

      if ((debe == 0 && haber == 0) || (haber > 0 && debe > 0)) {
        toastr.warning(
          "Debes agregar un valor en debe o haber."
        );

        return;
      }


      if ($(event.target).closest("tr").hasClass('new'))
        iddetalle = 0

      if (cuentaContable.val() !== "") {


        const data = domFunc.getObjectFromNodes(comprobantes.getDetail(id).inputs);



        if (comprobantes.data.docType) {


          const data2 = comprobantes.getDetail(id).tds
          data['idAuxiliar'] = data2[0].dataset.idcont
          data['idDocumento'] = data2[1].dataset.iddoc
          data['tipoDocumento'] = data2[1].dataset.doctype.toLocaleLowerCase()

        }

        $.ajax({
          url: `/4DACTION/_V3_setComprobanteDetalle`,
          dataType: "json",
          type: "POST",
          async: false,
          data: {
            id: iddetalle,
            ...data,
            idComprobante: comprobantes.id
          },
          success: function (d) {
            if (d.success) {
              $(`tr[data-id="${id}"] button.search-btn`).css("display", "none");
              document.querySelector(`tr[data-id="${id}"] button.edit`).style.display = "";
              document.querySelector(`tr[data-id="${id}"] button.show.cuentaContable`).style.display =
                "none";
              document.querySelector(`tr[data-id="${id}"] button.save`).style.display = "none";

              comprobantes.block(id);
              let tr = $(event.target).closest("tr")[0]
              tr.dataset.id = d.id;
              tr.classList.remove("new");

              document.getElementById('active').checked = d.activo //Controla check de activo en caso de que comprobante quede guardado bien o no
              comprobantes.calculateTotals();
              if (comprobantes.validate()) {
                toastr.success(NOTIFY.get("SUCCESS_SAVE"));
                if (event.keyCode && event.keyCode == 13) {
                  $('li[data-name="addDetails"] button').trigger('click');
                }
              } else {
                toastr.success(NOTIFY.get("ACCOUNT_WARNING_EQUAL"));
              }
            } else {
              d.errorMsg ? toastr.warning(d.errorMsg) : toastr.success(NOTIFY.get("ERROR_INTERNAL"));


            }
          }
        });
      } else {
        cuentaContable.css("background-color", "red");
        toastr.warning("Debes seleccionar una cuenta contable.");
      }
    } else {
      toastr.warning("Debes Guardar el comprobantes antes de agregar un detalle.");
    }
  },
  delete: function (event) {
    const id = $(event.target).closest("tr")[0].dataset.id;

    $.ajax({
      url: `/4DACTION/_V3_setComprobanteDetalle`,
      dataType: "json",
      type: "POST",
      data: {
        delete: true,
        id
      }
    }).done(function (data) {
      if (data.success) {
        const line = document.querySelector(`tr[data-id="${id}"]`);
        line.parentNode.removeChild(line);
        comprobantes.calculateTotals();
        toastr.success(NOTIFY.get("SUCCESS_DELETE"));
      } else {
        toastr.success(NOTIFY.get("ERROR_INTERNAL"));
      }
    });
  },
  validateNumbers() {
    const debeValues = document.querySelectorAll('input[name="debe"]');
    const haberValues = document.querySelectorAll('input[name="haber"]');
    let debe = 0;
    let haber = 0;
    // let patternThousand = `\\${currency.thousands_sep}`;
    // let patternDecimal = `\\${currency.decimals_sep}`;
    // let reThousand = new RegExp(patternThousand, "g");
    // let reDecimal = new RegExp(patternDecimal, "g");
    // let re = reFromCurrency(currency);
    for (const item of debeValues) {
      // debe += parseFloat(item.value.replace(reThousand,"").replace(reDecimal, ".")) || 0;
      debe += parseStrToInt(item.value, currency) || 0;
    }
    for (const item of haberValues) {
      // haber += parseFloat(item.value.replace(reThousand,"").replace(reDecimal, ".")) || 0;
      haber += parseStrToInt(item.value, currency) || 0;
    }
    debe = debe.toFixed(2)
    haber = haber.toFixed(2)

    return debe === haber;
  },
  validate() {
    const docType = document.querySelector(`select[name="docType"]`);
    const description = document.querySelector(`[name="description"]`);

    if (description.value === '') {
      description.style.border = '2px solid #F47975'
    }

    if (docType.value === '') {
      docType.style.border = '2px solid #F47975'
    }


    return docType.value !== "" && description.value !== "";
  },
  menu: function () {
    unaBase.toolbox.init();
    unaBase.toolbox.menu.init({
      entity: "Comprobantes",
      buttons: ["saveComprobante", "exit", "addDetails", "exportExcel", 'generate_reverse_provision'],
      data: function () {
        comprobantes.data = domFunc.getDataByClassName("item");
        return comprobantes.data;
      },
      validate: function () {
        return comprobantes.validate();
      }
    });
  },
  addEvent13: (i = "") => {
    $(`tr${i != "" ? '[data-id="' + i + '"]' : ''} input`).keypress(function (event) {

      var keycode = (event.keyCode ? event.keyCode : event.which);
      const tr = event.target.closest('tr')
      if (keycode == '13') {
        comprobantes.save(event)
      }
    });

  },
  addFormatAll: (i = '') => {
    $(`tr${i != "" ? '[data-id="' + i + '"]' : ''} input.format-all`).keyup(function (event) {

      var keycode = (event.keyCode ? event.keyCode : event.which);
      if (keycode != '13' && this.value != '') {
        if (this.value.includes('-') && this.value.length > 1) {
          this.value = '-' + unaBase.utilities.transformNumber(this.value, "format-all")
        }


        // if(!this.value.includes('-')){
        //   this.value = unaBase.utilities.transformNumber(this.value, "format-all")
        // }
      }
    });

  }
};

$(document).ready(function () {
  unaBase.ui.block();
  comprobantes.menu();
  comprobantes.init($("#comprobantes").data("id"));
  unaBase.ui.unblock();
  unaBase.ui.expandable.init();

  document.querySelector('#excluir').checked = comprobantes.data.excluir


  document.querySelector('#check_apertura').checked = comprobantes.data.apertura

  if (!access._650) {
    $("#excluir-check").hide();
  }

  if (!access._682) {
    $("#check-active").hide();
  }
});