//Eliminar usuario
$(document).ready(function() {
    $('#borrarUsuarioForm').on('submit', function(event) {
      event.preventDefault();
      
      var usu_codigo = $('#id').val();

      $.ajax({
      url: './php/vistas/borrarUsuario.php',
      type: 'POST',
      contentType: 'application/json',
      data: JSON.stringify({ usu_codigo: usu_codigo }),
      success: function(response) {
          if (response.varRespuesta === 'Usuario eliminado exitosamente.') {
            location.reload();
          } else {
            alert('El usuario no pudo ser eliminado.');
            location.reload();
          }
      },
      error: function() {
        alert('Error en la solicitud.');
        location.reload();
      }
  });

    });
  });