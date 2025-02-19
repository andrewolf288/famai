$(document).ready(() => {

    let dataTable
    const dataContainer = $("#data-container")

    // Opciones de DataTable
    const dataTableOptions = {
        dom: '<"top d-flex justify-content-between align-items-center"<"info"i><"search"f><"pagination"p>>rt',
        destroy: true,
        responsive: true,
        paging: true,
        pageLength: 50,
        lengthMenu: [50, 100, 250, 500],
        searching: false,
        info: true,
        language: {
            lengthMenu: "Mostrar _MENU_ registros por página",
            info: "Mostrando _START_ a _END_ de _TOTAL_ registros",
            infoEmpty: "Mostrando 0 a 0 de 0 registros",
            infoFiltered: "(filtrado de _MAX_ registros totales)",
            search: "Buscar:",
            zeroRecords: "No se encontraron resultados",
            select: {
                rows: {
                    _: " - %d filas seleccionadas",
                    0: " - Ninguna fila seleccionada",
                    1: " - 1 fila seleccionada"
                }
            },
        },
        columnDefs: [
            {
                targets: 0,
                orderable: false,
            },
            {
                orderable: false,
                render: DataTable.render.select(),
                targets: 1,
                className: 'form-check-input'
            },
        ],
        select: {
            style: 'multi',
            selector: 'td.form-check-input'
        },
    }

    function initDataTable() {
        if($.fn.DataTable.isDataTable(dataContainer)) {
            dataContainer.DataTable().destroy();
        }

        dataTable = dataContainer.DataTable(dataTableOptions)
    }

    initDataTable()

    $("#data-container-body").on('click', '.stock-total', async function () {
        abrirModalInformacionStock()
    })

    $("#btn-reservar-materiales").on('click', function () {
        abrirModalReservacion()
    })

    // funciones especiales
    function abrirModalInformacionStock() {
        const modal = new bootstrap.Modal(document.getElementById('informacionStockModal'))
        modal.show()
    }

    function abrirModalReservacion() {
        const modal = new bootstrap.Modal(document.getElementById('reservarStockModal'))
        modal.show()
    }
})