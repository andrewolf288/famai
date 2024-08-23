$(document).ready(function() {
    //Crear usuario
    $('#crearUsuarioForm').on('submit', function(event) {
        event.preventDefault();

        var usu_codigo = $('#usu_codigo').val();
        var usu_nombre = $('#usu_nombre').val();
        var usu_contrasena = $('#usu_contrasena').val();

        $.ajax({
            url: './php/vistas/crearUsuario.php',
            type: 'POST',
            contentType: 'application/json',
            data: JSON.stringify({
                usu_codigo: usu_codigo,
                usu_nombre: usu_nombre,
                usu_contrasena: usu_contrasena
            }),
            success: function(response) {
                var jsonData = JSON.parse(response);
                $('#response').html(jsonData.varRespuesta);
                window.location.reload();
            },
            error: function() {
                $('#response').html('<p>Error en la solicitud.</p>');
            }
        });
    });
    //Funcion para mostrar / ocultar la contrasena
    $('.toggle-password').on('click', function() {
        const passwordField = $(this).siblings('input');
        const passwordFieldType = passwordField.attr('type') === 'password' ? 'text' : 'password';
        passwordField.attr('type', passwordFieldType);
        
        const icon = $(this).find('i');
        if (passwordFieldType === 'text') {
            icon.removeClass('fa-eye').addClass('fa-eye-slash');
        } else {
            icon.removeClass('fa-eye-slash').addClass('fa-eye');
        }
    });
});