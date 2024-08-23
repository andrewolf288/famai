//Inserta los modales en la pagina de usuarios
$(document).ready(function() {
    $('#modal-container-create').load('./paginas/crearUsuarioModal.html');
    $('#modal-container-edit').load('./paginas/editarUsuarioModal.html');
    $('#modal-container-delete').load('./paginas/eliminarUsuarioModal.html');
});