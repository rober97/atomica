// Variables Globales
const fk = unaBase.id_ingreso
const numOrder = unaBase.id_ingreso
let tipos = [];
let cuentas = [];
let ventas = [];
let comprobantes = [];
let documentos = [];
let emitir = "Hola";
let orden = {}
let fechaIngreso = "12-08-2024";
let obs = "text random";
let fechaCobro = "11-08-2024";

const $itemDocumentos = document.querySelector(".itemDocumentos");
const $itemVentas = document.querySelector(".itemVentas");
const $itemComprobantes = document.querySelector(".itemComprobantes");
const $loader = document.getElementById("loader");
const $addBtn = document.getElementById("add");
const $btnGuardarIngreso = document.getElementById("btnGuardarIngreso");
const $btnAnularIngreso = document.getElementById("btnAnularIngreso");


// Funciones de pintado
function paintSelect(id, array) {
    const selectElement = document.getElementById(id);
    selectElement.innerHTML = array
        .map((item) => `<option value="${item.value}">${item.label}</option>`)
        .join("");
}

function paintInput(id, value) {
    const selectElement = document.getElementById(id);
    selectElement.value = value;
}

function paintFormOrden() {
    paintInput("emitirForm", orden.cliente);
    paintInput("totalPagoForm", orden.total_por_cobrar);
    paintInput("abonoForm", orden.monto_a_cobrar);
    paintInput("fechaIngresoForm", orden.fecha_vcto);
    paintInput("obsForm", orden.observacion);
    document.getElementById("estado").textContent = orden.estado
    document.getElementById("numOrder").textContent = numOrder
}

function showActionBtn(btn) {
    btn.style.display = "";
}

function hideActionBtn(btn) {
    btn.style.display = "none";
}

function updateAccionesModal() {
    if (orden.estado === "PAGADA") {
        hideActionBtn($btnGuardarIngreso);
        hideActionBtn($btnAnularIngreso);
        return;
    }

    if (orden.estado === "EMITIDA") {
        if (documentos.length === 0) {
            hideActionBtn($btnGuardarIngreso);
            showActionBtn($btnAnularIngreso);
        } else {
            hideActionBtn($btnAnularIngreso);
            showActionBtn($btnGuardarIngreso);
        }
    }
}

function canDeleteDocumentoIngreso() {
    if (orden.estado === "EMITIDA") return true;
    if (orden.estado === "PAGADA") return !!access._692;
    return false;
}

function paintFormCheques() {
    const partes = orden.fecha_vcto.split('-');
    const fechaConvertida = `${partes[2]}-${partes[1]}-${partes[0]}`;
    paintSelect("tipoForm", tipos);
    paintSelect("cuentasForm", cuentas);
    paintInput("pagoForm", documentos.length + 1);
    paintInput("fechaCobroForm", fechaConvertida);
}

