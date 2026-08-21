const btnSave = document.getElementById('modal-custom-accept')
const btnCancel = document.getElementById('modal-custom-cancel')

const modalCustom = document.getElementById("modalCustom");

/**
 * Emite el documento y crea su asiento contable desde el modal compartido.
 *
 * Sirve a DTV, NC y ND: el contexto (ACC_DOC) aporta el sheet, los montos, el
 * tipodoc del asiento y la ruta de emisión, que en cada tipo es la que ese
 * documento ya usaba antes de unificar el modal.
 *
 * El asiento se envía tal como lo muestra la tabla: para NC/ND las filas ya
 * vienen invertidas desde saveDocConReparto y 4D no reinterpreta el signo.
 *
 * @param {Object} opciones
 * @param {Object} opciones.ctx   entrada de ACC_DOC.
 * @param {string} opciones.modo  "manual" | "electronico".
 */
const actionModalCustomEmitir = async ({ ctx, modo } = {}) => {
    if (!ctx || !ctx.emitir?.[modo]) {
        toastr.error('No se pudo determinar el tipo de documento a emitir.');
        return;
    }

    // =========== Helpers ===========
    const fmt = (n) => (Number(n || 0)).toLocaleString('es-CL');
    const getFechaISOFromDDMMYYYY = (ddmmyyyy) => {
        // dd-mm-aaaa -> aaaa-mm-dd
        if (!ddmmyyyy) return '';
        const [dd, mm, yyyy] = ddmmyyyy.split('-');
        return `${yyyy}-${mm}-${dd}`;
    };
    const diffDiasHoyAbs = (iso) => {
        const f1 = new Date(iso);
        const f2 = new Date();
        return Math.abs(Math.round((f1 - f2) / (1000 * 60 * 60 * 24)));
    };

    // =========== UI: bloquear ===========
    unaBase.ui.block();
    const blockTimeout = setTimeout(() => {
        unaBase.ui.unblock();
        toastr.warning('El proceso está tardando más de lo habitual. Intenta nuevamente si no termina.');
    }, 30000);

    try {
        // =========== 1) Preparar y validar datos de filas ===========
        const rows = document.querySelectorAll('#cuentasTableBody tr');
        const id = ctx.id();
        const docData = ctx.doc();
        const asientoData = [];

        const montoTotalFactura = parseFloat(docData.montos.total) || 0;
        let totalDebe = 0;
        let totalHaber = 0;
        let validRows = true;

        rows.forEach((row) => {
            const cuentaContable = row.querySelector('.cuenta-contable')?.value?.trim();
            const debe = Number((row.querySelector('.input-debe')?.value || '0').replaceAll('.', '').replace(',', '.')) || 0;
            const haber = Number((row.querySelector('.input-haber')?.value || '0').replaceAll('.', '').replace(',', '.')) || 0;
            const fechaContable = document.querySelector(".date-facturar-dtv").value.split("-").reverse().join("-");

            if (!cuentaContable || (!debe && !haber) || (debe && haber)) {
                validRows = false;
            } else {
                totalDebe += debe;
                totalHaber += haber;
                asientoData.push({
                    cuenta: cuentaContable,
                    debe, haber,
                    tipodoc: ctx.tipodoc,
                    iddoc: id,
                    fechaEmision: fechaContable
                });
            }
        });

        if (!validRows || asientoData.length === 0) {
            toastr.error('Cada fila debe tener una cuenta contable y solo un valor en Debe o Haber.');
            return;
        }

        if (totalDebe > montoTotalFactura || totalHaber > montoTotalFactura) {
            toastr.error(`El total Debe (${fmt(totalDebe)}) o Haber (${fmt(totalHaber)}) no puede superar el monto total del documento (${fmt(montoTotalFactura)}).`);
            return;
        }

        if (totalDebe !== totalHaber) {
            toastr.error(`El asiento no está balanceado. Debe: ${fmt(totalDebe)} vs Haber: ${fmt(totalHaber)}. Deben ser iguales.`);
            return;
        }

        // =========== 2) Validaciones cliente / cabecera ===========
        // Regla de RUT propia de cada tipo de documento. Es la de emisión, que en
        // DTV es más estricta que la que se aplica antes de abrir el modal.
        const vRut = ctx.validarRutEmision();
        if (!vRut.ok) {
            toastr.warning(vRut.msg);
            return;
        }

        const giro = $('input[name="contacto[info][giro]"]').val() || '';
        if (giro.length > 40) {
            toastr.warning('El giro del cliente excede 40 caracteres. Ajusta la ficha antes de emitir.');
            return;
        }

        // Fecha de emisión (desde input existente dd-mm-aaaa en tu UI)
        const fechaDoc_DDMMYYYY = $(`${ctx.sheet} input[name="fecha_emision"]`).val(); // dd-mm-aaaa
        const fechaEmisionISO = getFechaISOFromDDMMYYYY(fechaDoc_DDMMYYYY); // aaaa-mm-dd
        if (!fechaEmisionISO) {
            toastr.error('Fecha de emisión inválida.');
            return;
        }
        if (ctx.validaFecha10Dias(modo) && diffDiasHoyAbs(fechaEmisionISO) > 10) {
            toastr.warning('La fecha de emisión no puede superar los 10 días de diferencia con la fecha actual.');
            return;
        }

        const tipoLabel = ctx.tipoLabel();

        // =========== 3) Emitir SIEMPRE primero ===========
        const aplicarUITrasEmision = (folio, fechaISO) => {
            const [y, m, d] = (fechaISO || '').split('-');
            const $sheet = $(ctx.sheet);
            $sheet.find('span[data-name="folio"]').text(folio);
            $sheet.find('span[data-name="fecha_emision"]').text(`${d}-${m}-${y}`);
            $sheet.find('span[data-name="estado"]').text('EMITIDA');
            $sheet.find('input[name="folio"]').val(folio);
            $sheet.find('input[name="fecha_emision"]').val(`${d}-${m}-${y}`);
            $('#menu').find(ctx.botones.map((b) => `[data-name="${b}"]`).join(', ')).hide();
            if (ctx.mostrarTrasEmitir?.length) {
                $('#menu').find(ctx.mostrarTrasEmitir.map((b) => `[data-name="${b}"]`).join(', ')).show();
            }
            $sheet.find('button.edit').hide();
            $sheet.find('input.edit, textarea.edit').prop('readonly', true).removeClass('datepicker');
            $(`${ctx.sheet} table.items`).find('input').prop('readonly', true);
        };

        const emitir = async () => {
            const cfg = ctx.emitir[modo];
            // El manual toma folio y fecha de los inputs del modal; el electrónico
            // usa la fecha de emisión del documento y 4D asigna el folio.
            const folioModal = document.querySelector('.folio-facturar-dtv')?.value || '';
            const fechaModalISO = document.querySelector('.date-facturar-dtv')?.value || '';
            const payload = cfg.body({
                id,
                folio: folioModal,
                fecha: modo === 'manual' ? fechaModalISO : fechaEmisionISO,
                tipoLabel
            });

            let data;
            if (cfg.via === 'node') {
                const r = await axios({ method: 'post', url: cfg.url(), data: payload });
                if (!r?.data?.success) throw new Error(cfg.errorMsg(r));
                data = cfg.unwrap(r);
            } else {
                // $.ajax rechaza con el jqXHR, no con un Error: se traduce para no
                // perder el mensaje de red que mostraba el flujo anterior.
                let r;
                try {
                    r = await $.ajax({ url: cfg.url(), data: payload, dataType: 'json', type: 'POST' });
                } catch (xhr) {
                    console.error('Fallo de red al emitir:', xhr);
                    throw new Error('Error de red al emitir el documento');
                }
                if (!r?.success) throw new Error(cfg.errorMsg(r));
                data = cfg.unwrap(r);
            }

            aplicarUITrasEmision(data.index, data.date);
            toastr.success(ctx.msgEmitido(data.index));
            unaBase.inbox.send({
                subject: ctx.inboxSubject(data.index),
                into: 'viewport',
                href: ctx.reload(id),
                tag: 'avisos'
            });

            // Sólo el electrónico descarga el PDF, igual que antes de unificar.
            if (modo === 'electronico' && ctx.pdf) {
                $.ajax({
                    url: ctx.pdf,
                    data: { id, cedible: false },
                    success: (url) => { if (url) window.open(url); }
                });
            }

            return data;
        };

        await emitir();

        // =========== 4) SOLO si la emisión fue exitosa, crear asientos ===========
        const fechaContable = document.querySelector('.date-facturar-dtv')?.value
        const cfgAsiento = {
            method: 'post',
            url: `${nodeUrl}/create-asiento-contable?type=${ctx.tipodoc.toLowerCase()}&sid=${unaBase.sid.encoded()}&hostname=${window.location.origin}&fecha_contable=${fechaContable}`,
            data: asientoData
        };
        const respAsiento = await axios(cfgAsiento);

        if (respAsiento?.data?.success) {
            toastr.success('Asiento contable creado correctamente.');
            // Cerrar modal y recargar vista
            document.querySelector('#modalCustom').style.display = 'none';
            unaBase.loadInto.viewport(ctx.reload(id), undefined, undefined, true);
        } else {
            toastr.error('El documento fue emitido, pero no se pudo crear el asiento contable.');
            console.warn('Respuesta asiento:', respAsiento?.data);
        }

    } catch (err) {
        console.error('Error general:', err);
        // emitir() propaga el errorMsg que devuelve 4D: se muestra tal cual en vez
        // de un mensaje genérico, que era lo que dejaba al usuario sin diagnóstico.
        toastr.error(err?.message || 'Error inesperado en el proceso.');
    } finally {
        clearTimeout(blockTimeout);
        unaBase.ui.unblock();
    }
};


