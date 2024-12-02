
$(document).ready(function () {
    let oic_fechaaprobacion = ""
    let oic_fechaentregaestimada = ""
    let oic_fechaevaluacion = ""

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

    // -------- MANEJO DE FECHA ----------
    $("#fechaPicker").datepicker({
        dateFormat: 'dd/mm/yy',
        setDate: new Date()
    }).datepicker("setDate", new Date())

    // ver evento de cambio de area
    $('#areaSelect').on('change', async function () {
        const are_codigo = $(this).val()
        try {
            const {data} = await client.get(`/partesSimple?are_codigo=${are_codigo}`)
            cargarTablaOrdenInterna(data)
        } catch(error) {
            console.log(error)
        }
    })

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
            if (estadoOrdenTrabajo !== 'INGRESO') {
                if (!confirm('La orden de trabajo no tiene un estado "INGRESO". ¿Desea jalar los datos?')) {
                    return
                }
            }
            $('#clienteInput').val(data.cli_nombre || '')
            $('#idClienteInput').val(data.cli_nrodocumento || '')
            $('#equipoInput').val(data.odt_equipo)
            $('#componenteInput').val(data.odt_componente)

            // asignamos las fechas de Andromeda
            oic_fechaaprobacion = data.odt_fechaaprobacion
            oic_fechaentregaestimada = data.odt_fechaentregaestimada
            oic_fechaevaluacion = data.odt_fechaevaluacion
        } catch (error) {
            console.log(error)
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
                        odp_observacion: proceso.odp_observacion || '',
                        odp_ccalidad: false,
                        odp_editable_descripcion: false
                    })
                })

                // parseamos los materiales
                parte.materiales.forEach(material => {
                    parteDetalle.detalle_materiales.push({
                        // pro_id: material.producto === null ? obtenerIdUnico(): material.producto.pro_id,
                        pro_id: material.producto === null ? obtenerIdUnico() : material.producto.pro_codigo,
                        pro_codigo: material.producto === null ? '' : material.producto.pro_codigo,
                        odm_descripcion: material.odm_descripcion || '',
                        odm_cantidad: material.odm_cantidad || 1,
                        odm_observacion: material.odm_observacion || '',
                        odm_tipo: 1,
                        odm_asociar: material.producto === null ? false : true
                    })
                })

                // agregamos al detalle
                formatData.push(parteDetalle)
            })

            // actualizamos la informacion de procesos
            ordenInterna["detalle_partes"] = formatData
            // mostramos toast de exito al copiar la informacion
            toastr.options = {
                "closeButton": false,
                "debug": false,
                "newestOnTop": false,
                "progressBar": false,
                "positionClass": "toast-top-center",
                "preventDuplicates": false,
                "onclick": null,
                "showDuration": "300",
                "hideDuration": "1000",
                "timeOut": "5000",
                "extendedTimeOut": "1000",
                "showEasing": "swing",
                "hideEasing": "linear",
                "showMethod": "fadeIn",
                "hideMethod": "fadeOut"
            }
            toastr["success"]("Se copió la información de la orden interna", "Éxito en la operación")
        } catch (error) {
            const { response } = error
            if (response.status === 404) {
                alert(response.data.error)
            } else {
                alert('Error al buscar la orden interna')
            }
        }
    }

    // Maneja el evento de clic en el botón de busqueda
    $('#copyButton').on('click', async () => {
        const ingresoOT = $('#idClienteInput').val().trim()
        if (ingresoOT.length === 0) {
            alert('Asegurate de primero haber ingresado una orden de trabajo.')
            return
        }
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
    const cargarAreas = (data) => {
        const $areaSelect = $('#areaSelect')

        data.sort((a, b) => a["are_descripcion"].localeCompare(b["are_descripcion"]))

        data.forEach(area => {
            const option = $('<option>').val(area["are_codigo"]).text(area["are_descripcion"])
            $areaSelect.append(option)
        })
    }

    // cargamos responsables
    const cargarResponsables = (data) => {
        const $responsableOrigen = $('#responsableOrigen')
        const $responsableMaestro = $('#responsableMaestro')
        const $responsableAlmacen = $('#responsableAlmacen')

        data.sort((a, b) => a.tra_nombre.localeCompare(b.tra_nombre))

        data.forEach(responsable => {
            const option = $('<option>').val(responsable.tra_id).text(responsable.tra_nombre)
            $responsableOrigen.append(option.clone())
            $responsableMaestro.append(option.clone())
            $responsableAlmacen.append(option.clone())
        })
    }

    // cargar informacion segun usuario
    const cargarInformacionUsuario = (data) => {
        if(data){
            $('#areaSelect').val(data.are_codigo)
            $('#otInput').val(data.sed_codigo)
            $('#responsableOrigen').val(data.tra_id)
        } else {
            alert('El usuario logeado no esta relacionado con ningun trabajador')
        }
    }

    // --------- CARGA INICIAL DE DATA DE PARTES ----------
    const cargarTablaOrdenInterna = (data) => {
        // reseteamos el detalle de partes
        ordenInterna["detalle_partes"] = []
        const dataOrdenada = data.sort((a, b) => a.oip_orden - b.oip_orden)
        dataOrdenada.forEach(function (item, index) {
            const { oip_id, oip_descripcion } = item
            const data = {
                oip_id: oip_id,
                oip_descripcion: oip_descripcion,
                detalle_materiales: [],
                detalle_procesos: []
            }
            ordenInterna["detalle_partes"].push(data)
        })
    }

    // traemos la informacion necesaria para crear la orden interna
    const traerInformacionCreacionOrdenInterna = async () => {
        const usu_codigo = decodeJWT(localStorage.getItem('authToken')).usu_codigo
        try {
            showLoaderModal()
            const { data } = await client.get(`/informacion-creacion-orden-interna?usu_codigo=${usu_codigo}`)
            console.log(data)
            const { trabajador, responsables, areas, partes } = data
            // cargamos las areas
            cargarAreas(areas)
            // cargar responsables
            cargarResponsables(responsables)
            // cargar partes
            cargarTablaOrdenInterna(partes)
            // cargar informacion segun el trabajador usuario
            cargarInformacionUsuario(trabajador)
        } catch (error) {
            console.log(error)
            alert('Ocurrio un error al intentar obtener la información para la creación de la orden interna')
        } finally {
            hideLoaderModal()
        }
    }

    // inicializamos la data
    traerInformacionCreacionOrdenInterna()

    // Funcion de crear
    $('#btn-guardar-orden-interna').on('click', async () => {
        let handleError = ''
        const $oiCliente = $('#idClienteInput').val().trim()
        const $otInput = $('#otInput').val().trim()
        const $oiValorEquipo = $('#equipoInput').val().trim()
        const $oiValorComponente = $('#componenteInput').val().trim();
        const $oiCodigoArea = $('#areaSelect').val()
        const $oiFecha = $('#fechaPicker').val()
        const $oiEncargadoOrigen = $('#responsableOrigen').val()
        const $oiEncargadoMaestro = $('#responsableMaestro').val()
        const $oiEncargadoAlmacen = $('#responsableAlmacen').val()

        if (
            $oiCliente.length === 0 ||
            $otInput.length < 7 ||
            $oiValorEquipo.length === 0 ||
            $oiCodigoArea.length === 0 ||
            $oiFecha.length === 0 ||
            $oiEncargadoOrigen.length === 0
        ) {
            if ($otInput.length < 7) {
                handleError += '- Se debe ingresar información de orden trabajo con minimo 7 caracteres\n'
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
            if (ordenInterna["detalle_partes"].length === 0) {
                handleError += '- No hay detalle de partes. Esta área no tiene información de partes\n'
            }
        }

        if (handleError.length !== 0) {
            alert(handleError)
            return
        }

        // generamos el format de la data
        const formatData = {
            odt_numero: $otInput,
            cli_id: $oiCliente,
            are_codigo: $oiCodigoArea,
            oic_fecha: transformarFecha($oiFecha),
            tra_idorigen: $oiEncargadoOrigen,
            tra_idmaestro: $oiEncargadoMaestro || null,
            tra_idalmacen: $oiEncargadoAlmacen || null,
            oic_equipo_descripcion: $oiValorEquipo,
            oic_componente: $oiValorComponente,
            oic_fechaaprobacion: oic_fechaaprobacion || null,
            oic_fechaentregaestimada: oic_fechaentregaestimada || null,
            oic_fechaevaluacion: oic_fechaevaluacion || null,
            detalle_partes: ordenInterna.detalle_partes,
        }

        // // formateamos la data de numero de orden
        formatData.detalle_partes.forEach(element => {
            element.detalle_materiales.forEach((detalle, index) => {
                detalle["odm_item"] = index + 1
            })
        })

        try {
            showLoaderModal()
            const { data } = await client.post('/ordenesinternas', formatData)
            //verificamos si quiere seguir editando la orden interna
            window.location.href = `orden-interna/editar/${data.oic_id}`
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
    })

    // previsualizar orden interna
    $("#btn-previsualizar-orden-interna").on('click', async function () {
        const $oiCliente = $('#clienteInput').val().trim()
        const $otInput = $('#otInput').val().trim()
        const $oiValorEquipo = $('#equipoInput').val().trim()
        const $oiValorComponente = $('#componenteInput').val().trim()
        const $oiCodigoArea = $('#areaSelect option:selected').text()
        const $oiFecha = $('#fechaPicker').val()
        const $oiEncargadoOrigen = $('#responsableOrigen option:selected').text()
        const $oiEncargadoMaestro = $('#responsableMaestro option:selected').text()
        const $oiEncargadoAlmacen = $('#responsableAlmacen option:selected').text()

        const formatData = {
            odt_numero: $otInput,
            cli_id: $oiCliente,
            are_codigo: $oiCodigoArea,
            oic_fecha: $oiFecha,
            tra_idorigen: $oiEncargadoOrigen,
            tra_idmaestro: $oiEncargadoMaestro,
            tra_idalmacen: $oiEncargadoAlmacen,
            oic_equipo_descripcion: $oiValorEquipo,
            oic_componente: $oiValorComponente,
            detalle_partes: ordenInterna.detalle_partes,
        }

        if (ordenInterna["detalle_partes"].length === 0) {
            alert('No hay detalle de partes. Esta área no tiene información de partes\n')
            return
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
            const pdfBlob = new Blob([response.data], { type: 'application/pdf' });
            const pdfUrl = URL.createObjectURL(pdfBlob);
            showModalPreview(pdfUrl)
        } catch (error) {
            console.log(error)
            alert('Error al generar el reporte')
        } finally {
            hideLoaderModal()
        }
    })

    function showModalPreview(pdfUrl) {
        document.getElementById('pdf-frame').src = pdfUrl;
        const modal = new bootstrap.Modal(document.getElementById("previewPDFModal"));
        modal.show();
    }

    // Funcion de cancelar
    $('#btn-cancelar-orden-interna').on('click', function () {
        window.location.href = 'orden-interna'
    })
})