function paintDocumentos() {
    $itemDocumentos.innerHTML = "";
    let msg = document.getElementById("msgDocumentos");
    msg.style.display = documentos.length ? "none" : "flex";
    documentos.forEach((documento, i) => {
        const div = document.createElement("div");
        div.classList.add("bodyTableItem");
        debugger
        const campos = [
            documento.created_at,
            documento.created_emision,
            documento.tipo,
            documento.index,
            documento.cuenta.text || documento.cuenta.banco,
            '$' + unaBase.utilities.transformNumber(documento.total, 'int'),
            documento.estado,
        ];

        campos.forEach((texto) => {
            const col = document.createElement("div");
            col.classList.add("bodyTableCol");
            if (texto === documento.created_at) {
                col.innerHTML = convertirFormatoFechaHoraHtml(
                    documento.created_at
                );
            } else col.textContent = texto;
            div.appendChild(col);
        });

        const botonesDiv = document.createElement("div");
        botonesDiv.classList.add("bodyTableCol", "centerTotal");

        if (documento.status) {
            let btns = []
            if (documento.estado == 'PAGADO') {
                btns = ["anular", "eliminar"]
            } else if (documento.estado == 'ANULADO') {
                btns = ["eliminar"]
            } else {
                btns = ["validar", "anular", "eliminar"]
            }

            if (!canDeleteDocumentoIngreso()) btns = btns.filter((nombre) => nombre !== "eliminar");

            btns.forEach((nombre) => {
                const button = document.createElement("button");
                button.classList.add("btn", nombre, "centerTotal");

                const svg = document.createElementNS(
                    "http://www.w3.org/2000/svg",
                    "svg"
                );
                svg.setAttribute("xmlns", "http://www.w3.org/2000/svg");
                svg.setAttribute("viewBox", "0 0 24 24");

                const path = document.createElementNS(
                    "http://www.w3.org/2000/svg",
                    "path"
                );
                path.setAttribute("d", getSvgPath(nombre));
                svg.appendChild(path);

                const span = document.createElement("span");
                span.textContent = nombre[0].toUpperCase() + nombre.slice(1);

                button.appendChild(svg);
                button.appendChild(span);
                botonesDiv.appendChild(button);

                button.addEventListener("click", () => {
                    if (nombre === "eliminar") deleteDoc(i)
                    if (nombre === "anular") anularDoc(i)
                    if (nombre === "validar") validarDoc(i)
                });
            });
        } else if (canDeleteDocumentoIngreso()) {
            const button = document.createElement("button");
            button.classList.add("btn", "eliminar", "centerTotal");

            const svg = document.createElementNS(
                "http://www.w3.org/2000/svg",
                "svg"
            );
            svg.setAttribute("xmlns", "http://www.w3.org/2000/svg");
            svg.setAttribute("viewBox", "0 0 24 24");

            const path = document.createElementNS(
                "http://www.w3.org/2000/svg",
                "path"
            );
            path.setAttribute("d", getSvgPath("eliminar"));
            svg.appendChild(path);

            const span = document.createElement("span");
            span.textContent = "Eliminar";

            button.appendChild(svg);
            button.appendChild(span);
            botonesDiv.appendChild(button);

            button.addEventListener("click", () => {
                deleteDoc(i)
            });
        }

        div.appendChild(botonesDiv);
        $itemDocumentos.appendChild(div);
    });
}

function paintVentas() {
    if (ventas.length) {
        let msg = document.getElementById("msgVentas");
        msg.style.display = "none";
    }
    ventas.forEach((venta) => {
        const bodyTableItem = document.createElement("div");
        bodyTableItem.classList.add("bodyTableItem");

        const numeroDiv = document.createElement("div");
        numeroDiv.textContent = venta.index;
        numeroDiv.classList.add("bodyTableCol");

        const clienteDiv = document.createElement("div");
        clienteDiv.textContent = venta.cliente;
        clienteDiv.classList.add("bodyTableCol");

        const totalFacturaDiv = document.createElement("div");
        totalFacturaDiv.textContent = '$' + unaBase.utilities.transformNumber(venta.total_factura.toFixed(2), 'int');
        totalFacturaDiv.classList.add("bodyTableCol");

        const montoCobradoDiv = document.createElement("div");
        montoCobradoDiv.textContent = '$' + unaBase.utilities.transformNumber(venta.monto.toFixed(2), 'int')
        montoCobradoDiv.classList.add("bodyTableCol");

        bodyTableItem.appendChild(numeroDiv);
        bodyTableItem.appendChild(clienteDiv);
        bodyTableItem.appendChild(totalFacturaDiv);
        bodyTableItem.appendChild(montoCobradoDiv);

        $itemVentas.appendChild(bodyTableItem);
    });
}

