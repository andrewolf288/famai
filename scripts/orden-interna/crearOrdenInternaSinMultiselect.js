
$(document).ready(function () {
    let abortController

    window.onbeforeunload = function (e) {
        e.preventDefault();
        e.returnValue = '';
    }

    // evento para cargar
    $('select[multiple]').multiselect(
        {
            onOptionClick: function (element, option) {
                var thisOpt = $(option);
                if (thisOpt.prop('checked')) {
                    agregarDetalleProceso(thisOpt.val(), thisOpt.attr('title'))
                } else {
                    eliminarDetalleProceso(thisOpt.val())
                }
            }
        }
    )

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

    // data guardada
    const ordenInterna = {
        detalle_partes: []
    }

    let currentParte = 0

    // funcion de busqueda de detalle de parte
    function buscarDetalleParte(id_parte) {
        return findElement = ordenInterna.detalle_partes.find(element => element.oip_id == id_parte)
    }

    // funcion de buscar Orden de Trabajo
    const buscarOrdenTrabajo = async () => {
        // Obtener el valor del campo de texto
        var otValue = $('#otInput').val().trim()

        // Validar si el campo está vacío
        if (otValue.length === 0) {
            alert('Por favor, ingrese un valor para buscar.')
            return
        }

        try {
            const { data } = await client.get(`/ordenestrabajosByNumero/${otValue}`)
            const estadoOrdenTrabajo = data.odt_estado
            if (estadoOrdenTrabajo === 'Cerrado') {
                if (!confirm('La orden de trabajo ya ha sido cerrada. ¿Desea jalar los datos?')) {
                    return
                }
            }
            $('#clienteInput').val(data.cli_nombre || '')
            $('#oiInput').val(data.odt_numero)
            $('#idClienteInput').val(data.cli_nrodocumento || '')
            $('#equipoInput').val(data.odt_equipo)
        } catch (error) {
            const { response } = error
            if (response.status === 404) {
                alert(response.data.error)
            } else {
                alert('Error al buscar la orden de trabajo')
            }

            // actualizamos la referencia
            $('#otInput').val("")
            $('#clienteInput').val("")
            $('#idClienteInput').val("")
            $('#equipoInput').val("")
        }
    }

    // Maneja el evento de enter en el campo de orden de trabajo
    $('#otInput').on('keypress', async (event) => {
        if (event.which === 13) {
            await buscarOrdenTrabajo()
        }
    })

    // Maneja el evento de clic en el botón de búsqueda
    $('#searchButton').on('click', async () => {
        await buscarOrdenTrabajo()
    })

    // buscar orden interna
    const buscarOrdenInterna = async () => {
        // Obtener el valor del campo de texto
        var oiValue = $('#ordenInternaInput').val().trim()

        // Validar si el campo está vacío
        if (oiValue.length === 0) {
            alert('Por favor, ingrese un valor para buscar.')
            return
        }

        try {
            const { data } = await client.get(`/ordeninternaByNumero/${oiValue}`)
            const formatData = []
            data.partes.forEach(parte => {
                const parteDetalle = {
                    oip_id: parte.oip_id,
                    oip_descripcion: parte.parte.oip_descripcion,
                    detalle_materiales: [],
                    detalle_procesos: []
                }

                // parseamos los procesos
                parte.procesos.forEach(proceso => {
                    parteDetalle.detalle_procesos.push({
                        opp_id: proceso.proceso.opp_id,
                        opp_codigo: proceso.proceso.opp_codigo,
                        odp_descripcion: proceso.odp_descripcion || '',
                        odp_observacion: "",
                        odp_ccalidad: false
                    })
                })

                // parseamos los materiales
                parte.materiales.forEach(material => {
                    parteDetalle.detalle_materiales.push({
                        // pro_id: material.producto === null ? obtenerIdUnico(): material.producto.pro_id,
                        pro_id: material.producto === null ? obtenerIdUnico() : material.producto.pro_codigo,
                        pro_codigo: material.producto === null ? '' : material.producto.pro_codigo,
                        odm_descripcion: material.odm_descripcion,
                        odm_cantidad: material.odm_cantidad,
                        odm_observacion: "",
                        odm_asociar: material.producto === null ? false : true
                    })
                })

                // agregamos al detalle
                formatData.push(parteDetalle)
            })

            // agregamos al DOM la informacion
            $('#tbl-orden-interna tbody').empty()
            formatData.forEach(function (item, index) {
                const { oip_id, oip_descripcion, detalle_materiales, detalle_procesos } = item
                const row = `
                    <tr>
                        <td>${oip_descripcion}</td>
                        <td>
                            <button class="btn btn-sm btn-editar btn-procesos" data-element="${oip_descripcion}" data-bs-id="${oip_id}">
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-gear-fill" viewBox="0 0 16 16">
                                    <path d="M9.405 1.05c-.413-1.4-2.397-1.4-2.81 0l-.1.34a1.464 1.464 0 0 1-2.105.872l-.31-.17c-1.283-.698-2.686.705-1.987 1.987l.169.311c.446.82.023 1.841-.872 2.105l-.34.1c-1.4.413-1.4 2.397 0 2.81l.34.1a1.464 1.464 0 0 1 .872 2.105l-.17.31c-.698 1.283.705 2.686 1.987 1.987l.311-.169a1.464 1.464 0 0 1 2.105.872l.1.34c.413 1.4 2.397 1.4 2.81 0l.1-.34a1.464 1.464 0 0 1 2.105-.872l.31.17c1.283.698 2.686-.705 1.987-1.987l-.169-.311a1.464 1.464 0 0 1 .872-2.105l.34-.1c1.4-.413 1.4-2.397 0-2.81l-.34-.1a1.464 1.464 0 0 1-.872-2.105l.17-.31c.698-1.283-.705-2.686-1.987-1.987l-.311.169a1.464 1.464 0 0 1-2.105-.872zM8 10.93a2.929 2.929 0 1 1 0-5.86 2.929 2.929 0 0 1 0 5.858z"/>
                                </svg>
                                Procesos
                            </button>
                        </td>
                        <td>
                            <p class="text-center" id="cantidad-procesos-${oip_id}">${detalle_procesos.length}</p>
                        </td>
                        <td>
                            <button class="btn btn-sm btn-eliminar btn-productos" data-element="${oip_descripcion}" data-bs-id="${oip_id}">
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-hammer" viewBox="0 0 16 16">
                                    <path d="M9.972 2.508a.5.5 0 0 0-.16-.556l-.178-.129a5 5 0 0 0-2.076-.783C6.215.862 4.504 1.229 2.84 3.133H1.786a.5.5 0 0 0-.354.147L.146 4.567a.5.5 0 0 0 0 .706l2.571 2.579a.5.5 0 0 0 .708 0l1.286-1.29a.5.5 0 0 0 .146-.353V5.57l8.387 8.873A.5.5 0 0 0 14 14.5l1.5-1.5a.5.5 0 0 0 .017-.689l-9.129-8.63c.747-.456 1.772-.839 3.112-.839a.5.5 0 0 0 .472-.334"/>
                                </svg> 
                                Materiales
                            </button>
                        </td>
                        <td>
                            <p class="text-center" id="cantidad-productos-${oip_id}">${detalle_materiales.length}</p>
                        </td>
                    </tr>
                `
                // agregamos la tabla
                $('#tbl-orden-interna tbody').append(row)
            })

            // actualizamos la informacion de procesos
            ordenInterna["detalle_partes"] = formatData

        } catch (error) {
            alert('Error al buscar la orden interna')
        }
    }

    // Maneja el evento de clic en el botón de busqueda
    $('#copyButton').on('click', async () => {
        // abrimos el modal de ingreso de informacion
        const loaderModalSearchOI = new bootstrap.Modal(document.getElementById('ordenInternaSearchModal'))
        loaderModalSearchOI.show()
    })

    $('#btnSearchOrdenInterna').on('click', async function (event) {
        event.preventDefault()
        await buscarOrdenInterna()
        const loaderModalSearchOI = bootstrap.Modal.getInstance(document.getElementById('ordenInternaSearchModal'))
        loaderModalSearchOI.hide()
    })

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
            const $responsableMaestro = $('#responsableMaestro')
            const $responsableAlmacen = $('#responsableAlmacen')

            // Ordenar la data alfabéticamente según el nombre (índice [1])
            data.sort((a, b) => a.tra_nombre.localeCompare(b.tra_nombre))

            data.forEach(responsable => {
                const option = $('<option>').val(responsable.tra_id).text(responsable.tra_nombre)
                $responsableOrigen.append(option.clone())
                $responsableMaestro.append(option.clone())
                $responsableAlmacen.append(option.clone())
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
            $('#otInput').val(data.sed_codigo)
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

    // --------- CARGA INICIAL DE DATA DE PARTES ----------
    const cargarTablaOrdenInterna = async () => {
        try {
            const { data } = await client.get('/partesSimple')
            data.forEach(function (item, index) {
                const { oip_id, oip_descripcion } = item
                const row = `
                    <tr>
                        <td>${oip_descripcion}</td>
                        <td>
                            <button class="btn btn-sm btn-editar btn-procesos" data-element="${oip_descripcion}" data-bs-id="${oip_id}">
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-gear-fill" viewBox="0 0 16 16">
                                    <path d="M9.405 1.05c-.413-1.4-2.397-1.4-2.81 0l-.1.34a1.464 1.464 0 0 1-2.105.872l-.31-.17c-1.283-.698-2.686.705-1.987 1.987l.169.311c.446.82.023 1.841-.872 2.105l-.34.1c-1.4.413-1.4 2.397 0 2.81l.34.1a1.464 1.464 0 0 1 .872 2.105l-.17.31c-.698 1.283.705 2.686 1.987 1.987l.311-.169a1.464 1.464 0 0 1 2.105.872l.1.34c.413 1.4 2.397 1.4 2.81 0l.1-.34a1.464 1.464 0 0 1 2.105-.872l.31.17c1.283.698 2.686-.705 1.987-1.987l-.169-.311a1.464 1.464 0 0 1 .872-2.105l.34-.1c1.4-.413 1.4-2.397 0-2.81l-.34-.1a1.464 1.464 0 0 1-.872-2.105l.17-.31c.698-1.283-.705-2.686-1.987-1.987l-.311.169a1.464 1.464 0 0 1-2.105-.872zM8 10.93a2.929 2.929 0 1 1 0-5.86 2.929 2.929 0 0 1 0 5.858z"/>
                                </svg>
                                Procesos
                            </button>
                        </td>
                        <td>
                            <p class="text-center" id="cantidad-procesos-${oip_id}">0</p>
                        </td>
                        <td>
                            <button class="btn btn-sm btn-eliminar btn-productos" data-element="${oip_descripcion}" data-bs-id="${oip_id}">
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-hammer" viewBox="0 0 16 16">
                                    <path d="M9.972 2.508a.5.5 0 0 0-.16-.556l-.178-.129a5 5 0 0 0-2.076-.783C6.215.862 4.504 1.229 2.84 3.133H1.786a.5.5 0 0 0-.354.147L.146 4.567a.5.5 0 0 0 0 .706l2.571 2.579a.5.5 0 0 0 .708 0l1.286-1.29a.5.5 0 0 0 .146-.353V5.57l8.387 8.873A.5.5 0 0 0 14 14.5l1.5-1.5a.5.5 0 0 0 .017-.689l-9.129-8.63c.747-.456 1.772-.839 3.112-.839a.5.5 0 0 0 .472-.334"/>
                                </svg> 
                                Materiales
                            </button>
                        </td>
                        <td>
                            <p class="text-center" id="cantidad-productos-${oip_id}">0</p>
                        </td>
                    </tr>
                `
                // agregamos la tabla
                $('#tbl-orden-interna tbody').append(row)
                // formamos la data de procesos y productos
                const data = {
                    oip_id: oip_id,
                    oip_descripcion: oip_descripcion,
                    detalle_materiales: [],
                    detalle_procesos: []
                }
                ordenInterna["detalle_partes"].push(data)
            })
        } catch (error) {
            alert("Error al cargar la lista de partes")
        }
    }

    const initInformacion = async () => {
        try {
            showLoaderModal()
            await Promise.all([
                cargarTablaOrdenInterna(),
                cargarAreas(),
                cargarResponsables(),
            ])
            cargarInformacionUsuario()
        } catch (error) {
            alert("Error al cargar los datos")
        } finally {
            hideLoaderModal()

        }
    }

    // inicializamos la data
    initInformacion()

    // ------------ JAVASCRIPT PARA GESTION DE PROCESOS -------------
    // carga de selector de procesos
    const cargarProcesosSelect = async (id_parte) => {
        const findElement = buscarDetalleParte(id_parte)
        const { detalle_procesos } = findElement

        try {
            const { data } = await client.get(`/procesosByParte/${id_parte}`)
            // const $procesosSelect = $('#procesosSelect')
            // $procesosSelect.empty().append(`<option value="0">Seleccione un proceso</option>`)
            // data.forEach(function (proceso) {
            //     const option = $('<option>').val(proceso["opp_id"]).text(`${proceso["opp_codigo"]} - ${proceso["opp_descripcion"]}`).attr('data-codigo', proceso["opp_codigo"])
            //     $procesosSelect.append(option)
            // })
            let options = []
            data.forEach(function (proceso) {
                const checked = detalle_procesos.find(element => element.opp_id == proceso["opp_id"]) ? true : false
                options.push({
                    name: `${proceso["opp_codigo"]} - ${proceso["opp_descripcion"]}`,
                    value: proceso["opp_id"],
                    checked: checked
                })
            })

            $('select[multiple]').multiselect('loadOptions', options);
        } catch (error) {
            alert("Error al cargar la lista de procesos")
        }
    }

    // carga de detalle de procesos en tabla
    function cargarProcesosDetalle(id_parte) {
        $('#tbl-orden-interna-procesos tbody').empty()
        // buscamos el detalle de la parte correspondiente
        const findElement = buscarDetalleParte(id_parte)
        const { detalle_procesos } = findElement

        detalle_procesos.sort((a, b) => a.opp_codigo - b.opp_codigo)

        detalle_procesos.forEach(element => {
            // const row = `
            // <tr>
            //     <td>${element["opp_codigo"]}</td>
            //     <td>${element["opp_descripcion"]}</td>
            //     <td><input type="checkbox" ${element["odp_ccalidad"] ? 'checked' : ''} disabled/></td>
            //     <td>
            //         <input type="text" class="form-control" value="${element["odp_observacion"]}" readonly/>
            //     </td>
            //     <td>
            //         <div class="d-flex justify-content-around">
            //             <button class="btn btn-sm btn-warning btn-detalle-proceso-editar me-2" data-proceso="${element["opp_id"]}">
            //                 <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-pencil-fill" viewBox="0 0 16 16">
            //                     <path d="M12.854.146a.5.5 0 0 0-.707 0L10.5 1.793 14.207 5.5l1.647-1.646a.5.5 0 0 0 0-.708zm.646 6.061L9.793 2.5 3.293 9H3.5a.5.5 0 0 1 .5.5v.5h.5a.5.5 0 0 1 .5.5v.5h.5a.5.5 0 0 1 .5.5v.5h.5a.5.5 0 0 1 .5.5v.207zm-7.468 7.468A.5.5 0 0 1 6 13.5V13h-.5a.5.5 0 0 1-.5-.5V12h-.5a.5.5 0 0 1-.5-.5V11h-.5a.5.5 0 0 1-.5-.5V10h-.5a.5.5 0 0 1-.175-.032l-.179.178a.5.5 0 0 0-.11.168l-2 5a.5.5 0 0 0 .65.65l5-2a.5.5 0 0 0 .168-.11z"/>
            //                 </svg>
            //             </button>
            //             <button class="btn btn-sm btn-danger btn-detalle-proceso-eliminar" data-proceso="${element["opp_id"]}">
            //                 <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-trash3-fill" viewBox="0 0 16 16">
            //                     <path d="M11 1.5v1h3.5a.5.5 0 0 1 0 1h-.538l-.853 10.66A2 2 0 0 1 11.115 16h-6.23a2 2 0 0 1-1.994-1.84L2.038 3.5H1.5a.5.5 0 0 1 0-1H5v-1A1.5 1.5 0 0 1 6.5 0h3A1.5 1.5 0 0 1 11 1.5m-5 0v1h4v-1a.5.5 0 0 0-.5-.5h-3a.5.5 0 0 0-.5.5M4.5 5.029l.5 8.5a.5.5 0 1 0 .998-.06l-.5-8.5a.5.5 0 1 0-.998.06m6.53-.528a.5.5 0 0 0-.528.47l-.5 8.5a.5.5 0 0 0 .998.058l.5-8.5a.5.5 0 0 0-.47-.528M8 4.5a.5.5 0 0 0-.5.5v8.5a.5.5 0 0 0 1 0V5a.5.5 0 0 0-.5-.5"/>
            //                 </svg>
            //             </button>
            //         </div>
            //     </td>
            // </tr>`
            const row = `
            <tr>
                <td>${element["opp_codigo"]}</td>
                <td>
                    <input type="text" class="form-control descripcion-input" value="${element["odp_descripcion"]}" readonly/>
                </td>
                <td class="text-center">
                    <input type="checkbox" ${element["odp_ccalidad"] ? 'checked' : ''} disabled/>
                </td>
                <td>
                    <input type="text" class="form-control observacion-input" value="${element["odp_observacion"]}" readonly/>
                </td>
                <td>
                    <div class="d-flex justify-content-around">
                        <button class="btn btn-sm btn-warning btn-detalle-proceso-editar me-2" data-proceso="${element["opp_id"]}">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-pencil-fill" viewBox="0 0 16 16">
                                <path d="M12.854.146a.5.5 0 0 0-.707 0L10.5 1.793 14.207 5.5l1.647-1.646a.5.5 0 0 0 0-.708zm.646 6.061L9.793 2.5 3.293 9H3.5a.5.5 0 0 1 .5.5v.5h.5a.5.5 0 0 1 .5.5v.5h.5a.5.5 0 0 1 .5.5v.5h.5a.5.5 0 0 1 .5.5v.207zm-7.468 7.468A.5.5 0 0 1 6 13.5V13h-.5a.5.5 0 0 1-.5-.5V12h-.5a.5.5 0 0 1-.5-.5V11h-.5a.5.5 0 0 1-.5-.5V10h-.5a.5.5 0 0 1-.175-.032l-.179.178a.5.5 0 0 0-.11.168l-2 5a.5.5 0 0 0 .65.65l5-2a.5.5 0 0 0 .168-.11z"/>
                            </svg>
                        </button>
                    </div>
                </td>
            </tr>`
            $('#tbl-orden-interna-procesos tbody').append(row)
        })
    }

    // funcion cargar modal de procesos
    $('#tbl-orden-interna').on('click', '.btn-procesos', async (event) => {
        const id = $(event.currentTarget).data('bs-id')
        currentParte = id
        const findParte = buscarDetalleParte(id)

        $('#procesosModalLabel').text(`PROCESOS - ${findParte.oip_descripcion}`)
        // cargamos la informacion
        await cargarProcesosSelect(id)
        // cargar informacion de los detalles añadidos
        cargarProcesosDetalle(id)
        // mostramos el modal
        $('#procesosModal').modal('show')
    })

    // funcion de agregar detalle de proceso a parte de orden interna
    function agregarDetalleProceso(valueId, valueName) {
        console.log(valueId, valueName)
        const selectedProcesoId = valueId
        // if (selectedProcesoId == "0") {
        //     alert('Debes seleccionar un proceso')
        //     return
        // }
        const selectedProcesoName = valueName.split(" - ")[1].trim()
        const selectedProcesoCode = valueName.split(" - ")[0].trim()

        const findElement = buscarDetalleParte(currentParte)
        const { detalle_procesos } = findElement

        const findProceso = detalle_procesos.find(element => element.opp_id == selectedProcesoId)

        if (findProceso) {
            alert('Este proceso ya fué agregado')
        } else {
            const data = {
                opp_id: selectedProcesoId,
                opp_codigo: selectedProcesoCode,
                odp_descripcion: selectedProcesoName,
                odp_ccalidad: false,
                odp_observacion: ""
            }

            // primero añadimos al DOM
            // const row = `
            // <tr>
            //     <td>${data["opp_codigo"]}</td>
            //     <td>${data["opp_descripcion"]}</td>
            //     <td><input type="checkbox" disabled/></td>
            //     <td>
            //         <input type="text" class="form-control" value="${data["odp_observacion"]}" readonly/>
            //     </td>
            //     <td>
            //         <div class="d-flex justify-content-around">
            //             <button class="btn btn-sm btn-warning btn-detalle-proceso-editar me-2" data-proceso="${data["opp_id"]}">
            //                 <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-pencil-fill" viewBox="0 0 16 16">
            //                     <path d="M12.854.146a.5.5 0 0 0-.707 0L10.5 1.793 14.207 5.5l1.647-1.646a.5.5 0 0 0 0-.708zm.646 6.061L9.793 2.5 3.293 9H3.5a.5.5 0 0 1 .5.5v.5h.5a.5.5 0 0 1 .5.5v.5h.5a.5.5 0 0 1 .5.5v.5h.5a.5.5 0 0 1 .5.5v.207zm-7.468 7.468A.5.5 0 0 1 6 13.5V13h-.5a.5.5 0 0 1-.5-.5V12h-.5a.5.5 0 0 1-.5-.5V11h-.5a.5.5 0 0 1-.5-.5V10h-.5a.5.5 0 0 1-.175-.032l-.179.178a.5.5 0 0 0-.11.168l-2 5a.5.5 0 0 0 .65.65l5-2a.5.5 0 0 0 .168-.11z"/>
            //                 </svg>
            //             </button>
            //             <button class="btn btn-sm btn-danger btn-detalle-proceso-eliminar" data-proceso="${data["opp_id"]}">
            //                 <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-trash3-fill" viewBox="0 0 16 16">
            //                     <path d="M11 1.5v1h3.5a.5.5 0 0 1 0 1h-.538l-.853 10.66A2 2 0 0 1 11.115 16h-6.23a2 2 0 0 1-1.994-1.84L2.038 3.5H1.5a.5.5 0 0 1 0-1H5v-1A1.5 1.5 0 0 1 6.5 0h3A1.5 1.5 0 0 1 11 1.5m-5 0v1h4v-1a.5.5 0 0 0-.5-.5h-3a.5.5 0 0 0-.5.5M4.5 5.029l.5 8.5a.5.5 0 1 0 .998-.06l-.5-8.5a.5.5 0 1 0-.998.06m6.53-.528a.5.5 0 0 0-.528.47l-.5 8.5a.5.5 0 0 0 .998.058l.5-8.5a.5.5 0 0 0-.47-.528M8 4.5a.5.5 0 0 0-.5.5v8.5a.5.5 0 0 0 1 0V5a.5.5 0 0 0-.5-.5"/>
            //                 </svg>
            //             </button>
            //         </div>
            //     </td>
            // </tr>`
            const row = `
            <tr>
                <td>${data["opp_codigo"]}</td>
                <td>
                    <input type="text" class="form-control descripcion-input" value="${data["odp_descripcion"]}" readonly/>
                </td>
                <td class="text-center">
                    <input type="checkbox" disabled/>
                </td>
                <td>
                    <input type="text" class="form-control observacion-input" value="${data["odp_observacion"]}" readonly/>
                </td>
                <td>
                    <div class="d-flex justify-content-around">
                        <button class="btn btn-sm btn-warning btn-detalle-proceso-editar me-2" data-proceso="${data["opp_id"]}">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-pencil-fill" viewBox="0 0 16 16">
                                <path d="M12.854.146a.5.5 0 0 0-.707 0L10.5 1.793 14.207 5.5l1.647-1.646a.5.5 0 0 0 0-.708zm.646 6.061L9.793 2.5 3.293 9H3.5a.5.5 0 0 1 .5.5v.5h.5a.5.5 0 0 1 .5.5v.5h.5a.5.5 0 0 1 .5.5v.5h.5a.5.5 0 0 1 .5.5v.207zm-7.468 7.468A.5.5 0 0 1 6 13.5V13h-.5a.5.5 0 0 1-.5-.5V12h-.5a.5.5 0 0 1-.5-.5V11h-.5a.5.5 0 0 1-.5-.5V10h-.5a.5.5 0 0 1-.175-.032l-.179.178a.5.5 0 0 0-.11.168l-2 5a.5.5 0 0 0 .65.65l5-2a.5.5 0 0 0 .168-.11z"/>
                            </svg>
                        </button>
                    </div>
                </td>
            </tr>`

            $('#tbl-orden-interna-procesos tbody').append(row)
            detalle_procesos.push(data)
            // debemos actualizar la cantidad de procesos
            const totalProcesos = detalle_procesos.length
            const idCantidadProceso = `#cantidad-procesos-${currentParte}`
            $(idCantidadProceso).text(totalProcesos)
        }

        // seleccionamos el valor por defecto ---- para anterior implementacion se descomenta -----
        // $('#procesosSelect').val(0)
    }

    // funcion de agregar detalle de proceso a parte de orden interna
    // $('#procesosSelect').on('change', function () {
    //     const selectedProcesoId = $(this).val()
    //     if (selectedProcesoId == "0") {
    //         alert('Debes seleccionar un proceso')
    //         return
    //     }
    //     const selectedProcesoName = $(this).find('option:selected').text().split(" - ")[1].trim()
    //     const selectedProcesoCode = $(this).find('option:selected').data('codigo')

    //     const findElement = buscarDetalleParte(currentParte)
    //     const { detalle_procesos } = findElement

    //     const findProceso = detalle_procesos.find(element => element.opp_id == selectedProcesoId)

    //     if (findProceso) {
    //         alert('Este proceso ya fué agregado')
    //     } else {
    //         const data = {
    //             opp_id: selectedProcesoId,
    //             opp_codigo: selectedProcesoCode,
    //             opp_descripcion: selectedProcesoName,
    //             odp_ccalidad: false,
    //             odp_observacion: ""
    //         }

    //         // primero añadimos al DOM
    //         const row = `
    //         <tr>
    //             <td>${data["opp_codigo"]}</td>
    //             <td>${data["opp_descripcion"]}</td>
    //             <td><input type="checkbox" disabled/></td>
    //             <td>
    //                 <input type="text" class="form-control" value="${data["odp_observacion"]}" readonly/>
    //             </td>
    //             <td>
    //                 <div class="d-flex justify-content-around">
    //                     <button class="btn btn-sm btn-warning btn-detalle-proceso-editar me-2" data-proceso="${data["opp_id"]}">
    //                         <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-pencil-fill" viewBox="0 0 16 16">
    //                             <path d="M12.854.146a.5.5 0 0 0-.707 0L10.5 1.793 14.207 5.5l1.647-1.646a.5.5 0 0 0 0-.708zm.646 6.061L9.793 2.5 3.293 9H3.5a.5.5 0 0 1 .5.5v.5h.5a.5.5 0 0 1 .5.5v.5h.5a.5.5 0 0 1 .5.5v.5h.5a.5.5 0 0 1 .5.5v.207zm-7.468 7.468A.5.5 0 0 1 6 13.5V13h-.5a.5.5 0 0 1-.5-.5V12h-.5a.5.5 0 0 1-.5-.5V11h-.5a.5.5 0 0 1-.5-.5V10h-.5a.5.5 0 0 1-.175-.032l-.179.178a.5.5 0 0 0-.11.168l-2 5a.5.5 0 0 0 .65.65l5-2a.5.5 0 0 0 .168-.11z"/>
    //                         </svg>
    //                     </button>
    //                     <button class="btn btn-sm btn-danger btn-detalle-proceso-eliminar" data-proceso="${data["opp_id"]}">
    //                         <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-trash3-fill" viewBox="0 0 16 16">
    //                             <path d="M11 1.5v1h3.5a.5.5 0 0 1 0 1h-.538l-.853 10.66A2 2 0 0 1 11.115 16h-6.23a2 2 0 0 1-1.994-1.84L2.038 3.5H1.5a.5.5 0 0 1 0-1H5v-1A1.5 1.5 0 0 1 6.5 0h3A1.5 1.5 0 0 1 11 1.5m-5 0v1h4v-1a.5.5 0 0 0-.5-.5h-3a.5.5 0 0 0-.5.5M4.5 5.029l.5 8.5a.5.5 0 1 0 .998-.06l-.5-8.5a.5.5 0 1 0-.998.06m6.53-.528a.5.5 0 0 0-.528.47l-.5 8.5a.5.5 0 0 0 .998.058l.5-8.5a.5.5 0 0 0-.47-.528M8 4.5a.5.5 0 0 0-.5.5v8.5a.5.5 0 0 0 1 0V5a.5.5 0 0 0-.5-.5"/>
    //                         </svg>
    //                     </button>
    //                 </div>
    //             </td>
    //         </tr>`

    //         $('#tbl-orden-interna-procesos tbody').append(row)
    //         detalle_procesos.push(data)
    //         // debemos actualizar la cantidad de procesos
    //         const totalProcesos = detalle_procesos.length
    //         const idCantidadProceso = `#cantidad-procesos-${currentParte}`
    //         $(idCantidadProceso).text(totalProcesos)
    //     }

    //     // seleccionamos el valor por defecto
    //     $('#procesosSelect').val(0)
    // })

    // funcion de editar detalle de proceso
    $('#tbl-orden-interna-procesos').on('click', '.btn-detalle-proceso-editar', function () {
        const $row = $(this).closest('tr')
        // const $inputDescripcion = $row.find('.descripcion-input')
        const $inputObservacion = $row.find('.observacion-input')
        const $inputCheckbox = $row.find('input[type="checkbox"]')

        // CAMBIAMOS LA PROPIEDAD PARA QUE SE PUEDA EDITAR
        // $inputDescripcion.prop('readonly', false)
        $inputObservacion.prop('readonly', false)
        $inputCheckbox.prop('disabled', false)

        // ACTUALIZAMOS EL ELEMENTO
        $(this).removeClass('btn-warning btn-detalle-proceso-editar')
            .addClass('btn-success btn-detalle-proceso-guardar')
            .html(`<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-floppy-fill" viewBox="0 0 16 16">
                    <path d="M0 1.5A1.5 1.5 0 0 1 1.5 0H3v5.5A1.5 1.5 0 0 0 4.5 7h7A1.5 1.5 0 0 0 13 5.5V0h.086a1.5 1.5 0 0 1 1.06.44l1.415 1.414A1.5 1.5 0 0 1 16 2.914V14.5a1.5 1.5 0 0 1-1.5 1.5H14v-5.5A1.5 1.5 0 0 0 12.5 9h-9A1.5 1.5 0 0 0 2 10.5V16h-.5A1.5 1.5 0 0 1 0 14.5z"/>
                    <path d="M3 16h10v-5.5a.5.5 0 0 0-.5-.5h-9a.5.5 0 0 0-.5.5zm9-16H4v5.5a.5.5 0 0 0 .5.5h7a.5.5 0 0 0 .5-.5zM9 1h2v4H9z"/>
                </svg>`)
    })

    // funcion de guardar detalle de proceso
    $('#tbl-orden-interna-procesos').on('click', '.btn-detalle-proceso-guardar', function () {
        const id_proceso = $(this).data('proceso')
        const $row = $(this).closest('tr')
        const $inputDescripcion = $row.find('.descripcion-input')
        const $inputObservacion = $row.find('.observacion-input')
        const $inputCheckbox = $row.find('input[type="checkbox"]')

        const valueDescripcion = $inputDescripcion.val()
        const valueObservacion = $inputObservacion.val()

        $inputDescripcion.prop('readonly', true)
        $inputObservacion.prop('readonly', true)
        $inputCheckbox.prop('disabled', true)

        const findElement = buscarDetalleParte(currentParte)
        const { detalle_procesos } = findElement
        const findElementProceso = detalle_procesos.find(element => element.opp_id == id_proceso)
        findElementProceso["odp_descripcion"] = valueDescripcion
        findElementProceso["odp_observacion"] = valueObservacion
        findElementProceso["odp_ccalidad"] = $inputCheckbox.is(':checked') ? true : false

        // ACTUALIZAMOS EL ELEMENTO
        $(this).removeClass('btn-success btn-detalle-proceso-guardar')
            .addClass('btn-warning btn-detalle-proceso-editar')
            .html(`<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-pencil-fill" viewBox="0 0 16 16">
                        <path d="M12.854.146a.5.5 0 0 0-.707 0L10.5 1.793 14.207 5.5l1.647-1.646a.5.5 0 0 0 0-.708zm.646 6.061L9.793 2.5 3.293 9H3.5a.5.5 0 0 1 .5.5v.5h.5a.5.5 0 0 1 .5.5v.5h.5a.5.5 0 0 1 .5.5v.5h.5a.5.5 0 0 1 .5.5v.207zm-7.468 7.468A.5.5 0 0 1 6 13.5V13h-.5a.5.5 0 0 1-.5-.5V12h-.5a.5.5 0 0 1-.5-.5V11h-.5a.5.5 0 0 1-.5-.5V10h-.5a.5.5 0 0 1-.175-.032l-.179.178a.5.5 0 0 0-.11.168l-2 5a.5.5 0 0 0 .65.65l5-2a.5.5 0 0 0 .168-.11z"/>
                    </svg>`)
    })

    // funcion de eliminacion de detalle de proceso
    function eliminarDetalleProceso(id_proceso) {
        // const id_proceso = $(this).data('proceso')
        const $element = $(`button[data-proceso="${id_proceso}"]`)
        const $row = $element.closest('tr')

        // removemos el DOM
        $row.remove()

        // actualizamos la data
        const findElement = buscarDetalleParte(currentParte)
        const { detalle_procesos } = findElement

        const findIndexElementProceso = detalle_procesos.findIndex(element => element.opp_id == id_proceso)
        detalle_procesos.splice(findIndexElementProceso, 1)

        // debemos actualizar la cantidad de procesos
        const totalProcesos = detalle_procesos.length
        const idCantidadProceso = `#cantidad-procesos-${currentParte}`
        $(idCantidadProceso).text(totalProcesos)
    }
    // $('#tbl-orden-interna-procesos').on('click', '.btn-detalle-proceso-eliminar', function () {
    //     const id_proceso = $(this).data('proceso')
    //     const $row = $(this).closest('tr')

    //     // removemos el DOM
    //     $row.remove()

    //     // actualizamos la data
    //     const findElement = buscarDetalleParte(currentParte)
    //     const { detalle_procesos } = findElement

    //     const findIndexElementProceso = detalle_procesos.findIndex(element => element.opp_id == id_proceso)
    //     detalle_procesos.splice(findIndexElementProceso, 1)

    //     // debemos actualizar la cantidad de procesos
    //     const totalProcesos = detalle_procesos.length
    //     const idCantidadProceso = `#cantidad-procesos-${currentParte}`
    //     $(idCantidadProceso).text(totalProcesos)
    // })

    // ------------ JAVASCRIPT PARA GESTION DE PRODUCTOS -------------
    // carga de detalle de materiales en tabla
    function cargarProductosDetalle(id_parte) {
        $('#tbl-orden-interna-productos tbody').empty()
        // buscamos el detalle de la parte correspondiente
        const findElement = buscarDetalleParte(id_parte)
        const { detalle_materiales } = findElement
        detalle_materiales.forEach(element => {
            const row = `
            <tr>
                <td>${element["pro_codigo"]}</td>
                <td>
                    <input type="text" class="form-control descripcion-input" value="${element["odm_descripcion"]}" readonly/>
                </td>
                <td>
                    <input type="number" class="form-control cantidad-input" value="${element["odm_cantidad"]}" readonly/>
                </td>
                <td>
                    <input type="text" class="form-control observacion-input" value="${element["odm_observacion"]}" readonly/>
                </td>
                <td>
                    <div class="d-flex justify-content-around">
                        <button class="btn btn-sm btn-warning btn-detalle-producto-editar me-2" data-producto="${element["pro_id"]}">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-pencil-fill" viewBox="0 0 16 16">
                                <path d="M12.854.146a.5.5 0 0 0-.707 0L10.5 1.793 14.207 5.5l1.647-1.646a.5.5 0 0 0 0-.708zm.646 6.061L9.793 2.5 3.293 9H3.5a.5.5 0 0 1 .5.5v.5h.5a.5.5 0 0 1 .5.5v.5h.5a.5.5 0 0 1 .5.5v.5h.5a.5.5 0 0 1 .5.5v.207zm-7.468 7.468A.5.5 0 0 1 6 13.5V13h-.5a.5.5 0 0 1-.5-.5V12h-.5a.5.5 0 0 1-.5-.5V11h-.5a.5.5 0 0 1-.5-.5V10h-.5a.5.5 0 0 1-.175-.032l-.179.178a.5.5 0 0 0-.11.168l-2 5a.5.5 0 0 0 .65.65l5-2a.5.5 0 0 0 .168-.11z"/>
                            </svg>
                        </button>
                        <button class="btn btn-sm btn-danger btn-detalle-producto-eliminar" data-producto="${element["pro_id"]}">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-trash3-fill" viewBox="0 0 16 16">
                                <path d="M11 1.5v1h3.5a.5.5 0 0 1 0 1h-.538l-.853 10.66A2 2 0 0 1 11.115 16h-6.23a2 2 0 0 1-1.994-1.84L2.038 3.5H1.5a.5.5 0 0 1 0-1H5v-1A1.5 1.5 0 0 1 6.5 0h3A1.5 1.5 0 0 1 11 1.5m-5 0v1h4v-1a.5.5 0 0 0-.5-.5h-3a.5.5 0 0 0-.5.5M4.5 5.029l.5 8.5a.5.5 0 1 0 .998-.06l-.5-8.5a.5.5 0 1 0-.998.06m6.53-.528a.5.5 0 0 0-.528.47l-.5 8.5a.5.5 0 0 0 .998.058l.5-8.5a.5.5 0 0 0-.47-.528M8 4.5a.5.5 0 0 0-.5.5v8.5a.5.5 0 0 0 1 0V5a.5.5 0 0 0-.5-.5"/>
                            </svg>
                        </button>
                    </div>
                </td>
            </tr>`
            $('#tbl-orden-interna-productos tbody').append(row)
        })
    }

    $('#checkAsociarProducto').change(function () {
        if ($(this).is(':checked')) {
            // Si está marcado, cambia el placeholder
            $('#productosInput').attr('placeholder', 'Describa material...');
        } else {
            // Si no está marcado, vuelve al placeholder original
            $('#productosInput').attr('placeholder', 'Buscar material...');
        }
        $('#productosInput').val('')
        limpiarLista()
    });

    // funcion cargar modal de productos
    $('#tbl-orden-interna').on('click', '.btn-productos', async (event) => {
        $('#checkAsociarProducto').prop('checked', false)
        const id = $(event.currentTarget).data('bs-id')
        currentParte = id
        // abrimos el modal
        const findParte = buscarDetalleParte(id)
        $('#productosModalLabel').text(`MATERIALES - ${findParte.oip_descripcion}`)
        // cargar informacion de los detalles añadidos
        cargarProductosDetalle(id)
        // mostramos el modal
        $('#productosModal').modal('show')
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
            const { data } = await client.get(`/productosByQuery?query=${queryEncoded}`)
            // Limpiamos la lista
            limpiarLista()
            // formamos la lista
            data.forEach(material => {
                const listItem = document.createElement('li')
                listItem.className = 'list-group-item list-group-item-action'
                // listItem.textContent = `${material.pro_codigo} - ${material.pro_descripcion} - ${material.stock?.alp_stock || 0}`
                listItem.textContent = `${material.pro_codigo} - ${material.pro_descripcion} - Stock: ${material.alp_stock || '0.000000'}`
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
        const findElement = buscarDetalleParte(currentParte)
        const { detalle_materiales } = findElement
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
                odm_asociar: false
            }

            const row = `
             <tr>
                 <td>${data["pro_codigo"]}</td>
                 <td>
                     <input type="text" class="form-control descripcion-input" value="${data["odm_descripcion"]}" readonly/>
                 </td>
                 <td>
                     <input type="number" class="form-control cantidad-input" value="${data["odm_cantidad"]}" readonly/>
                 </td>
                 <td>
                     <input type="text" class="form-control observacion-input" value="${data["odm_observacion"]}" readonly/>
                 </td>
                 <td>
                     <div class="d-flex justify-content-around">
                         <button class="btn btn-sm btn-warning btn-detalle-producto-editar me-2" data-producto="${data["pro_id"]}">
                             <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-pencil-fill" viewBox="0 0 16 16">
                                 <path d="M12.854.146a.5.5 0 0 0-.707 0L10.5 1.793 14.207 5.5l1.647-1.646a.5.5 0 0 0 0-.708zm.646 6.061L9.793 2.5 3.293 9H3.5a.5.5 0 0 1 .5.5v.5h.5a.5.5 0 0 1 .5.5v.5h.5a.5.5 0 0 1 .5.5v.5h.5a.5.5 0 0 1 .5.5v.207zm-7.468 7.468A.5.5 0 0 1 6 13.5V13h-.5a.5.5 0 0 1-.5-.5V12h-.5a.5.5 0 0 1-.5-.5V11h-.5a.5.5 0 0 1-.5-.5V10h-.5a.5.5 0 0 1-.175-.032l-.179.178a.5.5 0 0 0-.11.168l-2 5a.5.5 0 0 0 .65.65l5-2a.5.5 0 0 0 .168-.11z"/>
                             </svg>
                         </button>
                         <button class="btn btn-sm btn-danger btn-detalle-producto-eliminar" data-producto="${data["pro_id"]}">
                             <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-trash3-fill" viewBox="0 0 16 16">
                                 <path d="M11 1.5v1h3.5a.5.5 0 0 1 0 1h-.538l-.853 10.66A2 2 0 0 1 11.115 16h-6.23a2 2 0 0 1-1.994-1.84L2.038 3.5H1.5a.5.5 0 0 1 0-1H5v-1A1.5 1.5 0 0 1 6.5 0h3A1.5 1.5 0 0 1 11 1.5m-5 0v1h4v-1a.5.5 0 0 0-.5-.5h-3a.5.5 0 0 0-.5.5M4.5 5.029l.5 8.5a.5.5 0 1 0 .998-.06l-.5-8.5a.5.5 0 1 0-.998.06m6.53-.528a.5.5 0 0 0-.528.47l-.5 8.5a.5.5 0 0 0 .998.058l.5-8.5a.5.5 0 0 0-.47-.528M8 4.5a.5.5 0 0 0-.5.5v8.5a.5.5 0 0 0 1 0V5a.5.5 0 0 0-.5-.5"/>
                             </svg>
                         </button>
                     </div>
                 </td>
             </tr>`

            $('#tbl-orden-interna-productos tbody').append(row)
            detalle_materiales.push(data)

            // debemos actualizar la cantidad de productos
            const totalProductos = detalle_materiales.length
            const idCantidadProducto = `#cantidad-productos-${currentParte}`
            $(idCantidadProducto).text(totalProductos)
        }
    }

    function seleccionarMaterial(material) {
        const { pro_id, pro_codigo, pro_descripcion } = material
        const findElement = buscarDetalleParte(currentParte)
        const { detalle_materiales } = findElement
        const findProducto = detalle_materiales.find(element => element.pro_id == pro_id)

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
                odm_asociar: true
            }

            const row = `
            <tr>
                <td>${data["pro_codigo"]}</td>
                <td>
                    <input type="text" class="form-control descripcion-input" value='${data["odm_descripcion"]}' readonly/>
                </td>
                <td>
                    <input type="number" class="form-control cantidad-input" value='${data["odm_cantidad"]}' readonly/>
                </td>
                <td>
                    <input type="text" class="form-control observacion-input" value='${data["odm_observacion"]}' readonly/>
                </td>
                <td>
                    <div class="d-flex justify-content-around">
                        <button class="btn btn-sm btn-warning btn-detalle-producto-editar me-2" data-producto="${data["pro_id"]}">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-pencil-fill" viewBox="0 0 16 16">
                                <path d="M12.854.146a.5.5 0 0 0-.707 0L10.5 1.793 14.207 5.5l1.647-1.646a.5.5 0 0 0 0-.708zm.646 6.061L9.793 2.5 3.293 9H3.5a.5.5 0 0 1 .5.5v.5h.5a.5.5 0 0 1 .5.5v.5h.5a.5.5 0 0 1 .5.5v.5h.5a.5.5 0 0 1 .5.5v.207zm-7.468 7.468A.5.5 0 0 1 6 13.5V13h-.5a.5.5 0 0 1-.5-.5V12h-.5a.5.5 0 0 1-.5-.5V11h-.5a.5.5 0 0 1-.5-.5V10h-.5a.5.5 0 0 1-.175-.032l-.179.178a.5.5 0 0 0-.11.168l-2 5a.5.5 0 0 0 .65.65l5-2a.5.5 0 0 0 .168-.11z"/>
                            </svg>
                        </button>
                        <button class="btn btn-sm btn-danger btn-detalle-producto-eliminar" data-producto="${data["pro_id"]}">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-trash3-fill" viewBox="0 0 16 16">
                                <path d="M11 1.5v1h3.5a.5.5 0 0 1 0 1h-.538l-.853 10.66A2 2 0 0 1 11.115 16h-6.23a2 2 0 0 1-1.994-1.84L2.038 3.5H1.5a.5.5 0 0 1 0-1H5v-1A1.5 1.5 0 0 1 6.5 0h3A1.5 1.5 0 0 1 11 1.5m-5 0v1h4v-1a.5.5 0 0 0-.5-.5h-3a.5.5 0 0 0-.5.5M4.5 5.029l.5 8.5a.5.5 0 1 0 .998-.06l-.5-8.5a.5.5 0 1 0-.998.06m6.53-.528a.5.5 0 0 0-.528.47l-.5 8.5a.5.5 0 0 0 .998.058l.5-8.5a.5.5 0 0 0-.47-.528M8 4.5a.5.5 0 0 0-.5.5v8.5a.5.5 0 0 0 1 0V5a.5.5 0 0 0-.5-.5"/>
                            </svg>
                        </button>
                    </div>
                </td>
            </tr>`

            $('#tbl-orden-interna-productos tbody').append(row)
            detalle_materiales.push(data)

            // debemos actualizar la cantidad de productos
            const totalProductos = detalle_materiales.length
            const idCantidadProducto = `#cantidad-productos-${currentParte}`
            $(idCantidadProducto).text(totalProductos)
        }
    }

    // funcion de editar detalle de productos
    $('#tbl-orden-interna-productos').on('click', '.btn-detalle-producto-editar', function () {
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

    // funcion de guardar detalle de productos
    $('#tbl-orden-interna-productos').on('click', '.btn-detalle-producto-guardar', function () {
        const id_producto = $(this).data('producto')
        const $row = $(this).closest('tr')

        const $descripcionInput = $row.find('.descripcion-input')
        const $cantidadInput = $row.find('.cantidad-input')
        const $observacionInput = $row.find('.observacion-input')

        const valueDescripcion = $descripcionInput.val()
        const valueCantidad = $cantidadInput.val()
        const valueObservacion = $observacionInput.val()

        const findElement = buscarDetalleParte(currentParte)
        const { detalle_materiales } = findElement
        const findElementProducto = detalle_materiales.find(element => element.pro_id == id_producto)
        findElementProducto["odm_descripcion"] = valueDescripcion
        findElementProducto["odm_cantidad"] = valueCantidad
        findElementProducto["odm_observacion"] = valueObservacion

        $descripcionInput.prop('readonly', true)
        $cantidadInput.prop('readonly', true)
        $observacionInput.prop('readonly', true)

        // ACTUALIZAMOS EL ELEMENTO
        $(this).removeClass('btn-warning btn-detalle-producto-guardar')
            .addClass('btn-warning btn-detalle-producto-editar')
            .html(`<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-pencil-fill" viewBox="0 0 16 16">
                        <path d="M12.854.146a.5.5 0 0 0-.707 0L10.5 1.793 14.207 5.5l1.647-1.646a.5.5 0 0 0 0-.708zm.646 6.061L9.793 2.5 3.293 9H3.5a.5.5 0 0 1 .5.5v.5h.5a.5.5 0 0 1 .5.5v.5h.5a.5.5 0 0 1 .5.5v.5h.5a.5.5 0 0 1 .5.5v.207zm-7.468 7.468A.5.5 0 0 1 6 13.5V13h-.5a.5.5 0 0 1-.5-.5V12h-.5a.5.5 0 0 1-.5-.5V11h-.5a.5.5 0 0 1-.5-.5V10h-.5a.5.5 0 0 1-.175-.032l-.179.178a.5.5 0 0 0-.11.168l-2 5a.5.5 0 0 0 .65.65l5-2a.5.5 0 0 0 .168-.11z"/>
                    </svg>`)
    })

    // funcion de eliminacion de detalle de producto
    $('#tbl-orden-interna-productos').on('click', '.btn-detalle-producto-eliminar', function () {
        const id_producto = $(this).data('producto')
        const $row = $(this).closest('tr')

        // removemos el DOM
        $row.remove()

        // actualizamos la data
        const findElement = buscarDetalleParte(currentParte)
        const { detalle_materiales } = findElement

        const findIndexElementProceso = detalle_materiales.findIndex(element => element.pro_id == id_producto)
        detalle_materiales.splice(findIndexElementProceso, 1)

        // debemos actualizar la cantidad de productos
        const totalProductos = detalle_materiales.length
        const idCantidadProducto = `#cantidad-productos-${currentParte}`
        $(idCantidadProducto).text(totalProductos)
    })

    // ---------- BOTONES DE CRUD GUARDAR ------------

    // validar información de detalle sin cantidad
    function validarInformacionDetalleMateriales() {
        const { detalle_partes } = ordenInterna

        // Acumular los errores en un solo string
        const handleError = detalle_partes.reduce((errores, { oip_descripcion, detalle_materiales }) => {
            detalle_materiales.forEach(({ odm_cantidad, odm_observacion }) => {
                if (!odm_cantidad || odm_cantidad <= 0) {
                    errores += `- La cantidad del material "${odm_observacion}" en la parte "${oip_descripcion}" debe ser un valor numérico mayor a 0.\n`
                }
            })
            return errores
        }, '')

        return handleError
    }

    // validacion informacion detalles partes
    function validarInformacionDetallePartes() {
        let validation = false
        const { detalle_partes } = ordenInterna
        detalle_partes.forEach(element => {
            if (element.detalle_materiales.length !== 0 && element.detalle_procesos.length !== 0) {
                validation = true
            }
        })
        return validation
    }

    // Funcion de reset
    function resetValues() {
        ordenInterna.detalle_partes = []
        currentParte = 0
    }

    // Funcion de crear
    $('#btn-guardar-orden-interna').on('click', async () => {
        console.log(ordenInterna.detalle_partes)
        // deshabilitamos el evento de recarga
        window.onbeforeunload = null;
        let handleError = ''
        const $oiCliente = $('#idClienteInput').val().trim()
        const $otInput = $('#otInput').val().trim()
        const $oiInput = $('#oiInput').val().trim()
        const $oiValorEquipo = $('#equipoInput').val().trim()
        const $oiCodigoArea = $('#areaSelect').val()
        const $oiFecha = $('#fechaPicker').val()
        const $oiEncargadoOrigen = $('#responsableOrigen').val()
        const $oiEncargadoMaestro = $('#responsableMaestro').val()
        const $oiEncargadoAlmacen = $('#responsableAlmacen').val()

        if (
            $oiCliente.length === 0 ||
            $otInput.length === 0 ||
            $oiInput.length === 0 ||
            $oiValorEquipo.length === 0 ||
            $oiCodigoArea.length === 0 ||
            $oiFecha.length === 0 ||
            $oiEncargadoOrigen.length === 0
        ) {
            if ($otInput.length === 0) {
                handleError += '- Se debe ingresar información de orden trabajo\n'
            }
            if ($oiInput.length === 0) {
                handleError += '- Se debe ingresar información de orden interna\n'
            }
            if ($oiCliente.length === 0) {
                handleError += '- Se debe ingresar información del cliente\n'
            }
            if ($oiCodigoArea.length === 0) {
                handleError += '- Se debe ingresar información del área\n'
            }
            if ($oiValorEquipo.length === 0) {
                handleError += '- Se debe ingresar información del equipo\n'
            }
            if ($oiFecha.length === 0) {
                handleError += '- Se debe ingresar información de la fecha\n'
            }
            if ($oiEncargadoOrigen.length === 0) {
                handleError += '- Se debe ingresar información de encargado origen\n'
            }
        }

        // manejamos el error
        if (handleError.length === 0) {
            const formatData = {
                odt_numero: $otInput,
                oic_numero: $oiInput,
                cli_id: $oiCliente,
                are_codigo: $oiCodigoArea,
                oic_fecha: transformarFecha($oiFecha),
                tra_idorigen: $oiEncargadoOrigen,
                tra_idmaestro: $oiEncargadoMaestro || null,
                tra_idalmacen: $oiEncargadoAlmacen || null,
                oic_equipo_descripcion: $oiValorEquipo,
                detalle_partes: ordenInterna.detalle_partes,
            }

            console.log(formatData)

            // // formateamos la data de numero de orden
            formatData.detalle_partes.forEach(element => {
                element.detalle_materiales.forEach((detalle, index) => {
                    detalle["odm_item"] = index + 1
                })
            })

            // VALIDAMOS SI LOS DETALLES DE LAS PARTES NO ESTAN VACIOS
            const validacionDetallePartes = validarInformacionDetallePartes()
            if (validacionDetallePartes) {
                // VALIDAMOS QUE LAS CANTIDADES DE LOS DETALLES DE MATERIALES NO ESTEN VACIOS
                const validacionDetalleMateriales = validarInformacionDetalleMateriales()
                if (validacionDetalleMateriales.length === 0) {
                    showLoaderModal()
                    try {
                        const { data } = await client.post('/ordenesinternas', formatData)
                        // si se desea imprimir
                        if (confirm('¿Deseas imprimir la orden interna?')) {
                            try {
                                const response = await client.get(`/generarReporteOrdenTrabajo?oic_id=${data.oic_id}`, {
                                    headers: {
                                        'Accept': 'application/pdf'
                                    },
                                    responseType: 'blob'
                                })

                                const url = window.URL.createObjectURL(new Blob([response.data]))
                                const a = document.createElement('a')
                                a.href = url
                                a.download = `reporte_orden_trabajo_${data.oic_id}.pdf`
                                document.body.appendChild(a)
                                a.click()
                                window.URL.revokeObjectURL(url)
                                document.body.removeChild(a)
                            } catch (error) {
                                alert('Error al generar el reporte')
                            }
                        }

                        //verificamos si quiere seguir editando la orden interna
                        if (confirm('¿Deseas seguir editando la orden interna?')) {
                            window.location.href = `orden-interna/editar/${data.oic_id}`
                        } else {
                            window.location.href = 'orden-interna'
                        }
                    } catch (error) {
                        const { response } = error
                        if (response.status === 500) {
                            alert(response.data.error)
                        } else {
                            alert('Hubo un error en la creacion de orden interna')
                        }
                    } finally {
                        hideLoaderModal()
                    }
                } else {
                    alert(validacionDetalleMateriales)
                }
            } else {
                alert('- Al menos una parte debe tener procesos y materiales')
            }
        } else {
            alert(handleError)
        }
    })

    // previsualizar orden interna
    $("#btn-previsualizar-orden-interna").on('click', async function () {
        const $oiCliente = $('#clienteInput').val().trim()
        const $otInput = $('#otInput').val().trim()
        const $oiInput = $('#oiInput').val().trim()
        const $oiValorEquipo = $('#equipoInput').val().trim()
        const $oiCodigoArea = $('#areaSelect option:selected').text()
        const $oiFecha = $('#fechaPicker').val()
        const $oiEncargadoOrigen = $('#responsableOrigen option:selected').text()
        const $oiEncargadoMaestro = $('#responsableMaestro option:selected').text()
        const $oiEncargadoAlmacen = $('#responsableAlmacen option:selected').text()

        const formatData = {
            odt_numero: $otInput,
            oic_numero: $oiInput,
            cli_id: $oiCliente,
            are_codigo: $oiCodigoArea,
            oic_fecha: $oiFecha,
            tra_idorigen: $oiEncargadoOrigen,
            tra_idmaestro: $oiEncargadoMaestro,
            tra_idalmacen: $oiEncargadoAlmacen,
            oic_equipo_descripcion: $oiValorEquipo,
            detalle_partes: ordenInterna.detalle_partes,
        }

        // // formateamos la data de numero de orden
        formatData.detalle_partes.forEach(element => {
            element.detalle_materiales.forEach((detalle, index) => {
                detalle["odm_item"] = index + 1
            })
        })

        showLoaderModal()
        try {
            const response = await client.post(`/previsualizarReporteOrdenTrabajo`, formatData, {
                headers: {
                    'Accept': 'application/pdf'
                },
                responseType: 'blob'
            })

            const url = window.URL.createObjectURL(new Blob([response.data]))
            const a = document.createElement('a')
            a.href = url
            a.download = `previsualizacion_orden_trabajo.pdf`
            document.body.appendChild(a)
            a.click()
            window.URL.revokeObjectURL(url)
            document.body.removeChild(a)
        } catch (error) {
            console.log(error)
            alert('Error al generar el reporte')
        } finally {
            hideLoaderModal()
        }
    })

    // Funcion de cancelar
    $('#btn-cancelar-orden-interna').on('click', function () {
        resetValues()
        window.location.href = 'orden-interna'
    })

    // -------- MANEJADORES DE DIALOG ---------------

    // Antes de que el modal se cierre
    $('#procesosModal').on('hide.bs.modal', function (e) {
        const $elemento = $('.btn-detalle-proceso-guardar').first()
        const $elementEdicion = $('.btn-detalle-proceso-editar').first()
        if ($elemento.length > 0) {
            if (!confirm("Aún tienes elementos sin guardar ¿Seguro que quieres cerrar el modal?")) {
                e.preventDefault()
            } else {

            }
        }
    })

    $('#productosModal').on('hide.bs.modal', function (e) {
        const $elemento = $('.btn-detalle-producto-guardar').first()
        if ($elemento.length > 0) {
            if (!confirm("Aún tienes elementos sin guardar ¿Seguro que quieres cerrar el modal?")) {
                e.preventDefault()
            }
        }
    })

})