const actionModalCustomManual = async () => {
    unaBase.ui.block();
    let blockTimeout = setTimeout(() => {
        unaBase.ui.unblock();
        toastr.warning("El proceso está tardando más de lo habitual. Intenta nuevamente si no termina.");
    }, 30000);

    setTimeout(async () => {
        try {
            const rows = document.querySelectorAll("#cuentasTableBody tr");
            const asientoData = [];
            const id = document.querySelector("#sheet-dtv").dataset.id;

            const montoTotalFactura = parseFloat(dtv.data.montos.total) || 0;
            let totalDebe = 0;
            let totalHaber = 0;
            let valid = true;

            rows.forEach((row) => {
                const cuentaContable = row.querySelector(".cuenta-contable").value;
                const debe = parseFloat(row.querySelector(".input-debe").value.replaceAll(".", "") || 0);
                const haber = parseFloat(row.querySelector(".input-haber").value.replaceAll(".", "") || 0);
                const fecha = document.querySelector(".date-facturar-dtv").value.split("-").reverse().join("-");

                if (!cuentaContable || (!debe && !haber) || (debe && haber)) {
                    valid = false;
                    toastr.error("Cada fila debe tener una cuenta contable y solo un valor en Debe o Haber.");
                    return;
                }

                totalDebe += debe;
                totalHaber += haber;
                debugger
                asientoData.push({ cuenta: cuentaContable, debe, haber, tipodoc: "DTV", iddoc: id, fechaEmision: fecha });
            });

            // Validación final: comprobar que la suma de Debe y Haber no exceda el monto total de la factura
            if (totalDebe > montoTotalFactura || totalHaber > montoTotalFactura) {
                toastr.error(`El total de Debe (${totalDebe}) o Haber (${totalHaber}) no puede ser mayor al monto total de la factura (${montoTotalFactura}).`);
                return;
            }

            // Validación fundamental: Debe debe ser igual a Haber (partida doble)
            if (totalDebe !== totalHaber) {
                toastr.error(`El asiento contable no está balanceado. Total Debe: ${totalDebe.toLocaleString()}, Total Haber: ${totalHaber.toLocaleString()}. Ambos valores deben ser iguales.`);
                return;
            }


            if (asientoData.length === 0 || !valid) {
                toastr.error("Debes agregar al menos una cuenta válida.");
                return;
            }

            // Emitir DTV manual
            const tipoFactura = document.querySelector('input[name="des_tipo_doc"]').value;
            const folio = document.querySelector(".folio-facturar-dtv").value;
            const fecha = document.querySelector(".date-facturar-dtv").value;
            debugger
            // Crear asiento contable
            const config = {
                method: "post",
                url: `${nodeUrl}/create-asiento-contable?type=dtv&sid=${unaBase.sid.encoded()}&hostname=${window.location.origin}&fecha_contable=${fecha}`,
                data: asientoData
            };
            const response = await axios(config);

            if (response.data.success) {
                toastr.success("Asiento contable creado correctamente.");



                const configEmitir = {
                    method: "post",
                    url: `${nodeUrl}/emitir-dtv-manual?type=dtv&sid=${unaBase.sid.encoded()}&hostname=${window.location.origin}`,
                    data: {
                        id: id,
                        folio: folio,
                        fecha: fecha,
                        tipo_factura: tipoFactura,
                        sid: unaBase.sid.encoded()
                    }
                };

                let dtvResponse = await axios(configEmitir);
                if (dtvResponse.data.success) {
                    dtvResponse = dtvResponse.data.data
                    const [year, month, day] = dtvResponse.date.split("-");

                    $("#sheet-dtv").find('span[data-name="folio"]').text(dtvResponse.index);
                    $("#sheet-dtv").find('span[data-name="fecha_emision"]').text(`${day}-${month}-${year}`);
                    $("#sheet-dtv").find('span[data-name="estado"]').text("EMITIDA");
                    $("#sheet-dtv").find('input[name="folio"]').val(dtvResponse.index);
                    $("#sheet-dtv").find('input[name="fecha_emision"]').val(`${day}-${month}-${year}`);

                    $("#menu").find('[data-name="dtv_emitir_manual"], [data-name="dtv_emitir_electronico"]').hide();
                    $("#sheet-dtv").find("button.edit").hide();
                    $("#sheet-dtv").find("input.edit").prop("readonly", true).removeClass("datepicker");
                    $("#sheet-dtv table.items").find("input").prop("readonly", true);

                    toastr.success(`Factura emitida con éxito (Folio ${dtvResponse.index})`);

                    unaBase.inbox.send({
                        subject: `Ha emitido Factura de venta Nº ${dtvResponse.index} / ${$('#sheet-dtv span[data-name="referencia"]').text()}`,
                        into: "viewport",
                        href: `/v3/views/dtv/content.shtml?id=${id}`,
                        tag: "avisos"
                    });

                    // Cerrar modal y recargar vista
                    document.querySelector("#modalCustom").style.display = "none";
                    unaBase.loadInto.viewport(`/v3/views/dtv/content.shtml?id=${id}`, undefined, undefined, true);
                } else {
                    toastr.warning((dtvResponse.data.errorMsg || "Error desconocido").replaceAll(/SL/g, "<br>"));
                }
            }
        } catch (error) {
            console.error(error);
            toastr.error("Error al crear asiento contable o emitir factura.");
        } finally {
            clearTimeout(blockTimeout);
            unaBase.ui.unblock();
        }
    }, 50); // Este delay garantiza el overlay/cargando
};

