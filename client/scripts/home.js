$(document).ready(() => {
    // ------------- JAVACRIPT PARA EL NAVABAR DE NAVEGACION -------------
    const modulos = JSON.parse(localStorage.getItem('modulos'));
    const { procesos } = modulos

    function createCard(title, url) {
        return `
          <div class="col-lg-6 col-md-6 col-12 mb-5">
            <div class="card bg-light border-0 h-100">
              <div class="card-body text-center p-4 p-lg-5 pt-0 pt-lg-0">
                <div class="feature bg-primary bg-gradient text-white rounded-3 mb-4 mt-n4">
                  <i class="bi bi-collection"></i>
                </div>
                <h2 class="fs-4 fw-bold">${title}</h2>
                <a href="/${url}" class="btn btn-primary">Ingresar</a>
              </div>
            </div>
          </div>
        `;
    }

    // Selecciona el contenedor donde se agregarán las tarjetas
    const container = document.getElementById("cards-container");

    // Itera sobre los datos y agrega cada tarjeta al contenedor
    procesos.forEach(proceso => {
        container.innerHTML += createCard(proceso.mol_descripcion, proceso.mol_url);
    });
})