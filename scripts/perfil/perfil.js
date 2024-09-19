$(document).ready(() => {
    const apiURL = '/auth/me'

    async function traerPerfilUsuario() {
        try{
            const {data} = await client.post(apiURL, null, {
                headers: {
                    'Accept': 'application/json'
                }
            })
            $('#usu_nombre').text(data.usu_nombre)
            $('#usu_codigo').text(data.usu_codigo)
            $('#usu_activo').html(data.usu_activo == 1 ? "<span class='badge rounded-pill bg-success'>Activo</span>" : "<span class='badge rounded-pill bg-danger'>Inactivo</span>")
            $('#usu_rol').text(data.rol.rol_descripcion)

        } catch(error){
            console.log(error)
        }
    }

    traerPerfilUsuario()
})