const applyCustomStylesForDtvAccounting = () => {
    const modalCustom = document.getElementById('modalCustom');
    const modalContent = document.getElementById('modal-content');
    const modalBody = document.getElementById('modal-body');

    // Aplicar estilos al contenedor del modal
    modalCustom.style.display = "flex";
    modalCustom.style.justifyContent = "center";
    modalCustom.style.alignItems = "center";
    modalCustom.style.paddingTop = "0";

    // Ajustar modalContent para centrarlo vertical y horizontalmente
    modalContent.style.minWidth = "40%";
    modalContent.style.width = "80vw";  // Ajustar al 80% del ancho de la ventana
    modalContent.style.maxWidth = "1140px"; // Máximo ancho permitido
    modalContent.style.height = "90vh"; // Altura automática basada en el contenido
    modalContent.style.overflow = "hidden"; // Ocultar el desbordamiento interno

    // Estilos para modalBody, controlar desbordamiento y espacio interior
    if (modalBody) {
        modalBody.style.padding = "20px";
        modalBody.style.maxHeight = "70vh"; // Ajustar a una altura máxima del 70% del alto de la pantalla
        modalBody.style.overflowY = "auto"; // Permite scroll en Y si es necesario
    }
};

const resetModalStylesToDefault = () => {
    const modalCustom = document.getElementById('modalCustom');
    const modalContent = document.getElementById('modal-content');
    const modalBody = document.getElementById('modal-body');

    // Restablecer estilos del contenedor del modal
    modalCustom.style.display = "none";
    modalCustom.style.position = "fixed";
    modalCustom.style.zIndex = "100";
    modalCustom.style.left = "0";
    modalCustom.style.top = "0";
    modalCustom.style.width = "100%";
    modalCustom.style.height = "100%";
    modalCustom.style.overflow = "auto";
    modalCustom.style.backgroundColor = "rgba(0, 0, 0, 0.4)";
    modalCustom.style.justifyContent = "";
    modalCustom.style.alignItems = "";
    modalCustom.style.paddingTop = "";

    // Restablecer estilos del contenido del modal
    modalContent.style.backgroundColor = "white";
    modalContent.style.margin = "14% auto";
    modalContent.style.padding = "20px";
    modalContent.style.borderRadius = "10px";
    modalContent.style.position = "relative";
    modalContent.style.minWidth = "30%";
    modalContent.style.maxWidth = "30%";
    modalContent.style.boxShadow = "0 4px 10px rgba(0, 0, 0, 0.2)";
    modalContent.style.width = "";
    modalContent.style.height = "";
    modalContent.style.maxHeight = "";
    modalContent.style.overflow = "";

    // Restablecer estilos del cuerpo interno del modal
    if (modalBody) {
        modalBody.style.padding = "20px";
        modalBody.style.height = "";
        modalBody.style.overflowY = "";
        modalBody.style.maxHeight = "";
    }
};



