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
                    <td>${material.producto?.unidad?.uni_codigo && 'No aplica'}</td>
                    <td>${material.odm_tipo == 1 ? 'Programado' : 'Agregado'}</td>
                    <td>${selectorAlmacen}</td>
                    <td>No aplica</td>
                    <td>
                        <div class="d-flex justify-content-around">
                            <button class="btn btn-sm btn-primary">
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-box-seam-fill" viewBox="0 0 16 16">
                                    <path fill-rule="evenodd" d="M15.528 2.973a.75.75 0 0 1 .472.696v8.662a.75.75 0 0 1-.472.696l-7.25 2.9a.75.75 0 0 1-.557 0l-7.25-2.9A.75.75 0 0 1 0 12.331V3.669a.75.75 0 0 1 .471-.696L7.443.184l.01-.003.268-.108a.75.75 0 0 1 .558 0l.269.108.01.003zM10.404 2 4.25 4.461 1.846 3.5 1 3.839v.4l6.5 2.6v7.922l.5.2.5-.2V6.84l6.5-2.6v-.4l-.846-.339L8 5.961 5.596 5l6.154-2.461z"/>
                                </svg>
                            </button>
                            <button class="btn btn-sm btn-success">
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-currency-exchange" viewBox="0 0 16 16">
                                    <path d="M0 5a5 5 0 0 0 4.027 4.905 6.5 6.5 0 0 1 .544-2.073C3.695 7.536 3.132 6.864 3 5.91h-.5v-.426h.466V5.05q-.001-.07.004-.135H2.5v-.427h.511C3.236 3.24 4.213 2.5 5.681 2.5c.316 0 .59.031.819.085v.733a3.5 3.5 0 0 0-.815-.082c-.919 0-1.538.466-1.734 1.252h1.917v.427h-1.98q-.004.07-.003.147v.422h1.983v.427H3.93c.118.602.468 1.03 1.005 1.229a6.5 6.5 0 0 1 4.97-3.113A5.002 5.002 0 0 0 0 5m16 5.5a5.5 5.5 0 1 1-11 0 5.5 5.5 0 0 1 11 0m-7.75 1.322c.069.835.746 1.485 1.964 1.562V14h.54v-.62c1.259-.086 1.996-.74 1.996-1.69 0-.865-.563-1.31-1.57-1.54l-.426-.1V8.374c.54.06.884.347.966.745h.948c-.07-.804-.779-1.433-1.914-1.502V7h-.54v.629c-1.076.103-1.808.732-1.808 1.622 0 .787.544 1.288 1.45 1.493l.358.085v1.78c-.554-.08-.92-.376-1.003-.787zm1.96-1.895c-.532-.12-.82-.364-.82-.732 0-.41.311-.719.824-.809v1.54h-.005zm.622 1.044c.645.145.943.38.943.796 0 .474-.37.8-1.02.86v-1.674z"/>
                                </svg>
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