function paintComprobantes() {
    if (comprobantes.length) {
        let msg = document.getElementById("msgComprobantes");
        msg.style.display = "none";
    }
    comprobantes.forEach((comprobante) => {
        const bodyTableItem = document.createElement("div");
        bodyTableItem.classList.add("bodyTableItem");
        bodyTableItem.addEventListener('click', (e) => {
            document.querySelector('.ui-dialog-titlebar-close').click()
            unaBase.loadInto.viewport('/v3/views/comprobantes/content.shtml?id=' + comprobante.idCom);
        })

        const numeroDiv = document.createElement("div");
        numeroDiv.textContent = comprobante.idCom;
        numeroDiv.classList.add("bodyTableCol");

        const clienteDiv = document.createElement("div");
        clienteDiv.textContent = comprobante.descripcion;
        clienteDiv.classList.add("bodyTableCol");

        const totalFacturaDiv = document.createElement("div");
        totalFacturaDiv.textContent = comprobante.fechaReg;
        totalFacturaDiv.classList.add("bodyTableCol");

        const montoCobradoDiv = document.createElement("div");
        montoCobradoDiv.textContent = comprobante.docType;
        montoCobradoDiv.classList.add("bodyTableCol");

        bodyTableItem.appendChild(numeroDiv);
        bodyTableItem.appendChild(clienteDiv);
        bodyTableItem.appendChild(totalFacturaDiv);
        bodyTableItem.appendChild(montoCobradoDiv);

        $itemComprobantes.appendChild(bodyTableItem);
    });
}

// Llamadas al Back
const getOrden = async () => {
    try {
        const url = `https://${window.location.host}/4DACTION/_V3_proxy_getIngresoContent?id=${fk}&api=true`;
        const response = await axios.get(url);
        debugger
        orden = response.data.OI
    } catch (error) {
        console.error(error);
    }
};

const getTipos = async () => {
    try {
        const url = `https://${window.location.host}/4DACTION/_V3_getTipoPagos?ingreso=true`;
        const response = await axios.get(url);
        tipos = response.data.rows.map(r => { return { label: r.text, value: r.text } })
    } catch (error) {
        console.error(error);
    }
};

const getCuentas = async () => {
    try {
        const url = `https://${window.location.host}/4DACTION/_V3_getCuentaBancaria?q=@`;
        const response = await axios.get(url);
        cuentas = response.data.rows.map(r => { return { label: r.text, value: r.id } })
    } catch (error) {
        console.error(error);
    }
};

const getDocumentos = async () => {
    try {
        const url = `https://${window.location.host}/4DACTION/_V3_getDocPagoByIngreso?id=${fk}`;
        const response = await axios.get(url);
        documentos = response.data.rows
    } catch (error) {
        console.error(error);
    }
};

// const getFactoringIngreso = async () => {
//     try {
//         const url = `https://${window.location.host}/4DACTION/_V3_getFactoringByIngreso?id=${id}`;
//         const response = await axios.get(url);

//     } catch (error) {
//         console.error(error);
//     }
// };

const getVentas = async () => {
    try {
        const url = `https://${window.location.host}/4DACTION/_V3_getDtvByIngreso?id=${fk}`;
        const response = await axios.get(url);
        ventas = response.data.rows
    } catch (error) {
        console.error(error);
    }
}

const getComprobantes = async () => {
    try {
        const url = `https://${window.location.host}/4DACTION/_V3_get_comprobantes_modulos?id=${fk}&tipo=OCB`;
        const response = await axios.get(url);
        comprobantes = response.data.rows
    } catch (error) {
        console.error(error);
    }
}

const deleteDocIngreso = async (idDoc) => {
    try {
        const url = `https://${window.location.host}/4DACTION/_V3_removeDocIngreso?id=${idDoc}`;
        const response = await axios.get(url);
    } catch (error) {
        console.error(error);
    }
}

const setIngreso = async (form) => {
    try {
        const data = new FormData();
        const { emitir, abono, fechaIngreso, obs } = form;


        data.append("ingreso[titular]", emitir);
        data.append("ingreso[abono]", abono);
        data.append("ingreso[fecha]", fechaIngreso);
        data.append("ingreso[observacion]", obs);
        data.append("id", fk);
        data.append("from", "ingresos");
        data.append("ingreso[tipo_moneda]", "");
        data.append("ingreso[valor_cambio]", 0);

        const url = `https://${window.location.host}/4DACTION/_V3_setIngreso`;
        const config = {
            method: "post",
            url,
            headers: {
                "Accept": "application/json",
            },
            data,
        };

        const response = await axios(config);
        console.log("Good Request", response);
        toastr.success("Ingreso guardado con éxito!")
    } catch (error) {
        console.log("Bad Request", error);
    }
};


