$(document).ready(() => {
    // URL ENDPOINT
    const apiURL = '/productos'

    // referencias de filtros
    const filterSelector = $('#filter-selector')
    const filterInput = $('#filter-input')
    const filterButton = $('#filter-button')

    // Opciones de DataTable
    const dataTableOptions = {
        destroy: true,
        responsive: true,
        paging: false,
        searching: false,
        info: false
    }

    const initDataTable = (data) => {
        let content = ''
        data.forEach((producto, index) => {
            content += `
            <tr>
                <td>${producto.pro_codigo}</td>
                <td>${producto.grupo_inventario !== null ? producto.grupo_inventario.pgi_codigo : 'No aplica'}</td>
                <td>${producto.familia !== null ? producto.familia.pfa_codigo : 'No aplica'}</td>
                <td>${producto.subfamilia !== null ? producto.subfamilia.psf_codigo : 'No aplica'}</td>
                <td>${producto.pro_descripcion}</td>
                <td>${producto.unidad !== null ? producto.unidad.uni_codigo : 'No aplica'}</td>
                <td>
                    <div class="d-flex justify-content-around">
                        <button class="btn btn-sm ${producto.pro_activo == 1 ? 'btn-warning' : 'btn-secondary'} btn-producto-editar" data-id-producto="${producto.pro_id}" ${producto.pro_activo == 1 ? '' : 'disabled'}>
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-pencil-fill" viewBox="0 0 16 16">
                                <path d="M12.854.146a.5.5 0 0 0-.707 0L10.5 1.793 14.207 5.5l1.647-1.646a.5.5 0 0 0 0-.708zm.646 6.061L9.793 2.5 3.293 9H3.5a.5.5 0 0 1 .5.5v.5h.5a.5.5 0 0 1 .5.5v.5h.5a.5.5 0 0 1 .5.5v.5h.5a.5.5 0 0 1 .5.5v.207zm-7.468 7.468A.5.5 0 0 1 6 13.5V13h-.5a.5.5 0 0 1-.5-.5V12h-.5a.5.5 0 0 1-.5-.5V11h-.5a.5.5 0 0 1-.5-.5V10h-.5a.5.5 0 0 1-.175-.032l-.179.178a.5.5 0 0 0-.11.168l-2 5a.5.5 0 0 0 .65.65l5-2a.5.5 0 0 0 .168-.11z"/>
                            </svg>
                        </button>
                        <button
                            class="btn btn-sm ${producto.pro_activo == 1 ? 'btn-primary' : 'btn-secondary'} btn-producto-historico" data-id-producto="${producto.pro_id}" 
                            ${producto.pro_activo == 1 ? '' : 'disabled'}>
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-list-task" viewBox="0 0 16 16">
                                <path fill-rule="evenodd" d="M2 2.5a.5.5 0 0 0-.5.5v1a.5.5 0 0 0 .5.5h1a.5.5 0 0 0 .5-.5V3a.5.5 0 0 0-.5-.5zM3 3H2v1h1z"/>
                                <path d="M5 3.5a.5.5 0 0 1 .5-.5h9a.5.5 0 0 1 0 1h-9a.5.5 0 0 1-.5-.5M5.5 7a.5.5 0 0 0 0 1h9a.5.5 0 0 0 0-1zm0 4a.5.5 0 0 0 0 1h9a.5.5 0 0 0 0-1z"/>
                                <path fill-rule="evenodd" d="M1.5 7a.5.5 0 0 1 .5-.5h1a.5.5 0 0 1 .5.5v1a.5.5 0 0 1-.5.5H2a.5.5 0 0 1-.5-.5zM2 7h1v1H2zm0 3.5a.5.5 0 0 0-.5.5v1a.5.5 0 0 0 .5.5h1a.5.5 0 0 0 .5-.5v-1a.5.5 0 0 0-.5-.5zm1 .5H2v1h1z"/>
                            </svg>
                        </button>
                    </div>
                </td>
                <td>${producto.ultima_compra === null ? 'No aplica' : parseDateSimple(producto.ultima_compra.prp_fechaultimacompra)}</td>
                <td>${producto.ultima_compra === null ? 'No aplica' : producto.ultima_compra.prp_preciounitario}</td>
                <td>${producto.ultima_compra === null ? 'No aplica' : producto.ultima_compra.proveedor.prv_nrodocumento}</td>
                <td>${producto.pro_activo == 1 ? '<span class="badge bg-success">Activo</span>' : '<span class="badge bg-danger">Inactivo</span>'}</td>
                <td>${producto.pro_usucreacion === null ? 'No aplica' : producto.pro_usucreacion}</td>
                <td>${producto.pro_feccreacion === null ? 'No aplica' : parseDate(producto.pro_feccreacion)}</td>
                <td>${producto.pro_usumodificacion === null ? 'No aplica' : producto.pro_usumodificacion}</td>
                <td>${producto.pro_fecmodificacion === null ? 'No aplica' : parseDate(producto.pro_fecmodificacion)}</td>
            </tr>
            `
        })
        $("#data-container-body").html(content)
    }

    filterButton.on('click', () => {
        // seleccionamos el valor del selector
        const filterField = filterSelector.val().trim()
        // seleccionamos el valor del criterio de busqueda
        const filterValue = filterInput.val().trim()

        let filteredURL = apiURL
        // si se aplica un filtro y se ingresa un criterio de busqueda
        if (filterField.length !== 0 && filterValue.length !== 0) {
            filteredURL += `?${filterField}=${encodeURIComponent(filterValue)}`
        }
        console.log(filteredURL)

        initPagination(filteredURL, initDataTable, dataTableOptions)
    });

    // inicializamos la paginacion con datatable
    initPagination(apiURL, initDataTable, dataTableOptions)

    // ------------MODAL CREATE--------------
    async function cargarOpcionesSelect(url, $selectElement, nombre, codigo, defaultOption) {
        try {
            // Realiza la solicitud fetch al servidor
            const {data} = await client.get(url)

            $selectElement.empty()
            $selectElement.append($('<option>', {
                value: "",
                text: defaultOption
            }))
            $.each(data, function (index, item) {
                $selectElement.append($('<option>', {
                    value: item[codigo],
                    text: item[nombre]
                }))
            })
        } catch (error) {
            console.error('Error al cargar opciones:', error)
        }
    }

    $('#btn-link-create-producto').on('click', async function () {
        // reseteamos el formulario
        $('#crearProductoForm')[0].reset()
        // CARGAMOS LOS SELECTORES
        const selects = {
            unidad: $('#unidadProducto'),
            grupo: $('#grupoProducto'),
            familia: $('#familiaProducto'),
            subfamilia: $('#subfamiliaProducto'),
            marca: $('#marcaProducto'),
            unidadMayor: $('#unidadMayorProducto')
        }

        // CARGAMOS MARCAS
        const solicitudes = [
            cargarOpcionesSelect('/marcasSimple', selects.marca, 'pma_descripcion', 'pma_codigo', 'Seleccione una marca'),
            cargarOpcionesSelect('/familiasSimple', selects.familia, 'pfa_descripcion', 'pfa_codigo', 'Seleccione una familia'),
            cargarOpcionesSelect('/subfamiliasSimple', selects.subfamilia, 'psf_descripcion', 'psf_codigo', 'Seleccione una subfamilia'),
            cargarOpcionesSelect('/gruposinventariosSimple', selects.grupo, 'pgi_descripcion', 'pgi_codigo', 'Seleccione un grupo'),
            cargarOpcionesSelect('/unidadesSimple', selects.unidad, 'uni_descripcion', 'uni_codigo', 'Seleccione una unidad'),
            cargarOpcionesSelect('/unidadesSimple', selects.unidadMayor, 'uni_descripcion', 'uni_codigo', 'Seleccione una unidad')
        ]

        // showLoaderModal()
        try {
            await Promise.all(solicitudes)

            // hideLoaderModal()
            const loaderModalCreate = new bootstrap.Modal(document.getElementById('productosCrearModal'))
            loaderModalCreate.show()
        } catch (error) {
            console.error('Error en una o más solicitudes:', error)
            // hideLoaderModal()
        }
    })

    // Función para crear producto
    $('#btnCrearProducto').on('click', async (event) => {
        event.preventDefault()
        let handleError = ''

        // Obtener los valores de los campos del formulario
        const codigoProducto = $.trim($('#codigoProducto').val()) // obligatorio
        const descripcionProducto = $.trim($('#descripcionProducto').val()) // obligatorio
        const unidadProducto = $('#unidadProducto').val() // obligatorio
        const grupoProducto = $('#grupoProducto').val() // obligatorio
        const familiaProducto = $('#familiaProducto').val() // obligatorio
        const subfamiliaProducto = $('#subfamiliaProducto').val() // obligatorio
        const marcaProducto = $('#marcaProducto').val() // obligatorio
        const unidadMayorProducto = $('#unidadMayorProducto').val() // opcional
        const factorUnidadMayorProducto = $('#factorUnidadMayorProducto').val() // opcional 
        const stockMinimoProducto = $('#stockMinimoProducto').val() // default - 0
        const generaStockProducto = $('#generaStockProducto').is(':checked') // default - seleccionado
        const codigoSunatProducto = $.trim($('#codigoSunatProducto').val()) // opcional
        const codigoSAP = $.trim($('#codigoSAP').val()) // opcional
        const codigoMarcaProducto = $.trim($('#codigoMarcaProducto').val()) // opcional
        const medidasProducto = $.trim($('#medidasProducto').val()) // opcional
        const modeloMaquinaProducto = $.trim($('#modeloMaquinaProducto').val()) // opcional
        const observacionProducto = $.trim($('#observacionProducto').val()) // opcional

        // Validaciones básicas
        if (!codigoProducto) {
            handleError += "- El código del producto es obligatorio.\n"
        }
        if (!descripcionProducto) {
            handleError += "- La descripción del producto es obligatoria.\n"
        }
        if (!unidadProducto) {
            handleError += "- La unidad del producto es obligatoria.\n"
        }
        if (!grupoProducto) {
            handleError += "- El grupo del producto es obligatorio.\n"
        }
        if (!familiaProducto) {
            handleError += "La familia del producto es obligatoria.\n"
        }
        if (!subfamiliaProducto) {
            handleError += "La subfamilia del producto es obligatoria.\n"
        }
        if (!marcaProducto) {
            handleError += "La marca del producto es obligatoria.\n"
        }

        if (handleError.length !== 0) {
            alert(handleError)
            return
        }

        // showLoaderModal()
        // Preparar el payload para enviar al backend
        const productData = {
            pro_codigo: codigoProducto,
            pro_descripcion: descripcionProducto,
            uni_codigo: unidadProducto,
            pgi_codigo: grupoProducto,
            pfa_codigo: familiaProducto,
            psf_codigo: subfamiliaProducto,
            pma_codigo: marcaProducto,
            uni_codigomayor: unidadMayorProducto || null,
            pro_factorunidadmayor: factorUnidadMayorProducto || null,
            pro_stockminimo: stockMinimoProducto || null,
            pro_generastock: generaStockProducto,
            pro_codigosunat: codigoSunatProducto || null,
            pro_codigosap: codigoSAP || null,
            pro_codigomarca: codigoMarcaProducto || null,
            pro_medidas: medidasProducto || null,
            pro_modelomaquina: modeloMaquinaProducto || null,
            pro_observacion: observacionProducto || null
        }

        console.log(productData)

        // Realizar la consulta AJAX para guardar los datos
        try {
            const {data} = await client.post('/productos', productData)
            console.log(data)
            // reseteamos el formulario
            $('#crearProductoForm')[0].reset()
            // oculatamos el modal
            const loaderModalCreate = bootstrap.Modal.getInstance(document.getElementById('productosCrearModal'))
            loaderModalCreate.hide()
            // traemos de nuevo la data
            initPagination(apiURL, initDataTable, dataTableOptions)
        } catch (error) {
            console.log(error)
            // alert()
        } finally {
            // hideLoaderModal()
        }
    })

    // ------------MODAL EDIT--------------
    async function cargarDetalleProductoById(id_producto) {
        try {
            const {data} = await client.get(`/producto/${id_producto}`)
            console.log(data)

            // actualizamos el formulario de edicion
            $("#productoIDEdit").val(data.pro_id)
            $("#descripcionProductoEdit").val(data.pro_descripcion)
            $("#codigoProductoEdit").val(data.pro_codigo)
            $("#unidadProductoEdit").val(data.uni_codigo)
            $("#grupoProductoEdit").val(data.pgi_codigo)
            $("#familiaProductoEdit").val(data.pfa_codigo)
            $("#subfamiliaProductoEdit").val(data.psf_codigo)
            $("#marcaProductoEdit").val(data.pma_codigo)
            $("#unidadMayorProductoEdit").val(data.uni_codigomayor || "")
            $("#factorUnidadMayorProductoEdit").val(data.pro_factorunidadmayor || "")
            $("#stockMinimoProductoEdit").val(data.pro_stockminimo)
            $("#generaStockProductoEdit").prop("checked", data.pro_generastock == 1 ? true : false)
            $("#codigoSunatProductoEdit").val(data.pro_codigosunat || "")
            $("#codigoSAPEdit").val(data.pro_codigosap || "")
            $("#codigoMarcaProductoEdit").val(data.pro_codigomarca || "")
            $("#medidasProductoEdit").val(data.pro_medidas || "")
            $("#modeloMaquinaProductoEdit").val(data.pro_modelomaquina || "")
            $("#observacionProductoEdit").val(data.pro_observacion || "")
            $("#activoProductoEdit").prop("checked", data.pro_activo == 1 ? true : false)

        } catch (error) {
            console.log(error)
        }
    }

    $('#data-container').on('click', '.btn-producto-editar', async function () {
        // reseteamos el formulario
        $('#editarProductoForm')[0].reset()
        const id_producto = $(this).data('id-producto')

        // CARGAMOS LOS SELECTORES
        const selects = {
            unidad: $('#unidadProductoEdit'),
            grupo: $('#grupoProductoEdit'),
            familia: $('#familiaProductoEdit'),
            subfamilia: $('#subfamiliaProductoEdit'),
            marca: $('#marcaProductoEdit'),
            unidadMayor: $('#unidadMayorProductoEdit')
        }

        // CARGAMOS MARCAS
        const solicitudes = [
            cargarOpcionesSelect('/marcasSimple', selects.marca, 'pma_descripcion', 'pma_codigo', 'Seleccione una marca'),
            cargarOpcionesSelect('/familiasSimple', selects.familia, 'pfa_descripcion', 'pfa_codigo', 'Seleccione una familia'),
            cargarOpcionesSelect('/subfamiliasSimple', selects.subfamilia, 'psf_descripcion', 'psf_codigo', 'Seleccione una subfamilia'),
            cargarOpcionesSelect('/gruposinventariosSimple', selects.grupo, 'pgi_descripcion', 'pgi_codigo', 'Seleccione un grupo'),
            cargarOpcionesSelect('/unidadesSimple', selects.unidad, 'uni_descripcion', 'uni_codigo', 'Seleccione una unidad'),
            cargarOpcionesSelect('/unidadesSimple', selects.unidadMayor, 'uni_descripcion', 'uni_codigo', 'Seleccione una unidad')
        ]

        // showLoaderModal()
        try {
            await Promise.all(solicitudes)
            await cargarDetalleProductoById(id_producto)

            // hideLoaderModal()
            const loaderModalEdit = new bootstrap.Modal(document.getElementById('editarProductoModal'))
            loaderModalEdit.show()
        } catch (error) {
            console.error('Error en una o más solicitudes:', error)
            // hideLoaderModal()
        }

    })

    // Función para editar producto
    $('#btnEditarProducto').on('click', async (event) => {
        event.preventDefault()
        let handleError = ''

        // Obtener los valores de los campos del formulario
        const idProducto = $("#productoIDEdit").val()
        const codigoProducto = $.trim($('#codigoProductoEdit').val()) // obligatorio
        const descripcionProducto = $.trim($('#descripcionProductoEdit').val()) // obligatorio
        const unidadProducto = $('#unidadProductoEdit').val() // obligatorio
        const grupoProducto = $('#grupoProductoEdit').val() // obligatorio
        const familiaProducto = $('#familiaProductoEdit').val() // obligatorio
        const subfamiliaProducto = $('#subfamiliaProductoEdit').val() // obligatorio
        const marcaProducto = $('#marcaProductoEdit').val() // obligatorio
        const unidadMayorProducto = $('#unidadMayorProductoEdit').val() // opcional
        const factorUnidadMayorProducto = $('#factorUnidadMayorProductoEdit').val() // opcional 
        const stockMinimoProducto = $('#stockMinimoProductoEdit').val() // default - 0
        const generaStockProducto = $('#generaStockProductoEdit').is(':checked') // default - seleccionado
        const codigoSunatProducto = $.trim($('#codigoSunatProductoEdit').val()) // opcional
        const codigoSAP = $.trim($('#codigoSAPEdit').val()) // opcional
        const codigoMarcaProducto = $.trim($('#codigoMarcaProductoEdit').val()) // opcional
        const medidasProducto = $.trim($('#medidasProductoEdit').val()) // opcional
        const modeloMaquinaProducto = $.trim($('#modeloMaquinaProductoEdit').val()) // opcional
        const observacionProducto = $.trim($('#observacionProductoEdit').val()) // opcional
        const activoProducto = $('#activoProductoEdit').is(':checked') // default - seleccionado

        // Validaciones básicas
        if (!codigoProducto) {
            handleError += "- El código del producto es obligatorio.\n"
        }
        if (!descripcionProducto) {
            handleError += "- La descripción del producto es obligatoria.\n"
        }
        if (!unidadProducto) {
            handleError += "- La unidad del producto es obligatoria.\n"
        }
        if (!grupoProducto) {
            handleError += "- El grupo del producto es obligatorio.\n"
        }
        if (!familiaProducto) {
            handleError += "La familia del producto es obligatoria.\n"
        }
        if (!subfamiliaProducto) {
            handleError += "La subfamilia del producto es obligatoria.\n"
        }
        if (!marcaProducto) {
            handleError += "La marca del producto es obligatoria.\n"
        }

        if (handleError.length !== 0) {
            alert(handleError)
            return
        }

        // showLoaderModal()
        // Preparar el payload para enviar al backend
        const productData = {
            pro_id: idProducto,
            pro_codigo: codigoProducto,
            pro_descripcion: descripcionProducto,
            uni_codigo: unidadProducto,
            pgi_codigo: grupoProducto,
            pfa_codigo: familiaProducto,
            psf_codigo: subfamiliaProducto,
            pma_codigo: marcaProducto,
            uni_codigomayor: unidadMayorProducto || null,
            pro_factorunidadmayor: factorUnidadMayorProducto || null,
            pro_stockminimo: stockMinimoProducto || null,
            pro_generastock: generaStockProducto,
            pro_codigosunat: codigoSunatProducto || null,
            pro_codigosap: codigoSAP || null,
            pro_codigomarca: codigoMarcaProducto || null,
            pro_medidas: medidasProducto || null,
            pro_modelomaquina: modeloMaquinaProducto || null,
            pro_observacion: observacionProducto || null,
            pro_activo: activoProducto
        }

        console.log(productData)
        // Realizar la consulta AJAX para editar los datos
        try {
            await client.put(`/producto/${idProducto}`, productData)
            // reseteamos el formulario
            $('#editarProductoForm')[0].reset()
            // oculatamos el modal
            const loaderModalEditar = bootstrap.Modal.getInstance(document.getElementById('editarProductoModal'))
            loaderModalEditar.hide()
            // traemos de nuevo la data
            initPagination(apiURL, initDataTable, dataTableOptions)
        } catch (error) {
            const {response} = error
            if(response.status === 400) {
                const handleError = formatErrorsFromString(response.data.error)
                alert(handleError)
            } else {
                alert(response.data.error)
            }
        } finally {
            // hideLoaderModal()
        }
    })

    // -------- MODAL HISTORICO COMPRAS ---------
    async function cargarHistoricoComprasById(id_producto) {
        const formatData = {
            pro_id: id_producto
        }
        try {
            const {data} = await client.post('/comprasByProducto', formatData)
            let content = ''
            data.forEach((compra, index) => {
                content += `
                <tr>
                    <td>${compra.proveedor.prv_nombre}</td>
                    <td>${compra.proveedor.prv_nrodocumento}</td>
                    <td>${compra.prp_fechaultimacompra === null ? "No aplica" : parseDate(compra.prp_fechaultimacompra)}</td>
                    <td>${compra.prp_preciounitario}</td>
                    <td>${compra.prp_observaciones || ""}</td>
                </tr>`
            })
            $("#tableBody_historico_compras").html(content)
        } catch (error) {
            console.log(error)
        }
    }

    $('#data-container').on('click', '.btn-producto-historico', async function () {
        const id_producto = $(this).data('id-producto')
        // showLoaderModal()
        await cargarHistoricoComprasById(id_producto)
        // hideLoaderModal()
        const loaderModalHistorico = new bootstrap.Modal(document.getElementById('historicoProductoModal'))
        loaderModalHistorico.show()
    })
})