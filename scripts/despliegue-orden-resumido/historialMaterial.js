$(document).ready(function () {
    const path = window.location.pathname;
    const segments = path.split('/');
    const productoId = segments.pop();

  // Llenar tabla de cotizaciones
  function initHistoricoCotizaciones(data) {
    $('#historico-cotizaciones-container tbody').empty();
    data.forEach(detalle => {
      const { cotizacion } = detalle;
      const { proveedor, moneda } = cotizacion;
      const rowItem = document.createElement('tr');
      rowItem.classList.add(`${cotizacion.coc_estado === 'SOL' ? 'table-danger' : 'table-success'}`);
      rowItem.innerHTML = `
        <td>${moment(cotizacion.coc_fechacotizacion).format('DD/MM/YYYY')}</td>
        <td>${cotizacion.coc_numero}</td>
        <td>${cotizacion.coc_cotizacionproveedor || 'No aplica'}</td>
        <td>${proveedor.prv_nrodocumento}</td>
        <td>${proveedor.prv_nombre}</td>
        <td>${detalle.detalle_material.producto.pro_codigo}</td>
        <td>${detalle.cod_descripcion}</td>
        <td class="text-center">${detalle.cod_cantidad || 'N/A'}</td>
        <td class="text-center">${moneda?.mon_simbolo || ''} ${detalle.cod_preciounitario || 'N/A'}</td>
        <td class="text-center">${moneda?.mon_simbolo || ''} ${detalle.cod_total || 'N/A'}</td>
        <td class="text-center">${detalle.cod_tiempoentrega ? `${detalle.cod_tiempoentrega} día(s)` : 'N/A'}</td>
      `;
      $('#historico-cotizaciones-container tbody').append(rowItem);
    });
  }

  // Llenar tabla de órdenes de compra
  function initHistoricoOrdenCompra(data) {
    $('#historico-ordenescompra-container tbody').empty();
    data.forEach(detalle => {
      const { orden_compra } = detalle;
      const { proveedor, moneda } = orden_compra;
      const rowItem = document.createElement('tr');
      rowItem.classList.add(`${orden_compra.occ_estado === 'EMI' ? 'table-danger' : 'table-success'}`);
      rowItem.innerHTML = `
        <td>${moment(orden_compra.occ_fecha).format('DD/MM/YYYY')}</td>
        <td>${orden_compra.occ_numero}</td>
        <td>${proveedor.prv_nrodocumento}</td>
        <td>${proveedor.prv_nombre}</td>
        <td>${detalle.detalle_material.producto.pro_codigo}</td>
        <td>${detalle.ocd_descripcion}</td>
        <td class="text-center">${detalle.ocd_cantidad || 'N/A'}</td>
        <td class="text-center">${moneda?.mon_simbolo || ''} ${detalle.ocd_preciounitario || 'N/A'}</td>
        <td class="text-center">${moneda?.mon_simbolo || ''} ${detalle.ocd_total || 'N/A'}</td>
      `;
      $('#historico-ordenescompra-container tbody').append(rowItem);
    });
  }

  // Inicializar histórico por producto
  async function initHistoricoByProducto(producto) {
    if (!producto) {
      bootbox.alert('Este material no tiene un código asignado');
      return;
    }

    // Parámetros para la consulta
    const params = new URLSearchParams({ pro_id: producto });

    // Obtener el nombre del producto
    const urlProducto = `/producto/${producto}`;
    const { data } = await client.get(urlProducto);
    $('#historico-material-nombre').text(`${data.pro_codigo} - ${data.pro_descripcion}`);

    // Cotizaciones
    const urlCotizacion = `/cotizacion-detalle-findByProducto?${params.toString()}`;
    initPagination(
      urlCotizacion,
      initHistoricoCotizaciones,
      {},
      10,
      '#historico-cotizaciones-container',
      '#historico-cotizaciones-container-body',
      '#pagination-container-historico-cotizacion'
    );

    // Órdenes de compra
    const urlOrdenCompra = `/ordencompra-detalle-findByProducto?${params.toString()}`;
    initPagination(
      urlOrdenCompra,
      initHistoricoOrdenCompra,
      {},
      10,
      '#historico-ordenescompra-container',
      '#historico-ordenescompra-container-body',
      '#pagination-container-historico-ordencompra'
    );
  }

  // --- INICIO ---
  if (productoId) {
    initHistoricoByProducto(productoId);
  }
});