async function anularIngreso () {
    try {
        const fechaIngreso = getValueInput("fechaIngresoForm");

        const periodoOk = await validarPeriodoIngresoAbierto(
            fechaIngreso,
            "La fecha de ingreso pertenece a un periodo cerrado, no puede anular la orden de ingreso."
        );
        if (!periodoOk) return;
        const data = new FormData();
        data.append("id", fk);
        data.append('nullify', true)
        data.append('comment', '')
        const url = `https://${window.location.host}/4DACTION/_V3_setIngreso`;
        const config = {
            method: "post",
            url,
            headers: {
                "Accept": "application/json",
            },
            data,
        };

        const response = await axios(config);
        toastr.success("Ingreso anulado con éxito!")
        debugger
        document.querySelector('.ui-dialog-titlebar-close').click()
        console.log("Good Request", response);
    } catch (error) {
        console.log("Bad Request", error);
    }
};

const setDocPagoByIngreso = async (form) => {
    try {
        const data = new FormData();
        const { created_emision, tipo, index, cuenta, cruzado } = form;

        let exchange_value=0


        exchange_value = document.querySelector("#valorTipoCambioForm").value.replaceAll(".",",")


        data.append("ingreso[documento][fecha]", created_emision);
        data.append("ingreso[documento][tipo]", tipo);
        data.append("ingreso[documento][numero]", index);
        data.append("paid", true);
        data.append("ingreso[documento][cuenta]", cuenta.index);
        data.append("ingreso[documento][check_cruzado]", cruzado);
        data.append("fk", fk);
        data.append("ingreso[tipo_moneda]", "");
        data.append("ingreso[valor_cambio]", 0);
        data.append("exchange_value", exchange_value);

        const url = `https://${window.location.host}/4DACTION/_V3_setDocPagoByIngreso`;
        const config = {
            method: "post",
            url,
            headers: {
                "Accept": "application/json",
            },
            data,
        };

        const response = await axios(config);
        console.log("Good Request", response);
        if (response.data.errorMsg && response.data.errorMsg != '') {
            toastr.error(response.data.errorMsg.replaceAll("SL", "<br />"))
        } else {
            toastr.success("Documento de ingreso asociado con éxito!")
            document.querySelector('.ui-dialog-titlebar-close').click()
        }
    } catch (error) {
        console.log("Bad Request", error);
    }
}


const setDocPagoByIngresoValidate = async (form) => {
    try {
        const data = new FormData();
        const { paid, id } = form;

        data.append("fk", fk);
        data.append("id", id);
        data.append("paid", paid);
        const url = `https://${window.location.host}/4DACTION/_V3_setDocPagoByIngreso`;
        const config = {
            method: "post",
            url,
            headers: {
                "Accept": "application/json",
            },
            data,
        };

        const response = await axios(config);
        console.log("Good Request", response);
        if (response.data.errorMsg && response.data.errorMsg != '') {
            toastr.error(response.data.errorMsg ? response.data.errorMsg.replaceAll("SL", "<br />") : 'Error desconocido')
        } else {
            documentos.find(v => v.id == form.id).estado = 'PAGADO'
            toastr.success("El documento fue pagado con exito!")
            paintDocumentos()


        }
    } catch (error) {
        console.log("Bad Request", error);
    }
}

const setDocPagoByIngresoAnular = async (form) => {
    try {
        const data = new FormData();
        const { nullified, id } = form;

        data.append("fk", fk);
        data.append("id", id);
        data.append("nullified", nullified);
        const url = `https://${window.location.host}/4DACTION/_V3_setDocPagoByIngreso`;
        const config = {
            method: "post",
            url,
            headers: {
                "Accept": "application/json",
            },
            data,
        };

        const response = await axios(config);
        console.log("Good Request", response);
        if (response.data.errorMsg && response.data.errorMsg != '') {
            toastr.error(response.data.errorMsg ? response.data.errorMsg.replaceAll("SL", "<br />") : 'Error desconocido')
        } else {
            documentos.find(v => v.id == form.id).estado = 'ANULADO'
            toastr.success("El documento fue anulado con éxito!!")
            paintDocumentos()
        }
    } catch (error) {
        console.log("Bad Request", error);
    }
}

