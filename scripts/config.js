const FLAG_LOCAL = window.location.hostname === "localhost"
const API_LOCAL_FRONT = "http://localhost/logistica"
const API_PUBLIC_FRONT = "http://logistica.famaisealjet.com:8080/logistica"
const API_LOCAL_BACK = "http://localhost:8080/api"
const API_PUBLIC_BACK = "http://logistica.famaisealjet.com:8083/api"
const API_STORAGE_LOCAL = "http://localhost:8080/storage/"
const API_STORAGE_PUBLIC = "http://logistica.famaisealjet.com:8083/storage/"

const config = {
    XAMPP_CARPET: 'logistica',
    BACK_URL: FLAG_LOCAL ? API_LOCAL_BACK : API_PUBLIC_BACK,
    BACK_STORAGE_URL: FLAG_LOCAL ? API_STORAGE_LOCAL : API_STORAGE_PUBLIC,
    FRONT_URL: FLAG_LOCAL ? API_LOCAL_FRONT : API_PUBLIC_FRONT,
    BACK_EXTRANET_URL: API_PUBLIC_BACK,
    FRONT_EXTRANET_URL: API_PUBLIC_FRONT
}