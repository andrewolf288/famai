function initPagination(URL, initDataTable, dataTableOptions = {}) {
    const dataContainer = $('#data-container')
    const dataContainerBody = $('#data-container-body')

    $('#pagination-container').pagination({
        dataSource: URL,
        locator: 'data',
        totalNumberLocator: function (response) {
            return response.count
        },
        pageSize: 10,
        showPageNumbers: true,
        showPrevious: true,
        showNext: true,
        showNavigator: true,
        showFirstOnEllipsisShow: true,
        showLastOnEllipsisShow: true,
        showSizeChanger: true,
        ajax: {
            beforeSend: function () {
                dataContainerBody.html(`
                    <tr>
                        <td colspan="100%">
                            <div class="d-flex justify-content-center align-items-center" style="height: 200px;">
                                <div class="text-center">
                                    <div class="spinner-border text-primary" role="status">
                                        <span class="visually-hidden">Loading...</span>
                                    </div>
                                    <div class="mt-2">Cargando...</div>
                                </div>
                            </div>
                        </td>
                    </tr>
                `);
            }
        },
        ajaxFunction: function (setting) {
            // Primero ejecutamos el beforeSend
            if (setting.beforeSend) {
                setting.beforeSend()
            }
            // Obtenemos los datos de paginacion
            const { pageNumber, pageSize } = setting.data
            // Realizamos la consulta usando nuestra configuracion de axios
            client.get(URL, {
                params: {
                    page: pageNumber,
                    page_size: pageSize
                }
            }).then(response => {
                setting.success(response.data)
            })
        },
        callback: function (data) {
            if ($.fn.DataTable.isDataTable(dataContainer)) {
                dataContainer.DataTable().destroy();
            }
            initDataTable(data);
            dataContainer.DataTable(dataTableOptions);
        },
    });
}