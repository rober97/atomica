// Configuración centralizada
const CONFIG = {
    endpoints: {
        set: "/4DACTION/_light_setParameters",
        get: "/4DACTION/_light_getParameters"
    },
    toastrOptions: {
        closeButton: false,
        debug: false,
        newestOnTop: false,
        progressBar: false,
        positionClass: "toast-top-right",
        preventDuplicates: false,
        onclick: null,
        showDuration: "300",
        hideDuration: "1000",
        timeOut: "5000",
        extendedTimeOut: "1000",
        showEasing: "swing",
        hideEasing: "linear",
        showMethod: "fadeIn",
        hideMethod: "fadeOut"
    }
};

// Mapeo de IDs de elementos a nombres de parámetros de API
const PARAM_MAPPINGS = {
    // ID del elemento HTML -> nombre del parámetro en la API
    'table-color': 'table_color',
    'accounting-mode': 'accounting_mode',
    'bandeja_dtc_unabase': 'bandeja_dtc_unabase',
    'btn_sica': 'btn_sica',
    'tipo_cambio': 'tipo_cambio_update',
    'btn_fecha_estimacion': 'ver_fecha_estimada_facturacion',
    'btn_mostrar_unidad': 'ocultar_unidad',
    'multiplesXServicio': 'multiplesXServicio',
    'items_categoria': 'items_categoria',
    'accounting_anticipos_contactos': 'accounting_anticipos_contactos',
    'portal_proveedores': 'portal_proveedores',
    'export_sap_lotus': 'export_sap_lotus',
    'datos_extras_banco_contacto': 'datos_extras_banco_contacto',
    'ocultar_columna_gastop_unit': 'ocultar_columna_gastop_unit',
    'valorventa_mismo_valorcosto': 'valorventa_mismo_valorcosto',
    'pdf_print_oc': 'usar_pdf_bandeja_print_oc',
    'ocultar_seccion_sc': 'ocultar_seccion_sc',
    'add_dtc_compras_no_validas': 'add_dtc_compras_no_validas',
    'conexion_syncfy': 'conexion_syncfy',
    'conexion_sii': 'conexion_sii',
    'ocultar_montos_adicionales': 'ocultar_montos_adicionales',
    'facturar_sin_rut': 'facturar_sin_rut',
    'sap_integration': 'sap_integration',
    'ocultar_lupa_doc_asiento': 'ocultar_lupa_doc_asiento',
    'export_diot': 'export_diot',
    'observaciones_fxr': 'observaciones_fxr',
    'hora_exe': 'hora_exe',
    'name_shift': 'name_shift',
    'esconder_totales_negocio_movil': 'esconder_totales_negocio_movil',
    'url_node': 'node_url',
    'url_web': 'web_url',
    'dialogo_tipo_cambio_facturar': 'dialogo_tipo_cambio_facturar',
    'update_fecha_asig': 'update_fecha_asig',
    'nombre_custom_pdf_neg': 'nombre_custom_pdf_neg',
    'nombre_custom_pdf_cot': 'nombre_custom_pdf_cot',
    'new_dtv_accounting': 'new_dtv_accounting',
    'incluir_codigo_item_pdf': 'incluir_codigo_item_pdf',
    'cotizacion_val_costo_a_venta': 'cotizacion_val_costo_a_venta'
};

// Utilidades
const showToast = (type, message) => {
    const title = type === 'success' ? 'Correcto' : 'Error';
    toastr.options = CONFIG.toastrOptions;
    toastr[type](message, title);
};

const getElementValue = (element) => {
    if (!element) return null;
    return element.type === 'checkbox' ? element.checked : element.value;
};

const setElementValue = (element, value) => {
    if (!element) return;
    if (element.type === 'checkbox') {
        element.checked = Boolean(value);
    } else {
        element.value = value || '';
    }
};

