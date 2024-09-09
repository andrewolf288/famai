$(document).ready(() => {
    // URL ENDPOINT
    const apiURL = '/ordenesinternas?oic_estado=1'

    // Opciones de DataTable
    const dataTableOptions = {
        destroy: true,
        responsive: true,
        paging: false,
        searching: false,
        info: false
    }

    // Inicializacion de data table
    function initDataTable(data) {
        let content = ''
        data.forEach((ordenInterna, index) => {
            content += `
                <tr>
                    <td>${ordenInterna.odt_numero}</td>
                    <td>${ordenInterna.cliente?.cli_nombre ?? 'No aplica'}</td>
                    <td>${ordenInterna.oic_numero}</td>
                    <td>${ordenInterna.oic_fecha !== null ? parseDate(ordenInterna.oic_fecha) : 'No aplica'}</td>
                    <td>${ordenInterna.area?.are_descripcion ?? 'No aplica'}</td>
                    <td class="text-center">${ordenInterna.total_materiales}</td>
                    <td>${ordenInterna.oic_estado == 1 ? '<span class="badge bg-success">Activo</span>' : '<span class="badge bg-danger">Inactivo</span>'}</td>
                    <td>
                        <div class="d-flex justify-content-around">
                            <button class="btn btn-sm btn-primary btn-orden-interna-view-materiales" data-orden-interna="${ordenInterna.oic_id}">
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-eye-fill" viewBox="0 0 16 16">
                                    <path d="M10.5 8a2.5 2.5 0 1 1-5 0 2.5 2.5 0 0 1 5 0"/>
                                    <path d="M0 8s3-5.5 8-5.5S16 8 16 8s-3 5.5-8 5.5S0 8 0 8m8 3.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7"/>
                                </svg>
                            </button>
                        </div>
                    </td>
                    <td>${ordenInterna.oic_usucreacion === null ? 'No aplica' : ordenInterna.oic_usucreacion}</td>
                    <td>${ordenInterna.oic_feccreacion === null ? 'No aplica' : parseDate(ordenInterna.oic_feccreacion)}</td>
                    <td>${ordenInterna.oic_usumodificacion === null ? 'No aplica' : ordenInterna.oic_usumodificacion}</td>
                    <td>${ordenInterna.oic_fecmodificacion === null ? 'No aplica' : parseDate(ordenInterna.oic_fecmodificacion)}</td>
                </tr>
            `
        })
        $('#data-container-body').html(content)
    }

    // inicializamos la paginacion con datatable
    initPagination(apiURL, initDataTable, dataTableOptions)

    $('#data-container').on('click', '.btn-orden-interna-view-materiales', async function () {
        const ordenInternaId = $(this).data('orden-interna')

        // consultamos la informacion de almacenes
        const {data:almacenes} =  await client.get('/almacenesSimple')

        let selectorAlmacen = `
        <select>
            <option value="">Seleccione un almacen</option>
        `
        almacenes.forEach(almacen => {
            selectorAlmacen += `<option value="${almacen.alm_id}">${almacen.alm_descripcion}</option>`
        })
        selectorAlmacen += `</select>`

        // vaciamos la tabla del modal
        $('#tableBody_detalle_materiales_orden').empty()

        // obtenemos los materiales de la orden interna
        const {data} = await client.get(`/materialesByOrdenInterna/${ordenInternaId}`)
        console.log(data)
        data.forEach(material => {
            let content = `
                <tr data-detalle-material="${material.odm_id}">
                    <td>${material.odm_descripcion}</td>
                    <td>${material.odm_cantidad}</td>
                    <td>${material.producto?.unidad?.uni_codigo || 'No aplica'}</td>
                    <td>${material.odm_tipo == 1 ? 'Programado' : 'Agregado'}</td>
                    <td>${selectorAlmacen}</td>
                    <td>No aplica</td>
                    <td>
                        <div class="d-flex justify-content-around">
                            <button class="btn btn-sm btn-primary me-2">
                                Reservar
                            </button>
                            <button class="btn btn-sm btn-success">
                                Cotizar
                            </button>
                        </div>
                    </td>
                </tr>
            `
            $('#tableBody_detalle_materiales_orden').append(content)
        })

        // cargamos el modal
        const loaderModalView = new bootstrap.Modal(document.getElementById('detalleMaterialesOrdenModal'))
        loaderModalView.show()
    })
})