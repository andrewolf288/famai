function testConsole() {
    console.log("Estamos probando cositas...")
}

function parseDate(dateString) {
    return moment(dateString).format('DD/MM/YYYY HH:mm:ss');
}

function parseDateSimple(dateString) {
    return moment(dateString).format('DD/MM/YYYY');
}

function transformarFecha(fecha) {
    const [dia, mes, año] = fecha.split('/');
    return `${año}-${mes}-${dia}`;
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
    } else {
        console.log("El modal ya no existe")
    }
}

function formatErrorsFromString(errorString) {
    const errors = JSON.parse(errorString);
    let errorMessage = '';

    for (const [field, messages] of Object.entries(errors)) {
        errorMessage += messages.join('\n') + '\n';
    }

    return errorMessage.trim();
}

function esValorNumericoValidoYMayorQueCero(inputElement) {
    const numero = parseFloat(inputElement);
    return !isNaN(numero) && numero > 0;
}

function obtenerIdUnico() {
    return Date.now().toString(36) + Math.random().toString(36).slice(2, 11)
}