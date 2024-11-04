document.addEventListener('DOMContentLoaded', () => {
    function cargarListaNotificaciones(data){
        console.log(data)
        $("#data-notificaciones").empty();
        // Recorremos las notificaciones y agregamos cada una como un elemento de lista
        data.forEach((notificacion) => {
            const { ntf_id, ntf_fecha, ntf_proceso, ntf_descripcion, ntf_visto } = notificacion;

            const liItem = document.createElement('li');
            liItem.className = 'list-group-item';

            liItem.innerHTML = `
            <div class="d-flex align-items-center">
                <div class="form-check me-2">
                    <input class="form-check-input" type="checkbox" data-id="${ntf_id}" ${ntf_visto ? 'checked' : ''} ${ntf_visto ? 'disabled' : ''}>
                </div>

                <span class="me-4">
                    <svg xmlns="http://www.w3.org/2000/svg" width="25" height="25" fill="currentColor" class="bi bi-bell-fill" viewBox="0 0 16 16">
                        <path d="M8 16a2 2 0 0 0 2-2H6a2 2 0 0 0 2 2m.995-14.901a1 1 0 1 0-1.99 0A5 5 0 0 0 3 6c0 1.098-.5 6-2 7h14c-1.5-1-2-5.902-2-7 0-2.42-1.72-4.44-4.005-4.901"/>
                    </svg>
                </span>

                <div class="w-100">
                    <div class="d-flex w-100 justify-content-between">
                        <h5 class="mb-1">${ntf_proceso}</h5>
                        <small class="text-muted">${parseDate(ntf_fecha)}</small>
                    </div>
                    <p class="mb-1">${ntf_descripcion}</p>
                </div>
            </div>
        `;

            $("#data-notificaciones").append(liItem);
        });
    }

    async function cargarNotificacionesNoLeidas() {
        const usu_codigo = decodeJWT(localStorage.getItem('authToken')).usu_codigo
        if(showNotificaciones){
            const { data } = await client.get(`notificacionesByUsuarioNoVisto?usu_codigo=${usu_codigo}`);
            if (data.length > 0) {
                cargarListaNotificaciones(data);
                // mostramos el modal
                const dialogNotificaciones = new bootstrap.Modal(document.getElementById('dialogNotificacionesModal'));
                dialogNotificaciones.show();
                // ya no volvemos a mostrar notificaciones
                showNotificaciones = false
            }
        }
    }

    $("#notificaciones").on("click", async function (e) {
        e.preventDefault();
        const usu_codigo = decodeJWT(localStorage.getItem('authToken')).usu_codigo
        const { data } = await client.get('notificacionesByUsuario?usu_codigo=' + usu_codigo);
        cargarListaNotificaciones(data);
        // mostramos el modal
        const dialogNotificaciones = new bootstrap.Modal(document.getElementById('dialogNotificacionesModal'));
        dialogNotificaciones.show();
    });

    $("#data-notificaciones").on('click', '.form-check-input', async function () {
        const notificacion = $(this).data('id'); 
        try {
            await client.put(`/notificacion/${notificacion}`)
            $(this).prop('checked', true);
            $(this).prop('disabled', true);
        } catch(error){
            console.log(error)
            alert('Hubo un error al cambiar el estado')
        }
    })

    $("#btn-mostrar-todas-notificaciones").on('click', async function () {
        const usu_codigo = decodeJWT(localStorage.getItem('authToken')).usu_codigo
        const { data } = await client.get(`notificacionesByUsuarioTodos?usu_codigo=${usu_codigo}`);
        cargarListaNotificaciones(data);
    })

    $("#btn-mostrar-no-leidas-notificaciones").on('click', async function () {
        const usu_codigo = decodeJWT(localStorage.getItem('authToken')).usu_codigo
        const { data } = await client.get(`notificacionesByUsuarioNoVisto?usu_codigo=${usu_codigo}`);
        cargarListaNotificaciones(data);
    })
})