async function sendDataIngreso() {
    // Form 1
    const emitir = getValueInput("emitirForm");
    const abono = getValueInput("totalPagoForm");
    const fechaIngreso = getValueInput("fechaIngresoForm");
    const obs = getValueInput("obsForm");

    const form1 = { emitir, abono, fechaIngreso, obs }

    setIngreso(form1)

    const hasPendingDocument = documentos.some(doc => doc.estado === "PENDIENTE");
    if (hasPendingDocument) {
        // Form 2
        const doc = documentos[0]
        setDocPagoByIngreso(doc)
    }
}
function convertDate(date) {
    if (!date) return "";

    const value = String(date).trim();

    if (/^\d{4}[-\/]\d{2}/.test(value)) {
        return value.substring(0, 7).replace("/", "-");
    }

    const match = value.match(/^(\d{2})[-\/](\d{2})[-\/](\d{4})/);
    if (match) {
        return `${match[3]}-${match[2]}`;
    }

    return value;
}
async function getPeriods(period, status = true) {
    const origin = location.origin
    const url = `${origin}/4DACTION/_V3_get_estadoPeriodoContable`;
    const queryParams = new URLSearchParams({
        periodo: convertDate(period),
        status: status
    });
    try {
        const response = await fetch(`${url}?${queryParams}`);
        const data = await response.json();
        return data
    } catch (error) {
        console.error("Error al obtener el estado del periodo contable:", error);
    }
}
async function validarPeriodoIngresoAbierto(fecha, mensaje) {
    if (!unaBase.accounting_mode) return true;

    const periodStatus = await getPeriods(fecha);

    if (!periodStatus || !periodStatus.exists) {
        toastr.warning("El periodo contable no está creado para esta fecha: " + fecha);
        return false;
    }

    if (periodStatus.closed) {
        toastr.warning(mensaje);
        return false;
    }

    return true;
}
// Funciones de Logica
async function agregarDocumento() {

    if (validForm()) {
        const tipo = getValueInput("tipoForm");
        const numPago = getValueInput("pagoForm");
        const cuenta = getValueInput("cuentasForm");
        const fechaCobro = getValueInput("fechaCobroForm");
        const monto = getValueInput("totalPagoForm");
        const cruzado = document.getElementById("cruzadoForm").checked;
        const periodStatus = await getPeriods(fechaCobro)

        if(unaBase.accounting_mode){

            if (!periodStatus.exists) {
                unaBase.ui.unblock();
                toastr.warning("El periodo contable no esta creado para esta fecha: ", fechaCobro);
                return
            } 
            if(periodStatus.closed) {
                toastr.warning("El periodo contable esta cerrado para esta fecha: ", fechaCobro);
                return
            }
        }

        documentos.unshift({
            index: numPago,
            tipo: tipo,
            total: monto,
            username: "soporte3",
            created_at: "2023-08-24T-04:00",
            created_emision: fechaCobro,
            estado: "PENDIENTE",
            cruzado: tipo === "CHEQUE" ? cruzado : false,
            cuenta: {
                index: cuenta,
                text: cuentas.find(c => c.value === parseInt(cuenta)).label
            },
            status: false,
        });
        paintDocumentos();
        paintInput("pagoForm", documentos.length + 1);
        updateAddButtonState(true)
        updateAccionesModal();
    }
}

function updateAddButtonState(isDisabled = false) {
    if (isDisabled) $addBtn.classList.add("disabled")
    else $addBtn.classList.remove("disabled")
    $addBtn.disabled = isDisabled
}

async function deleteDoc(i) {
    const fechaDocumento = documentos[i].created_emision;
    const periodoOk = await validarPeriodoIngresoAbierto(
        fechaDocumento,
        "La fecha de emisión del documento pertenece a un periodo cerrado, no puede eliminar el documento de ingreso."
    );

    if (!periodoOk) return;
    console.log(documentos[i])
    if (documentos[i].id) {
        await deleteDocIngreso(documentos[i].id)
    }
    documentos.splice(i, 1)
    const hasPendingDocument = documentos.some(doc => doc.estado === "PENDIENTE");
    if (!hasPendingDocument) updateAddButtonState(false)
    paintDocumentos()
    updateAccionesModal()
}

