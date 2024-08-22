//Carga informacion del usuario logueado
$(document).ready(function() {
    $.ajax({
        url: './php/vistas/getUsuarioSesion.php',
        method: 'GET',
        dataType: 'json',
        success: function(response) {
            if (response.username) {
                $('#sesion-usuario').text(response.username);
                $('#sesion-nombre').text(response.names);
            } else {
                console.log(response);
                //window.location.href = './pages/login/login.html';
            }
        },
        error: function(xhr, status, error) {
            console.error(error);
            //window.location.href = './pages/login/login.html';
        }
    });
});