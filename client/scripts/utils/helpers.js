function testConsole() {
    console.log("Estamos probando cositas...")
}

function parseDate(dateString) {
    const date = new Date(dateString)
    const day = String(date.getDate()).padStart(2, '0')
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const year = date.getFullYear()
    const hour = String(date.getHours()).padStart(2, '0')
    const minute = String(date.getMinutes()).padStart(2, '0')
    const second = String(date.getSeconds()).padStart(2, '0')
    const formattedDate = `${day}/${month}/${year} ${hour}:${minute}:${second}`
    return formattedDate
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