async function validarDoc(i) {
    console.log(documentos[i])
    confirm('¿El documento se marcará como pagado. ¿Está seguro?').done(function (data) {
        if (data) {
            const doc = documentos[i]
            doc.paid = true
            setDocPagoByIngresoValidate(doc)
        }

    });


}

async function anularDoc(i) {
    confirm('¿Está seguro que desea anular el documento de pago?').done(function (data) {
        if (data) {
            const doc = documentos[i]
            doc.nullified = true
            setDocPagoByIngresoAnular(doc)
        }
    });
}

async function init() {
    await getOrden();
    await getTipos();
    await getCuentas();
    await getDocumentos();
    await getVentas();
    await getComprobantes();

    paintFormOrden();
    paintFormCheques();
    paintDocumentos();
    paintVentas();
    paintComprobantes();
    updateAccionesModal();

    showCruzado();

    $loader.style.display = "none";
}

// Funciones Adicionales
function getSvgPath(nombre) {
    switch (nombre) {
        case "validar":
            return "M21,7L9,19L3.5,13.5L4.91,12.09L9,16.17L19.59,5.59L21,7Z";
        case "anular":
            return "M12 2C17.5 2 22 6.5 22 12S17.5 22 12 22 2 17.5 2 12 6.5 2 12 2M12 4C10.1 4 8.4 4.6 7.1 5.7L18.3 16.9C19.3 15.5 20 13.8 20 12C20 7.6 16.4 4 12 4M16.9 18.3L5.7 7.1C4.6 8.4 4 10.1 4 12C4 16.4 7.6 20 12 20C13.9 20 15.6 19.4 16.9 18.3Z";
        case "eliminar":
            return "M19,6.41L17.59,5L12,10.59L6.41,5L5,6.41L10.59,12L5,17.59L6.41,19L12,13.41L17.59,19L19,17.59L13.41,12L19,6.41Z";
    }
}

function convertirFormatoFechaHoraHtml(fechaHora) {
    const fecha = new Date(fechaHora.replace("T-", "T"));

    const dia = fecha.getUTCDate().toString().padStart(2, "0");
    const mes = (fecha.getUTCMonth() + 1).toString().padStart(2, "0");
    const año = fecha.getUTCFullYear();
    const hora = fecha.getUTCHours().toString().padStart(2, "0");
    const minutos = fecha.getUTCMinutes().toString().padStart(2, "0");

    return `${dia}-${mes}-${año} <strong style="color: var(--bg-primary);">${hora}:${minutos}</strong>`;
}

function showCruzado() {
    const selectElement = document.getElementById("tipoForm");
    const selectedValue = selectElement.value;
    const selectElementToHide = document.getElementById("cruzado");

    if (selectedValue !== "CHEQUE") {
        selectElementToHide.style.transform = "scale(0)";
        selectElementToHide.style.transition = "0.3s";
    } else {
        selectElementToHide.style.transform = "scale(1)";
        selectElementToHide.style.transition = "0.3s";
    }
}

function isEmpty(value) {
    return value.trim() === "";
}

function validForm() {
    const tipo = getValueInput("tipoForm");
    const numPago = getValueInput("pagoForm");
    const cuenta = getValueInput("cuentasForm");
    if (isEmpty(tipo)) toastr.warning("El campo Tiro es un campo obligatorio.")
    if (isEmpty(numPago)) toastr.warning("El campo Número de Pago es un campo obligatorio.")
    if (isEmpty(cuenta)) toastr.warning("El campo Cuenta es un campo obligatorio.")
    return (
        tipo.trim() !== "" && numPago.trim() !== "" && cuenta.trim() !== ""
    );
}

function getValueInput(id) {
    const selectElement = document.getElementById(id);
    return selectElement.value;
}

// Init
init();