const closeModalCustom = () => {
    // Abrir el modal cuando se hace click en el botón
    modalCustom.style.display = "none";
}

const initModalCustom = (title, contenido, onAccept) => {
    unaBase.ui.block();

    // Abrir el modal y configurar el título y contenido
    modalCustom.style.display = "block";
    modalCustom.querySelector('.modal-title').innerHTML = title;
    modalCustom.querySelector('.modal-content-body').innerHTML = contenido;

    // Configurar el selector de fecha
    const fechaInput = modalCustom.querySelector('#fecha_reporte');
    if (fechaInput) {
        fecha_periodo_from = moment().startOf('year').format('DD-MM-YYYY');
        fecha_periodo_to = moment().format('DD-MM-YYYY');

        const $fechaReporte = $('#fecha_reporte');

        $fechaReporte.daterangepicker({
            minDate: '01/01/2012',
            startDate: moment().startOf('year'),
            endDate: moment(),
            autoApply: false,
            linkedCalendars: false,
            locale: {
                format: "DD/MM/YYYY",
                separator: " - ",
                applyLabel: "Aplicar",
                cancelLabel: "Cancelar",
                daysOfWeek: ["Do", "Lu", "Ma", "Mi", "Ju", "Vi", "Sa"],
                monthNames: [
                    "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
                    "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
                ],
                firstDay: 1
            }
        }, function (start, end) {
            fecha_periodo_from = start.format('DD-MM-YYYY');
            fecha_periodo_to = end.format('DD-MM-YYYY');
        });

        $fechaReporte.on('show.daterangepicker', function (ev, picker) {
            picker.setStartDate(moment().startOf('year'));
            picker.setEndDate(moment());

            picker.leftCalendar.month = moment().subtract(1, 'month');
            picker.rightCalendar.month = moment();

            picker.updateCalendars();
        });
    }

    // Configurar evento de guardar
    btnSave.onclick = () => {
        if (onAccept && typeof onAccept === 'function') {
            onAccept();
        }
    };

    // Función para inicializar Tom Select para cuentas contables
    const initializeCuentasTomSelect = (selector, options) => {
        let selectElement = modalCustom.querySelector(selector);
        selectElement.innerHTML = '';
        options.forEach(optionData => {
            let option = document.createElement('option');
            option.text = optionData.text;
            option.value = optionData.value;
            selectElement.appendChild(option);
        });

        new TomSelect(selectElement, {
            sortField: {
                field: "text",
                direction: "asc"
            }
        });
    };

    // Inicializar Tom Select para contactos con carga remota
    const initializeContactosTomSelect = (selector) => {
        let selectElement = modalCustom.querySelector(selector);

        new TomSelect(selectElement, {
            valueField: 'id',
            labelField: 'text',
            searchField: ['text'],
            preload: true,
            load: function (query, callback) {
                $.ajax({
                    url: '/4DACTION/_light_get_contactos',
                    dataType: 'json',
                    data: {
                        page: 1,
                        results: 100,
                        q: query
                    },
                    success: function (response) {
                        const contactsOptions = response.rows
                            .map(value => ({
                                id: value.id,
                                text: value.rut ? `${value.nombre_completo} (${value.rut})` : value.nombre_completo
                            }));
                        callback(contactsOptions);
                    },
                    error: function () {
                        callback();
                    }
                });
            },
            render: {
                option: function (item, escape) {
                    return '<div>' + escape(item.text) + '</div>';
                },
                item: function (item, escape) {
                    return '<div>' + escape(item.text) + '</div>';
                }
            },
            placeholder: 'Selecciona un contacto',
            loadingClass: 'loading'
        });
    };

    // Llamada inicial para obtener cuentas contables
    $.ajax({
        url: window.origin + "/4DACTION/_force_getPlanAccounts",
        type: "GET",
        data: { only_accounts: true },
        dataType: "json"
    }).done(accountsResponse => {
        // Inicializar Tom Select para cuentas contables
        const accountsOptions = [
            { text: 'Selecciona una cuenta', value: '' }, // Opción por defecto
            ...accountsResponse.rows.map(v => ({
                text: `${v.number} / ${v.name}`,
                value: v.number
            }))
        ];
        initializeCuentasTomSelect('#cuentas_contable', accountsOptions);

        // Inicializar Tom Select para contactos con carga remota
        initializeContactosTomSelect('#contacto_auxiliar');

        unaBase.ui.unblock();
    }).fail(error => {
        toastr.error("Error interno. Inténtalo de nuevo más tarde.");
        unaBase.ui.unblock();
    });
};