// Función para recolectar todos los parámetros del formulario
const collectFormParams = () => {
    const params = {};
    
    Object.keys(PARAM_MAPPINGS).forEach(elementId => {
        const element = document.getElementById(elementId);
        const value = getElementValue(element);
        
        if (value !== null) {
            const apiParamName = PARAM_MAPPINGS[elementId];
            params[apiParamName] = value;
        }
    });

    // Agregar parámetro especial del selector
    const selectParam = document.querySelector('.select_id_param');
    if (selectParam) {
        params['id_param_dtv_invoice'] = selectParam.value;
    }

    return params;
};

// Guardar todos los parámetros
const setParamGeneral = () => {
    const params = collectFormParams();

    // Guardar url_node en localStorage si existe
    if (params.node_url) {
        localStorage.setItem('node_url', params.node_url);
    }

    $.ajax({
        url: window.origin + CONFIG.endpoints.set,
        type: "POST",
        dataType: "json",
        data: params,
        success: function (data) {
            if (data.success) {
                showToast('success', "Parámetros actualizados correctamente");
            } else {
                showToast('error', "Error al actualizar parámetros");
            }
        },
        error: function () {
            showToast('error', "Error al actualizar parámetros");
        }
    });
};

// Obtener parámetros del servidor
const getParamGeneral = () => {
    $.ajax({
        url: window.origin + CONFIG.endpoints.get,
        dataType: "json",
        success: function (data) {
            // Invertir el mapeo para buscar por valor de API
            const reverseMapping = {};
            Object.entries(PARAM_MAPPINGS).forEach(([elementId, apiParam]) => {
                reverseMapping[apiParam] = elementId;
            });

            // Aplicar los valores recibidos a los elementos
            Object.entries(data).forEach(([apiParam, value]) => {
                const elementId = reverseMapping[apiParam];
                if (elementId) {
                    const element = document.getElementById(elementId);
                    setElementValue(element, value);
                }
            });

            // Inicializar color picker
            $('.cpicker').colorpicker();

            // Establecer valor del selector especial
            const selectParam = document.querySelector('.select_id_param');
            if (selectParam && data.id_param_dtv_nv) {
                selectParam.value = data.id_param_dtv_nv;
            }
        },
        error: function () {
            showToast('error', "Error al obtener parámetros");
        }
    });
};

// Guardar parámetros individualmente (optimizado para usar la misma lógica)
const setParamByOne = () => {
    const params = collectFormParams();

    $.ajax({
        url: window.origin + CONFIG.endpoints.set,
        type: "POST",
        dataType: "json",
        data: params,
        success: function (data) {
            if (data.success) {
                showToast('success', "Parámetros actualizados correctamente");
            } else {
                showToast('error', "Error al actualizar parámetros");
            }
        },
        error: function () {
            showToast('error', "Error al actualizar parámetros");
        }
    });
};

// Función legacy mantenida por compatibilidad (pero optimizada)
const saveParam = (element) => {
    const elementId = element.id;
    const value = getElementValue(element);
    const apiParamName = PARAM_MAPPINGS[elementId] || elementId;
    
    saveValueParam(apiParamName, value);
};

const saveValueParam = (paramName, value) => {
    const data = {};
    data[paramName] = value;

    $.ajax({
        url: window.origin + CONFIG.endpoints.set,
        type: "POST",
        dataType: "json",
        data: data,
        success: function (data) {
            if (data.success) {
                showToast('success', "Parámetros actualizados correctamente");
            } else {
                showToast('error', "Error al actualizar parámetros");
            }
        },
        error: function () {
            showToast('error', "Error al actualizar parámetros");
        }
    });
};

// Funciones legacy mantenidas por compatibilidad
const generarAvisoError = (mensaje) => showToast('error', mensaje);
const generarAvisoExitoso = (mensaje) => showToast('success', mensaje);

// Inicialización
(function init() {
    getParamGeneral();
    
    // Event listeners para checkboxes
    const checkboxes = document.querySelectorAll('input[type="checkbox"]');
    checkboxes.forEach(checkbox => {
        checkbox.addEventListener('change', setParamByOne);
    });

    // Event listener para el selector
    const selectParam = document.querySelector('.select_id_param');
    if (selectParam) {
        selectParam.addEventListener('change', setParamByOne);
    }
})();