$(document).ready(function(){
    $('#tbl-usuarios').DataTable({
        //Botones de exportar y paginar por tamaño
        dom: "<'row mb-3'<'col-sm-12 col-md-6'B>><'row'<'col-sm-12 col-md-6'l>><'row'<'col-sm-12'tr>>" +
             "<'row'<'col-sm-12 col-md-5'i><'col-sm-12 col-md-7'p>>",
        lengthMenu: [
            [10, 25, 50, -1],
            [10, 25, 50, 'All']
        ],
        buttons:{
            dom: {
                button: {
                    className: 'btn btn-exportar'
                }
            },
            buttons: [
            {
                extend: "excel",
                text:'Exportar a Excel',
                className:'btn btn-exportar',
                exportOptions: {
                    columns: ':not(:last-child)'
                }
            }
            ]
        },
        "language": {
            "lengthMenu": "Mostrar _MENU_ registros por página",
            "zeroRecords": "No se encontraron resultados",
            "info": "Mostrando _START_ a _END_ de _TOTAL_ registros",
            "infoEmpty": "Mostrando 0 a 0 de 0 registros",
            "infoFiltered": "(filtrado de _MAX_ registros totales)",
            "search": "Buscar:",
            "paginate": {
                "first": "Primero",
                "last": "Último",
                "next": "Siguiente",
                "previous": "Anterior"
            },
            "loadingRecords": "Cargando...",
            "processing": "Procesando...",
            "emptyTable": "No hay datos disponibles en la tabla",
            "aria": {
                "sortAscending": ": activar para ordenar la columna en orden ascendente",
                "sortDescending": ": activar para ordenar la columna en orden descendente"
            }
        },
        "responsive": true,
        "processing": true,
        "serverSide": true,
        "order": [],
        "ajax": {
            "url": "./php/vistas/leerUsuariosAdvanced.php",
            "type": "POST",
            "contentType": "application/json",
            "data": function(d) {
                var jsonData = JSON.stringify(d);
                return jsonData;
            },
            "dataSrc": function(json) {
                // Aquí puedes modificar los datos antes de pasarlos a DataTables
                json.data.forEach(function(user) {
                    let id = user[0]; // Suponiendo que el ID está en la primera posición
                    let actions = `<a href="#" class="btn btn-sm btn-editar" data-bs-toggle="modal" data-bs-target="#editarUsuarioModal" data-bs-id="${id}"> <i class="fa-solid fa-pen-to-square"></i> Editar</a> <a href="#" class="btn btn-sm btn-eliminar" data-bs-toggle="modal" data-bs-target="#eliminarUsuarioModal" data-bs-id="${id}"> <i class="fa-solid fa-trash"></i> Eliminar</a>`;
                    user.push(actions);
                });
                return json.data;
            }
        },
        "columns": [
            { "data": 0 },
            { "data": 1 },
            { "data": 2 },
            { "data": 3 },
            { "data": 4 },
            { "data": 5 },
            { "data": 6 }, 
            { "data": 7 }, 
            { "data": 8 }  
        ]
    });
});


//Editar Usuario
$(document).on('shown.bs.modal', '#editarUsuarioModal', function(event) {
    let button = $(event.relatedTarget);
    let id = button.data('bs-id');

    let url = "./php/vistas/leerUnUsuario.php";
    let data = { usu_codigo: id };

    fetch(url, {
        method: 'POST',
        body: JSON.stringify(data),
        headers: {
            'Content-Type': 'application/json'
        }
    })
    .then(response => response.json())
    .then(data => {
        if (data.data) {
            let users = data.data;
            let user = users.find(user => user[0] == id);
            // Setea los datos
            if (user) {
                // Añadir el campo final con los botones de editar y eliminar
                let actions = `<a href="#" class="btn btn-sm btn-editar" data-bs-toggle="modal" data-bs-target="#editarUsuarioModal" data-bs-id="${user[0]}"> <i class="fa-solid fa-pen-to-square"></i> Editar</a> <a href="#" class="btn btn-sm btn-eliminar" data-bs-toggle="modal" data-bs-target="#eliminarUsuarioModal" data-bs-id="${user[0]}"> <i class="fa-solid fa-trash"></i> Eliminar</a>`;
                user.push(actions);

                let modal = $('#editarUsuarioModal');
                modal.find('.modal-body #usu_codigo').val(user[0]);
                modal.find('.modal-body #usu_nombre').val(user[1]);
                modal.find('.modal-body #usu_contrasena').val('');
                modal.find('.modal-body #usu_activo').prop('checked', user[2] === 'Activo');
            }
        }
    })
    .catch(err => console.log(err));
});

//Eliminar usuario por ID
$(document).on('shown.bs.modal', '#eliminarUsuarioModal', function(event) {
    let button = $(event.relatedTarget);
    let id = button.data('bs-id');
    console.log("Deleting user with ID:", id);
    let modal = $(this);
    modal.find('.modal-footer #id').val(id);
});