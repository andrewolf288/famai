$(document).ready(() => {
    console.log("Entro aqui el script")

    $(".btn-detalle").on('click', async function () {
        const modal = new bootstrap.Modal(document.getElementById('detalleModal'))
        modal.show()
    })

    $(".btn-crear-orden-compra").on('click', async function () {
        const modal = new bootstrap.Modal(document.getElementById('crearOrdenCompraModal'))
        modal.show()
    })
})