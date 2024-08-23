//Editar Usuario
document.getElementById('editarUsuarioForm').addEventListener('submit', function(event) {
    event.preventDefault();
  
    let form = document.getElementById('editarUsuarioForm');
    let formData = new FormData(form);
    //Carga  los datos
    let usuario = {
        usu_codigo: formData.get('usu_codigo'),
        usu_nombre: formData.get('usu_nombre'),
        usu_contrasena: formData.get('usu_contrasena'),
        usu_activo: formData.get('usu_activo') ? 1 : 0
    };
  
    fetch('./php/vistas/modificarUsuario.php', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(usuario)
    })
    .then(response => response.json())
    .then(data => {
        if (data.varRespuesta) {
          window.location.reload();
        } else {
            alert('Error al actualizar usuario.');
        }
    })
    .catch(error => console.error('Error:', error));
  });