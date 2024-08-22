$(document).ready(function() {
    //Muestra los campos para introducir la contraseña
    $('.btn-cambiar-contrasena').on('click', function(e) {
        e.preventDefault();
        $('#password-fields').removeClass('d-none');
        $(this).addClass('d-none');
    });
    //Oculta los campos de cambio de contraseña
    $('#cancel-password').on('click', function(e) {
        e.preventDefault();
        $('#password-fields').addClass('d-none');
        $('.btn-cambiar-contrasena').removeClass('d-none');
        $('#current-password').val('');
        $('#new-password').val('');
    });
    //Para el cambio de contraseña
    $('#save-password').on('click', function(e) {
        e.preventDefault();
        var currentPassword = $('#current-password').val();
        var newPassword = $('#new-password').val();
        if (currentPassword && newPassword) {
            $.ajax({
                url: './php/vistas/modificarUsuario.php',
                type: 'POST',
                contentType: 'application/json',
                data: JSON.stringify({
                    usu_contrasena_old: currentPassword,
                    usu_contrasena: newPassword
                }),
                //Mensajes de exito o falla
                success: function(response) {
                    try {
                        var jsonData = response;
                        if (jsonData.varRespuesta === 'La contrasena de su usuario fue actualizado exitosamente.') {
                            $('#successAlert').text(jsonData.varRespuesta).removeClass('d-none');
                            $('#errorAlert').addClass('d-none');
                            $('#password-fields').addClass('d-none');
                            $('.btn-cambiar-contrasena').removeClass('d-none');
                            $('#current-password').val('');
                            $('#new-password').val('');
                        } else {
                            $('#errorAlert').text(jsonData.varRespuesta).removeClass('d-none');
                            $('#successAlert').addClass('d-none');
                        }
                    } catch (e) {
                        $('#errorAlert').text('Respuesta no válida del servidor.').removeClass('d-none');
                        $('#successAlert').addClass('d-none');
                        console.error("Error parsing JSON response:", e);
                    }
                },
                error: function() {
                    $('#errorAlert').text('Error en la solicitud.').removeClass('d-none');
                    $('#successAlert').addClass('d-none');
                }
            });
        } else {
            $('#errorAlert').text('Por favor, complete ambos campos de contraseña.').removeClass('d-none');
            $('#successAlert').addClass('d-none');
        }
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
