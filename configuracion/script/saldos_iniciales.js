// ============================================================
//  Mantenedor: Saldos iniciales
//  Endpoint unico: /4DACTION/_clay_saldos_iniciales_crud
//  El parametro action decide la operacion (default: list).
//  Envoltura de respuesta: { success, message, data? }
//  OJO: success:false llega con HTTP 200, por lo que axios NO
//  rechaza; el error hay que leerlo del body. Ademas "data"
//  solo existe cuando success es true -> usar optional chaining.
// ============================================================

const CRUD_URL = "/4DACTION/_clay_saldos_iniciales_crud";

let idSaldoSeleccionado = 0;

// Toastr directo (el helper compartido generarAvisoExitoso tiene un bug
// conocido que pierde el mensaje, y aqui los mensajes del backend importan).
const toastOpts = {
    "closeButton": false,
    "positionClass": "toast-top-right",
    "preventDuplicates": false,
    "showDuration": "300",
    "hideDuration": "1000",
    "timeOut": "5000",
    "extendedTimeOut": "1000",
    "showMethod": "fadeIn",
    "hideMethod": "fadeOut"
};

const avisoOk = (msg) => { toastr.options = toastOpts; toastr.success(msg || "Operacion exitosa", "Correcto"); };
const avisoError = (msg) => { toastr.options = toastOpts; toastr.error(msg || "Ocurrio un error", "Error"); };

// ---------------------------------------------------------------
//  Llamadas al endpoint
// ---------------------------------------------------------------
async function crud(params) {
    const res = await axios.get(CRUD_URL, { params });
    return res.data; // { success, message, data? }
}

const listarSaldos = (cuenta, anio) => {
    const params = { action: "list" };
    if (cuenta) params.cuenta = cuenta;
    if (anio) params.anio = anio;
    return crud(params);
};

const obtenerSaldo = (id) => crud({ action: "get", id });

const guardarSaldo = ({ id, cuenta, anio, monto }) =>
    crud({ action: "save", id: id || 0, cuenta, anio, monto });

const eliminarSaldo = (id) => crud({ action: "delete", id });

// ---------------------------------------------------------------
//  Utilidades
// ---------------------------------------------------------------
const fmtMonto = (valor) => {
    const n = Number(valor);
    if (isNaN(n)) return valor;
    return new Intl.NumberFormat("es-CL").format(n);
};

// ---------------------------------------------------------------
//  Tabla
// ---------------------------------------------------------------
async function setTableSaldos() {
    const cuenta = document.getElementById("filtro_cuenta").value.trim();
    const anio = document.getElementById("filtro_anio").value.trim();

    loadingLoad("loading-modal", true, "Cargando...");

    let body;
    try {
        body = await listarSaldos(cuenta, anio);
    } catch (e) {
        loadingLoad("loading-modal", false);
        avisoError("Hubo un error al cargar los saldos iniciales");
        return;
    }

    if (!body || !body.success) {
        loadingLoad("loading-modal", false);
        avisoError(body?.message || "No se pudieron cargar los saldos iniciales");
        return;
    }

    // Lista vacia no es error: rows [] / total 0
    const rows = body?.data?.rows || [];

    $(".tablesaldos").dataTable({
        "bDestroy": true,
        // Respetar el orden que ya entrega el backend (cuenta asc, año desc)
        "order": [],
        dom: "<'col'" +
            "<'row'" +
            "<'col-sm-12'B>" +
            ">" +
            "<'row'" +
            "<'col-sm-6'l>" +
            "<'col-sm-6'f>" +
            ">" +
            "<'row dt-table'" +
            "<'col-sm-12'rt>" +
            ">" +
            "<'row'" +
            "<'col-sm-6'i>" +
            ">" +
            "<'row'" +
            "<'col-sm-12'p>" +
            ">" +
            ">",
        buttons: [{
            extend: "colvis",
            text: '<div class="row"><div class="col"><i class="fas fa-eye"></i></div></div>',
            className: "btn btn-outline-info btn-lg",
            titleAttr: "Visualizar columnas",
            collectionLayout: "fixed three-column",
            postfixButtons: ["colvisRestore"],
        }],
        language: {
            url: "//cdn.datatables.net/plug-ins/1.10.16/i18n/Spanish.json",
        },
        aaData: rows,
        columns: [
            {
                data: "id",
                visible: false,
            },
            {
                data: "cuenta_cte",
            },
            {
                data: "anio",
            },
            {
                data: "monto",
                className: "monto-cell",
                render: function (data) {
                    return fmtMonto(data);
                },
            },
            {
                data: null,
                orderable: false,
                render: function () {
                    return `<div class="d-flex justify-content-center">
                        <button class="btn btn-primary btn-sm edit_saldo" data-toggle="tooltip" data-placement="top" title="Editar registro"><i class="fas fa-pencil-alt"></i></button>
                        <button class="btn btn-danger btn-sm delete_saldo" data-toggle="modal" data-target="#ModalConfirm" data-placement="top" title="Borrar registro" style="background: #FC4903;"><i class="fas fa-trash-alt"></i></button>
                    </div>`;
                },
            },
        ],
    });

    loadingLoad("loading-modal", false);
}

