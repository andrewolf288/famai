document.addEventListener('DOMContentLoaded', () => {
  const sedesDropdownMenu = document.getElementById('sedesDropdownMenu')

  async function cargarSedes() {
    const { data } = await client.get('/sedes')
    data.forEach(sede => {
      const li = document.createElement('li')
      li.innerHTML = `
        <a class="dropdown-item" data-sede-codigo="${sede.sed_codigo}">${sede.sed_nombre}</a>
      `
      li.addEventListener('click', async function () { cambiarSedeActual($(this).find('a').attr('data-sede-codigo')) })
      sedesDropdownMenu.appendChild(li)
    })
  }

  async function cambiarSedeActual(sedeCodigo) {

    bootbox.confirm({
      title: 'Cambiar sede actual',
      message: '¿Estás seguro de querer cambiar la sede actual? Todos los procesos y documentos que genere seran con la nueva sede',
      callback: async function (result) {
        if (result) {
          const { data } = await client.post(`/cambiar-sede-actual-trabajador`, { sede_codigo: sedeCodigo })
          if (data) {
            const sedeActual = document.getElementById('sede-actual')
            sedeActual.textContent = data.sed_nombre
          }
        }
      }
    })
  }

  async function cargarSedeActual() {
    try {
      const sedeActual = document.getElementById('sede-actual')
      const { data } = await client.get('/sede-actual-trabajador')

      if (!data || !data.sed_nombre) {
        sedeActual.textContent = 'N/A'
      } else {
        sedeActual.textContent = data.sed_nombre
      }
    } catch (error) {
      console.log(error)
    }
  }
  async function cargarUsuarioActual() {
    try {
      const { data } = await client.post('/auth/me', null, {
        headers: {
          'Accept': 'application/json'
        }
      })
      const usuarioActual = document.getElementById('usuario-actual')
      usuarioActual.textContent = data.usu_codigo

    } catch (error) {
      console.log(error)
    }

  }

  cargarSedes()
  cargarSedeActual()
  cargarUsuarioActual()
})