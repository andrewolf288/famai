$(document).ready(async () => {
    let dataTable;
    let dataTableIsInitialized = false

    // DATA TABLE OPTIONS
    const dataTableOptions = {
        destroy: true,
        language: {
            lengthMenu: "Mostrar _MENU_ registros por página",
            zeroRecords: "No se encontraron resultados",
            info: "Mostrando _START_ a _END_ de _TOTAL_ registros",
            infoEmpty: "Mostrando 0 a 0 de 0 registros",
            infoFiltered: "(filtrado de _MAX_ registros totales)",
            search: "Buscar:",
            loadingRecords: "Cargando...",
            processing: "Procesando...",
            emptyTable: "No hay datos disponibles en la tabla",
            aria: {
                sortAscending: ": activar para ordenar la columna en orden ascendente",
                sortDescending: ": activar para ordenar la columna en orden descendente"
            }
        },
        responsive: true,
    }

    const initDataTable = async () => {
        if (dataTableIsInitialized) {
            dataTable.destroy();
        }

        await cargarProductos();
        dataTable = $('#datatable_productos').DataTable(dataTableOptions)
        dataTableIsInitialized = true
    }

    const cargarProductos = async () => {
        // let timeoutId
        try {
            // timeoutId = setTimeout(showLoaderModal, 300);
            const response = await fetch('./php/vistas/leerproductosadvancedwhole.php', {
                method: 'POST'
            })
            const { data: productos } = await response.json()
            let content = ''
            productos.forEach((producto, index) => {
                content += `
                <tr>
                    <td>${producto.pro_codigo}</td>
                    <td>${producto.pgi_codigo}</td>
                    <td>${producto.pfa_codigo}</td>
                    <td>${producto.psf_codigo}</td>
                    <td>${producto.pro_descripcion}</td>
                    <td>${producto.uni_codigo}</td>
                    <td>${producto.pro_activo == 1 ? '<span class="badge bg-success">Activo</span>' : '<span class="badge bg-danger">Inactivo</span>'}</td>
                    <td>
                        <div class="d-flex justify-content-around">
                            <button class="btn btn-sm ${producto.pro_activo === 1 ? 'btn-warning' : 'btn-secondary'} btn-producto-editar" onclick='editarProducto(${producto.pro_id})' data-id-producto="${producto.pro_id}" ${producto.pro_activo == 1 ? '' : 'disabled'}>
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-pencil-fill" viewBox="0 0 16 16">
                                    <path d="M12.854.146a.5.5 0 0 0-.707 0L10.5 1.793 14.207 5.5l1.647-1.646a.5.5 0 0 0 0-.708zm.646 6.061L9.793 2.5 3.293 9H3.5a.5.5 0 0 1 .5.5v.5h.5a.5.5 0 0 1 .5.5v.5h.5a.5.5 0 0 1 .5.5v.5h.5a.5.5 0 0 1 .5.5v.207zm-7.468 7.468A.5.5 0 0 1 6 13.5V13h-.5a.5.5 0 0 1-.5-.5V12h-.5a.5.5 0 0 1-.5-.5V11h-.5a.5.5 0 0 1-.5-.5V10h-.5a.5.5 0 0 1-.175-.032l-.179.178a.5.5 0 0 0-.11.168l-2 5a.5.5 0 0 0 .65.65l5-2a.5.5 0 0 0 .168-.11z"/>
                                </svg>
                            </button>
                            <button
                                class="btn btn-sm ${producto.pro_activo === 1 ? 'btn-primary' : 'btn-secondary'} btn-producto-historico" onclick='verHistoricoProducto(${producto.pro_id})' data-id-producto="${producto.pro_id}" 
                                ${producto.pro_activo == 1 ? '' : 'disabled'}>
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-list-task" viewBox="0 0 16 16">
                                    <path fill-rule="evenodd" d="M2 2.5a.5.5 0 0 0-.5.5v1a.5.5 0 0 0 .5.5h1a.5.5 0 0 0 .5-.5V3a.5.5 0 0 0-.5-.5zM3 3H2v1h1z"/>
                                    <path d="M5 3.5a.5.5 0 0 1 .5-.5h9a.5.5 0 0 1 0 1h-9a.5.5 0 0 1-.5-.5M5.5 7a.5.5 0 0 0 0 1h9a.5.5 0 0 0 0-1zm0 4a.5.5 0 0 0 0 1h9a.5.5 0 0 0 0-1z"/>
                                    <path fill-rule="evenodd" d="M1.5 7a.5.5 0 0 1 .5-.5h1a.5.5 0 0 1 .5.5v1a.5.5 0 0 1-.5.5H2a.5.5 0 0 1-.5-.5zM2 7h1v1H2zm0 3.5a.5.5 0 0 0-.5.5v1a.5.5 0 0 0 .5.5h1a.5.5 0 0 0 .5-.5v-1a.5.5 0 0 0-.5-.5zm1 .5H2v1h1z"/>
                                </svg>
                            </button>
                        </div>
                    </td>
                    <td>${producto.pro_usucreacion}</td>
                    <td>${parseDate(producto.pro_feccreacion)}</td>
                    <td>${producto.pro_usumodificacion === null ? 'No aplica' : producto.pro_usumodificacion}</td>
                    <td>${producto.pro_fecmodificacion === null ? 'No aplica' : parseDate(producto.pro_fecmodificacion)}</td>
                </tr>
            `
            })
            $("#tableBody_productos").html(content)
        } catch (error) {
            alert(error);
        } finally {
            // clearTimeout(timeoutId)
            // hideLoaderModal()
        }
    }

    // ------------MODAL CREATE--------------
    async function cargarOpcionesSelect(url, $selectElement, nombre, codigo, defaultOption) {
        try {
            // Realiza la solicitud fetch al servidor
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            // Verifica si la respuesta fue exitosa
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            // Convierte la respuesta a JSON
            const data = await response.json();
            const dataSelect = data.data;

            $selectElement.empty();
            $selectElement.append($('<option>', {
                value: "",
                text: defaultOption
            }));
            $.each(dataSelect, function (index, item) {
                $selectElement.append($('<option>', {
                    value: item[codigo],
                    text: item[nombre]
                }));
            });
        } catch (error) {
            console.error('Error al cargar opciones:', error);
        }
    }

    $('#btn-link-create-producto').on('click', async function () {
        // reseteamos el formulario
        $('#crearProductoForm')[0].reset();
        // CARGAMOS LOS SELECTORES
        const selects = {
            unidad: $('#unidadProducto'),
            grupo: $('#grupoProducto'),
            familia: $('#familiaProducto'),
            subfamilia: $('#subfamiliaProducto'),
            marca: $('#marcaProducto'),
            unidadMayor: $('#unidadMayorProducto')
        };

        // CARGAMOS MARCAS
        const solicitudes = [
            cargarOpcionesSelect('./php/vistas/leerproductosmarcasadvanced.php', selects.marca, 'pma_descripcion', 'pma_codigo', 'Seleccione una marca'),
            cargarOpcionesSelect('./php/vistas/leerproductosfamiliasadvanced.php', selects.familia, 'pfa_descripcion', 'pfa_codigo', 'Seleccione una familia'),
            cargarOpcionesSelect('./php/vistas/leerproductossubfamiliasadvanced.php', selects.subfamilia, 'psf_descripcion', 'psf_codigo', 'Seleccione una subfamilia'),
            cargarOpcionesSelect('./php/vistas/leerproductosgruposinventarioadvanced.php', selects.grupo, 'pgi_descripcion', 'pgi_codigo', 'Seleccione un grupo'),
            cargarOpcionesSelect('./php/vistas/leerunidadesadvanced.php', selects.unidad, 'uni_descripcion', 'uni_codigo', 'Seleccione una unidad'),
            cargarOpcionesSelect('./php/vistas/leerunidadesadvanced.php', selects.unidadMayor, 'uni_descripcion', 'uni_codigo', 'Seleccione una unidad')
        ];

        showLoaderModal()
        try {
            await Promise.all(solicitudes);

            hideLoaderModal()
            const loaderModalCreate = new bootstrap.Modal(document.getElementById('productosCrearModal'))
            loaderModalCreate.show()
        } catch (error) {
            console.error('Error en una o más solicitudes:', error);
            hideLoaderModal()
        }
    });

    // Función para crear producto
    $('#btnCrearProducto').on('click', async (event) => {
        event.preventDefault();
        let handleError = ''

        // Obtener los valores de los campos del formulario
        const codigoProducto = $.trim($('#codigoProducto').val()); // obligatorio
        const descripcionProducto = $.trim($('#descripcionProducto').val()); // obligatorio
        const unidadProducto = $('#unidadProducto').val(); // obligatorio
        const grupoProducto = $('#grupoProducto').val(); // obligatorio
        const familiaProducto = $('#familiaProducto').val(); // obligatorio
        const subfamiliaProducto = $('#subfamiliaProducto').val(); // obligatorio
        const marcaProducto = $('#marcaProducto').val(); // obligatorio
        const unidadMayorProducto = $('#unidadMayorProducto').val(); // opcional
        const factorUnidadMayorProducto = $('#factorUnidadMayorProducto').val(); // opcional 
        const stockMinimoProducto = $('#stockMinimoProducto').val(); // default - 0
        const generaStockProducto = $('#generaStockProducto').is(':checked'); // default - seleccionado
        const codigoSunatProducto = $.trim($('#codigoSunatProducto').val()); // opcional
        const codigoSAP = $.trim($('#codigoSAP').val()); // opcional

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

        showLoaderModal()
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
            pro_codigosap: codigoSAP || null
        };

        // Realizar la consulta AJAX para guardar los datos
        try {
            const response = await fetch('./php/vistas/crearproducto.php', {
                method: 'POST',
                body: JSON.stringify(productData),
                headers: {
                    'Content-Type': 'application/json',
                },
            })

            const responseData = await response.json();
            console.log(responseData)

            if (responseData.varRespuesta && responseData.varRespuesta.length !== 0) {
                alert(responseData.varRespuesta);
            } else {
                // reseteamos el formulario
                $('#crearProductoForm')[0].reset();
                // oculatamos el modal
                const loaderModalCreate = bootstrap.Modal.getInstance(document.getElementById('productosCrearModal'))
                loaderModalCreate.hide()
                // traemos de nuevo la data
                await initDataTable()
            }
        } catch (error) {
            console.log(error)
        } finally {
            hideLoaderModal()
        }
    });

    // LOADERS
    const showLoaderModal = () => {
        const loaderModal = new bootstrap.Modal(document.getElementById('loaderModal'), {
            backdrop: 'static',
            keyboard: false
        });
        loaderModal.show();
    };

    const hideLoaderModal = () => {
        const loaderModal = bootstrap.Modal.getInstance(document.getElementById('loaderModal'));
        if (loaderModal) {
            loaderModal.hide();
        } else {
            console.log("El modal ya no existe")
        }
    };

    // UTILS FUNCTIONS
    function parseDate(dateString) {
        const date = new Date(dateString);
        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0'); // Los meses en JavaScript son 0-11
        const year = date.getFullYear();
        const formattedDate = `${day}/${month}/${year}`;
        return formattedDate;
    }

    showLoaderModal()
    await initDataTable()
    hideLoaderModal()
})