let business = {
	starter: {
		init: () => {
			isConnected()
			const valores = window.location.search;
			const urlParams = new URLSearchParams(valores);
			let id = urlParams.get('id');
			let sid = business.sid();

			let config = {

				method: 'get',
				url: general.params.nodeUrl + '/get-business-list?id=' + id + '&hostname=' + general.params.hostnameUrl + '&total_format_k=True&sid=' + sid

			};

			axios(config)
				.then(function (response) {

					business.starter.totales(response.data.data.rows[0]);

				})
				.catch(function (error) {

					console.log(error);
				});
		},
		list: {
			charge: async (val, qid) => {
				isConnected()
				let listado = $('div#businesslist');
				let errorArea = $('div#errorArea');
				errorArea.empty();

				const param = JSON.parse(localStorage.getItem('parametros'));
				const hideClass = param.esconder_totales_negocio_movil ? 'hide-element' : '';
				
				business.application.loading(true);
				var hoy = new Date();


				if (val == "") {
					var fecha = String(hoy.getMonth() + 1) + "-" + String(hoy.getFullYear());
					fecha = fecha.replace(/\//g, '-');
					val = fecha;
				}

				let sid = business.sid();

				console.log("cargar listado")

				// let config  =  {

				// 	method: 'get',
				// 	url:general.params.nodeUrl + '/get-business-list?sid='+sid+'&hostname='+general.params.hostnameUrl+'&estadonv=enproceso&estado=negocio&currency_format=True&month='+val+'&qid='+qid

				// };

				//TEMPORAL
				val = String(hoy.getFullYear())

				let config = {

					method: 'get',
					url: general.params.nodeUrl + '/get-business-list?sid=' + sid + '&hostname=' + general.params.hostnameUrl + '&estadonv=enproceso&estado=negocio&currency_format=True&year=' + val + '&qid=' + qid

				};

				axios(config)
					.then(function (response) {

						console.log("llegan datos")


						if (response.data.records.total_records > 0) {



							$.each(response.data.data.rows, function (key, item) {
								let opts = $('div#businesslist div[id="heading' + item.id + '"]');

								if (opts.length == 0) {
									let row =
										'<div class="card no-gutters shadow  business bg-dark  ">' +
										'<div class="  container-fluid no-gutters" id="heading' + item.id + '">' +

										'<a href="business.shtml?id=' + item.id + '" style="background-color: #d5d8dd" class="list-group-item list-group-item-action listado no-gutters" >' +
										'<div class="d-flex w-100 justify-content-between">' +
										'<h5 class="mb-1"></h5>' +
										'<small  class="badge badge-success badge-pill">' + item.fecha_asignacion + '</small>' +
										'</div>' +
										'<div class="row">' +
										'<div class="d-flex w-100 justify-content-between col-12 col-md-12 col-xl-12 ">' +
										'<span style="font-size: 1em;font-weight: bold;" class="mb-1">' + item.folio + " - " + item.referencia + '</span>' +
										'</div>' +
										'<div class="d-flex w-100 justify-content-between col-12 col-md-12 col-xl-12 ">' +
										'<small class="mb-1">' + item.razon_cliente + '</small>' +
										'</div>' +
										'<div class=" ' + hideClass + ' col-3 col-md-3 col-xl-3 text-center">' +
										'<span class="">' + item.total_neto + '</span><br>' +
										'<small  class="">Total venta</small>' +
										'</div>' +

										'<div class="' + hideClass + ' col-3 col-md-3 col-xl-3 text-center ">' +
										'<span class="">' + item.costo.presupuestado + '</span><br>' +
										'<small  class="">Presupuesto </small>' +

										'</div>' +

										'<div class="' + hideClass + ' col-3 col-md-3  col-xl-3 text-center">' +
										'<span class="">' + item.costo.real + '</span><br>' +
										'<small  class="">Gasto real</small>' +

										'</div>' +
										'<div class="' + hideClass + ' col-3 col-md-3  col-xl-3 text-center">' +
										'<span >' + item.utilidad.real + '</span><br>' +
										'<small  class="">Utilidad</small>' +

										'</div>' +


										'</div>' +
										'<div class="d-flex w-100 justify-content-between">' +
										'<h5 class="mb-1"></h5>' +
										'<small  class="badge badge-info badge-pill">  </small>' +
										'</div>' +


										'</a>' +
										'</div>' +
										'</div>';

									listado.append(row);



									if (qid !== "") {
										$('div#heading' + qid + ' a').focus();
										$("#businessSearch").trigger('change');

									}

								}

							});


						} else {

							let row =
								'<div class="card ">' +
								'<div class="card-header business container-fluid no-gutters" >' +
								'<a  class="list-group-item list-group-item-action listado no-gutters" >' +
								'<div class="d-flex w-100 justify-content-between">' +
								'<h5 class="mb-1"></h5>' +
								'<small></small>' +
								'</div>' +
								'<div class="d-flex w-100 justify-content-between">' +
								'<span style="font-size: 1em;font-weight: bold;" class="mb-1">' + response.data.records.errorMsg + '</span>' +

								'</div>' +
								'</a>' +
								'</div>' +
								'</div>';




							errorArea.append(row);

						}




					})
					.then(function () {
						business.application.loading(false);

					})
					.catch(function (error) {

						console.log(error);
					});

			}
		},
		totales: (item) => {

			$('nav#bloque div#info-content-totales').empty();
			let bloqueTotales = $('div#info-content-totales');


			let titulo = $('div#info-content h5#titulo');
			titulo[0].textContent = item.folio + " - " + item.referencia

			const param = JSON.parse(localStorage.getItem('parametros'));
			const hideClass = param.esconder_totales_negocio_movil ? 'hide-element' : '';

			let row = `
				<div class="${hideClass}">
					<span>${item.total_neto}</span><br>
					<small>Total venta</small>
				</div>
				<div class="${hideClass}">
					<span>${item.costo.presupuestado}</span><br>
					<small>Presupuesto</small>
				</div>
				<div class="${hideClass}">
					<span>${item.costo.real}</span><br>
					<small>Gasto real</small>
				</div>
				<div class="${hideClass}">
					<span>${item.utilidad.real}</span><br>
					<small>Utilidad</small>
				</div>`;










			bloqueTotales.append(row);
		}
	},
	item: {
		categorias: {
			charge: async () => {
				business.application.loading(true);
				const valores = window.location.search;
				console.log(valores);
				const urlParams = new URLSearchParams(valores);
				let id = urlParams.get('id');
				localStorage.setItem("id_nv", id);
				let sid = business.sid();

				let config = {

					method: 'get',
					url: general.params.nodeUrl + '/get-business-items?id=' + id + '&categorias=True&hostname=' + general.params.hostnameUrl + '&currency_format=true&sid=' + sid

				};

				axios(config)
					.then(function (response) {

						console.log("llegan datos")
						let detalle = $('div#detalle-nv');

						$.each(response.data.rows, function (key, item) {

							let row =
								'<div class="card no-gutters shadow   bg-dark  ">' +
								'<div class="card-header categoria container-fluid no-gutters" id="heading' + item.llave_item + '" data-idcategoria="' + item.id_categoria + '">' +
								'<div class="d-flex w-100 justify-content-between">' +
								'<h5 class="mb-1"></h5>' +
								'<button  type="button" class="btn btn-link fas fa-sitemap"  nombre="' + item.nombre + '" llave="' + item.llave_item + '" id="editStaff" onclick="business.application.staff.charge.users(this)"   style="color:blue"  aria-pressed="false"></button>' +
								'</div>' +
								'<button class="btn  btn-block text-left  no-gutters container-fluid btn-bloq" type="button" data-toggle="collapse" data-target="#collapse' + item.llave_item + '" aria-expanded="false" aria-controls="collapse' + item.llave_item + '" tipo="categoria" llavetitulo="' + item.llave_item + '"  idnv="' + id + '" onclick="business.item.items.charge(this)" >' +



								'<div class="row  no-gutters " id="item-content">' +
								'<div class="col-1   no-gutters container-fluid ">' +
								'<i class="fas fa-angle-double-down fa-2x"></i>' +
								'</div>' +

								'<div class="col-11  no-gutters">' +
								'<div class="row no-gutters">' +

								'<div class="col-12  col-md-3 hb border-end ">' +
								'<span style="font-weight: bold;" class="name"> ' + item.nombre + '</span>' +
								'</div>' +

								'<div class="col-3  vb col-md-2 text-center">' +
								'<span class="cat-total-venta">' + item.sub_venta + '</span><br>' +
								'<small  class="">Total costo</small>' +
								'</div>' +

								'<div class="col-3 vb col-md-2 text-center ">' +
								'<span  class="cat-total-gp">' + item.sub_gasto_pre + '</span><br>' +
								'<small  class="">Presupuesto</small>' +

								'</div>' +

								'<div class="col-3 vb col-md-2 text-center">' +
								'<span  class="cat-total-gr">' + item.total_gasto_real + '</span><br>' +
								'<small  class="">Gasto real</small>' +

								'</div>' +

								'<div class="col-2 vb col-md-2 text-center">' +
								'<span  class="cat-total-dif">' + item.diferencia + '</span><br>' +
								'<small  class="">Dif</small>' +

								'</div>' +

								'<div class="col-1 col-md-1 text-right h5 green " id="porcentaje" >' +
								'<span  class="cat-porc-dif">' + item.porc_diferencia + '</span><br>' +


								'</div>' +


								'</div>' +
								'</div>	' +
								'</div>' +
								'</button>' +


								'</div>' +
								'<div id="collapse' + item.llave_item + '" class="collapse" aria-labelledby="heading' + item.llave_item + '" data-parent="#detalle-nv">' +
								'</div>' +

								'</div>';

							detalle.append(row);


							if (parseInt(item.diferencia) < 0) {

								$('button[data-target="#collapse' + item.llave_item + '"]').find('#porcentaje').removeClass('green').addClass('red');


							}






						});





					})
					.then(function (res) {

						business.application.loading(false);
					})
					.catch(function (error) {

						console.log(error);
					});

			}
		},
		items: {
			charge: async (objeto) => {

				console.log("carga de items");

				let sid = business.sid();
				business.application.icon(objeto);
				business.application.deletelist(objeto);

				let tipo = objeto.attributes.tipo.value;
				let tipoDocs = []

				if (objeto.ariaExpanded == "false") {
					business.application.loading(true);
					let k = objeto.attributes.llavetitulo.value;
					let idnv = objeto.attributes.idnv.value;
					const getTipoDocumento = async () => {
						// Configuración del request
						let config_tipo_doc = {
							method: 'get',
							url: location.origin + '/4DACTION/_V3_getTipoDocumento?id=' + idnv + '&sid=' + sid + '&q='
						};

						try {
							// Hacer la solicitud con axios
							const response = await axios(config_tipo_doc);

							// Generar el HTML del select como string
							let selectHtml = '';
							response.data.rows.forEach(e => {
								tipoDocs.push(e)
								selectHtml += `<option value="${e.id}">${e.text}</option>`;
							});


							// Devolver el select como texto
							return selectHtml;
						} catch (error) {
							console.error('Error obteniendo los tipos de documento:', error);
							return '<select id="tipoDocumento"><option>Error</option></select>'; // Manejo de error con un select vacío
						}
					};
					const selectTipoDoc = await getTipoDocumento();
					let config = {

						method: 'get',
						url: general.params.nodeUrl + '/get-business-items?id=' + idnv + '&items=True&llave_titulo=' + k + '&hostname=' + general.params.hostnameUrl + '&separatenivel=True&tipoitem=' + tipo + '&currency_format=true&sid=' + sid

					};

					axios(config)
						.then(function (response) {

							console.log("llegan items")
							let detalle = $('div#detalle-nv div#collapse' + k);



							$('div#heading' + k + ' i ').addClass('fa-rotate-180');




							$.each(response.data.rows, function (key, item) {
								let row = "";
								let detalle = $('div#detalle-nv div#collapse' + k);

								const hiddenClass = parseFloat(item.total_gasto_real.replace(',', '.')) == 0 ? 'hide-element' : '';


								if (item.isSubCat) {



									superrow =
										'<div class="card" id="heading' + item.llave_item + '" data-idcategoria="' + item.id_categoria + '">' +
										'<div class="card-header subCat  no-gutters" >' +



										'<button class="btn  btn-block text-left no-gutters btn-bloq head" type="button" data-toggle="collapse" data-target="#collapse' + item.llave_item + '" llave=' + item.llave_item + ' aria-expanded="false" tipo="subcat" aria-controls="collapse' + item.llave_item + '" llavetitulo="' + item.llave_item + '" llavecategoria="' + item.llave_titulo + '" idnv="' + idnv + '" onclick="business.item.items.charge(this)" >' +
										'<div class="row  no-gutters" id="item-content">' +
										'<div class="col-1  no-gutters  ">' +
										'<i class="fas fa-angle-down fa-2x"></i>' +
										'</div>' +

										'<div class="col-11 no-gutters">' +
										'<div class="row no-gutters">' +

										'<div class="col-12  col-md-3 ">' +
										'<span style="font-weight: bold;"> ' + item.nombre + '</span>' +
										'</div>' +

										'<div class="col-3  vb col-md-2 text-center">' +
										'<span class="subcat-total-venta">' + item.sub_venta + '</span><br>' +
										'<small  class="">Total costo</small>' +
										'</div>' +

										'<div class="col-3 vb col-md-2 text-center ">' +
										'<span class="subcat-total-gp">' + item.sub_gasto_pre + '</span><br>' +
										'<small  class="">Presupuesto</small>' +

										'</div>' +

										'<div class="col-3  vb col-md-2 text-center">' +
										'<spanclass="subcat-total-gr" >' + item.total_gasto_real + '</span><br>' +
										'<small  class="">Gasto real</small>' +

										'</div>' +

										'<div class="col-2 vb col-md-2 text-center">' +
										'<span class="subcat-total-dif">' + item.diferencia + '</span><br>' +
										'<small  class="">Diferencia</small>' +

										'</div>' +

										'<div class="col-1 col-md-1 text-right  h5 green " id="porcentaje" >' +
										'<span class="subcat-porc-dif" >' + item.porc_diferencia + '</span><br>' +
										'</div>' +

										'</div>' +
										'</div>	' +
										'</div>' +
										'</button>' +


										'<div class="d-flex w-100 justify-content-between">' +
										'<h5 class="mb-1"></h5>' +
										' <small  class="badge badge-success badge-pill">' + item.cont_sub_cat_items + '</small>' +
										'</div>' +
										'</div>' +
										'<div id="collapse' + item.llave_item + '" class="collapse" aria-labelledby="heading' + item.llave_item + '" data-parent="#collapse' + item.llave_titulo + '">' +

										'</div>' +

										'</div>';

									detalle.append(superrow);

									if (parseInt(item.diferencia) < 0) {

										$('button[data-target="#collapse' + item.llave_item + '"]').find('#porcentaje').removeClass('green').addClass('red');


									}



								} else if (item.llaveSubCat !== "") {
									row =

										'<div class="card"  id="heading' + item.llave_item + '">' +
										'<div class="card-header subCatItem container-fluid no-gutters">' +

										'<button class="btn  btn-block text-left no-gutters btn-bloq head" type="button" data-toggle="collapse" data-target="#collapse' + item.llave_item + '" aria-expanded="false"  llave="' + item.llave_item + '" llavesubcat="' + item.llaveSubCat + '" aria-controls="collapse' + item.llave_item + '"    tipo="subCatItem" llavetitulo="' + item.llave_item + '" llavecategoria="' + item.llave_titulo + '" idnv="' + idnv + '" onclick="business.item.itemdetail.charge(this)" >' +
										'<div class="row no-gutters " id="item-content">' +
										'<div class="col-1  no-gutters  ">' +
										'<i class="far fa-edit fa-2x"></i>' +
										'</div>' +

										'<div class="col-11 no-gutters ">' +
										'<div class="row no-gutters">' +

										'<div class="col-12  col-md-3 ">' +
										'<span style="font-weight: bold;" class="item-nombre"> ' + item.nombre + '</span>' +
										'</div>' +

										'<div class="col-3  vb col-md-2 text-center">' +
										'<span class="item-total-venta" >' + item.sub_venta + '</span><br>' +
										'<small  class="">Total costo</small>' +
										'</div>' +

										'<div class="col-3 vb col-md-2 text-center ">' +
										'<span class="item-total-gp">' + item.sub_gasto_pre + '</span><br>' +
										'<small  class="">Presupuesto</small>' +

										'</div>' +

										'<div class="col-2  vb col-md-2 text-center">' +
										'<span class="item-total-gr">' + item.total_gasto_real + '</span><br>' +
										'<small  class="">Gasto real</small>' +

										'</div>' +

										'<div class="col-2 vb col-md-2 text-center">' +
										'<span class="item-total-dif">' + item.diferencia + '</span><br>' +
										'<small  class="">Diferencia</small>' +

										'</div>' +

										'<div class="col-2 col-md-1 text-right h5 green " id="porcentaje" >' +
										'<span class="item-porc-dif">' + item.porc_diferencia + '</span><br>' +
										'</div>' +


										'</div>' +
										'</div>	' +
										'</div>' +
										'</button>' +
										'</div>' +
										'<div id="collapse' + item.llave_item + '" class="collapse " aria-labelledby="heading' + item.llave_item + '" data-parent="#collapse' + item.llaveSubCat + '">' +

										'</div>' +
										'</div>';



									detalle.append(row);
									if (parseInt(item.diferencia) < 0) {

										$('button[data-target="#collapse' + item.llave_item + '"]').find('#porcentaje').removeClass('green').addClass('red');


									}

								} else {
									row =
										'<div class="card " id="heading' + item.llave_item + '">' +
										'<div class="card-header item container-fluid no-gutters" >' +

										'<button class="btn  btn-block text-left no-gutters btn-bloq head" type="button" data-toggle="collapse" data-target="#collapse' + item.llave_item + '" aria-expanded="false"  aria-controls="collapse' + item.llave_item + '" llavetitulo="' + item.llave_item + '"  llave="' + item.llave_item + '" llavecategoria="' + item.llave_titulo + '" llavesubcat="' + item.llaveSubCat + '" >' +
										'<div class="row no-gutters " id="item-content">' +
										'<div class="col-1  no-gutters  ">' +
										'<i class="far fa-edit fa-2x"></i>' +
										'</div>' +

										'<div class="col-11 no-gutters ">' +
										'<div class="row no-gutters">' +

										'<div class="col-12  col-md-3 ">' +
										'<span style="font-weight: bold;" class="item-nombre"> ' + item.nombre + '</span>' +
										'</div>' +

										'<div class="col-3  vb col-md-2 text-center">' +
										'<span class="item-total-venta" >' + item.sub_venta + '</span><br>' +
										'<small  class="">Total costo</small>' +
										'</div>' +

										'<div class="col-3 vb col-md-2 text-center ">' +
										'<span class="item-total-gp">' + item.sub_gasto_pre + '</span><br>' +
										'<small  class="">Presupuesto</small>' +

										'</div>' +

										'<div class="col-2  vb col-md-2 text-center">' +
										'<span class="item-total-gr">' + item.total_gasto_real + '</span><br>' +
										'<small  class="">Gasto real</small>' +

										'</div>' +

										'<div class="col-2 vb col-md-2 text-center">' +
										'<span class="item-total-dif">' + item.diferencia + '</span><br>' +
										'<small  class="">Diferencia</small>' +

										'</div>' +

										'<div class="col-2 col-md-1 text-right h5 green " id="porcentaje" >' +
										'<span class="item-porc-dif">' + item.porc_diferencia + '</span><br>' +
										'</div>' +


										'</div>' +
										'</div>	' +
										'</div>' +
										'</button>' +
										'</div>' +
										'<div id="collapse' + item.llave_item + '" class="collapse" aria-labelledby="heading' + item.llave_item + '" data-parent="#collapse' + item.llave_titulo + '">' +

										'<div id="' + item.llave_item + '" class="card-body item  no-gutters ">' +
										'<div class="row " id="item-content-detail">' +


										'<div class="col-12 col-xl-12"  >' +
										'<button type="button" class="btn btn-link" id="edit" onclick="business.application.item.edit(this)" llave_item="' + item.llave_item + '" aria-pressed="false">' +
										'<i class="fas fa-pen-square fa-2x" style="color:green"></i>' +
										'</button>' +
										'<button type="button" class="btn btn-link" id="save" onclick="business.application.item.save(this)" llave_item="' + item.llave_item + '" aria-pressed="false" idnv="' + idnv + '">' +
										'<i class="fas fa-save fa-2x" style="color:green"> </i>' +
										'</button>' +
										'<button type="button" class="btn btn-link" id="clone" onclick="business.application.item.clone(this)" llave_item="' + item.llave_item + '" aria-pressed="false" idnv="' + idnv + '">' +
										'<i class="far fa-clone fa-2x" style="color:green"> </i>' +
										'</button>' +
										'<button type="button" class="btn btn-link" id="delete" onclick="business.application.item.delete(this)" llave_item="' + item.llave_item + '" aria-pressed="false" idnv="' + idnv + '">' +
										'<i class="fas fa-trash fa-2x" style="color:red"> </i>' +
										'</button>' +
										'</div>' +

										'<div class="col-4  col-xl-2">' +
										'<small for="" class="form-label ">Codigo</small>' +
										' <input type="text" class="form-control border-0  edit" id="coditem" disabled value="' + item.cod + '">' +
										'</div>' +
										'<div class="col-8  col-xl-3 ">' +
										'<small for="" class="form-label">Nombre</small>' +
										'<select class="form-control edit" id="nombreitem' + item.llave_item + '" style="background-color: #edebb2">' +
										'<option value="' + item.id_producto + '" selected>' + item.nombre + '</option>' + // Valor por defecto
										'</select>' +
										'</div>' +
										'<div class="col-4  col-xl-1  ">' +
										'<small for="" class="form-label">Cantidad</small>' +
										'<input type="number" class="form-control  border-0 edit " id="cantidaditem" disabled value="' + item.cantidad + '" onchange="business.application.recalculate.itemdetail(this) ">' +
										'</div>' +
										'<div class="col-4  col-xl-2  ">' +
										'<small for="" class="form-label">Cantidad 2</small>' +
										'<input type="number" class="form-control  border-0 edit " id="cantidad2item" disabled value="' + item.cantidad2 + '" onchange="business.application.recalculate.itemdetail(this) ">' +

										'</div>' +


										'<div class="col-6  col-xl-2  ">' +
										'<small for="" class="form-label">Modelo</small>' +
										'<input type="text" class="form-control  border-0 edit " id="puitem" disabled value="' + item.pu_venta + '" onkeyup="business.application.recalculate.itemdetail(this) ">' +
										'<input  type="text" class="form-control bg-success"  style="color:white" border-0 recal" id="suitem" disabled value="' + item.sub_venta + '">' +
										'</div>' +

										'<div class="col-6  col-xl-2  ">' +
										'<small for="" class="form-label">Control</small>' +
										'<input type="text" class="form-control  border-0 edit controlInput' + item.llave_item + '" id="pugpitem" style="background-color: #edebb2" value="' + item.pu_gasto_pre + '" onkeyup="business.application.recalculate.itemdetail(this) ">' +
										'<input  type="text" class="form-control bg-success pugInput' + item.llave_item + '" style="color:white" border-0 recal" id="sugpitem" disabled value="' + item.sub_gasto_pre + '">' +
										'</div>' +

										'<div class="col-9 col-xl-3  ">' +
										'<small for="" class="form-label">Descripción</small>' +
										'<textarea class="form-control edit" id="desitem"   rows="3">' + item.descripcion + '</textarea>' +
										'</div>' +

										'<div class="col-9 col-xl-3">' +
										'<small for="" class="form-label">Tipo de documento</small>' +
										'<select id="tipoDocumento' + item.llave_item + '" class="form-control custom-select">' +
										selectTipoDoc +
										'</select>' +
										'</div>' +

										'<div class="col-3 col-xl-9  "  >' +
										'<button type="button" class="btn btn-link" tpgasto="oc" llave="' + item.llave_item + '" onclick="business.gastos.create(this)">Crear OC</button>' +
										'<button type="button" class="btn btn-link ' + hiddenClass + '" tpgasto="oc" llave="' + item.llave_item + '" onclick="business.gastos.charge(this)">Ver OC</button>' +
										'<hr>' +
										'<button type="button" class="btn btn-link" tpgasto="fxr" llave="' + item.llave_item + '" onclick="business.gastos.create(this)">Crear FXR</button>' +
										'<button type="button" class="btn btn-link ' + hiddenClass + '" tpgasto="fxr" llave="' + item.llave_item + '" onclick="business.gastos.charge(this)">Ver FXR</button>' +

										'</div>' +



										'</div>' +

										'</div>' +
										'<div id="hgastos' + item.llave_item + '" class="collapse show " aria-labelledby="collapse' + item.llave_item + '" data-parent="#collapse' + item.llave_item + '">' +

										'</div>' +

										'</div>' +

										'</div>';
									detalle.append(row);



									const select = document.getElementById('tipoDocumento' + item.llave_item);

									select.addEventListener('change', (event) => {
										console.log(`Opción seleccionada: ${event.target.value}`);

										// Buscar el input control asociado
										const inputControl = document.querySelector('.controlInput' + item.llave_item);
										const sugpitem = document.querySelector('.pugInput' + item.llave_item);

										// Si el valor original no está almacenado en el atributo, guardarlo
										if (!inputControl.hasAttribute('data-original')) {
											const rawValue = inputControl.value;
											const originalValue = parseFloat(rawValue.replace(/\./g, '').replace(/,/g, '.'));
											inputControl.setAttribute('data-original', originalValue);
										}

										// Recuperar el valor original del atributo
										const originalValue = parseFloat(inputControl.getAttribute('data-original'));

										// Encontrar el documento seleccionado en la lista de tipoDocs
										const tipoDocSelect = tipoDocs.find(doc => doc.id == event.target.value);

										if (tipoDocSelect) {
											const ratio = parseFloat(tipoDocSelect.ratio);

											if (!isNaN(originalValue) && ratio >= 0) {
												// Ajustar el valor basado en el ratio del documento seleccionado
												const valorAjustado = originalValue / (1 - ratio);
												const formattedValue = valorAjustado.toLocaleString('es-CL', {
													minimumFractionDigits: parseInt(general.params.info.data.decimals),
													maximumFractionDigits: parseInt(general.params.info.data.decimals)
												});
												inputControl.value = formattedValue;
												sugpitem.value = formattedValue;
												console.log(`Nuevo valor ajustado: ${formattedValue}`);
											} else {
												// Restaurar el valor original si no hay un ratio válido
												const formattedValue = originalValue.toLocaleString('es-CL', {
													minimumFractionDigits: parseInt(general.params.info.data.decimals),
													maximumFractionDigits: parseInt(general.params.info.data.decimals)
												});
												inputControl.value = formattedValue;
												sugpitem.value = formattedValue;
												console.log(`Valor restaurado a: ${formattedValue}`);
											}
										} else {
											console.warn('No se encontró el documento seleccionado.');
										}
									});







									if (parseInt(item.diferencia) < 0) {

										$('button[data-target="#collapse' + item.llave_item + '"]').find('#porcentaje').removeClass('green').addClass('red');


									}

									new TomSelect('#nombreitem' + item.llave_item, {
										valueField: 'id',
										labelField: 'text',
										searchField: 'text',
										load: function (query, callback) {
											if (!query.length) return callback();

											let idCategoria = objeto.parentElement.dataset.idcategoria;
											axios.get(location.origin + '/4DACTION/_V3_getProductoByCategoria?q=' + encodeURIComponent(query) + '&id=' + idCategoria)
												.then(function (response) {
													callback(response.data.rows);
												})
												.catch(function (error) {
													console.error('Error fetching data: ', error);
													callback();
												});
										},
										onChange: function (value) {
											
											if (value && value != '') {
												let selectedItem = this.options[value];
												const codigo = this.input.parentNode.parentNode.children[1].querySelector('input#coditem')
												codigo.value = selectedItem.index;
											}

										}
									});

								}


							});

						})
						.then(function () {
							business.application.loading(false);

						})
						.catch(function (error) {

							console.log(error);
						});


				}


			}
		},
		itemdetail: {
			charge: (objeto) => {
				console.log("carga de items");
				let sid = business.sid();
				// business.application.icon(objeto);
				business.application.deletelist(objeto);

				//let tipo=objeto.attributes.tipo.value;

				if (objeto.ariaExpanded == "false") {
					business.application.loading(true);
					let k = objeto.attributes.llave.value;


					let idnv = objeto.attributes.idnv.value;
					let config = {

						method: 'get',
						url: general.params.nodeUrl + '/get-business-items?id=' + idnv + '&llave=' + k + '&hostname=' + general.params.hostnameUrl + '&currency_format=true&sid=' + sid

					};

					axios(config)
						.then(function (response) {

							console.log("llegan items")
							let detalle = $('div#detalle-nv div#collapse' + k);




							$.each(response.data.rows, function (key, item) {
								let row = "";
								const hiddenClass = parseFloat(item.total_gasto_real.replace(',', '.')) == 0 ? 'hide-element' : '';
								if (item.llaveSubCat !== "") {
									row =
										'<div id="' + item.llave_item + '" class="card-body item no-gutters">' +
										'<div class="row" id="item-content-detail">' +
										'<div class="col-12 col-xl-12">' +
										'<button type="button" class="btn btn-link" id="edit" onclick="business.application.item.edit(this)" llave_item="' + item.llave_item + '" aria-pressed="false">' +
										'<i class="fas fa-pen-square fa-2x" style="color:green"></i>' +
										'</button>' +
										'<button type="button" class="btn btn-link" id="save" onclick="business.application.item.save(this)" llave_item="' + item.llave_item + '" aria-pressed="false" idnv="' + idnv + '">' +
										'<i class="fas fa-save fa-2x" style="color:green"></i>' +
										'</button>' +
										'<button type="button" class="btn btn-link" id="clone" onclick="business.application.item.clone(this)" llave_item="' + item.llave_item + '" aria-pressed="false" idnv="' + idnv + '">' +
										'<i class="far fa-clone fa-2x" style="color:green"></i>' +
										'</button>' +
										'<button type="button" class="btn btn-link" id="delete" onclick="business.application.item.delete(this)" llave_item="' + item.llave_item + '" aria-pressed="false" idnv="' + idnv + '">' +
										'<i class="fas fa-trash fa-2x" style="color:red"></i>' +
										'</button>' +
										'</div>' +

										'<div class="col-4 col-xl-2">' +
										'<small for="" class="form-label">Codigo</small>' +
										'<input type="text" class="form-control border-0 edit" id="coditem" disabled value="' + item.cod + '">' +
										'</div>' +
										'<div class="col-8 col-xl-3">' +
										'<small for="" class="form-label">Nombre</small>' +
										'<select class="form-control edit" id="nombreitem' + item.llave_item + '" style="background-color: #edebb2">' +
										'<option value="' + item.id_producto + '" selected>' + item.nombre + '</option>' + // Valor por defecto
										'</select>' +
										'</div>' +
										'<div class="col-4 col-xl-1">' +
										'<small for="" class="form-label">Cantidad</small>' +
										'<input type="text" class="form-control border-0 edit" id="cantidaditem" disabled value="' + item.cantidad + '" onchange="business.application.recalculate.itemdetail(this)">' +
										'</div>' +
										'<div class="col-4 col-xl-2">' +
										'<small for="" class="form-label">Cantidad 2</small>' +
										'<input type="text" class="form-control border-0 edit" id="cantidad2item" disabled value="' + item.cantidad2 + '" onchange="business.application.recalculate.itemdetail(this)">' +
										'</div>' +
										'<div class="col-6 col-xl-2">' +
										'<small for="" class="form-label">Modelo</small>' +
										'<input type="text" class="form-control border-0 edit" id="puitem" disabled value="' + item.pu_venta + '" onkeyup="business.application.recalculate.itemdetail(this)">' +
										'<input type="text" class="form-control bg-success border-0 recal" id="suitem" disabled value="' + item.sub_venta + '">' +
										'</div>' +
										'<div class="col-6 col-xl-2">' +
										'<small for="" class="form-label">Control</small>' +
										'<input type="text" class="form-control border-0 edit" id="pugpitem" style="background-color: #edebb2" value="' + item.pu_gasto_pre + '" onkeyup="business.application.recalculate.itemdetail(this)">' +
										'<input type="text" class="form-control bg-success border-0 recal" id="sugpitem" disabled value="' + item.sub_gasto_pre + '">' +
										'</div>' +
										'<div class="col-6 col-xl-2">' +
										'<small for="" class="form-label">Control</small>' +
										'<input type="text" class="form-control border-0 edit" id="pugpitem" style="background-color: #edebb2" value="' + item.pu_gasto_pre + '" onkeyup="business.application.recalculate.itemdetail(this)">' +
										'<input type="text" class="form-control bg-success border-0 recal" id="sugpitem" disabled value="' + item.sub_gasto_pre + '">' +
										'</div>' +
										'<div class="col-9 col-xl-3">' +
										'<small for="" class="form-label">Descripción</small>' +
										'<textarea class="form-control edit" id="desitem" rows="3">' + item.descripcion + '</textarea>' +
										'</div>' +
										'<div class="col-3 col-xl-9">' +
										'<button type="button" class="btn btn-link" tpgasto="oc" llave="' + item.llave_item + '" onclick="business.gastos.create(this)">Crear OC</button>' +
										'<button type="button" class="btn btn-link ' + hiddenClass + '" tpgasto="oc" llave="' + item.llave_item + '" onclick="business.gastos.charge(this)">Ver OC</button>' +
										'<hr>' +
										'<button type="button" class="btn btn-link" tpgasto="fxr" llave="' + item.llave_item + '" onclick="business.gastos.create(this)">Crear FXR</button>' +
										'<button type="button" class="btn btn-link ' + hiddenClass + '" tpgasto="fxr" llave="' + item.llave_item + '" onclick="business.gastos.charge(this)">Ver FXR</button>' +
										'</div>' +
										'</div>' +
										'</div>' +
										'<div id="hgastos' + item.llave_item + '" class="collapse show" aria-labelledby="collapse' + item.llave_item + '" data-parent="#collapse' + item.llave_item + '"></div>';

									detalle.append(row);


									// Inicializar TomSelect para el select de búsqueda
									new TomSelect('#nombreitem' + item.llave_item, {
										valueField: 'id',
										labelField: 'text',
										searchField: 'text',
										load: function (query, callback) {
											if (!query.length) return callback();
											let cardWithCategoria = objeto.closest('.card');

											while (cardWithCategoria && !cardWithCategoria.hasAttribute('data-idcategoria')) {
												cardWithCategoria = cardWithCategoria.parentElement.closest('.card');
											}
											let idCategoria = cardWithCategoria ? cardWithCategoria.getAttribute('data-idcategoria') : null;


											axios.get(location.origin + '/4DACTION/_V3_getProductoByCategoria?q=' + encodeURIComponent(query) + '&id=' + idCategoria)
												.then(function (response) {
													callback(response.data);
												})
												.catch(function (error) {
													console.error('Error fetching data: ', error);
													callback();
												});
										},
										onChange: function (value) {
											
											if (value && value != '') {
												let selectedItem = this.options[value];
												const codigo = this.input.parentNode.parentNode.children[1].querySelector('input#coditem')
												codigo.value = selectedItem.index;
												

											}
										}
									});
								}
							});






						})
						.then(function () {
							business.application.loading(false);
						})
						.catch(function (error) {

							console.log(error);
						});


				}


			}
		}
	},
	gastos: {
		charge: (obj) => {

			let key = obj.attributes.llave.value;
			let tp = obj.attributes.tpgasto.value;

			const valores = window.location.search;


			const urlParams = new URLSearchParams(valores);
			let id = urlParams.get('id');

			let config = {

				method: 'get',
				url: general.params.nodeUrl + '/light-search?id=' + id + '&llave=' + key + '&hostname=' + general.params.hostnameUrl + '&tpgasto=' + tp + '&tipo=gastos&currency_format=true'

			};



			axios(config)
				.then(function (response) {

					let target = $(' div#hgastos' + key);

					target.empty();
					if (response.data.records.total_records > 0) {



						$.each(response.data.data.rows, function (key, item) {
							const statusColor = item.estado === 'ANULADA' ? 'text-red' : '';
							row =
								'<a href="' + general.params.hostnameUrl + '/4DACTION/wbienvenidos#compras/content.shtml?id=' + item.idoc + '" target="_blank">' +
								'<div class="card " id="content-gasto' + key + '" idoc="' + item.idoc + '">' +
								'<div class="card-header item container-fluid no-gutters" >' +

								'<div class="row no-gutters">' +
								'<div class="col-12  col-md-12 ">' +
								'<span style="font-weight: bold;" class="oc-folio badge-pill badge-info mx-auto  h4"> ' + item.tipogasto + '</span>' +
								'<h1></h1>' +
								'<small  class="badge badge-warning badge-pill float-right">' + item.tipodoc + '</small>' +
								'</div>' +
								'<div class="col-12  col-md-12 ">' +
								'<span style="font-weight: bold;" class="oc-folio"> ' + item.folio + ' - ' + item.referencia + '</span>' +
								'</div>' +
								'<div class="col-12 col-md-12 text-right h5 green "  >' +
								'<span class="oc-proveedor h5">' + item.proveedor + '</span><br>' +
								'</div>' +

								'<div class="col-3  vb col-md-3 text-center">' +
								'<span class="oc-proveedor h5 ' + statusColor + '" >' + item.estado + '</span><br>' +
								'<small  class="">Estado</small>' +
								'</div>' +

								'<div class="col-3 vb col-md-2 text-center ">' +
								'<span class="h5">' + item.total_justificado + '</span><br>' +
								'<small  class="">Justificado</small>' +
								'</div>' +

								'<div class="col-2  vb col-md-2 text-center">' +
								'<span class=" h5">' + item.pagado + '</span><br>' +
								'<small  class="">Pagado</small>' +

								'</div>' +

								'<div class="col-2 vb col-md-2 text-center">' +
								'<span class="h5">' + item.total_oc + '</span><br>' +
								'<small  class="">Total </small>' +

								'</div>' +



								'</div>' +
								'</div>	' +
								'</div>' +
								'</a>';



							target.append(row);


						});
					} else {
						let m = "";
						if (tp == "oc") {

							m = "OCs asociadas"
						} else {
							m = "FXR asociados"
						}

						business.toast.info("Este item no tiene " + m)
					}


				});




		},
		create: (obj) => {
			let key = obj.attributes.llave.value;
			let tp = obj.attributes.tpgasto.value;

			const valores = window.location.search;


			const urlParams = new URLSearchParams(valores);
			let id = urlParams.get('id');


			const formDataInitial = new URLSearchParams();
			formDataInitial.append('create_from', tp);
			formDataInitial.append('oc[from]', tp);

			axios.post(general.params.hostnameUrl + '/4DACTION/_V3_setCompras', formDataInitial)
				.then(response => {


					let llave_titulo = ('OC' + (Math.random() * 0xFFFFFFFF << 0).toString(16) + 'TITULO' + (1) + (Math.round(Math.random() * 100000)));
					let llave_actual = ('OC' + (Math.random() * 0xFFFFFFFF << 0).toString(16) + 'ITEM' + (2) + (Math.round(Math.random() * 100000)));
					let llave_nv_titulo = document.querySelector(`button.head[llave="${key}"]`).attributes.llavecategoria.value
					let nombre_titulo = document.querySelector(`div#heading${llave_nv_titulo} span.name`).textContent
					//let precio_item =   document.querySelector(`#${key} #sugpitem`).value.replaceAll(".","")
					let precio_item = document.querySelector(`button.head[llave="${key}"] span.item-total-dif`).textContent.replaceAll(".", "")
					// OBTENER NOMBRE DE ITEM
					let namecont = document.querySelector(`#nombreitem${key}`);
					let nombre_item = namecont.options[namecont.selectedIndex].text;
					const id_producto = namecont.options[namecont.selectedIndex].value

					const data = response.data;
					const formData = new URLSearchParams();


					// TITULO
					formData.append('oc[detalle_item][llave]', llave_titulo);
					formData.append('oc[detalle_item][tipo]', 'TITULO');
					formData.append('oc[detalle_item][items]', 1);
					formData.append('oc[detalle_item][idnv]', id);
					formData.append('oc[detalle_item][origen]', 'PROYECTO');
					formData.append('oc[detalle_item][origen][lugar]', 'INTERNO');
					formData.append('oc[detalle_item][origen][lugar][des]', 'ITEM DIRECTO');
					formData.append('oc[detalle_item][id_tipo_producto]', '04');
					formData.append('oc[detalle_item][cod_producto]', '');
					formData.append('oc[detalle_item][id_producto]', "");
					formData.append('oc[detalle_item][llave_nv]', llave_nv_titulo);
					formData.append('oc[detalle_item][id_clasif]', "");
					formData.append('oc[detalle_item][des_clasif]', '');
					formData.append('oc[detalle_item][llave_titulo]', llave_titulo);
					formData.append('oc[detalle_item][observacion_item]', '');
					formData.append('oc[detalle_item][nombre]', nombre_titulo);
					formData.append('oc[detalle_item][cantidad]', 0);
					formData.append('oc[detalle_item][dias]', 0);
					formData.append('oc[detalle_item][precio]', 0);
					formData.append('oc[detalle_item][subtotal]', 0);
					formData.append('oc[detalle_item][dscto]', 0);
					formData.append('oc[detalle_item][total]', 0);


					// ITEM
					formData.append('oc[detalle_item][llave]', llave_actual);
					formData.append('oc[detalle_item][tipo]', 'ITEM');
					formData.append('oc[detalle_item][items]', 2);
					formData.append('oc[detalle_item][idnv]', id);
					formData.append('oc[detalle_item][origen]', 'PROYECTO');
					formData.append('oc[detalle_item][origen][lugar]', 'INTERNO');
					formData.append('oc[detalle_item][origen][lugar][des]', 'ITEM DIRECTO');
					formData.append('oc[detalle_item][id_tipo_producto]', '04');
					formData.append('oc[detalle_item][cod_producto]', '');
					formData.append('oc[detalle_item][id_producto]', id_producto);
					formData.append('oc[detalle_item][llave_nv]', key);
					formData.append('oc[detalle_item][id_clasif]', "");
					formData.append('oc[detalle_item][des_clasif]', '');
					formData.append('oc[detalle_item][llave_titulo]', llave_titulo);
					formData.append('oc[detalle_item][observacion_item]', '');
					formData.append('oc[detalle_item][nombre]', nombre_item);
					formData.append('oc[detalle_item][cantidad]', 1);
					formData.append('oc[detalle_item][dias]', 1);
					formData.append('oc[detalle_item][precio]', precio_item);
					formData.append('oc[detalle_item][subtotal]', precio_item);
					formData.append('oc[detalle_item][dscto]', 0);
					formData.append('oc[detalle_item][total]', precio_item);

					//GENERALES
					formData.append('id', data.id);
					formData.append('oc[negocio][id]', id);
					formData.append('create_from', tp);
					formData.append('oc[from]', tp);

					axios.post(general.params.hostnameUrl + '/4DACTION/_V3_setCompras', formData)
						.then(subresponse => {

							window.open(general.params.hostnameUrl + `/4DACTION/wbienvenidos#compras/content.shtml?id=${data.id}`);
						})
						.catch(suberror => {
							console.error('Error en la segunda solicitud:', suberror);
						});
				})
				.catch(error => {
					console.error('Error en la primera solicitud:', error);
				});

		}
	},
	application: {
		icon: (target) => {

			let tipo = target.attributes.tipo.value;
			let active = "";

			if (tipo == "categoria") {

				active = $('div.categoria button[aria-expanded="true"] i').removeClass('fa-rotate-180');



			} else if (tipo = "subcat") {

				active = $('div.subCat button[aria-expanded="true"] i').removeClass('fa-rotate-180');


			}
		},
		deletelist: (target) => {

			let tipo = target.attributes.tipo.value;
			let tar = "";

			if (tipo == "categoria") {
				tar = $('div#business-content div.categoria button[aria-expanded="true"]').data('target');

			} else if (tipo == "subcat") {
				tar = $('div#business-content div.subCat button[aria-expanded="true"]').data('target');
			} else if (tipo == "subCatItem") {
				tar = $('div#business-content div.subCatItem button[aria-expanded="true"]').data('target');
			}



			if (tar !== "" && typeof tar === 'string') {

				$('div' + tar).empty();



			}
		},
		recalculate: {
			itemdetail: (obj) => {




				let idobj = obj.parentElement.parentElement.parentElement.attributes.id.value;

				let venta = $('div#' + idobj + ' #puitem');
				let gasto = $('div#' + idobj + ' #pugpitem');
				let subventa = $('div#' + idobj + ' #suitem');
				let subgasto = $('div#' + idobj + ' #sugpitem');
				let cantidad = $('div#' + idobj + ' #cantidaditem');
				let cantidad2 = $('div#' + idobj + ' #cantidad2item');
				let rcsv = 0;
				let rcgp = 0;

				// let vval=venta[0].value.replaceAll ( ",", "").replaceAll ( ".", "");
				// let gval=gasto[0].value.replaceAll ( ",", "").replaceAll ( ".", "");	
				let vval = venta[0].value.replaceAll(".", "");
				let gval = gasto[0].value.replaceAll(".", "");

				
				if (obj.attributes.id.value == "cantidaditem" || obj.attributes.id.value == "cantidad2item") {



					rcsv = parseFloat(cantidad[0].value) * parseFloat(cantidad2[0].value) * parseFloat(vval);

					rcgp = parseFloat(cantidad[0].value) * parseFloat(cantidad2[0].value) * parseFloat(gval);

					subventa[0].value = new Intl.NumberFormat("de-DE").format(rcsv);
					subgasto[0].value = new Intl.NumberFormat("de-DE").format(rcgp);

				} else if (obj.attributes.id.value == "puitem") {

					rcsv = parseFloat(cantidad[0].value) * parseFloat(cantidad2[0].value) * parseFloat(vval);
					venta[0].value = new Intl.NumberFormat("de-DE").format(vval);

					subventa[0].value = new Intl.NumberFormat("de-DE").format(rcsv);


					

				} else if (obj.attributes.id.value == "pugpitem") {

					rcsv = parseFloat(cantidad[0].value) * parseFloat(cantidad2[0].value) * parseFloat(gval);
					gasto[0].value = new Intl.NumberFormat("de-DE").format(gval);

					subgasto[0].value = new Intl.NumberFormat("de-DE").format(rcsv);


					gasto[0].setAttribute('data-original', rcsv);
				}



			},
			subcat: (key) => {


				const valores = window.location.search;
				console.log(valores);
				const urlParams = new URLSearchParams(valores);
				let id = urlParams.get('id');
				let sid = business.sid();

				let config = {

					method: 'get',
					url: general.params.nodeUrl + '/get-business-items?id=' + id + '&llave=' + key + '&hostname=' + general.params.hostnameUrl + '&currency_format=true&subcat=true&sid=' + sid

				};



				axios(config)
					.then(function (response) {


						$('div#heading' + key + ' button.btn-bloq span.subcat-total-venta')[0].textContent = response.data.rows[0].sub_venta;
						$('div#heading' + key + ' button.btn-bloq span.subcat-total-gp')[0].textContent = response.data.rows[0].sub_gasto_pre;
						$('div#heading' + key + ' button.btn-bloq span.subcat-total-gr')[0].textContent = response.data.rows[0].total_gasto_real;
						$('div#heading' + key + ' button.btn-bloq span.subcat-total-dif')[0].textContent = response.data.rows[0].diferencia;
						$('div#heading' + key + ' button.btn-bloq span.subcat-porc-dif')[0].textContent = response.data.rows[0].porc_diferencia;


					});


			},
			cat: (key) => {


				const valores = window.location.search;
				console.log(valores);
				const urlParams = new URLSearchParams(valores);
				let id = urlParams.get('id');
				let sid = business.sid();
				let config = {

					method: 'get',
					url: general.params.nodeUrl + '/get-business-items?id=' + id + '&llave=' + key + '&categorias=True&hostname=' + general.params.hostnameUrl + '&currency_format=true&sid=' + sid

				};



				axios(config)
					.then(function (response) {

						$('div#heading' + key + ' button.btn-bloq span.cat-total-venta')[0].textContent = response.data.rows[0].sub_venta;
						$('div#heading' + key + ' button.btn-bloq span.cat-total-gp')[0].textContent = response.data.rows[0].sub_gasto_pre;
						$('div#heading' + key + ' button.btn-bloq span.cat-total-gr')[0].textContent = response.data.rows[0].total_gasto_real;
						$('div#heading' + key + ' button.btn-bloq span.cat-total-dif')[0].textContent = response.data.rows[0].diferencia;
						$('div#heading' + key + ' button.btn-bloq span.cat-porc-dif')[0].textContent = response.data.rows[0].porc_diferencia;

					});



			},
			item: (key) => {




				const valores = window.location.search;
				console.log(valores);
				const urlParams = new URLSearchParams(valores);
				let id = urlParams.get('id');
				let sid = business.sid();
				let config = {

					method: 'get',
					url: general.params.nodeUrl + '/get-business-items?id=' + id + '&llave=' + key + '&hostname=' + general.params.hostnameUrl + '&currency_format=true&sid=' + sid

				};



				axios(config)
					.then(function (response) {

						$('div#heading' + key + ' button.btn-bloq span.item-nombre')[0].textContent = response.data.rows[0].nombre;
						$('div#heading' + key + ' button.btn-bloq span.item-total-venta')[0].textContent = response.data.rows[0].sub_venta;
						$('div#heading' + key + ' button.btn-bloq span.item-total-gp')[0].textContent = response.data.rows[0].sub_gasto_pre;
						$('div#heading' + key + ' button.btn-bloq span.item-total-gr')[0].textContent = response.data.rows[0].total_gasto_real;
						$('div#heading' + key + ' button.btn-bloq span.item-total-dif')[0].textContent = response.data.rows[0].diferencia;
						$('div#heading' + key + ' button.btn-bloq span.item-porc-dif')[0].textContent = response.data.rows[0].porc_diferencia;

					});
			}

		},
		item: {
			save: (obj) => {

				business.application.loading(true);
				console.log("Guardando Item");

				let idobj = obj.attributes.llave_item.value;
				let idnv = obj.attributes.idnv.value;

				let ventacont = $('div#' + idobj + ' #puitem');
				let gastocont = $('div#' + idobj + ' #pugpitem');
				let subventacont = $('div#' + idobj + ' #suitem');
				let subgastocont = $('div#' + idobj + ' #sugpitem');
				let cantidadcont = $('div#' + idobj + ' #cantidaditem');
				let cantidad2cont = $('div#' + idobj + ' #cantidad2item');
				let namecont = $('div#' + idobj + ' #nombreitem' + idobj);
				let codcont = $('div#' + idobj + ' #coditem');
				let descont = $('div#' + idobj + ' #desitem');

				let code = codcont[0].value;
				let name = namecont[0].options[namecont[0].selectedIndex].text;

				let c1 = cantidadcont[0].value;
				let c2 = cantidad2cont[0].value;
				let pu = ventacont[0].value.replaceAll(",", "").replaceAll(".", "");
				let gp = gastocont[0].value.replaceAll(",", "").replaceAll(".", "");
				let des = descont[0].value;

				// OBTENER NOMBRE DE ITEM
				
				let nombre_item = namecont[0].options[namecont[0].selectedIndex].text;
				const id_producto = namecont[0].options[namecont[0].selectedIndex].value

				let sid = business.sid();

				let config = {

					method: 'post',
					url: general.params.nodeUrl + '/save-item?tipo=save&idnv=' + idnv + '&llave=' + idobj + '&hostname=' + general.params.hostnameUrl + '&code=' + code + '&name=' + name + '&c1=' + c1 + '&c2=' + c2 + '&pu=' + pu + '&gp=' + gp + '&des=' + des + '&sid=' + sid + '&id_producto=' + id_producto

				};

				axios(config)
					.then(function (response) {

						console.log("Item Guardado")

						business.application.retotales();
						business.application.loading(false);
						business.toast.set("Item Guardado");

						business.application.recalculate.item(idobj);
						if (response.data.llavesubcat !== "") {
							business.application.recalculate.subcat(response.data.llavesubcat);
						}
						business.application.recalculate.cat(response.data.llavecat);

					});
			},
			edit: (obj) => {


				if (obj.ariaPressed == "false") {
					console.log("Editando Item");
					$('div#' + obj.attributes.llave_item.value + ' .edit').removeAttr("disabled", "false");
					$('div#' + obj.attributes.llave_item.value + ' .edit').removeClass('border-0');

					obj.ariaPressed = "true";
				} else {
					console.log("Edición Terminada Item");
					$('div#' + obj.attributes.llave_item.value + ' .edit').attr("disabled", "true");
					$('div#' + obj.attributes.llave_item.value + ' .edit').addClass('border-0');

					obj.ariaPressed = "false";

				}
			},
			clone: (obj) => {


				business.application.loading(true);
				console.log("Duplicando Item");

				let idobj = obj.attributes.llave_item.value;
				let idnv = obj.attributes.idnv.value;

				
				const id_producto = obj.parentNode.parentNode.querySelector(`select#nombreitem${idobj}`)?.value || 0;

				let sid = business.sid();

				let config = {
					method: 'post',
					url: general.params.nodeUrl + '/light-actions?tipo=clone&idnv=' + idnv + '&llave=' + idobj + '&hostname=' + general.params.hostnameUrl + '&sid=' + sid + '&id_producto=' + id_producto

				};

				axios(config)
					.then(function (response) {

						business.application.recalculate.cat(response.data.llavecat);

						console.log("Item Duplicado");

						business.application.retotales();
						business.application.loading(false);
						business.toast.set("Item duplicado");
						let llavecat = response.data.llavecat;
						let llavesubcat = response.data.llavesubcat;

						if (llavesubcat !== "") {
							if (response.data.llavesubcat !== "") {
								business.application.recalculate.subcat(response.data.llavesubcat);
							}

							$('div#collapse' + llavesubcat).empty();
							$('div#collapse' + llavesubcat).removeClass('show');
							let target = $('div#heading' + llavesubcat + ' button.btn-bloq');
							target[0].ariaExpanded = "false";
							$('div#heading' + llavesubcat + ' button.btn-bloq').trigger("click");

						} else {



							$('div#collapse' + llavecat).empty();
							$('div#collapse' + llavecat).removeClass('show');
							let target = $('div#heading' + llavecat + '  button.btn-bloq');
							target[0].ariaExpanded = "false";

							$('div#heading' + llavecat + ' button.btn-bloq').trigger("click");


						}








					});



			},
			delete: (obj) => {
				if (window.confirm("¿Esta seguro que desea eliminar este elemento?")) {

					business.application.loading(true);
					console.log("Eliminando Item");

					let idobj = obj.attributes.llave_item.value;
					let idnv = obj.attributes.idnv.value;


					let sid = business.sid();


					let config = {

						method: 'post',
						url: general.params.nodeUrl + '/light-actions?tipo=delete&idnv=' + idnv + '&llave=' + idobj + '&hostname=' + general.params.hostnameUrl + '&sid=' + sid

					};

					axios(config)
						.then(function (response) {





							if (response.data.success) {
								console.log("Item Eliminado");
								$('div#detalle-nv div#heading' + idobj).remove();

								business.toast.set("Item Eliminado");
								business.application.retotales();
								business.application.loading(false);
								if (response.data.llavesubcat !== "") {
									business.application.recalculate.subcat(response.data.llavesubcat);
								}
								business.application.recalculate.cat(response.data.llavecat);


							} else {
								business.application.loading(false);
								console.log(response.data.errorMsg);
								business.toast.alert(response.data.errorMsg);
							}



						});
				}


			}

		},
		retotales: (obj) => {


			const valores = window.location.search;
			const urlParams = new URLSearchParams(valores);
			let id = urlParams.get('id');
			let sid = business.sid();

			let config = {

				method: 'get',
				url: general.params.nodeUrl + '/get-business-list?id=' + id + '&hostname=' + general.params.hostnameUrl + '&total_format_k=True&sid=' + sid

			};

			axios(config)
				.then(function (response) {

					business.starter.totales(response.data.data.rows[0]);

				})
				.catch(function (error) {

					console.log(error);
				});
		},
		loading: (opt) => {


			let target = $('div#WindowLoad');

			if (opt) {


				let height = 20;
				let ancho = 0;
				let alto = 0;

				if (window.innerWidth == undefined) {
					ancho = window.screen.width;
				}
				else {
					ancho = window.innerWidth;
				}

				if (window.innerHeight == undefined) alto = window.screen.height;
				else alto = window.innerHeight;


				var heightdivsito = alto / 2 - parseInt(height) / 2;

				let loader =
					'<div class="d-flex justify-content-center text-center align-middle align-items-center" style="height:' + alto + 'px;  ">' +
					'<div class="spinner-grow text-success" role="status" style="width: 6rem; height: 6rem;">' +
					'<span class="sr-only">Loading...</span>' +
					'</div>' +
					'</div>';

				div = document.createElement("div");
				div.id = "WindowLoad"
				div.style.width = ancho + "px";
				div.style.height = alto + "px";
				$("body").append(div);

				input = document.createElement("input");
				input.id = "focusInput";
				input.type = "text"

				$("#WindowLoad").append(input);

				$("#focusInput").focus();
				$("#focusInput").hide();

				$("#WindowLoad").html(loader);


			} else {
				setTimeout(() => {
					target.remove();
				}, 600);

			}
		},
		export: {
			resumen: () => {

				const valores = window.location.search;
				const urlParams = new URLSearchParams(valores);
				let id = urlParams.get('id');
				let sid = business.sid();

				var url =
					general.params.nodeUrl +
					"/export-negocio/?download=true&entity=cotizaciones&id=" +
					id +
					"&folio=" +

					"&sid=" +
					sid +
					"&preview=false&nullified=false " +

					"&hostname=" +
					window.location.origin +
					"&presupuestos=false";


				var download = window.open(url).blur();
				window.focus();
				try {
					download.close();
				} catch (err) {
					console.log(err);
				}

			}
		},
		staff: {
			charge: {
				users: (obj) => {


					let sid = business.sid();
					let llave = obj.attributes.llave.value;
					let nombre = obj.attributes.nombre.value;
					let idnv = localStorage.getItem("id_nv");
					let user = "";
					let config = {

						method: 'get',
						url: general.params.nodeUrl + '/get-users-staff?idnv=' + idnv + '&llave=' + llave + '&hostname=' + general.params.hostnameUrl + '&sid=' + sid

					};

					axios(config)
						.then(function (response) {


							console.log("Users staff");

							let userrows = "";

							let userList = "";

							let acceso = "";


							if (response.data.errorMsg == "") {

								$.each(response.data.rows, function (key, item) {




									if (item.access) {
										acceso = "checked"
									}



									userrows += '<a class="list-group-item list-group-item-action " user="' + item.user + '" tipo="categoria" llave="' + llave + '" user="' + item.user + '" id="user-' + item.user + '" data-toggle="list" href="#list-' + item.user + '" role="tab" aria-controls=' + item.user + '"   >' + item.nombre + '  </a>';


									userList += '<div class="tab-pane fade " id="list-' + item.user + '" role="tabpanel" aria-labelledby="user-' + item.user + '">' +

										'<div class="card  shadow   bg-dark  ">' +
										'<div class="card-header categoria " id="staffheading' + llave + item.user + '">' +

										'<div class="row" >' +
										'<div class="col-2    ">' +
										'<i class="fas fa-angle-double-down "></i>' +
										'</div>' +

										'<div class="col-10 ">' +
										'<div class="row" >' +
										'<div class="col-9 col-md-10 ">' +
										'<button class="btn  btn-block text-left  btn-bloq"  user="' + item.user + '" type="button" data-toggle="collapse" data-target="#staffcollapse' + llave + item.user + '" aria-expanded="false" aria-controls="staffcollapse' + llave + item.user + '" tipo="categoria" llavetitulo="' + llave + '" idnv="' + idnv + '" onclick="business.application.staff.charge.itemlist(this)"  >' +

										'<div class="">' +
										'<span style="font-weight: bold;"> ' + nombre + '</span>' +
										'</div>' +

										'</button>' +
										'</div>' +
										'<div class="col-3 col-md-2 custom-control custom-switch" >' +
										'<input  type="checkbox" class="custom-control-input" user="' + item.user + '" llave="' + llave + '" tipo="categoria" id="switchCat' + llave + item.user + '" ' + acceso + ' onclick="business.application.staff.setAccess(this)">' +
										' <label class="custom-control-label" for="switchCat' + llave + item.user + '"></label>' +
										'</div>' +
										'</div>' +
										'</div>' +
										'</div>' +
										'</div>' +
										'<div id="staffcollapse' + llave + item.user + '" class="collapse" aria-labelledby="staffheading' + llave + item.user + '" data-parent="">' +
										'</div>' +
										'</div>' +

										'</div>';




								});

								let staffContent =
									'<div class="row">' +
									'<div class="col-4">' +
									'<div class="list-group" id="userList" role="tablist">' +
									userrows +
									'</div>' +
									'</div>' +
									'<div class="col-8">' +
									'<div class="tab-content" id="usersAccessItemsList">' +
									userList +
									'</div>' +
									'</div>' +
									'</div>';

								business.application.modal('Staff', staffContent);




								//business.application.staff.getAccess(response.data,user,"cat");
							}
							else {

								business.toast.alert(response.data.errorMsg);
							}






						})
						.then(function () {


						});
				},
				itemlist: (objeto) => {


					let user = objeto.attributes.user.value;
					let sid = business.sid();
					let k = objeto.attributes.llavetitulo.value;
					let tipo = objeto.attributes.tipo.value;
					let detalle = $('div#modalCage div#staffcollapse' + k + user);

					business.application.staff.deletelist(objeto);


					if (objeto.ariaExpanded == "false") {
						business.application.loading(true);



						let idnv = localStorage.getItem("id_nv");

						let config = {

							method: 'get',
							url: general.params.nodeUrl + '/get-business-items?id=' + idnv + '&items=True&llave_titulo=' + k + '&hostname=' + general.params.hostnameUrl + '&tipoitem=' + tipo + '&currency_format=true&sid=' + sid

						};

						axios(config)
							.then(function (response) {

								console.log("llegan items")

								$.each(response.data.rows, function (key, item) {
									let row = "";



									if (item.isSubCat) {



										superrow =
											'<div class="card" id="staffheading' + item.llave_item + user + '">' +
											'<div class="card-header subCat  no-gutters" >' +

											'<div class="row  " >' +
											'<div class="col-2  ">' +
											'<i class="fas fa-angle-down "></i>' +
											'</div>' +
											'<div class="col-10   ">' +
											'<div class="row  " >' +
											'<div class="col-9 col-md-10  ">' +

											'<button class="btn  btn-block text-left btn-bloq" type="button"   user="' + user + '" data-toggle="collapse" data-target="#staffcollapse' + item.llave_item + user + '" llave=' + item.llave_item + ' aria-expanded="false" tipo="subcat" aria-controls="staffcollapse' + item.llave_item + '" llavetitulo="' + item.llave_item + '"  idnv="' + idnv + '" onclick="business.application.staff.charge.itemlist(this)" >' +
											'<div class="row  " >' +


											'<div class="col-11  col-md-11 ">' +
											'<span style="font-weight: bold;"> ' + item.nombre + '</span>' +
											'</div>' +

											'</div>' +
											'</button>' +
											'</div>' +
											'<div class="col-3 col-md-2 custom-control custom-switch" >' +

											'<input  type="checkbox" class="custom-control-input" tipo="subcat"  llavetitulo="' + item.llave_titulo + '" user="' + user + '" llave="' + item.llave_item + '" id="switchCat' + item.llave_item + user + '" onclick="business.application.staff.setAccess(this)">' +
											' <label class="custom-control-label" for="switchCat' + item.llave_item + user + '"></label>' +
											'</div>' +
											'</div>' +
											'</div>' +
											'</div>' +
											'<div class="d-flex w-100 justify-content-between">' +
											'<h5 class="mb-1"></h5>' +
											' <small  class="badge badge-success badge-pill">' + item.cont_sub_cat_items + '</small>' +
											'</div>' +
											'</div>' +
											'<div id="staffcollapse' + item.llave_item + user + '" class="collapse" aria-labelledby="staffheading' + item.llave_item + user + '" data-parent="#staffcollapse' + item.llave_titulo + user + '">' +

											'</div>' +

											'</div>';

										detalle.append(superrow);





									} else if (item.llaveSubCat !== "") {


										row = '<div class="card"  id="staffheading' + item.llave_item + user + '">' +
											'<div class="card-header subCatItem  ">' +


											'<div class="row "">' +
											'<div class="col-2 ">' +
											'<i class="far fa-edit "></i>' +
											'</div>' +

											'<div class="col-10 ">' +
											'<div class="row ">' +

											'<div class="col-9  col-md-10">' +
											'<span style="font-weight: bold;" class="item-nombre"> ' + item.nombre + '</span>' +
											'</div>' +
											'<div class="col-3 col-md-2 custom-control custom-switch" >' +
											'<input  type="checkbox" class="custom-control-input" tipo="item" id="switchCat' + item.llave_item + user + '" llavesubcat="' + item.llaveSubCat + '" llavetitulo="' + item.llave_titulo + '" user="' + user + '" llave="' + item.llave_item + '" onclick="business.application.staff.setAccess(this)">' +
											' <label class="custom-control-label" for="switchCat' + item.llave_item + user + '"></label>' +
											'</div>' +

											'</div>' +
											'</div>	' +
											'</div>' +
											'</div>' +
											'</div>';



										detalle.append(row);


									} else {
										row =
											'<div class="card " id="staffheading' + item.llave_item + user + '">' +
											'<div class="card-header item container-fluid no-gutters" >' +

											'<div class="row "">' +
											'<div class="col-2 ">' +
											'<i class="far fa-edit "></i>' +
											'</div>' +

											'<div class="col-10 ">' +
											'<div class="row ">' +

											'<div class="col-9  col-md-10">' +
											'<span style="font-weight: bold;" class="item-nombre"> ' + item.nombre + '</span>' +
											'</div>' +
											'<div class="col-3 col-md-2 custom-control custom-switch" >' +
											'<input  type="checkbox" class="custom-control-input" tipo="item" id="switchCat' + item.llave_item + user + '"   llavetitulo="' + item.llave_titulo + '" user="' + user + '" llave="' + item.llave_item + '" onclick="business.application.staff.setAccess(this)">' +
											' <label class="custom-control-label" for="switchCat' + item.llave_item + user + '"></label>' +
											'</div>' +

											'</div>' +
											'</div>	' +
											'</div>' +
											'</div>' +

											'</div>';


										detalle.append(row);

									}


								});


								business.application.staff.getAccess(response.data, user, tipo);



							})
							.then(function () {
								business.application.loading(false);

							})
							.catch(function (error) {

								console.log(error);
							});

					} else {
						business.application.loading(false);

						detalle.empty();
					}
				}
			},
			setAccess: (obj) => {



				let user = obj.attributes.user.value;
				let sid = business.sid();
				let k = obj.attributes.llave.value;
				let tipo = obj.attributes.tipo.value;
				let idnv = localStorage.getItem("id_nv");
				let access = obj.checked;



				let config = {

					method: 'post',
					url: general.params.nodeUrl + '/set-items-access?idnv=' + idnv + '&items=True&llave=' + k + '&hostname=' + general.params.hostnameUrl + '&tipo=' + tipo + '&login=' + user + '&access=' + access + '&sid=' + sid

				};

				axios(config)
					.then(function (response) {

						let checkboxList = null;

						if (response.data.success) {

							switch (tipo) {
								case "categoria":

									checkboxList = $('div#list-' + user + ' div.custom-switch input[llavetitulo="' + k + '"]');


									break;
								case "subcat":

									checkboxList = $('div#list-' + user + ' div.custom-switch input[llavesubcat="' + k + '"]');
									break;

							}


							if (access) {
								business.toast.modal.success('Acceso concedido');
								$.each(checkboxList, function (key, item) {
									item.checked = true;
								});


							} else {
								business.toast.modal.success('Acceso restringido');
								$.each(checkboxList, function (key, item) {
									item.checked = false;
								});
							}





						} else {

						}


					});
			},
			getAccess: (obj, user, tp) => {

				let sid = business.sid();


				let idnv = localStorage.getItem("id_nv");

				$.each(obj.rows, function (key, item) {


					let config = {

						method: 'get',
						url: general.params.nodeUrl + '/get-items-access?idnv=' + idnv + '&llave=' + item.llave_item + '&hostname=' + general.params.hostnameUrl + '&tipo=' + item.tipo_item + '&login=' + user + '&sid=' + sid

					};

					axios(config)
						.then(function (response) {


							let check = $('div#generalModal input#switchCat' + item.llave_item + user);

							if (response.data.access) {
								check[0].checked = true;
							} else {
								check[0].checked = false;
							}




						});
				});
			},
			focus: (obj) => {

				let user = obj.attributes.user.value;

				$('div#generalModal div.categoria button[user="' + user + '"]').focus();

			},
			deletelist: (target) => {

				let tipo = target.attributes.tipo.value;
				let tar = "";

				if (tipo == "categoria") {
					tar = $('div#generalModal div.categoria button[aria-expanded="true"]').data('target');

				} else if (tipo == "subcat") {
					tar = $('div#generalModal div.subCat button[aria-expanded="true"]').data('target');
				} else if (tipo == "subCatItem") {
					tar = $('div#generalModal div.subCatItem button[aria-expanded="true"]').data('target');
				}



				if (tar !== "" && typeof tar === 'string') {

					$('div' + tar).empty();



				}

			}

		},
		modal: (title, body) => {


			let modalCage = $('div#modalCage');



			let t = modalCage.find('h5').attr("id", 'modalTitle');
			t[0].textContent = title;


			let b = $('div#modalBody');
			b.empty();
			b.append(body);

			$('button#modalTrigger').trigger('click');




		}
	},
	search: {
		items: (q) => {

			const valores = window.location.search;
			const urlParams = new URLSearchParams(valores);
			let id = urlParams.get('id');
			let tipo = "item";
			if (q == '') {
				q = "";
			}
			let config = {

				method: 'get',
				url: general.params.nodeUrl + '/light-search?q=' + q + '&id=' + id + '&hostname=' + general.params.hostnameUrl + '&tipo=' + tipo

			};

			axios(config)
				.then(function (response) {
					let list = $('datalist#itemlist');
					// list.empty();
					$.each(response.data.rows, function (key, item) {

						let opts = $('datalist#itemlist option[llave="' + item.llave + '"]');

						if (opts.length == 0) {




							let superrow =
								'<option value="' + item.nombre + '" llave="' + item.llave + '" llavecat="' + item.llavecat + '" llavesubcat="' + item.llavesubcat + '" >' +
								'<p>' + item.cod + '</p>' +
								'</option>';

							list.append(superrow);



						}



					});

				});

		},
		business: (q) => {


			let tipo = "business";


			let config = {

				method: 'get',
				url: general.params.nodeUrl + '/light-search?q=' + q + '&hostname=' + general.params.hostnameUrl + '&tipo=' + tipo
			};

			axios(config)
				.then(function (response) {
					let list = $('datalist#bl');
					// list.empty();

					if (response.data.records.total_records > 0) {

						$.each(response.data.data.rows, function (key, item) {

							let opts = $('datalist#bl option[id="' + item.id + '"]');

							if (opts.length == 0) {




								let superrow =
									'<option value="' + item.folio + ' - ' + item.referencia + '" id="' + item.id + '">' +

									'</option>';

								list.append(superrow);



							}



						});
					}

				});
		},
		selected: {
			item: (val) => {


				let llave = val.attributes.llave.value;
				let llavecat = val.attributes.llavecat.value;
				let llaveSubCat = val.attributes.llavesubcat.value;
				let cont = 0;


				let cat = $('div#detalle-nv div#heading' + llavecat + ' button.btn-bloq');

				if (cat[0].ariaExpanded == "false") {

					$('div#detalle-nv div#heading' + llavecat + ' button.btn-bloq').trigger("click");
				}



				if (llaveSubCat !== "") {
					setTimeout(() => {
						let subcat = $('div#detalle-nv div#heading' + llaveSubCat + ' button');

						if (subcat[0].ariaExpanded == "false") {

							$('div#detalle-nv div#heading' + llaveSubCat + ' button.btn-bloq').trigger("click");
						}

					}, 800);

				}



				setTimeout(() => {

					$('div#heading' + llave + ' button.btn-bloq').focus();

				}, 1500);


				setTimeout(() => {
					let item = $('div#heading' + llave + '  button.btn-bloq');
					if (item[0].ariaExpanded == "false") {

						$('div#heading' + llave + ' button.btn-bloq').trigger("click");
					}



				}, 2000);

				//$("input#titleSearch").val("");

				let target = $('datalist#bl');

				target.empty();

			},
			business: (val) => {


				let qid = val.attributes.id.value;
				let inList = $('div#heading' + qid);

				if (inList.length == 0) {
					business.starter.list.charge("", qid);
				}

				let target = $('datalist#itemlist');

				target.empty();


			}

		}
	},
	toast: {
		set: (msg, delay = 3000) => {

			let toast = $('div.toast-content');
			toast.empty();

			let toastElement =
				'<div class="alert alert-success fixed-bottom float-right alert-dismissible fade show badge-pill container-fluid" role="alert"  style="width: 50%">' +
				'<p class="text-center font-weight-bold">' + msg + '</p> ' +
				'<button type="button" class=" close" data-dismiss="toast" aria-label="Close">' +
				'<span aria-hidden="true">&times;</span>' +
				'</button>' +
				'</div>';

			toast.append(toastElement);



			$('.alert').toast({
				delay
			});

			$('.alert').toast("show");

			setTimeout(() => {
				toast.empty();
			}, delay + 1000);
		},
		activate: (delay = 2000) => {

			// $('.toast').toast({
			// 	delay
			// });
			// $('.toast').toast("show");

			// setTimeout(() => {
			// 	let toastElement = document.getElementById("toastElement");
			// 	toastElement.parentNode.removeChild(toastElement);
			// }, delay+2000);
		},
		alert: (msg, delay = 4000) => {


			let toast = $('div.toast-content');
			toast.empty();

			let toastElement =

				'<div class=" alert alert-danger fixed-bottom float-right alert-dismissible fade show badge-pill container-fluid " role="alert"  style="width:50%">' +
				'<p class="text-center font-weight-bold">' + msg + '</p> ' +
				'<button type="button" class="close" data-dismiss="alert" aria-label="Close">' +
				'<span aria-hidden="true">&times;</span>' +
				'</button>' +
				'</div>';


			toast.append(toastElement);

			$('.alert').toast({
				delay
			});

			$('.alert').toast("show");

			setTimeout(() => {
				toast.empty();
			}, 5000);

		},
		info: (msg, delay = 4000) => {


			let toast = $('div.toast-content');
			toast.empty();

			let toastElement =

				'<div class=" alert alert-info fixed-bottom  alert-dismissible fade show  container-fluid " role="alert"  style="width: 50%">' +
				'<p class="text-center font-weight-bold">' + msg + '</p> ' +
				'<button type="button" class="close" data-dismiss="alert" aria-label="Close">' +
				'<span aria-hidden="true">&times;</span>' +
				'</button>' +
				'</div>';


			toast.append(toastElement);

			$('.alert').toast({
				delay
			});

			$('.alert').toast("show");

			setTimeout(() => {
				toast.empty();
			}, 5000);

		},
		modal: {
			success: (msg, delay = 2000) => {

				let toast = $('div.modal-toast-content');
				toast.empty();

				let toastElement =
					'<div class="alert alert-success fixed-bottom float-right alert-dismissible fade show badge-pill container-fluid" role="alert"  style="width: 50%">' +
					'<p class="text-center font-weight-bold">' + msg + '</p> ' +
					'<button type="button" class=" close" data-dismiss="toast" aria-label="Close">' +
					'<span aria-hidden="true">&times;</span>' +
					'</button>' +
					'</div>';

				toast.append(toastElement);



				$('.alert').toast({
					delay
				});

				$('.alert').toast("show");

				setTimeout(() => {
					toast.empty();
				}, delay + 1000);
			}
		}
	},
	session: {
		verify(redirect = false) {

			fetch(`/4DACTION/_V3_verifySession?sid=${business.sid()}`)

				.then(res => {

					// rendir.user.clean();
					if (typeof res.usename !== "undefined" || res.username !== null) {
						// rendir.user = res;
						// 

						if (redirect) window.location.href = "/light/business_list.shtml";
					} else {
						// window.location.href = "/";
					}
				}).catch(err => {
					window.location.href = "/";
					// console.log(err);
				});
		}
	},
	sid: () => {

		// var name = cname + "=";
		var decodedCookie = decodeURIComponent(document.cookie);
		var ca = decodedCookie.split(';');
		for (var i = 0; i < ca.length; i++) {
			var c = ca[i];
			while (c.charAt(0) == ' ') {
				c = c.substring(1);
			}
			// if (c.indexOf(name) == 0) {
			if (c.match(/UNABASE/g)) {
				return c.substring(c.indexOf("UNABASE"));
			}
		}
		return "";
	}
}

