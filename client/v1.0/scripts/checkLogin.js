//Verifica si esta logueado, sino redirige al login
function checkLoginStatus() {
    fetch('./php/vistas/check_login_status.php')
        .then(response => response.json())
        .then(data => {
            if (!data.loggedin) {
                window.location.href = './paginas/login.html';
            }
        });
}

window.onload = checkLoginStatus;