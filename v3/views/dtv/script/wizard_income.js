var income = {
    "container": $('#dtvporcobrar'),
    "sumatotal": 0,
    "moneda": "",
    menu: function () {
        unaBase.toolbox.menu.init({
            entity: 'dtv_cobros',
            buttons: ["receive_next_step", "receive_previous_step", "generate_installments"]
        });
    },
    dtv: {
        diffCambio: () => {
            const nuevoTipoCambio = document.querySelector('.tipo-cambio-ingreso').value
            document.querySelectorAll('table.step-1 > tbody > tr').forEach(row => {
                const saldoPorCobrar = parseFloat(row.dataset.saldoporcobrar); // Saldo actual en euros
                const saldoOriginal = parseFloat(row.dataset.saldooriginal);  // Saldo original en pesos MXN
        
                if (isNaN(saldoPorCobrar) || isNaN(saldoOriginal)) {
                    console.error('Datos inválidos en la fila:', row);
                    return;
                }
                // Convertir saldoPorCobrar a pesos utilizando el nuevo tipo de cambio
                const saldoConvertidoAPesos = saldoPorCobrar * nuevoTipoCambio;
        
                // Calcular la diferencia cambiaria en pesos
                const diferenciaCambiaria = saldoOriginal - saldoConvertidoAPesos;
        
                // Actualizar el atributo `data-diff-cambiaria` del `<tr>`
                row.setAttribute('data-diff-cambiaria', diferenciaCambiaria.toFixed(2));
        
                const diffElement = row.querySelector('.diff-cambiaria');
                if (diffElement) {
                    diffElement.textContent = diferenciaCambiaria.toFixed(2);
                }
            });
        },
        get: function () {
            var selected = $('table.listincome > tbody > tr > td > input:checked');
            var objFinal = {};
            selected.each(function (key, item) {
                var id = $(this).closest("tr").data('id');
                eval("obj = { 'id_dtv_" + id + "': '" + id + "' }");
                $.extend(objFinal, objFinal, obj);
            });

            function openDialog(id) {
                const row = document.querySelector(`.step-1 tbody tr[data-id="${id}"]`);
                if (!row) {
                    console.error(`No se encontró la fila con ID: ${id}`);
                    return;
                }

                const diferenciaCambiaria = row.dataset.diffCambiaria || '0.00'; // Obtener el valor actualizado
                const saldoPorCobrar = row.dataset.saldoporcobrar || '0.00'; // Por si necesitas otro dato
                const tipoCambioDefault = unaBase.moneyDefault.codigo
                const saldoOriginal = parseFloat(row.dataset.saldooriginal.replace(',', '.'))
                const valorCambioOriginal = parseFloat(row.dataset.valorcambio.replace(',', '.'))
                const saldoPorCobrarOriginal = parseFloat(row.dataset.saldooriginal);
                const nuevoTipoCambio = parseFloat(document.querySelector('.tipo-cambio-ingreso').value.replace(',', '.'));
                const totalCobrado = ((saldoOriginal / valorCambioOriginal) * nuevoTipoCambio).toFixed(2)
                r
                // Eliminar cualquier diálogo previo
                $(`#dialog-${id}`).remove();

                // Crear el contenido del diálogo dinámicamente
                const dialogContent = $(`
                    <div id="dialog-${id}" title="Informacion">
                        <p class="ingreso">Total a cobrar segun factura (${tipoCambioDefault}): <span>${saldoPorCobrarOriginal}</span></p>
                        <p class="ingreso">Total cobrado (${tipoCambioDefault}): <span>${totalCobrado}</span></p>
                        <p class="ingreso">Diferencia Tipo de Cambio: <span class="diff-cambiaria">${diferenciaCambiaria}</span></p>
                        <label for="comision-bancaria-${id}">Comisión bancaria:</label>
                        <input type="text" id="comision-bancaria-${id}" class="custom-popover-input" placeholder="Ingrese la comisión">
                    </div>
                `);

                // Inicializar el diálogo
                dialogContent.dialog({
                    modal: true,
                    buttons: {
                        Guardar: function () {
                            const comisionValue = $(`#comision-bancaria-${id}`).val();
                            console.log(`Comisión bancaria para ID ${id}: ${comisionValue}`);
                            $(this).dialog("close");
                        },
                        Cancelar: function () {
                            $(this).dialog("close");
                        }
                    },
                    close: function () {
                        $(this).dialog("destroy").remove(); // Elimina el diálogo del DOM
                    }
                });
            }

            $.ajax({
                url: '/4DACTION/_V3_get_dtv_to_receive',
                data: objFinal,
                dataType: 'json',
                success: function (data) {
                    const containerTableStep1 = income.container.find('table.step-1 > tbody');
                    containerTableStep1.empty();
                    const tipoMoneda = data.rows[0].tipo_moneda
                    const tipoCambio = document.querySelector('.tipo-cambio-ingreso')
                    tipoCambio.value = unaBase.money.find(u => u.codigo == tipoMoneda).value

                    if (data.rows.length > 0) {
                        data.rows.forEach(item => {

                            const saldoOriginal = item.saldo;
                            const saldo = saldoOriginal / item.valor_cambio;
                            const symbol = item.tipo_moneda;
                            const moneda = item.tipo_moneda;
                            const valorCambio = item.valor_cambio;

                            const saldoFormatted = $.number(saldo, currency.decimals, currency.decimals_sep, currency.thousands_sep);
                            r
                            const nuevoTipoCambio = tipoCambio && parseFloat(tipoCambio.value.replace(',', '.')) > 0 ? parseFloat(tipoCambio.value.replace(',', '.')) : 1

                            const saldoPorCobrar = parseFloat(saldo);
                            let nuevaDiferenciaCambiaria = (saldoPorCobrar / nuevoTipoCambio).toFixed(2);
                            nuevaDiferenciaCambiaria = $.number(nuevaDiferenciaCambiaria, currency.decimals, currency.decimals_sep, currency.thousands_sep);
                            const htmlObject = $(
                                `<tr data-id="${item.id}" data-idcli="${item.idcliente}" data-saldoporcobrar="${saldo}" data-saldooriginal="${saldoOriginal}" data-moneda="${moneda}" data-valorcambio="${valorCambio}" data-diff-cambiaria="${nuevaDiferenciaCambiaria}">
                                    <td>${item.numero}</td>
                                    <td class="left">${item.cliente}</td>
                                    <td class="center">${item.fecha_factura}</td>
                                    <td class="numeric currency right">${symbol} <span style="font-weight:bold;padding:5px">${saldoFormatted}</span></td>
                                    <td class="numeric percent modoperu"><input style="width:30px;" class="fill2" type="text" name="porcentaje" value="100" data-porcentaje="100"> % </td>
                                    <td class="numeric currency"><input class="fill1" name="monto" data-saldoactual="${saldo}" type="text" value="${saldoFormatted}"></td>
                                    <td class="numeric currency right">${symbol} <span data-saldofinal style="font-weight:bold;padding:5px">0</span></td>
                                    <td class="center action-icon">
                                    <button class="detail-dialog" data-id="${item.id}" style="cursor: pointer; color: #007bff; font-size: 18px;">
                                        <i class="fas fa-info-circle"></i>
                                    </button>
                                </td>
                                </tr>`
                            );

                            containerTableStep1.append(htmlObject);

                            if (currency.code !== "PEN") {
                                $('.modoperu').hide();
                            }

                            // Event handlers for dialog
                            htmlObject.find('.detail-dialog').on('click', function () {
                                const id = $(this).data('id');
                                openDialog(id);
                            });

                            htmlObject.find('input[name="monto"]').on('blur', function () {
                                const input = $(this);
                                const montoIngresado = parseFloat(input.val());
                                const saldoActual = parseFloat(input.data("saldoactual"));
                                const saldoFinal = saldoActual - montoIngresado;

                                input.closest('tr').find("span[data-saldofinal]").text($.number(saldoFinal, currency.decimals, currency.decimals_sep, currency.thousands_sep));
                                input.data('saldoactual', montoIngresado);

                                if (saldoFinal < 0) {
                                    alert("Ha excedido monto por cobrar. Por favor reingrese monto.");
                                    input.val(saldoActual).focus();
                                } else {
                                    $('.numeric.currency span').number(true, currency.decimals, currency.decimals_sep, currency.thousands_sep);
                                }

                                income.updateSuma();
                            });

                            htmlObject.find('input[name="porcentaje"]').on('blur', function () {
                                const input = $(this);
                                const percent = parseFloat(input.val());

                                if (percent > 0 && percent <= 100) {
                                    const target = input.closest('tr');
                                    const saldoPorCobrar = parseFloat(target.data("saldoporcobrar"));
                                    const montoIngresado = (percent / 100) * saldoPorCobrar;
                                    const saldoFinal = saldoPorCobrar - montoIngresado;

                                    target.find('input[name="monto"]').val(montoIngresado).data('saldoactual', montoIngresado);
                                    target.find("span[data-saldofinal]").text($.number(saldoFinal, currency.decimals, currency.decimals_sep, currency.thousands_sep));

                                    income.updateSuma();
                                } else {
                                    input.val('100');
                                }
                            });
                        });

                        income.updateSuma();
                    } else {
                        containerTableStep1.append('<tr><td colspan="7">Hubo un problema al cargar la lista.</td></tr>');
                    }

                    $('.numeric.currency input, .numeric.currency span').number(true, currency.decimals, currency.decimals_sep, currency.thousands_sep);
                }
            });
        }
    }


    ,
    installments: {
        preview: function () {
            var selected = $('#dtvporcobrar > table.step-1 > tbody > tr');
            var objFinal = {
                "agrupado": false
            };
            var repetidos = 0;
            var aIdcliente = [];
            selected.each(function (key, item) {
                var id = $(this).data('id');
                var idcli = $(this).data('idcli');
                var monto = $(this).find('input[name="monto"]').val();
                var moneda = $(this).data('moneda');
                var valorcambio = $(this).data('valorcambio');
                var diffCambio = $(this).data('diff-cambiaria');

                var info = id + "/" + idcli + "/" + monto + "/" + moneda + "/" + valorcambio + '/' + diffCambio;
                eval("obj = { 'dtv_" + id + "': '" + info + "' }");
                $.extend(objFinal, objFinal, obj);
                var index = jQuery.inArray(idcli, aIdcliente);
                if (index != -1) {
                    repetidos++;
                }
                aIdcliente.push(idcli);
            });
            if (repetidos > 0) {
                confirm("Existen documentos del mismo cliente. ¿Desea crearlos como cobro agrupado?").done(function (data) {
                    if (data) {
                        objFinal.agrupado = true;
                        income.installments.showcobros(objFinal);
                        income.next.show();
                    } else {
                        income.installments.showcobros(objFinal);
                        income.next.show();
                    }
                });
            } else {
                income.installments.showcobros(objFinal);
                income.next.show();
            }
        },
        showcobros: function (dtvs) {
            if (dtvs) {
                $.ajax({
                    'url': '/4DACTION/_V3_get_preview_cobros',
                    data: dtvs,
                    dataType: 'json',
                    success: function (data) {
                        var containerTableStep2 = income.container.find('table.step-2 > tbody');
                        var htmlObject2;
                        containerTableStep2.find("*").remove();
                        if (data.rows.length > 0) {
                            $.each(data.rows, function (key, item) {
                                r
                                let symbol = currency.symbol;
                                const total = String(item.total).replaceAll('.', ',')
                                if (item.tipo_moneda == "USD") {
                                    symbol = item.tipo_moneda;
                                }

                                htmlObject2 = $('<tr data-show="' + item.show + '" data-id="' + item.id + '" data-dtv="' + item.dtv + '" data-group="' + item.group + '" data-monto="' + item.monto + '" data-total="' + total + '" data-cli="' + item.idcli + '" data-diff-cambio="' + item.diff_cambio + '" data-moneda="' + item.tipo_moneda + '" data-valorcambio="' + item.valor_cambio + '">' +
                                    '<td>S/N</td>' +
                                    '<td class="left">' + item.ncli + '</td>' +
                                    '<td class="left"><input class="fill3" type="text" name="cobrara" value="' + item.ncli + '"></td>' +
                                    '<td><input class="datepicker fill2" placeholder="dd-mm-aaaa" type="text" name="fecha" value="' + income.currentdate() + '"></td>' +
                                    '<td class="numeric currency right">' + symbol + ' <span style="font-weight:bold;padding:5px">' + total + '</span></td>' +
                                    '</tr>');
                                containerTableStep2.append(htmlObject2);
                            });
                            var cant = $('table.step-2 > tbody > tr[data-show="True"]').length;
                            if (cant == 1) {
                                $('#dtvporcobrar').find('.steps-text').text("SE GENERARÁ " + cant + " ORDEN DE INGRESO");
                            } else {
                                if (cant > 1) {
                                    $('#dtvporcobrar').find('.steps-text').text("SE GENERARÁN " + cant + " ÓRDENES DE INGRESO");
                                }
                            }
                            containerTableStep2.find('tr[data-show="False"]').hide();
                        } else {
                            htmlObject2 = $('<tr><td colspan="7">Hubo un problema al cargar la lista.</td></tr>');
                            containerTableStep2.append(htmlObject2);
                        }

                        $('.numeric.currency span').number(true, currency.decimals, currency.decimals_sep, currency.thousands_sep);

                        // $('.numeric.currency span').number(true, 0, ',', '.');
                        $(".datepicker").datepicker();
                    }
                });
            } else {
                alert("Ocurrió un error al cargar la información. Por favor intente nuevamente.");
            }
        },
        setCobros: async function () {
            var selected = $('#dtvporcobrar > table.step-2 > tbody > tr');
            var cobros = {};
            var cont = 0;
            var crearIngreso = true
            r
            let fechaIngreso = ''
            r
            selected.each(function (key, item) {
                cont++;
                fechaIngreso = item.querySelector('tr[data-show="True"] input[name="fecha"]') ? item.querySelector('tr[data-show="True"] input[name="fecha"]').value : fechaIngreso
                var cli = $(this).data('cli');
                var dtv = $(this).data('dtv');
                var group = $(this).data('group');
                var monto = $(this).data('monto');
                var fecha = fechaIngreso
                var cobrara = $(this).find('input[name="cobrara"]').val();
                var original = $(this).data('show');
                var moneda = $(this).data('moneda');
                var valorcambio = $(this).data('valorcambio');
                var diffCambio = $(this).data('diff-cambio');
                r
                var info = cli + "&" + dtv + "&" + group + "&" + monto + "&" + fecha + "&" + cobrara + "&" + original + "&" + moneda + "&" + valorcambio + "&" + diffCambio;
                eval("obj = { 'cobro_" + cont + "': '" + info + "' }");
                $.extend(cobros, cobros, obj);
                var fechaByPeriod = fecha.replace(/^(\d{2})\/(\d{2})\/(\d{4})$/, '$3-$2')
                $.ajax({
                    url: "/4DACTION/_V3_get_estadoPeriodoContable",
                    dataType: "json",
                    type: "POST",
                    data: {
                        periodo: fechaByPeriod,
                        status: true
                    },
                    async: false
                }).done(function (data) {
                    r
                    if (data.closed) {
                        crearIngreso = false
                        toastr.warning("La fecha de ingreso pertenece a un periodo cerrado, no puede continuar.");
                    }
                });
            });
            r
            if (crearIngreso && cobros) {
                console.log(crearIngreso, cobros)
                unaBase.ui.block();
                $.ajax({
                    url: '/4DACTION/_V3_setOcobrosAgrupados',
                    dataType: 'json',
                    type: 'POST',
                    data: cobros,
                    success: function (data) {
                        if (data.success) {
                            toastr.success('Cobros generados con éxito.');
                            if (data.ocbs.length == 1) {
                                // unaBase.loadInto.viewport('/v3/views/cobros/content.shtml?id=' + data.ocbs[0]);
                                unaBase.ui.unblock();
                                $('.ui-dialog button[title="close"]').trigger('click');
                                unaBase.id_ingreso = data.ocbs[0].id
                                unaBase.loadInto.dialog('/v3/views/ingresos/dialog/ingreso.shtml?id=' + data.ocbs[0].id, 'Orden de ingreso', 'x-large');
                            } else {
                                income.installments.showcobrosCreados(data.ocbs);
                                unaBase.ui.unblock();
                            }
                            $('#search [name="q"]').data("manual", true).trigger('keydown');
                            $('#search [name="q"]').data("manual", true).trigger('keyup');
                        }
                    },
                    error: function (e) {
                        unaBase.ui.unblock();
                        toastr.error('Ha ocurrido un error interno. Por favor comunicarse con soporte.');
                        console.log(e);
                    }
                });
            } else {
                alert("Ocurrió un error al cargar la información. Por favor intente nuevamente.");
            }
        },
        showcobrosCreados: function (cobros) {
            income.container.find('table.step-1').hide();
            income.container.find('table.step-2').hide();
            income.container.find('table.step-3').show();
            $('#dtvporcobrar').find('.steps-labels').text("");
            $('.dialog header').hide();

            if (cobros) {
                var containerTableStep3 = income.container.find('table.step-3 > tbody');
                var htmlObject3;
                containerTableStep3.find("*").remove();
                if (cobros.length > 0) {
                    $.each(cobros, function (key, item) {
                        htmlObject3 = $('<tr data-id="' + item.id + '">' +
                            '<td>' + item.folio + '</td>' +
                            '<td class="left">' + item.cli + '</td>' +
                            '<td class="left">' + item.referencia + '</td>' +
                            '<td class="numeric currency right">' + currency.symbol + ' <span style="font-weight:bold;padding:5px">' + item.monto + '</span></td>' +
                            // '<td><button>+ Doc.</button></td>' +
                            '</tr>');
                        containerTableStep3.append(htmlObject3);
                    });
                    var cant = $('table.step-3 > tbody > tr').length;
                    $('#dtvporcobrar').find('.steps-text').text(cant + " ÓRDENES DE cobros CREADAS");
                } else {
                    htmlObject3 = $('<tr><td colspan="4">Hubo un problema al cargar la lista.</td></tr>');
                    containerTableStep3.append(htmlObject3);
                }

                $('.numeric.currency span').number(true, currency.decimals, currency.decimals_sep, currency.thousands_sep);

                // $('.numeric.currency span').number(true, 0, ',', '.');
                $(".datepicker").datepicker();
            } else {
                alert("Ocurrió un error al cargar la información. Por favor intente nuevamente.");
            }

        },
    },
    next: {
        ini: function () {
            income.installments.preview();
        },
        show: function () {
            income.container.find('table.step-1').hide();
            income.container.find('table.step-2').show();
            $('#dialog-menu ul').find('li[data-name="receive_next_step"]').hide();
            $('#dialog-menu ul').find('li[data-name="receive_previous_step"]').show();
            $('#dialog-menu ul').find('li[data-name="generate_installments"]').show().find('button').addClass('ui-state-hover').find('.ui-button-text').addClass('bold');
            $('#dtvporcobrar').find('.steps-labels').text("Paso 2 de 2");
        }
    },
    previous: function () {
        income.container.find('table.step-1').show();
        income.container.find('table.step-2').hide();
        $('#dialog-menu ul').find('li[data-name="receive_next_step"]').show();
        $('#dialog-menu ul').find('li[data-name="receive_previous_step"]').hide();
        $('#dialog-menu ul').find('li[data-name="generate_installments"]').hide();
        income.container.find('.steps-labels').text("Paso 1 de 2");
        $('#dtvporcobrar').find('.steps-text').text("CONFIRMACIÓN DE MONTO");
    },
    display: {
        init: function () {
            $('#dialog-menu ul').find('li[data-name="receive_previous_step"]').hide();
            $('#dialog-menu ul').find('li[data-name="generate_installments"]').hide();
            income.container.find('table.step-2').hide();
            income.container.find('table.step-3').hide();
        }
    },
    currentdate: function () {
        var today = new Date();
        var dd = today.getDate();
        var mm = today.getMonth() + 1; //January is 0!
        var yyyy = today.getFullYear();
        if (dd < 10) {
            dd = '0' + dd;
        }
        if (mm < 10) {
            mm = '0' + mm;
        }
        return dd + '/' + mm + '/' + yyyy;
    },
    updateSuma: function () {
        income.sumatotal = 0;
        income.container.find('table.step-1 > tbody').find('tr').each(function (key, item) {
            let target = $(this);
            income.sumatotal = income.sumatotal + parseFloat(String(target.find('input[name="monto"]').data('saldoactual')).replace(',', '.'));
        });

        var symbol = currency.symbol;
        if (income.moneda == "USD") {
            symbol = "USD";
        }

        $('.income-suma > span').text(symbol + " " + $.number(income.sumatotal, currency.decimals, currency.decimals_sep, currency.thousands_sep));

    }
}
$(document).ready(function () {
    income.menu();
    income.dtv.get();
    income.display.init();

    if (currency.code != "PEN") {
        $('.modoperu').hide();
    }
    $('input.numeric.currency').number(true, currency.decimals, currency.decimals_sep, currency.thousands_sep);


    document.querySelector('.tipo-cambio-ingreso').addEventListener('change', (e) => {
        const nuevoTipoCambio = parseFloat(e.target.value.replace(',', '.'));
    
        if (isNaN(nuevoTipoCambio) || nuevoTipoCambio <= 0) {
            alert('Por favor ingrese un tipo de cambio válido.');
            return;
        }
    
        // Actualizar la diferencia cambiaria en cada fila
        document.querySelectorAll('table.step-1 > tbody > tr').forEach(row => {
            const saldoPorCobrar = parseFloat(row.dataset.saldoporcobrar); // Saldo actual en euros
            const saldoOriginal = parseFloat(row.dataset.saldooriginal);  // Saldo original en pesos MXN
    
            if (isNaN(saldoPorCobrar) || isNaN(saldoOriginal)) {
                console.error('Datos inválidos en la fila:', row);
                return;
            }
            // Convertir saldoPorCobrar a pesos utilizando el nuevo tipo de cambio
            const saldoConvertidoAPesos = saldoPorCobrar * nuevoTipoCambio;
    
            // Calcular la diferencia cambiaria en pesos
            const diferenciaCambiaria = saldoOriginal - saldoConvertidoAPesos;
    
            // Actualizar el atributo `data-diff-cambiaria` del `<tr>`
            row.setAttribute('data-diff-cambiaria', diferenciaCambiaria.toFixed(2));
    
            // (Opcional) Actualizar la UI si se muestra la diferencia cambiaria en pantalla
            const diffElement = row.querySelector('.diff-cambiaria');
            if (diffElement) {
                diffElement.textContent = diferenciaCambiaria.toFixed(2);
            }
        });
    
        console.log('Diferencias cambiarias actualizadas.');
    });
    
    



    $('input[name="percentallcobro"]').blur(function () {
        let percent = parseFloat($(this).val());
        if (percent > 0 && percent <= 100) {
            const containerTableStep1 = income.container.find('table.step-1 > tbody');
            containerTableStep1.find('input[name="porcentaje"]').data('porcentaje', percent).val(percent);

            income.sumatotal = 0;
            containerTableStep1.find('tr').each(function (key, item) {
                let target = $(this);
                let saldoPorCobrar = parseFloat(target.data("saldoporcobrar"));
                let factor = percent / 100;
                let montoIngresado = factor * saldoPorCobrar;
                var saldoFinal = saldoPorCobrar - montoIngresado;
                target.find('input[name="monto"]').val(montoIngresado);
                target.find('input[name="monto"]').data('saldoactual', montoIngresado);
                target.find("span[data-saldofinal]").text($.number(saldoFinal, currency.decimals, currency.decimals_sep, currency.thousands_sep));
            });

            income.updateSuma();


        } else {
            $(this).val('100');
        }
    });

});