//Funcion para la autenticacion del usuario
$(document).ready(function() {
    $('#loginForm').on('submit', function(event) {
        event.preventDefault();

        var usu_codigo = $('#usu_codigo').val();
        var usu_contrasena = $('#usu_contrasena').val();
        //Login a traves de php
        $.ajax({
            url: '../php/vistas/login.php', 
            type: 'POST',
            contentType: 'application/json',
            data: JSON.stringify({
                usu_codigo: usu_codigo,
                usu_contrasena: usu_contrasena
            }),
            success: function(response) {
                var jsonData = JSON.parse(response);
                if (jsonData.varRespuesta.includes('Bienvenido,')) {
                    window.location.href = '../index.html';
                } else {
                    $('#response').html(jsonData.varRespuesta);
                    $('#errorAlert').show();
                    $('#successAlert').hide();
                }
            },
            error: function() {
                $('#response').html('Error en la solicitud.');
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