$(document).ready(async () => {
    let dataTable
    let dataTableIsInitialized = false

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

    const initDataTable = async () => {
        if (dataTableIsInitialized) {
            dataTable.destroy()
        }

        await cargarTrabajadores()
        dataTable = $('#datatable_trabajadores').DataTable(dataTableOptions)
        dataTableIsInitialized = true
    }

    const cargarTrabajadores = async () => {
        // let timeoutId
        try {
            // timeoutId = setTimeout(showLoaderModal, 300)
            const response = await fetch('./php/vistas/leertrabajadoresadvanced.php', {
                method: 'POST'
            })
            const { data: trabajadores } = await response.json()
            let content = ''
            trabajadores.forEach((trabajador, index) => {
                content += `
            <tr>
                <td>${trabajador.tra_codigosap === null ? 'Sin código' : trabajador.tra_codigosap}</td>
                <td>${trabajador.tra_nombre}</td>
                <td>${trabajador.tra_activo == 1 ? '<span class="badge bg-success">Activo</span>' : '<span class="badge bg-danger">Inactivo</span>'}</td>
                <td>${trabajador.tra_usucreacion === null ? 'No aplica' : trabajador.tra_usucreacion}</td>
                <td>${trabajador.tra_feccreacion === null ? 'No aplica' : parseDate(trabajador.tra_feccreacion)}</td>
                <td>${trabajador.tra_usumodificacion === null ? 'No aplica' : trabajador.tra_usumodificacion}</td>
                <td>${trabajador.tra_fecmodificacion === null ? 'No aplica' : parseDate(trabajador.tra_fecmodificacion)}</td>
            </tr>`
            })
            $("#tableBody_trabajadores").html(content)
        } catch (error) {
            alert(error)
        } finally {
            // clearTimeout(timeoutId)
            // hideLoaderModal()
        }
    }

    // LOADERS
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
        } else {
            console.log("El modal ya no existe")
        }
    }

    // UTILS FUNCTIONS
    function parseDate(dateString) {
        const date = new Date(dateString)
        const day = String(date.getDate()).padStart(2, '0')
        const month = String(date.getMonth() + 1).padStart(2, '0') // Los meses en JavaScript son 0-11
        const year = date.getFullYear()
        const formattedDate = `${day}/${month}/${year}`
        return formattedDate
    }

    showLoaderModal()
    await initDataTable()
    hideLoaderModal()
})