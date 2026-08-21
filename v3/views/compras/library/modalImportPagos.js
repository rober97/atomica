
var btnUploadFile = document.getElementById('upload-btn')
var modalPagos = document.getElementById("modalImportadorPagos");


const downloadTemplate = () => {
  let fileName = ''
  let modulo = document.querySelector('html > body.menu.home > aside > div > div > ul > li.active').dataset.name.toUpperCase()
  if (modulo == 'GASTOS') {
    fileName = "orden_de_compra_S_N";
  } else {
    fileName = "rendicion_S_N";
  }
  let sid = unaBase.sid.encoded()

  var url = nodeUrl + '/export-template-import-pagos/?filename=' + fileName + '&sid=' + encodeURIComponent(sid) + '&modulo=' + modulo + '&hostname=' + window.location.origin;
  var download = window.open(url).blur();
  window.focus();
  download.close();
}

const importExcel = (e) => {
  let file = document.getElementById('excel-file');
  let sid = unaBase.sid.encoded();

  if (file.files.length > 0) {
    unaBase.ui.block();
    let data = new FormData();
    let attachment = file.files[0];
    data.append('upload[attachment]', attachment);
    data.append('sid', sid);

    $.ajax({
      url: nodeUrl + '/import-pagos-masivos?hostname=' + window.location.origin + '&sid=' + sid,
      type: 'POST',
      contentType: false,
      data: data,
      processData: false,
      cache: false,
      success: function (data) {
        unaBase.ui.unblock();
        const warningModal = document.getElementById('warning-modal');
        warningModal.style.display = 'none';
        warningModal.innerHTML = '';
        
        if (data !== undefined) {
          let valid = true;
          let errorList = document.createElement('ul');
          errorList.style.listStyleType = 'none';
          errorList.style.padding = '0';
          errorList.style.fontSize = '12px';

          data.forEach(item => {
            let listItem = document.createElement('li');
            listItem.style.marginBottom = '5px';

            if (item.success) {
              listItem.innerHTML = `<span class="badge bg-success">Importado con éxito! con folio: ${item.identificador}</span>`;
            } else {
              valid = false;
              listItem.innerHTML = `<span class="badge bg-warning">${item.errorMsg}</span>`;
            }

            errorList.appendChild(listItem);
          });

          if (valid) {
            modalPagos.style.display = "none";
            document.querySelector('li.active a').click();
          } else {
            warningModal.appendChild(errorList);
            warningModal.style.display = 'block';
          }
        } else {
          let errorMessage = 'No fue posible realizar la carga de los datos debido a un problema con el servidor. Por favor intente nuevamente. <p><small>Si el inconveniente persiste, por favor comuníquese con Soporte@una.cl.</small></p>';
          let errorItem = document.createElement('li');
          errorItem.innerHTML = `<span class="badge bg-danger">${errorMessage}</span>`;
          warningModal.appendChild(errorItem);
          warningModal.style.display = 'block';
        }
      },
      fail: function (e1, e2, e3) {
        unaBase.ui.unblock();
        const warningModal = document.getElementById('warning-modal');
        let errorMessage = 'No fue posible realizar la carga de los datos debido a un problema con el servidor. Por favor intente nuevamente. <p><small>Si el inconveniente persiste, por favor comuníquese con Soporte@una.cl.</small></p>';
        warningModal.innerHTML = `<span class="badge bg-danger">${errorMessage}</span>`;
        warningModal.style.display = 'block';
      }
    });

  } else {
    const warningModal = document.getElementById('warning-modal');
    warningModal.innerHTML = `<span class="badge bg-warning">Debes seleccionar un archivo Excel para poder importarlo!</span>`;
    warningModal.style.display = 'block';
  }
};



const closeModal = () => {
  // Abrir el modal cuando se hace click en el botón
  modalPagos.style.display = "none";
}


(function init() {


  var btnPlantillaDownload = document.querySelector('#modalImportadorPagos #download-template-btn')
  if (btnPlantillaDownload) {
    btnPlantillaDownload.addEventListener("click", () => downloadTemplate());
  }

  btnUploadFile.addEventListener("click", () => importExcel());

  document.querySelector('#modalImportadorPagos #excel-file').value = ''

  document.querySelector('#modalImportadorPagos #excel-file').addEventListener('change', function (event) {
    const file = event.target.files[0];
    if (file && file.type !== 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet') {
      toastr.warning("Solo se acepta archivos de tipo excel.");
      event.target.value = '';
    }
  });
})();