const initModalCustomMayor = (title, contenido, onAccept) => {
    unaBase.ui.block();
    resetModalStylesToDefault();

    // Limpiar botón extra "Ver en pantalla" si quedó de auxiliar_report
    const btnViewReport = modalCustom.querySelector('#btn-view-report-auxiliar');
    if (btnViewReport) {
        const colView = btnViewReport.closest('.col-4, .col-6, div');
        if (colView) {
            colView.remove();
        } else {
            btnViewReport.remove();
        }
    }

    // Restaurar layout normal del footer a 2 botones
    const btnCancel = modalCustom.querySelector('#modal-custom-cancel');
    const btnAccept = modalCustom.querySelector('#modal-custom-accept');

    if (btnCancel && btnCancel.parentElement) {
        btnCancel.parentElement.className = 'col-6';
        btnCancel.parentElement.style.display = 'flex';
        btnCancel.parentElement.style.alignItems = 'center';
    }

    if (btnAccept && btnAccept.parentElement) {
        btnAccept.parentElement.className = 'col-6';
        btnAccept.parentElement.style.display = 'flex';
        btnAccept.parentElement.style.alignItems = 'center';
    }

    if (btnCancel) {
        btnCancel.style.width = '100%';
    }

    if (btnAccept) {
        btnAccept.style.width = '100%';
    }

    // Abrir el modal y configurar el título y contenido
    modalCustom.style.display = "block";
    modalCustom.querySelector('.modal-title').innerHTML = title;
    modalCustom.querySelector('.modal-content-body').innerHTML = contenido;

    // Configurar el selector de fecha
    const fechaInput = modalCustom.querySelector('#fecha_reporte');
    if (fechaInput) {
        fecha_periodo_from = moment().startOf('year').format('DD-MM-YYYY');
        fecha_periodo_to = moment().format('DD-MM-YYYY');

        const $fechaReporte = $('#fecha_reporte');

        $fechaReporte.daterangepicker({
            minDate: '01/01/2012',
            startDate: moment().startOf('year'),
            endDate: moment(),
            autoApply: false,
            linkedCalendars: false,
            locale: {
                format: "DD/MM/YYYY",
                separator: " - ",
                applyLabel: "Aplicar",
                cancelLabel: "Cancelar",
                daysOfWeek: ["Do", "Lu", "Ma", "Mi", "Ju", "Vi", "Sa"],
                monthNames: [
                    "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
                    "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
                ],
                firstDay: 1
            }
        }, function (start, end) {
            fecha_periodo_from = start.format('DD-MM-YYYY');
            fecha_periodo_to = end.format('DD-MM-YYYY');
        });

        $fechaReporte.on('show.daterangepicker', function (ev, picker) {
            picker.setStartDate(moment().startOf('year'));
            picker.setEndDate(moment());

            picker.leftCalendar.month = moment().subtract(1, 'month');
            picker.rightCalendar.month = moment();

            picker.updateCalendars();
        });
    }

    btnSave.onclick = () => {
        if (onAccept && typeof onAccept === 'function') {
            onAccept();
        }
    };

    const initializeCuentasTomSelect = (selector, options) => {
        let selectElement = modalCustom.querySelector(selector);
        selectElement.innerHTML = '';

        options.forEach(optionData => {
            let option = document.createElement('option');
            option.text = optionData.text;
            option.value = optionData.value;
            selectElement.appendChild(option);
        });

        let tomSelect = new TomSelect(selectElement, {
            maxItems: null,
            valueField: 'value',
            labelField: 'text',
            searchField: 'text',
            sortField: {
                field: "text",
                direction: "asc"
            },
            plugins: ['remove_button'],
            render: {
                option: (data, escape) => {
                    return `
                        <div>
                            <input type="checkbox" class="tomselect-checkbox" value="${escape(data.value)}">
                            <span>${escape(data.text)}</span>
                        </div>
                    `;
                },
                item: (data, escape) => {
                    return `<div class="selected-item">${escape(data.text)}</div>`;
                }
            },
            onItemAdd: (value, item) => {
                let checkbox = document.querySelector(`input[value="${value}"]`);
                if (checkbox) checkbox.checked = true;
            },
            onItemRemove: (value) => {
                let checkbox = document.querySelector(`input[value="${value}"]`);
                if (checkbox) checkbox.checked = false;
            }
        });

        selectElement.addEventListener('change', () => {
            const selectedValues = tomSelect.items;
            document.querySelectorAll('.tomselect-checkbox').forEach(checkbox => {
                checkbox.checked = selectedValues.includes(checkbox.value);
            });
        });
    };

    $.ajax({
        url: window.origin + "/4DACTION/_force_getPlanAccounts",
        type: "GET",
        data: { only_accounts: true },
        dataType: "json"
    }).done(accountsResponse => {
        const accountsOptions = [
            { text: 'Selecciona una cuenta', value: '' },
            ...accountsResponse.rows.map(v => ({
                text: `${v.number} / ${v.name}`,
                value: v.number
            }))
        ];
        initializeCuentasTomSelect('#cuentas_contable', accountsOptions);

        unaBase.ui.unblock();
    }).fail(error => {
        toastr.error("Error interno. Inténtalo de nuevo más tarde.");
        unaBase.ui.unblock();
    });
};

