$(document).ready(() => {
  // ------------- JAVACRIPT PARA EL NAVABAR DE NAVEGACION -------------
  const modulos = JSON.parse(localStorage.getItem('modulos'));
  const { procesos } = modulos

  function createCard(title, url, colorIndex) {
    const colores = ['#C3E2EB', '#C4CAEB', '#CAC3EB']
    return `
          <div class="col-lg-6 col-md-6 col-12 mb-5">
            <div class="card border-1 h-100 shadow-sm" style="background-color: ${colores[colorIndex]}">
              <div class="card-body text-center flex flex-column justify-content-center align-items-center p-4">
                <div class="feature bg-primary bg-gradient text-white rounded-3">
                  <i class="bi bi-collection"></i>
                </div>
                <h2 class="fs-4 fw-bold">${title}</h2>
                <a href="${url}" class="btn btn-primary">Ingresar</a>
              </div>
            </div>
          </div>
        `;
  }

  // Selecciona el contenedor donde se agregarán las tarjetas
  const container = document.getElementById("cards-container");

  // Itera sobre los datos y agrega cada tarjeta al contenedor
  let colorIndex = 0;
  procesos.forEach(proceso => {
    container.innerHTML += createCard(proceso.mol_descripcion, proceso.mol_url, colorIndex);
    if (proceso.mol_descripcion === 'Despliegue OT-Materiales') return colorIndex = 1
    if (proceso.mol_descripcion === 'OIs Validación Códigos') return colorIndex = 2
  });

  function cargarListaNotificaciones(data) {
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
    const { data } = await client.get(`notificacionesByUsuarioNoVisto?usu_codigo=${usu_codigo}`);
    if (data.length > 0) {
      cargarListaNotificaciones(data);
      // mostramos el modal
      const dialogNotificaciones = new bootstrap.Modal(document.getElementById('dialogNotificacionesModal'));
      dialogNotificaciones.show();
    }
  }

  cargarNotificacionesNoLeidas()
})