$(document).ready(function () {
    let dataTable;
    let dataTableIsInitialized = false
    let productos = []
    let idProducto = 0

    // DATATABLE
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

    // INICIALIZAR LA TABLA
    function initDataTable() {
        if (dataTableIsInitialized) {
            dataTable.destroy();
        }

        cargarProductos();
    }

    // Cargar productos
    function cargarProductos() {
        showLoadingModal();
        $.ajax({
            url: './php/vistas/leerproductosadvancedwhole.php',
            method: 'POST',
            dataType: 'json',
            success: function (response) {
                const { data } = response;
                productos = data;
                renderTable();
                dataTable = $('#tbl-productos').DataTable(dataTableOptions);
                dataTableIsInitialized = true;
            },
            error: function (xhr, status, error) {
                console.error(error);
                alert('Error en la solicitud.');
            },
            complete: function () {
                hideLoadingModal();
            }
        });
    }

    // Renderizar la tabla de productos
    function renderTable() {
        $('#tbl-productos tbody').empty();
        productos.forEach(function (item) {
            const row = `
                <tr>
                    <td>${item.pro_codigo}</td>
                    <td>${item.pro_descripcion}</td>
                    <td>${item.uni_codigo}</td>
                    <td>${item.pgi_descripcion}</td>
                    <td>${item.pfa_descripcion}</td>
                    <td>${item.psf_descripcion}</td>
                    <td>${item.pma_descripcion}</td>
                    <td>${item.uni_codigomayor}</td>
                    <td>${item.pro_factorunidadmayor}</td>
                    <td>${item.pro_stockminimo}</td>
                    <td>${item.pro_codigosap}</td>
                    <td>${item.pro_codigosunat}</td>
                    <td>${item.pro_activo == 1 ? '<span class="badge bg-success">Activo</span>' : '<span class="badge bg-danger">Inactivo</span>'}</td>
                    <td>${item.pro_usucreacion}</td>
                    <td>${parseDate(item.pro_feccreacion)}</td>
                    <td>${item.pro_usumodificacion === null ? 'No aplica' : item.pro_usumodificacion}</td>
                    <td>${item.pro_fecmodificacion === null ? 'No aplica' : parseDate(item.pro_fecmodificacion)}</td>
                    <td>
                        <div class="d-flex justify-content-around">
                            <button class="btn btn-sm ${item.pro_activo === 1 ? 'btn-warning' : 'btn-secondary'} btn-producto-editar" data-id-producto="${item.pro_id}" ${item.pro_activo == 1 ? '' : 'disabled'}>
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-pencil-fill" viewBox="0 0 16 16">
                                    <path d="M12.854.146a.5.5 0 0 0-.707 0L10.5 1.793 14.207 5.5l1.647-1.646a.5.5 0 0 0 0-.708zm.646 6.061L9.793 2.5 3.293 9H3.5a.5.5 0 0 1 .5.5v.5h.5a.5.5 0 0 1 .5.5v.5h.5a.5.5 0 0 1 .5.5v.5h.5a.5.5 0 0 1 .5.5v.207zm-7.468 7.468A.5.5 0 0 1 6 13.5V13h-.5a.5.5 0 0 1-.5-.5V12h-.5a.5.5 0 0 1-.5-.5V11h-.5a.5.5 0 0 1-.5-.5V10h-.5a.5.5 0 0 1-.175-.032l-.179.178a.5.5 0 0 0-.11.168l-2 5a.5.5 0 0 0 .65.65l5-2a.5.5 0 0 0 .168-.11z"/>
                                </svg>
                            </button>
                            <button class="btn btn-sm ${item.pro_activo === 1 ? 'btn-danger' : 'btn-secondary'} btn-producto-eliminar" data-id-producto="${item.pro_id}" ${item.pro_activo == 1 ? '' : 'disabled'}>
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-trash-fill" viewBox="0 0 16 16">
                                    <path d="M2.5 1a1 1 0 0 0-1 1v1a1 1 0 0 0 1 1H3v9a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2V4h.5a1 1 0 0 0 1-1V2a1 1 0 0 0-1-1H10a1 1 0 0 0-1-1H7a1 1 0 0 0-1 1zm3 4a.5.5 0 0 1 .5.5v7a.5.5 0 0 1-1 0v-7a.5.5 0 0 1 .5-.5M8 5a.5.5 0 0 1 .5.5v7a.5.5 0 0 1-1 0v-7A.5.5 0 0 1 8 5m3 .5v7a.5.5 0 0 1-1 0v-7a.5.5 0 0 1 1 0"/>
                                </svg>
                            </button>
                        </div>
                    </td>
                </tr>`;
            $('#tbl-productos tbody').append(row);
        });
    }

    initDataTable()

    // FUNCION PARA BUSCAR PRODUCTO
    const findProducto = (id) => {
        return productos.find(element => element.pro_id == id)
    }

    // FUNCION PARA CARGAR SELECTORES
    function cargarOpcionesSelect(url, $selectElement, nombre, codigo, defaultOption) {
        return $.ajax({
            url: url,
            method: 'POST',
            dataType: 'json'
        })
            .done(function (data) {
                const { data: dataSelect } = data;
                $selectElement.empty(); // Limpiar las opciones actuales
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
            })
            .fail(function (xhr, status, error) {
                console.error('Error al cargar opciones:', error);
            });
    }

    // FUNCION PARA ABRIR UN DIALOGO
    $('#btn-link-create-producto').on('click', function () {
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
            cargarOpcionesSelect('./php/vistas/leerproductosmarcasadvanced.php', selects.marca, 'pma_descripcion', 'pma_codigo', 'Seleccione una marca'),
            cargarOpcionesSelect('./php/vistas/leerproductosfamiliasadvanced.php', selects.familia, 'pfa_descripcion', 'pfa_codigo', 'Seleccione una familia'),
            cargarOpcionesSelect('./php/vistas/leerproductossubfamiliasadvanced.php', selects.subfamilia, 'psf_descripcion', 'psf_codigo', 'Seleccione una subfamilia'),
            cargarOpcionesSelect('./php/vistas/leerproductosgruposinventarioadvanced.php', selects.grupo, 'pgi_descripcion', 'pgi_codigo', 'Seleccione un grupo'),
            cargarOpcionesSelect('./php/vistas/leerunidadesadvanced.php', selects.unidad, 'uni_descripcion', 'uni_codigo', 'Seleccione una unidad'),
            cargarOpcionesSelect('./php/vistas/leerunidadesadvanced.php', selects.unidadMayor, 'uni_descripcion', 'uni_codigo', 'Seleccione una unidad')
        ]

        // Mostrar el modal de carga antes de iniciar las solicitudes
        $('#loadingModal').modal('show')
        $.when.apply($, solicitudes)
            .done(function () {
                // Ocultar el modal de carga cuando todas las solicitudes hayan terminado
                $('#loadingModal').modal('hide')
                $('#productosCrearModal').modal('show')
            })
            .fail(function () {
                console.error('Error en una o más solicitudes.')
                // Ocultar el modal de carga aunque haya un error
                $('#loadingModal').modal('hide')
            });
    })

    // Función para crear producto
    $('#btnCrearProducto').on('click', function (event) {
        event.preventDefault();

        // Mostrar diálogo de carga
        showLoadingModal();

        // Obtener los valores de los campos del formulario
        const codigoProducto = $.trim($('#codigoProducto').val());
        const descripcionProducto = $.trim($('#descripcionProducto').val());
        const unidadProducto = $('#unidadProducto').val();
        const grupoProducto = $('#grupoProducto').val();
        const familiaProducto = $('#familiaProducto').val();
        const subfamiliaProducto = $('#subfamiliaProducto').val();
        const marcaProducto = $('#marcaProducto').val();
        const unidadMayorProducto = $('#unidadMayorProducto').val();
        const factorUnidadMayorProducto = $('#factorUnidadMayorProducto').val();
        const stockMinimoProducto = $('#stockMinimoProducto').val();
        const generaStockProducto = $('#generaStockProducto').is(':checked');
        const codigoSunatProducto = $.trim($('#codigoSunatProducto').val());
        const codigoSAP = $.trim($('#codigoSAP').val());

        // Validaciones básicas
        if (!codigoProducto) return alert('El código del producto es obligatorio.');
        if (!descripcionProducto) return alert('La descripción del producto es obligatoria.');
        if (!unidadProducto) return alert('La unidad del producto es obligatoria.');
        if (!grupoProducto) return alert('El grupo del producto es obligatorio.');
        if (!familiaProducto) return alert('La familia del producto es obligatoria.');
        if (!subfamiliaProducto) return alert('La subfamilia del producto es obligatoria.');
        if (!marcaProducto) return alert('La marca del producto es obligatoria.');
        if (!codigoSAP) return alert('El código SAP del producto es obligatorio.');

        // Preparar el payload para enviar al backend
        const data = {
            pro_codigo: codigoProducto,
            pro_descripcion: descripcionProducto,
            uni_codigo: unidadProducto,
            pgi_codigo: grupoProducto,
            pfa_codigo: familiaProducto,
            psf_codigo: subfamiliaProducto,
            pma_codigo: marcaProducto,
            uni_codigomayor: unidadMayorProducto || null, // Permitir que sea opcional
            pro_factorunidadmayor: factorUnidadMayorProducto || null,
            pro_stockminimo: stockMinimoProducto || null,
            pro_generastock: generaStockProducto,
            pro_codigosunat: codigoSunatProducto || null,
            pro_codigosap: codigoSAP || null
        };

        // Realizar la consulta AJAX para guardar los datos
        $.ajax({
            url: './php/vistas/crearproducto.php',
            method: 'POST',
            contentType: 'application/json',
            data: JSON.stringify(data),
            success: function (response) {
                // Reiniciar el formulario y ocultar el modal
                $('#crearProductoForm')[0].reset();
                $('#productosCrearModal').modal('hide');
                // cargarProductos(); // Recargar la lista de productos
                $('#content').load('./paginas/productos/listProductos.html')
            },
            error: function (xhr) {
                const errorData = xhr.responseJSON || {};
                console.log(errorData)
            },
            complete: function () {
                // Ocultar diálogo de carga
                hideLoadingModal();
            }
        });
    });


    // ------------- ELIMINAR PRODUCTO ------------
    $('#tbl-productos').on('click', '.btn-producto-eliminar', function () {
        const idProductoRow = $(this).data('id-producto')
        idProducto = idProductoRow
        const producto = findProducto(idProductoRow)

        const messageReplacement = `¿Quieres eliminar el producto: <span class="text-danger">${producto["pro_descripcion"]}</span>?`
        $("#descripcion-eliminacion-producto").html(messageReplacement)
        $("#productosEliminarModal").modal('show')
    })

    $("#btnEliminarProducto").on('click', function () {
        // aperturamos un dialogo de carga
        showLoadingModal()
        const data = {
            pro_id: idProducto
        }

        $.ajax({
            url: './php/vistas/borrarproducto.php',
            method: 'POST',
            contentType: 'application/json',
            data: JSON.stringify(data),
            success: function (response) {
                $('#productosEliminarModal').modal('hide')
                // cargarProductos()
                $('#content').load('./paginas/productos/listProductos.html')
            },
            error: function (xhr) {
                const errorData = xhr.responseJSON || {};
                alert(`Error al eliminar el producto: ${errorData.message || 'Error desconocido'}`);
            },
            complete: function () {
                hideLoadingModal()
            }
        });
    })

    // parser date
    function parseDate(dateString) {
        const date = new Date(dateString);
        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0'); // Los meses en JavaScript son 0-11
        const year = date.getFullYear();
        const formattedDate = `${day}/${month}/${year}`;
        return formattedDate;
    }

    // ----------- MANEJADORES DE DIALOG ---------------
    // Mostrar el modal de carga
    function showLoadingModal() {
        $('#loadingModal').modal('show');
    }

    // Ocultar el modal de carga
    function hideLoadingModal() {
        $('#loadingModal').modal('hide');
    }
})