$(document).ready(() => {
    let dataTable

    const dataTableOptions = {
        dom: '<"top d-flex justify-content-between align-items-center"<"info"i><"search"f><"pagination"p>>rt',
        destroy: true,
        responsive: true,
        paging: true,
        pageLength: 50,
        lengthMenu: [50, 100, 250, 500],
        searching: true,
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
            style: 'single',
            selector: 'td.form-check-input'
        },
    }

    function initData() {
        const formatData = [
            {
                fecha_compra: '2023-01-01',
                numero_orden_compra: '000000001',
                documento_proveedor: '123456789',
                razon_social_proveedor: 'Proveedor A',
                moneda: 'SOL',
                subtotal: 1000,
                iva: 180,
                total: 1180,
            },
            {
                fecha_compra: '2023-01-01',
                numero_orden_compra: '000000002',
                documento_proveedor: '233456789',
                razon_social_proveedor: 'Proveedor B',
                moneda: 'SOL',
                subtotal: 1000,
                iva: 180,
                total: 1180,
            },
            {
                fecha_compra: '2023-01-01',
                numero_orden_compra: '000000003',
                documento_proveedor: '123455589',
                razon_social_proveedor: 'Proveedor C',
                moneda: 'SOL',
                subtotal: 1000,
                iva: 180,
                total: 1180,
            }
        ]

        let content = ''

        formatData.forEach(data => {
            content += `
                <tr>
                    <td></td>
                    <td></td>
                    <td>${data.fecha_compra}</td>
                    <td>${data.numero_orden_compra}</td>
                    <td>${data.documento_proveedor}</td>
                    <td>${data.razon_social_proveedor}</td>
                    <td class="text-center">S/. ${data.moneda}</td>
                    <td class="text-center">S/. ${data.subtotal}</td>
                    <td class="text-center">S/. ${data.iva}</td>
                    <td class="text-center">S/. ${data.total}</td>
                    <td>
                        <div class="d-flex justify-content-center">
                            <button class="btn btn-sm btn-primary btn-crear-orden-compra">
                                5 items por ingresar
                            </button>
                        </div>
                    </td>
                </tr>
            `
        })

        // AÑADIMOS EL CONTENIDO
        $('#data-container-body').html(content)
        // INICIALIZAMOS EL DATATABLE
        dataTable = $('#data-container').DataTable(dataTableOptions)
    }

    initData()
})