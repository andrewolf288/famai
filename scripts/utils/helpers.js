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

function esValorNumericoValidoMayorIgualQueCero(inputElement) {
    const numero = parseFloat(inputElement);
    return !isNaN(numero) && numero >= 0;
}

function esFechaValida(fecha) {
    const regex = /^\d{4}-\d{2}-\d{2}$/;
    return regex.test(fecha);
}

function obtenerValorNumerico(inputElement) {
    const numero = parseFloat(inputElement);
    return !isNaN(numero) && numero > 0 ? numero : 0;
}

function obtenerIdUnico() {
    return Date.now().toString(36) + Math.random().toString(36).slice(2, 11)
}

function decodeJWT(token) {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(window.atob(base64).split('').map(function (c) {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));
    return JSON.parse(jsonPayload);
}

function debounce(func) {
    let timeout;
    return function (...args) {
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(this, args), 300);
    };
}

function parserAlert(error, simbolo = '\n') {
    const lineasError = error.split(simbolo)
    const listaErroresHTML = `
        <ul>
            ${lineasError.map(linea => linea.trim() !== '' ? `<li>${linea}</li>` : '').join('')}
        </ul>
    `;
    return listaErroresHTML
}

function escapeHTML(text) {
    if (!text) return "";
    return text
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");
}

function compareStringsIgnoreCaseAndAccents(str1, str2) {
    const normalize = (str) => 
        str
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase();

    return normalize(str1) === normalize(str2);
}

function unionObservaciones(detalleMateriales) {
    let observacion = ""
    detalleMateriales.forEach(detalle => {
        const detalleObservacion = detalle.odm_observacion
        if(detalleObservacion){
            const obs = detalleObservacion.trim().replace(/[\r\n]+/g, " ")
            if(obs.length > 0){
                observacion += "CANT: " + detalle.odm_cantidad + " - " + obs + "\n"
            }
        }
    })

    return observacion.trimEnd()
}

// funcion para comprobar si un datatable esta inicializado, si es asi lo destruye
function detroyDataTable(dataContainer) {
    if ($.fn.DataTable.isDataTable(dataContainer)) {
        dataContainer.DataTable().destroy();
    }
}

// funcion para obtener la observación parser
function parserObservacion(observacion, texto) {
    return `${texto} - ${observacion.split(" - ")[1] || observacion}`
}