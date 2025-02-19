$(document).ready(function () {
    let abortController

    window.onbeforeunload = function (e) {
        e.preventDefault();
        e.returnValue = '';
    }

    const showLoaderModal = () => {
        const loaderModal = new bootstrap.Modal(document.getElementById('loaderModal'), {
            backdrop: 'static',
            keyboard: false
        })
        loaderModal.show()
    }

    const hideLoaderModal = () => {
        const loaderModal = bootstrap.Modal.getInstance(document.getElementById('loaderModal'))
        if (loaderModal) {
            loaderModal.hide()
        }
    }

    const detalle_requerimiento = []

    // cargar areas
    const cargarAreas = async () => {
        try {
            const { data } = await client.get('/areasSimple')
            const $areaSelect = $('#areaSelect')

            data.sort((a, b) => a["are_descripcion"].localeCompare(b["are_descripcion"]))

            data.forEach(area => {
                const option = $('<option>').val(area["are_codigo"]).text(area["are_descripcion"])
                $areaSelect.append(option)
            })

        } catch (error) {
            alert('Error al obtener las areas')
        }
    }

    // cargamos responsables
    const cargarResponsables = async () => {
        try {
            const { data } = await client.get('/trabajadoresSimple')
            const $responsableOrigen = $('#responsableOrigen')

            // Ordenar la data alfabéticamente según el nombre (índice [1])
            data.sort((a, b) => a.tra_nombre.localeCompare(b.tra_nombre))

            data.forEach(responsable => {
                const option = $('<option>').val(responsable.tra_id).text(responsable.tra_nombre)
                $responsableOrigen.append(option.clone())
            })
        } catch (error) {
            alert('Error al obtener los encargados')
        }
    }

    // cargar informacion segun usuario
    const cargarInformacionUsuario = async () => {
        const usu_codigo = decodeJWT(localStorage.getItem('authToken')).usu_codigo
        try {
            const { data } = await client.get(`/trabajadorByUsuario/${usu_codigo}`)
            $('#areaSelect').val(data.are_codigo)
            $('#responsableOrigen').val(data.tra_id)
        } catch (error) {
            const { response } = error
            if (response.status === 404) {
                alert('El usuario logeado no esta relacionado con ningun trabajador')
            } else {
                alert('Ocurrio un error al traer la informacion de trabajador')
            }
        }
    }

    // -------- MANEJO DE FECHA ----------
    $("#fechaPicker").datepicker({
        dateFormat: 'dd/mm/yy',
        setDate: new Date()
    }).datepicker("setDate", new Date())

    $("#fechaEntregaPicker").datepicker({
        dateFormat: 'dd/mm/yy',
        setDate: new Date()
    }).datepicker("setDate", new Date())

    const initInformacion = async () => {
        try {
            // showLoaderModal()
            await Promise.all([
                cargarAreas(),
                cargarResponsables(),
            ])
            cargarInformacionUsuario()
        } catch (error) {
            console.log(error)
            alert("Error al cargar los datos")
        } finally {
            // hideLoaderModal()

        }
    }

    // inicializamos la data
    initInformacion()

    // funcion cargar modal de productos
    $('#addProductBtn').on('click', async (event) => {
        // reseteamos el modal
        $('#checkAsociarProducto').prop('checked', false)
        $('#productosInput').val('')
        limpiarLista()
        $('#tbl-cotizacion-productos tbody').empty()
        // mostramos el modal
        $('#addProductModal').modal('show')
    })

    // al momento de ir ingresando valores en el input
    $('#productosInput').on('input', debounce(async function () {
        const isChecked = $('#checkAsociarProducto').is(':checked')
        const query = $(this).val().trim()
        if (query.length >= 3 && !isChecked) {
            await buscarMateriales(query)
        } else {
            limpiarLista()
        }
    }))

    // al momento de presionar enter
    $('#productosInput').on('keydown', function (event) {
        // si es la tecla de enter
        if (event.keyCode === 13) {
            event.preventDefault();
            const isChecked = $('#checkAsociarProducto').is(':checked')
            // si se desea agregar un producto sin código
            if (isChecked) {
                ingresarProductoSinCodigo()
            } else {
                return
            }
        }
    });

    async function buscarMateriales(query) {
        if (abortController) {
            abortController.abort();
        }
        abortController = new AbortController();
        const signal = abortController.signal;

        try {
            const queryEncoded = encodeURIComponent(query)
            const { data } = await client.get(`/productosByQuery2?query=${queryEncoded}`)
            // Limpiamos la lista
            limpiarLista()
            // formamos la lista
            data.forEach(material => {
                const listItem = document.createElement('li')
                listItem.className = 'list-group-item list-group-item-action'
                // listItem.textContent = `${material.pro_codigo} - ${material.pro_descripcion} - ${material.stock?.alp_stock || 0}`
                listItem.textContent = `${material.pro_codigo} - ${material.pro_descripcion} - Stock: ${material.alp_stock || '0.000000'} - Fec. Ult. Ingreso: ${material["UltimaFechaIngreso"] ? parseDateSimple(material["UltimaFechaIngreso"]) : 'No Aplica'}`
                listItem.dataset.id = material.pro_id
                listItem.addEventListener('click', () => seleccionarMaterial(material))
                // agregar la lista completa
                $('#resultadosLista').append(listItem)
            })
        } catch (error) {
            if (error.name === 'AbortError') {
                console.log('Petición abortada'); // Maneja el error de la petición abortada
            } else {
                console.error('Error al buscar materiales:', error);
                alert('Error al buscar materiales. Inténtalo de nuevo.'); // Muestra un mensaje de error al usuario
            }
        }
    }

    function limpiarLista() {
        $('#resultadosLista').empty()
    }

    function ingresarProductoSinCodigo() {
        const pro_codigo = ""
        const pro_id = obtenerIdUnico()
        const pro_descripcion = $.trim($('#productosInput').val())

        if (pro_descripcion.length < 3) {
            alert('La descripción debe tener al menos 3 caracteres')
        } else {
            $('#productosInput').val('')

            const data = {
                pro_id,
                pro_codigo,
                odm_descripcion: pro_descripcion,
                odm_cantidad: 1.00,
                odm_observacion: "",
                odm_tipo: 1,
                odm_asociar: false,
                detalle_adjuntos: []
            }

            const row = `
             <tr>
                 <td>${data["pro_codigo"]}</td>
                 <td>
                     <input type="text" class="form-control descripcion-input" value='${data["odm_descripcion"].replace(/'/g, "&#39;")}' readonly/>
                 </td>
                 <td>
                     <input type="number" class="form-control cantidad-input" value="${data["odm_cantidad"]}" readonly/>
                 </td>
                 <td>
                     <input type="text" class="form-control observacion-input" value='${data["odm_observacion"].replace(/'/g, "&#39;")}' readonly/>
                 </td>
                 <td>
                     <div class="d-flex justify-content-around">
                         <button class="btn btn-sm btn-warning btn-detalle-producto-editar me-2" data-producto="${data["pro_id"]}">
                             <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-pencil-fill" viewBox="0 0 16 16">
                                 <path d="M12.854.146a.5.5 0 0 0-.707 0L10.5 1.793 14.207 5.5l1.647-1.646a.5.5 0 0 0 0-.708zm.646 6.061L9.793 2.5 3.293 9H3.5a.5.5 0 0 1 .5.5v.5h.5a.5.5 0 0 1 .5.5v.5h.5a.5.5 0 0 1 .5.5v.5h.5a.5.5 0 0 1 .5.5v.207zm-7.468 7.468A.5.5 0 0 1 6 13.5V13h-.5a.5.5 0 0 1-.5-.5V12h-.5a.5.5 0 0 1-.5-.5V11h-.5a.5.5 0 0 1-.5-.5V10h-.5a.5.5 0 0 1-.175-.032l-.179.178a.5.5 0 0 0-.11.168l-2 5a.5.5 0 0 0 .65.65l5-2a.5.5 0 0 0 .168-.11z"/>
                             </svg>
                         </button>
                         <button class="btn btn-sm btn-danger btn-detalle-producto-eliminar me-2" data-producto="${data["pro_id"]}">
                             <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-trash3-fill" viewBox="0 0 16 16">
                                 <path d="M11 1.5v1h3.5a.5.5 0 0 1 0 1h-.538l-.853 10.66A2 2 0 0 1 11.115 16h-6.23a2 2 0 0 1-1.994-1.84L2.038 3.5H1.5a.5.5 0 0 1 0-1H5v-1A1.5 1.5 0 0 1 6.5 0h3A1.5 1.5 0 0 1 11 1.5m-5 0v1h4v-1a.5.5 0 0 0-.5-.5h-3a.5.5 0 0 0-.5.5M4.5 5.029l.5 8.5a.5.5 0 1 0 .998-.06l-.5-8.5a.5.5 0 1 0-.998.06m6.53-.528a.5.5 0 0 0-.528.47l-.5 8.5a.5.5 0 0 0 .998.058l.5-8.5a.5.5 0 0 0-.47-.528M8 4.5a.5.5 0 0 0-.5.5v8.5a.5.5 0 0 0 1 0V5a.5.5 0 0 0-.5-.5"/>
                             </svg>
                         </button>
                         <button class="btn btn-sm btn-primary btn-detalle-producto-adjuntos" data-producto="${data["pro_id"]}">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-file-earmark-text-fill" viewBox="0 0 16 16">
                                <path d="M9.293 0H4a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V4.707A1 1 0 0 0 13.707 4L10 .293A1 1 0 0 0 9.293 0M9.5 3.5v-2l3 3h-2a1 1 0 0 1-1-1M4.5 9a.5.5 0 0 1 0-1h7a.5.5 0 0 1 0 1zM4 10.5a.5.5 0 0 1 .5-.5h7a.5.5 0 0 1 0 1h-7a.5.5 0 0 1-.5-.5m.5 2.5a.5.5 0 0 1 0-1h4a.5.5 0 0 1 0 1z"/>
                            </svg>
                         </button>
                     </div>
                 </td>
             </tr>`

            $('#tbl-requerimientos tbody').append(row)
            detalle_requerimiento.push(data)
        }
    }

    function seleccionarMaterial(material) {
        const { pro_id, pro_codigo, pro_descripcion } = material
        const findProducto = detalle_requerimiento.find(element => element.pro_id == pro_id)

        // Excepcion de validacion
        if (findProducto) {
            alert('Este producto ya fué agregado')
        } else {
            limpiarLista()
            $('#productosInput').val('')

            const data = {
                pro_id,
                pro_codigo,
                odm_descripcion: pro_descripcion,
                odm_cantidad: 1.00,
                odm_observacion: "",
                odm_tipo: 1,
                odm_asociar: true,
                detalle_adjuntos: []
            }

            const row = `
            <tr>
                <td>${data["pro_codigo"]}</td>
                <td>
                    <input type="text" class="form-control descripcion-input" value='${data["odm_descripcion"].replace(/'/g, "&#39;")}' readonly/>
                </td>
                <td>
                    <input type="number" class="form-control cantidad-input" value='${data["odm_cantidad"]}' readonly/>
                </td>
                <td>
                    <input type="text" class="form-control observacion-input" value='${data["odm_observacion"].replace(/'/g, "&#39;")}' readonly/>
                </td>
                <td>
                    <div class="d-flex justify-content-around">
                        <button class="btn btn-sm btn-warning btn-detalle-producto-editar me-2" data-producto="${data["pro_id"]}">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-pencil-fill" viewBox="0 0 16 16">
                                <path d="M12.854.146a.5.5 0 0 0-.707 0L10.5 1.793 14.207 5.5l1.647-1.646a.5.5 0 0 0 0-.708zm.646 6.061L9.793 2.5 3.293 9H3.5a.5.5 0 0 1 .5.5v.5h.5a.5.5 0 0 1 .5.5v.5h.5a.5.5 0 0 1 .5.5v.5h.5a.5.5 0 0 1 .5.5v.207zm-7.468 7.468A.5.5 0 0 1 6 13.5V13h-.5a.5.5 0 0 1-.5-.5V12h-.5a.5.5 0 0 1-.5-.5V11h-.5a.5.5 0 0 1-.5-.5V10h-.5a.5.5 0 0 1-.175-.032l-.179.178a.5.5 0 0 0-.11.168l-2 5a.5.5 0 0 0 .65.65l5-2a.5.5 0 0 0 .168-.11z"/>
                            </svg>
                        </button>
                        <button class="btn btn-sm btn-danger btn-detalle-producto-eliminar me-2" data-producto="${data["pro_id"]}">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-trash3-fill" viewBox="0 0 16 16">
                                <path d="M11 1.5v1h3.5a.5.5 0 0 1 0 1h-.538l-.853 10.66A2 2 0 0 1 11.115 16h-6.23a2 2 0 0 1-1.994-1.84L2.038 3.5H1.5a.5.5 0 0 1 0-1H5v-1A1.5 1.5 0 0 1 6.5 0h3A1.5 1.5 0 0 1 11 1.5m-5 0v1h4v-1a.5.5 0 0 0-.5-.5h-3a.5.5 0 0 0-.5.5M4.5 5.029l.5 8.5a.5.5 0 1 0 .998-.06l-.5-8.5a.5.5 0 1 0-.998.06m6.53-.528a.5.5 0 0 0-.528.47l-.5 8.5a.5.5 0 0 0 .998.058l.5-8.5a.5.5 0 0 0-.47-.528M8 4.5a.5.5 0 0 0-.5.5v8.5a.5.5 0 0 0 1 0V5a.5.5 0 0 0-.5-.5"/>
                            </svg>
                        </button>
                        <button class="btn btn-sm btn-primary btn-detalle-producto-adjuntos" data-producto="${data["pro_id"]}">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-file-earmark-text-fill" viewBox="0 0 16 16">
                                <path d="M9.293 0H4a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V4.707A1 1 0 0 0 13.707 4L10 .293A1 1 0 0 0 9.293 0M9.5 3.5v-2l3 3h-2a1 1 0 0 1-1-1M4.5 9a.5.5 0 0 1 0-1h7a.5.5 0 0 1 0 1zM4 10.5a.5.5 0 0 1 .5-.5h7a.5.5 0 0 1 0 1h-7a.5.5 0 0 1-.5-.5m.5 2.5a.5.5 0 0 1 0-1h4a.5.5 0 0 1 0 1z"/>
                            </svg>
                         </button>
                    </div>
                </td>
            </tr>`

            $('#tbl-requerimientos tbody').append(row)
            detalle_requerimiento.push(data)
        }
    }

    // funcion de editar detalle de productos
    $('#tbl-requerimientos').on('click', '.btn-detalle-producto-editar', function () {
        const $row = $(this).closest('tr')
        const $descripcionInput = $row.find('.descripcion-input')
        const $cantidadInput = $row.find('.cantidad-input')
        const $observacionInput = $row.find('.observacion-input')

        // Habilitar los inputs
        $descripcionInput.prop('readonly', false)
        $cantidadInput.prop('readonly', false)
        $observacionInput.prop('readonly', false)

        // ACTUALIZAMOS EL ELEMENTO
        $(this).removeClass('btn-warning btn-detalle-producto-editar')
            .addClass('btn-success btn-detalle-producto-guardar')
            .html(`<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-floppy-fill" viewBox="0 0 16 16">
                    <path d="M0 1.5A1.5 1.5 0 0 1 1.5 0H3v5.5A1.5 1.5 0 0 0 4.5 7h7A1.5 1.5 0 0 0 13 5.5V0h.086a1.5 1.5 0 0 1 1.06.44l1.415 1.414A1.5 1.5 0 0 1 16 2.914V14.5a1.5 1.5 0 0 1-1.5 1.5H14v-5.5A1.5 1.5 0 0 0 12.5 9h-9A1.5 1.5 0 0 0 2 10.5V16h-.5A1.5 1.5 0 0 1 0 14.5z"/>
                    <path d="M3 16h10v-5.5a.5.5 0 0 0-.5-.5h-9a.5.5 0 0 0-.5.5zm9-16H4v5.5a.5.5 0 0 0 .5.5h7a.5.5 0 0 0 .5-.5zM9 1h2v4H9z"/>
                </svg>`)
    })

    $('#tbl-requerimientos').on('click', '.btn-detalle-producto-guardar', function () {
        const id_producto = $(this).data('producto')
        const $row = $(this).closest('tr')

        const $descripcionInput = $row.find('.descripcion-input')
        const $cantidadInput = $row.find('.cantidad-input')
        const $observacionInput = $row.find('.observacion-input')

        const valueDescripcion = $descripcionInput.val()
        const valueCantidad = $cantidadInput.val()
        const valueObservacion = $observacionInput.val()

        const findElementProducto = detalle_requerimiento.find(element => element.pro_id == id_producto)
        findElementProducto["odm_descripcion"] = valueDescripcion
        findElementProducto["odm_cantidad"] = valueCantidad
        findElementProducto["odm_observacion"] = valueObservacion

        $descripcionInput.prop('readonly', true)
        $cantidadInput.prop('readonly', true)
        $observacionInput.prop('readonly', true)

        // ACTUALIZAMOS EL ELEMENTO
        $(this).removeClass('btn-success btn-detalle-producto-guardar')
            .addClass('btn-warning btn-detalle-producto-editar')
            .html(`<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-pencil-fill" viewBox="0 0 16 16">
                        <path d="M12.854.146a.5.5 0 0 0-.707 0L10.5 1.793 14.207 5.5l1.647-1.646a.5.5 0 0 0 0-.708zm.646 6.061L9.793 2.5 3.293 9H3.5a.5.5 0 0 1 .5.5v.5h.5a.5.5 0 0 1 .5.5v.5h.5a.5.5 0 0 1 .5.5v.5h.5a.5.5 0 0 1 .5.5v.207zm-7.468 7.468A.5.5 0 0 1 6 13.5V13h-.5a.5.5 0 0 1-.5-.5V12h-.5a.5.5 0 0 1-.5-.5V11h-.5a.5.5 0 0 1-.5-.5V10h-.5a.5.5 0 0 1-.175-.032l-.179.178a.5.5 0 0 0-.11.168l-2 5a.5.5 0 0 0 .65.65l5-2a.5.5 0 0 0 .168-.11z"/>
                    </svg>`)
    })

    // funcion de eliminacion de detalle de producto
    $('#tbl-requerimientos').on('click', '.btn-detalle-producto-eliminar', function () {
        const id_producto = $(this).data('producto')
        const $row = $(this).closest('tr')

        // removemos el DOM
        $row.remove()

        const findIndexElementProceso = detalle_requerimiento.findIndex(element => element.pro_id == id_producto)
        detalle_requerimiento.splice(findIndexElementProceso, 1)
    })

    // -------- GESTION DE ARCHIVOS ADJUNTOS ---------
    $('#tbl-requerimientos').on('click', '.btn-detalle-producto-adjuntos', function () {
        console.log("netro aqui")
        const id_producto = $(this).data('producto')
        // const $row = $(this).closest('tr')
        $("#tabla-archivos-adjuntos").empty()
        $("#id-detalle-material").val(id_producto)

        const findDetalle = detalle_requerimiento.find(element => element.pro_id == id_producto)
        const { detalle_adjuntos } = findDetalle

        detalle_adjuntos.forEach((element, index) => {
            const { oma_descripcion } = element
            const row = `
            <tr>
                <td>${index + 1}</td>
                <td>${oma_descripcion}</td>
                <td class="text-center">
                    <button type="button" class="btn btn-danger btn-sm btn-eliminar-archivo">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-trash-fill" viewBox="0 0 16 16">
                            <path d="M2.5 1a1 1 0 0 0-1 1v1a1 1 0 0 0 1 1H3v9a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2V4h.5a1 1 0 0 0 1-1V2a1 1 0 0 0-1-1H10a1 1 0 0 0-1-1H7a1 1 0 0 0-1 1zm3 4a.5.5 0 0 1 .5.5v7a.5.5 0 0 1-1 0v-7a.5.5 0 0 1 .5-.5M8 5a.5.5 0 0 1 .5.5v7a.5.5 0 0 1-1 0v-7A.5.5 0 0 1 8 5m3 .5v7a.5.5 0 0 1-1 0v-7a.5.5 0 0 1 1 0"/>
                        </svg>
                    </button>
                </td>
            </tr>
            `
            $("#tabla-archivos-adjuntos").append(row)
        })

        // mostramos los modales correspondientes
        const modalAdjuntos = new bootstrap.Modal(document.getElementById('adjuntosMaterialModal'))
        modalAdjuntos.show()
    })

    $('#btn-agregar-archivo').click(async function () {
        const fileInput = $('#fileUpload')[0]
        const descriptionInput = $('#fileDescription')
        const id_producto = $("#id-detalle-material").val()

        const findDetalle = detalle_requerimiento.find(element => element.pro_id == id_producto)
        const { detalle_adjuntos } = findDetalle

        // Verificar que se haya seleccionado un archivo y que haya una descripción
        if (fileInput.files.length > 0 && descriptionInput.val().trim() !== "") {
            const file = fileInput.files[0]
            const description = descriptionInput.val().trim()

            const formatData = {
                oma_descripcion: description,
                oma_file: file,
            }
            // Crear una nueva fila en la tabla con un índice del array
            const row = `
                <tr data-index=${detalle_adjuntos.length}>
                    <td>
                        ${detalle_adjuntos.length + 1}
                    </td>
                    <td class="descripcion-file">${formatData.oma_descripcion}</td>
                    <td class="text-center">
                        <button type="button" class="btn btn-danger btn-sm btn-eliminar-archivo">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-trash-fill" viewBox="0 0 16 16">
                                <path d="M2.5 1a1 1 0 0 0-1 1v1a1 1 0 0 0 1 1H3v9a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2V4h.5a1 1 0 0 0 1-1V2a1 1 0 0 0-1-1H10a1 1 0 0 0-1-1H7a1 1 0 0 0-1 1zm3 4a.5.5 0 0 1 .5.5v7a.5.5 0 0 1-1 0v-7a.5.5 0 0 1 .5-.5M8 5a.5.5 0 0 1 .5.5v7a.5.5 0 0 1-1 0v-7A.5.5 0 0 1 8 5m3 .5v7a.5.5 0 0 1-1 0v-7a.5.5 0 0 1 1 0"/>
                            </svg>
                        </button>
                    </td>
                </tr>
            `
            $('#tabla-archivos-adjuntos').append(row)

            detalle_adjuntos.push(formatData)

            // Limpiar los campos después de agregar el archivo
            fileInput.value = ''
            descriptionInput.val('')
        } else {
            alert('Por favor, seleccione un archivo y agregue una descripción.');
        }
    })

    // Evento para eliminar archivos de la tabla
    $('#tabla-archivos-adjuntos').on('click', '.btn-eliminar-archivo', async function () {
        const row = $(this).closest('tr')
        const index = row.data('index')

        const id_producto = $("#id-detalle-material").val()

        const findDetalle = detalle_requerimiento.find(element => element.pro_id == id_producto)
        const { detalle_adjuntos } = findDetalle

        detalle_adjuntos.splice(index, 1)
        row.remove()
    })

    $("#btn-guardar-requerimiento").click(async function () {
        let handleError = ''
        window.onbeforeunload = null;
        
        const $oiValorEquipo = $('#equipoInput').val().trim()
        const $oiCodigoArea = $('#areaSelect').val()
        const $oiFecha = $('#fechaPicker').val()
        const $oiFechaEntrega = $('#fechaEntregaPicker').val()
        const $oiEncargadoOrigen = $('#responsableOrigen').val()

        if (
            $oiFecha.length === 0 ||
            $oiFechaEntrega.length === 0 ||
            $oiEncargadoOrigen.length === 0 ||
            $oiCodigoArea.length === 0 ||
            detalle_requerimiento.length === 0
        ) {
            if ($oiCodigoArea.length === 0) {
                handleError += '- Se debe ingresar información del área\n'
            }
            if ($oiFecha.length === 0) {
                handleError += '- Se debe ingresar información de la fecha\n'
            }
            if ($oiFechaEntrega.length === 0) {
                handleError += '- Se debe ingresar información de la fecha de entrega\n'
            }
            if ($oiEncargadoOrigen.length === 0) {
                handleError += '- Se debe ingresar información de encargado origen\n'
            }
            if (detalle_requerimiento.length === 0) {
                handleError += '- Se debe ingresar información de detalle de requerimiento\n'
            }
        }

        if (handleError.length !== 0) {
            alert(handleError)
            return
        }

        const formatData = {
            oic_fecha: transformarFecha($oiFecha),
            oic_fechaentregaestimada: transformarFecha($oiFechaEntrega),
            are_codigo: $oiCodigoArea,
            tra_idorigen: $oiEncargadoOrigen,
            oic_equipo_descripcion: $oiValorEquipo || null,
            detalle_requerimiento: []
        }

        // debemos parsear la informacion
        detalle_requerimiento.forEach((element, index) => {
            formatData.detalle_requerimiento.push({
                pro_id: element.pro_id,
                pro_codigo: element.pro_codigo,
                odm_item: index + 1,
                odm_descripcion: element.odm_descripcion,
                odm_cantidad: element.odm_cantidad,
                odm_observacion: element.odm_observacion,
                odm_tipo: element.odm_tipo,
                odm_asociar: element.odm_asociar,
                detalle_adjuntos: [...element.detalle_adjuntos.map(element_adjunto => element_adjunto.oma_descripcion)]
            })
        })

        // formar data
        console.log(formatData)
        // return
        const formData = new FormData()
        formData.append('data', JSON.stringify(formatData))

        // agregamos estructuradamente los archivos en el formdata
        detalle_requerimiento.forEach((detalle, indexDetalle) => {
            const {detalle_adjuntos} = detalle
            detalle_adjuntos.forEach((file, indexFile) => {
                formData.append(`files[${indexDetalle}][${indexFile}]`, file.oma_file)
            })
        })

        try{
            await client.post('/requerimientos', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            })
            window.location.href = "requerimiento"
        } catch(error){
            console.log(error)
            alert("Error al crear el requerimiento")
        }
    })

})