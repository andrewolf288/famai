const BASE_URL = config.BACK_URL

// funcion para obtener token de acceso
function getCurrentAccessToken(){
    return localStorage.getItem('authToken')
}

function logoutUnauthorized(){
    localStorage.removeItem('authToken')
    localStorage.removeItem('modulos')
    window.location.href = '/logistica/login.html'
}

const options = {
    baseURL: BASE_URL,
    timeout: 300000
}

const client = axios.create(options)
client.interceptors.request.use(
    (config) => {
        if(config.authorization !== false){
            const token = getCurrentAccessToken()
            if(token){
                config.headers.Authorization = 'Bearer ' + token
            }
        }
        return config
    },
    (error) => {
        return Promise.reject(error)
      }
)

client.interceptors.response.use(
    response => {
        return response
    },
    error => {
        if (error.response && error.response.status === 401) {
            // Si el error es un 401 Unauthorized, ejecutar la función de logout
            logoutUnauthorized()
        }
        // Rechazar el error para que se maneje en el componente o llamador
        return Promise.reject(error)
    }
)