/**
 * Abre el modal de asiento contable para cualquier documento del registry
 * ACC_DOC (DTV, NC, ND). El modal es el mismo; lo que cambia son las rutas y el
 * lado de la partida doble, y eso viaja en el contexto.
 *
 * @param {string} title
 * @param {string} contenido
 * @param {Object} opciones
 * @param {Object} opciones.ctx   entrada de ACC_DOC.
 * @param {string} opciones.modo  "manual" | "electronico".
 */
const initModalCustomDocAccounting = (title, contenido, { ctx, modo } = {}) => {
    applyCustomStylesForDtvAccounting();  // Aplica los estilos customizados
    // Abrir el modal y configurar el título y contenido
    modalCustom.style.display = "flex";
    modalCustom.querySelector('.modal-title').innerHTML = title;
    modalCustom.querySelector('.modal-content-body').innerHTML = contenido;

    // Asegurar que el modal esté alineado en la parte superior
    modalCustom.querySelector('#modal-content').style.top = '10px';

    modalCustom.querySelector('#modal-custom-accept').textContent = "Emitir";

    // Configurar evento de guardar
    btnSave.onclick = () => actionModalCustomEmitir({ ctx, modo });
};

/* Alias retrocompatible: resuelve el contexto desde el DOM. */
const initModalCustomDtvAccounting = (title, contenido, modo) =>
    initModalCustomDocAccounting(title, contenido, { ctx: resolveAccDoc(), modo });


