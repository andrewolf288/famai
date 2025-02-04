$(document).ready(() => {
    $("#btn-crear-nota-ingreso").on('click', () => {
        const modal = new bootstrap.Modal(document.getElementById('crearNotaIngresoModal'))
        modal.show()
    })

    $("#agregarItemButton").on('click', function () {
        const modal = new bootstrap.Modal(document.getElementById('addProductModal'))
        modal.show()
    })

})
