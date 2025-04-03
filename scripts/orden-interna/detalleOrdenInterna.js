$(document).ready(async function () {
    const path = window.location.pathname
    const segments = path.split('/')
    const id = segments.pop()

    let detalleOrdenInterna = []
    let currentDetalleParte = 0

    // funcion de busqueda de detalle de parte
    function buscarDetalleParte(id_detalle_parte) {
        return detalleOrdenInterna.find(element => element.opd_id == id_detalle_parte)
    }

    async function cargarDetalleOrdenInterna() {
        try {
            const { data } = await client.get(`/ordeninterna/${id}`)
            estadoOI = data.oic_estado
            detalleOrdenInterna = data.partes
            // reemplazamos el valor en orden trabajo
            $('#otInput').val(data.odt_numero)
            // reemplazamos el valor en cliente
            $('#clienteInput').val(data.cliente?.cli_nombre ?? 'No aplica')
            // reemplazamos el valor en fecha
            $('#fechaPicker').val(data.oic_fecha ? parseDateSimple(data.oic_fecha) : 'No aplica')
            // reemplazamos el valor en area
            $('#areaSelect').val(data.area.are_descripcion || 'No aplica')
            // reemplazamos el valor en equipo de trabajo
            $('#equipoInput').val(data.oic_equipo_descripcion || 'No aplica')
            // reemplazamos el valor de componente
            $('#componenteInput').val(data.oic_componente_descripcion || 'No aplica')
            // reemplazamos el valor de encargado origen
            $('#responsableOrigen').val(data.trabajador_origen?.tra_nombre ?? 'No aplica')
            // reemplazamos el valor de encargado maestro
            $('#responsableMaestro').val(data.trabajador_maestro?.tra_nombre ?? 'No aplica')
            // reemplazamos el valor de encargado almacen
            $('#responsableAlmacen').val(data.trabajador_almacen?.tra_nombre ?? 'No aplica')

            data.partes.forEach(function (item, index) {
                const totalDetalleProcesos = item.procesos.length
                const totalDetalleProductos = item.materiales.length
                const totalRegulares = item.materiales.filter((element) => element.odm_tipo == 1).length
                const totalAdicionales = item.materiales.filter((element) => element.odm_tipo == 2).length
                const totalClientes = item.materiales.filter((element) => element.odm_tipo == 3).length
                const totalNoPedir = item.materiales.filter((element) => element.odm_tipo == 4).length
                const totalRecuperado = item.materiales.filter((element) => element.odm_tipo == 5).length

                const row = `
                <tr>
                    <td>${item.parte.oip_descripcion}</td>
                    <td>
                        <button class="btn btn-sm btn-editar btn-procesos" data-element="${item.parte.oip_descripcion}" data-id-parte="${item.oip_id}" data-id-detalle-parte="${item.opd_id}">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-gear-fill" viewBox="0 0 16 16">
                                <path d="M9.405 1.05c-.413-1.4-2.397-1.4-2.81 0l-.1.34a1.464 1.464 0 0 1-2.105.872l-.31-.17c-1.283-.698-2.686.705-1.987 1.987l.169.311c.446.82.023 1.841-.872 2.105l-.34.1c-1.4.413-1.4 2.397 0 2.81l.34.1a1.464 1.464 0 0 1 .872 2.105l-.17.31c-.698 1.283.705 2.686 1.987 1.987l.311-.169a1.464 1.464 0 0 1 2.105.872l.1.34c.413 1.4 2.397 1.4 2.81 0l.1-.34a1.464 1.464 0 0 1 2.105-.872l.31.17c1.283.698 2.686-.705 1.987-1.987l-.169-.311a1.464 1.464 0 0 1 .872-2.105l.34-.1c1.4-.413 1.4-2.397 0-2.81l-.34-.1a1.464 1.464 0 0 1-.872-2.105l.17-.31c.698-1.283-.705-2.686-1.987-1.987l-.311.169a1.464 1.464 0 0 1-2.105-.872zM8 10.93a2.929 2.929 0 1 1 0-5.86 2.929 2.929 0 0 1 0 5.858z"/>
                            </svg>
                            Procesos
                        </button>
                    </td>
                    <td>
                        <p class="text-center" id="cantidad-procesos-${item.opd_id}">${totalDetalleProcesos}</p>
                    </td>
                    <td>
                        <button class="btn btn-sm btn-eliminar btn-productos" data-element="${item.parte.oip_descripcion}" data-id-parte="${item.oip_id}" data-id-detalle-parte="${item.opd_id}">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-hammer" viewBox="0 0 16 16">
                                <path d="M9.972 2.508a.5.5 0 0 0-.16-.556l-.178-.129a5 5 0 0 0-2.076-.783C6.215.862 4.504 1.229 2.84 3.133H1.786a.5.5 0 0 0-.354.147L.146 4.567a.5.5 0 0 0 0 .706l2.571 2.579a.5.5 0 0 0 .708 0l1.286-1.29a.5.5 0 0 0 .146-.353V5.57l8.387 8.873A.5.5 0 0 0 14 14.5l1.5-1.5a.5.5 0 0 0 .017-.689l-9.129-8.63c.747-.456 1.772-.839 3.112-.839a.5.5 0 0 0 .472-.334"/>
                            </svg>
                            Materiales
                        </button>
                    </td>
                    <td>
                        <p class="text-center" id="cantidad-productos-${item.opd_id}">${totalDetalleProductos}</p>
                    </td>
                    <td>
                        <p class="text-center" id="cantidad-regulares-${item.opd_id}">${totalRegulares}</p>
                    </td>
                    <td>
                        <p class="text-center" id="cantidad-adicionales-${item.opd_id}">${totalAdicionales}</p>
                    </td>
                    <td>
                        <p class="text-center" id="cantidad-clientes-${item.opd_id}">${totalClientes}</p>
                    </td>
                    <td>
                        <p class="text-center" id="cantidad-nopedir-${item.opd_id}">${totalNoPedir}</p>
                    </td>
                    <td>
                        <p class="text-center" id="cantidad-recuperado-${item.opd_id}">${totalRecuperado}</p>
                    </td>
                </tr>
                `
                // agregamos la tabla
                $('#tbl-orden-interna tbody').append(row)
            })
        } catch (error) {
            alert('Error al cargar la orden interna')
        }
    }

    await cargarDetalleOrdenInterna()

    // ---------- JAVASCRIPT PARA IMPRESION DE PDF ------------------
    $('#btn-imprimir-orden-interna').on('click', async function () {
        try {
            const response = await client.get(`/generarReporteOrdenTrabajo?oic_id=${id}`, {
                headers: {
                    'Accept': 'application/pdf'
                },
                responseType: 'blob'
            })

            const pdfBlob = new Blob([response.data], { type: 'application/pdf' });
            const pdfUrl = URL.createObjectURL(pdfBlob);
            showModalPreview(pdfUrl)
        } catch (error) {
            alert('Error al generar el reporte')
        }
    })

    // cargamos los procesos de detalle en modal
    function cargarProcesosDetalle(id_parte) {
        $('#tbl-orden-interna-procesos tbody').empty()
        // buscamos el detalle de la parte correspondiente
        const findElement = buscarDetalleParte(id_parte)
        const { procesos } = findElement
        const palabraClave = 'otro'

        procesos.sort((a, b) => a.opp_codigo - b.opp_codigo)

        procesos.forEach(element => {
            const claseCondicional = element.proceso.opp_descripcion.toLowerCase().includes(palabraClave) ? true : false
            const row = `
            <tr data-id-proceso="${element.proceso.opp_id}" data-id-detalle="${element.odp_id}" class="table-primary ${claseCondicional ? 'editable-descripcion' : ''}">
                <td>${element.proceso.opp_codigo}</td>
                <td>
                    <input type="text" class="form-control descripcion-input" value='${element.odp_descripcion.replace(/'/g, "&#39;") || element.proceso.opp_descripcion.replace(/'/g, "&#39;")}' readonly/>
                </td>
                <td class="text-center">
                    <input type="checkbox" ${element.odp_ccalidad == 1 ? 'checked' : ''} disabled/>
                </td>
                <td>
                    <textarea type="text" class="form-control observacion-input" readonly>${element.odp_observacion || ''}</textarea>
                </td>
                <td>${element.odp_usumodificacion ?? 'No aplica'}</td>
                <td>${element.odp_fecmodificacion ? parseDate(element.odp_fecmodificacion) : 'No aplica'}</td>
                <td>${element.odp_usucreacion ?? 'No aplica'}</td>
                <td>${element.odp_feccreacion ? parseDate(element.odp_feccreacion) : 'No aplica'}</td>
            </tr>`
            $('#tbl-orden-interna-procesos tbody').append(row)
        })
    }

    // funcion cargar modal de procesos
    $('#tbl-orden-interna').on('click', '.btn-procesos', (event) => {
        // obtnemos el id del detalle de la parte
        const id_detalle_parte = $(event.currentTarget).data('id-detalle-parte')
        // actualizamos nuestra variable flag
        currentDetalleParte = id_detalle_parte
        // buscamos el detalle de la parte en la data traida
        const findParte = buscarDetalleParte(id_detalle_parte)

        // modificamos el nombre del modal
        $('#procesosModalLabel').text(`PROCESOS - ${findParte.parte.oip_descripcion}`)
        // cargar informacion de los detalles añadidos
        cargarProcesosDetalle(findParte.opd_id)
        // mostramos el modal
        $('#procesosModal').modal('show')
    })

    // carga de detalle de materiales en tabla
    function cargarProductosDetalle(id_detalle_parte) {
        $('#tbl-orden-interna-productos tbody').empty()
        // buscamos el detalle de la parte correspondiente
        const findElement = buscarDetalleParte(id_detalle_parte)
        const { materiales } = findElement
        materiales.forEach(element => {
            const row = `
            <tr data-id-producto="${element.producto?.pro_codigo ?? ''}" data-id-detalle="${element.odm_id}" class="table-primary">
                <td>${element.producto?.pro_codigo ?? '-'}</td>
                <td>
                    <input type="text" class="form-control descripcion-input ${element.producto ? '' : 'editable-input'}" value='${element.odm_descripcion?.replace(/'/g, "&#39;")}' readonly/>
                </td>
                <td>
                    <input type="number" class="form-control cantidad-input" value='${element.odm_cantidad}' readonly/>
                </td>
                <td>${element.producto?.uni_codigo ?? ''}</td>
                <td>
                    <input type="text" class="form-control observacion-input" value='${element.odm_observacion?.replace(/'/g, "&#39;") || ''}' readonly/>
                </td>
                <td>${element.odm_usumodificacion ?? 'No aplica'}</td>
                <td>${element.odm_fecmodificacion ? parseDate(element.odm_fecmodificacion) : 'No aplica'}</td>
                <td>${element.odm_usucreacion ?? 'No aplica'}</td>
                <td>${element.odm_feccreacion ? parseDate(element.odm_feccreacion) : 'No aplica'}</td>
            </tr>`
            $('#tbl-orden-interna-productos tbody').append(row)
        })
    }

    // funcion cargar modal de productos
    $('#tbl-orden-interna').on('click', '.btn-productos', async (event) => {
        $('#checkAsociarProducto').prop('checked', false)
        const id_detalle_parte = $(event.currentTarget).data('id-detalle-parte')
        currentDetalleParte = id_detalle_parte
        // abrimos el modal
        const findParte = buscarDetalleParte(id_detalle_parte)
        $('#productosModalLabel').text(`MATERIALES - ${findParte.parte.oip_descripcion}`)
        // cargar informacion de los detalles añadidos
        cargarProductosDetalle(id_detalle_parte)
        // mostramos el modal
        $('#productosModal').modal('show')
    })

    // Gestionamos el detalle de archivos
    $("#tbl-orden-interna-productos").on("click", ".btn-detalle-adjuntos", async function () {
        const $row = $(this).closest('tr')
        const odm_id = $row.data('id-detalle')

        // guardamos el valor de odm_id para proximas operaciones
        $("#id-detalle-material").val(odm_id)

        // vaceamos informacion de la tabla
        $('#tabla-archivos-adjuntos').empty()

        // llamamos a la informacion del detalle
        try {
            const { data } = await client.get(`/ordeninternamaterialesadjuntos/${odm_id}`)

            data.forEach(element => {
                const { oma_id, oma_descripcion, oma_url } = element
                const row = `
                    <tr data-id-adjunto="${oma_id}">
                        <td>
                            <a target="_blank" href="${config.BACK_STORAGE_URL}${oma_url}">Ver recurso</a>
                        </td>
                        <td class="descripcion-file">${oma_descripcion}</td>
                        <td>
                            <button type="button" class="btn btn-danger btn-sm btn-eliminar-archivo">
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-trash-fill" viewBox="0 0 16 16">
                                    <path d="M2.5 1a1 1 0 0 0-1 1v1a1 1 0 0 0 1 1H3v9a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2V4h.5a1 1 0 0 0 1-1V2a1 1 0 0 0-1-1H10a1 1 0 0 0-1-1H7a1 1 0 0 0-1 1zm3 4a.5.5 0 0 1 .5.5v7a.5.5 0 0 1-1 0v-7a.5.5 0 0 1 .5-.5M8 5a.5.5 0 0 1 .5.5v7a.5.5 0 0 1-1 0v-7A.5.5 0 0 1 8 5m3 .5v7a.5.5 0 0 1-1 0v-7a.5.5 0 0 1 1 0"/>
                                </svg>
                            </button>
                        </td>
                    </tr>
                `
                $('#tabla-archivos-adjuntos').append(row)
            })

        } catch (error) {
            console.log(error)
            alert("Error al cargar los archivos")
        }

        // finalmente mostramos el modal
        const modalAdjuntos = new bootstrap.Modal(document.getElementById('adjuntosMaterialModal'))
        modalAdjuntos.show()
    })

    // mostrar preview de PDF
    function showModalPreview(pdfUrl) {
        document.getElementById('pdf-frame').src = pdfUrl;
        const modal = new bootstrap.Modal(document.getElementById("previewPDFModal"));
        modal.show();
    }
})