// ---------------------------------------------------------------
//  Modal crear / editar
// ---------------------------------------------------------------
function abrirModalNuevo() {
    document.getElementById("saldo_id").value = "0";
    document.getElementById("cuenta").value = "";
    document.getElementById("anio").value = "";
    document.getElementById("monto").value = "";
    document.getElementById("modalSaldoTitle").textContent = "Nuevo saldo inicial";
    $("#modalSaldo").modal("show");
}

async function abrirModalEditar(id) {
    let body;
    try {
        body = await obtenerSaldo(id);
    } catch (e) {
        avisoError("Hubo un error al obtener el saldo inicial");
        return;
    }

    if (!body || !body.success) {
        avisoError(body?.message || "No existe el saldo inicial");
        return;
    }

    const s = body?.data || {};
    document.getElementById("saldo_id").value = s.id;
    document.getElementById("cuenta").value = s.cuenta_cte || "";
    document.getElementById("anio").value = s.anio || "";
    document.getElementById("monto").value = (s.monto === 0 || s.monto) ? s.monto : "";
    document.getElementById("modalSaldoTitle").textContent = "Editar saldo inicial";
    $("#modalSaldo").modal("show");
}

async function onGuardar() {
    const id = Number(document.getElementById("saldo_id").value) || 0;
    const cuenta = document.getElementById("cuenta").value.trim();
    const anio = document.getElementById("anio").value.trim();
    const monto = document.getElementById("monto").value.trim(); // "" != "0": monto=0 es valido

    // Validaciones cliente (mismo orden que el backend). El backend
    // sigue siendo la fuente de verdad (unicidad, bloqueos, etc.).
    if (!cuenta) return avisoError("La cuenta corriente es obligatoria");
    if (anio === "") return avisoError("El año es obligatorio");
    if (Number(anio) < 2000 || Number(anio) > 2100) return avisoError("Año fuera de rango (2000-2100)");
    if (monto === "") return avisoError("El monto es obligatorio");

    let body;
    try {
        body = await guardarSaldo({ id, cuenta, anio, monto });
    } catch (e) {
        avisoError("Hubo un error al guardar el saldo inicial");
        return;
    }

    if (!body || !body.success) {
        avisoError(body?.message || "No se pudo guardar el saldo inicial");
        return;
    }

    $("#modalSaldo").modal("hide");
    avisoOk(body.message); // "Saldo inicial creado" | "Saldo inicial actualizado"
    setTableSaldos();
}

// ---------------------------------------------------------------
//  Borrado
// ---------------------------------------------------------------
async function onConfirmarBorrado() {
    let body;
    try {
        body = await eliminarSaldo(idSaldoSeleccionado);
    } catch (e) {
        avisoError("Hubo un error al eliminar el saldo inicial");
        return;
    }

    if (!body || !body.success) {
        $("#ModalConfirm").modal("hide");
        avisoError(body?.message || "No se pudo eliminar el saldo inicial");
        return;
    }

    $("#ModalConfirm").modal("hide");
    avisoOk(body.message); // "Saldo inicial eliminado"
    setTableSaldos();
}

// ---------------------------------------------------------------
//  Eventos
// ---------------------------------------------------------------
document.getElementById("btn-nuevo").addEventListener("click", abrirModalNuevo);
document.getElementById("btn-guardar").addEventListener("click", onGuardar);
document.getElementById("btn-buscar").addEventListener("click", setTableSaldos);
document.getElementById("btn-confirm-delete").addEventListener("click", onConfirmarBorrado);

document.getElementById("btn-limpiar").addEventListener("click", function () {
    document.getElementById("filtro_cuenta").value = "";
    document.getElementById("filtro_anio").value = "";
    setTableSaldos();
});

// Buscar con Enter en los filtros
["filtro_cuenta", "filtro_anio"].forEach((id) => {
    document.getElementById(id).addEventListener("keyup", function (e) {
        if (e.key === "Enter") setTableSaldos();
    });
});

// Editar (delegado, la tabla se re-dibuja)
$(".tablesaldos").on("click", ".edit_saldo", function () {
    const currentRow = $(this).closest("tr");
    const data = $("#saldos_iniciales").DataTable().row(currentRow).data();
    if (data) abrirModalEditar(data.id);
});

// Guardar id para el modal de confirmacion de borrado
$(".tablesaldos").on("click", ".delete_saldo", function () {
    const currentRow = $(this).closest("tr");
    const data = $("#saldos_iniciales").DataTable().row(currentRow).data();
    idSaldoSeleccionado = data ? data.id : 0;
});

// ---------------------------------------------------------------
//  Init
// ---------------------------------------------------------------
setTableSaldos();