const initModalCustomMayorConAnalisis = (title, contenido, onAccept) => {
    unaBase.ui.block();

    // Limpiar botón extra "Ver en pantalla" si quedó de auxiliar_report
    const btnViewReport = modalCustom.querySelector('#btn-view-report-auxiliar');
    if (btnViewReport) {
        const colView = btnViewReport.closest('.col-4, .col-6, div');
        if (colView) {
            colView.remove();
        } else {
            btnViewReport.remove();
        }
    }

    // Restaurar layout normal del footer a 2 botones
    const btnCancel = modalCustom.querySelector('#modal-custom-cancel');
    const btnAccept = modalCustom.querySelector('#modal-custom-accept');

    if (btnCancel && btnCancel.parentElement) {
        btnCancel.parentElement.className = 'col-6';
        btnCancel.parentElement.style.display = 'flex';
        btnCancel.parentElement.style.alignItems = 'center';
    }

    if (btnAccept && btnAccept.parentElement) {
        btnAccept.parentElement.className = 'col-6';
        btnAccept.parentElement.style.display = 'flex';
        btnAccept.parentElement.style.alignItems = 'center';
    }

    if (btnCancel) {
        btnCancel.style.width = '100%';
    }

    if (btnAccept) {
        btnAccept.style.width = '100%';
    }

    // Abrir el modal y configurar el título y contenido
    modalCustom.style.display = "block";
    modalCustom.querySelector('.modal-title').innerHTML = title;
    modalCustom.querySelector('.modal-content-body').innerHTML = contenido;

    // Configurar el selector de fecha
    const fechaInput = modalCustom.querySelector('#fecha_reporte');
    if (fechaInput) {
        fecha_periodo_from = moment().startOf('year').format('DD-MM-YYYY');
        fecha_periodo_to = moment().format('DD-MM-YYYY');

        const $fechaReporte = $('#fecha_reporte');

        $fechaReporte.daterangepicker({
            minDate: '01/01/2012',
            startDate: moment().startOf('year'),
            endDate: moment(),
            autoApply: false,
            linkedCalendars: false,
            locale: {
                format: "DD/MM/YYYY",
                separator: " - ",
                applyLabel: "Aplicar",
                cancelLabel: "Cancelar",
                daysOfWeek: ["Do", "Lu", "Ma", "Mi", "Ju", "Vi", "Sa"],
                monthNames: [
                    "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
                    "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
                ],
                firstDay: 1
            }
        }, function (start, end) {
            fecha_periodo_from = start.format('DD-MM-YYYY');
            fecha_periodo_to = end.format('DD-MM-YYYY');
        });

        $fechaReporte.on('show.daterangepicker', function (ev, picker) {
            picker.setStartDate(moment().startOf('year'));
            picker.setEndDate(moment());

            picker.leftCalendar.month = moment().subtract(1, 'month');
            picker.rightCalendar.month = moment();

            picker.updateCalendars();
        });
    }

    // Configurar evento de guardar
    btnSave.onclick = () => {
        if (onAccept && typeof onAccept === 'function') {
            onAccept();
        }
    };

    // Función para inicializar Tom Select para cuentas contables
    const initializeCuentasTomSelect = (selector, options) => {
        let selectElement = modalCustom.querySelector(selector);
        selectElement.innerHTML = '';
        options.forEach(optionData => {
            let option = document.createElement('option');
            option.text = optionData.text;
            option.value = optionData.value;
            selectElement.appendChild(option);
        });

        new TomSelect(selectElement, {
            sortField: {
                field: "text",
                direction: "asc"
            }
        });
    };

    // Inicializar Tom Select para contactos con carga remota
    const initializeContactosTomSelect = (selector) => {
        let selectElement = modalCustom.querySelector(selector);

        new TomSelect(selectElement, {
            valueField: 'id',
            labelField: 'text',
            searchField: ['text'],
            preload: true,
            load: function (query, callback) {
                $.ajax({
                    url: '/4DACTION/_light_get_contactos',
                    dataType: 'json',
                    data: {
                        page: 1,
                        results: 100,
                        q: query
                    },
                    success: function (response) {
                        const contactsOptions = response.rows
                            .map(value => ({
                                id: value.id,
                                text: value.rut ? `${value.nombre_completo} (${value.rut})` : value.nombre_completo
                            }));
                        callback(contactsOptions);
                    },
                    error: function () {
                        callback();
                    }
                });
            },
            render: {
                option: function (item, escape) {
                    return '<div>' + escape(item.text) + '</div>';
                },
                item: function (item, escape) {
                    return '<div>' + escape(item.text) + '</div>';
                }
            },
            placeholder: 'Selecciona un contacto',
            loadingClass: 'loading'
        });
    };

    // Llamada inicial para obtener cuentas contables
    $.ajax({
        url: window.origin + "/4DACTION/_force_getPlanAccounts",
        type: "GET",
        data: { only_accounts: true },
        dataType: "json"
    }).done(accountsResponse => {
        // Inicializar Tom Select para cuentas contables
        const accountsOptions = [
            { text: 'Selecciona una cuenta', value: '' }, // Opción por defecto
            ...accountsResponse.rows.map(v => ({
                text: `${v.number} / ${v.name}`,
                value: v.number
            }))
        ];
        initializeCuentasTomSelect('#cuentas_contable', accountsOptions);

        // Inicializar Tom Select para contactos con carga remota
        initializeContactosTomSelect('#contacto_auxiliar');

        unaBase.ui.unblock();
    }).fail(error => {
        toastr.error("Error interno. Inténtalo de nuevo más tarde.");
        unaBase.ui.unblock();
    });
};




const initModalCustomCurrency = (title, contenido, onAccept) => {
    unaBase.ui.block();

    // Abrir el modal cuando se hace click en el botón
    modalCustom.style.display = "block";
    modalCustom.querySelector('.modal-title').innerHTML = title;
    modalCustom.querySelector('.modal-content-body').innerHTML = contenido;
    document.getElementById('modal-custom-accept').textContent = 'Aceptar';

    btnSave.onclick = () => {
        if (onAccept && typeof onAccept === 'function') {
            onAccept();
        }
    };

    unaBase.ui.unblock();
};


(function init() {



    btnCancel.addEventListener("click", () => closeModalCustom());


})();
