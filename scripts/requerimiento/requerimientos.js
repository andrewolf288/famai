$(document).ready(() => {
  // OBTENEMOS LA INFORMACION DEL USUARIO
  // const { rol } = decodeJWT(localStorage.getItem('authToken'))
  // URL ENDPOINT
  const apiURL = "/requerimientos";

  // referencias de filtros
  const filterSelector = $("#filter-selector");
  const filterInput = $("#filter-input");
  const filterButton = $("#filter-button");
  const filterFechas = $("#filter-dates");

  // -------- MANEJO DE FECHA ----------
  $("#fechaDesde")
    .datepicker({
      dateFormat: "dd/mm/yy",
    })
    .datepicker("setDate", new Date());

  $("#fechaHasta")
    .datepicker({
      dateFormat: "dd/mm/yy",
    })
    .datepicker("setDate", new Date());

  // Opciones de DataTable
  const dataTableOptions = {
    destroy: true,
    responsive: true,
    paging: false,
    searching: false,
    info: false,
  };

  // Inicializacion de data table
  function initDataTable(data) {
    let content = "";
    data.forEach((requerimiento, index) => {
      content += `
                <tr>
                    <td>${requerimiento?.odt_numero ?? "No aplica"}</td>
                    <td>${requerimiento.oic_fecha !== null ? parseDateSimple(requerimiento.oic_fecha) : "No aplica"}</td>
                    <td>${
                      requerimiento.oic_fechaentregaestimada !== null
                        ? parseDateSimple(requerimiento.oic_fechaentregaestimada)
                        : "No aplica"
                    }</td>
                    <td>${requerimiento.area?.are_descripcion ?? "No aplica"}</td>
                    <td>${requerimiento.motivo_requerimiento?.mrq_descripcion ?? "No aplica"}</td>
                    <td class="text-center">${requerimiento.total_materiales}</td>
                    <td>${requerimiento.oic_estado}</td>
                    <td>
                        <div class="d-flex">
                            <button class="btn btn-sm btn-warning btn-requerimiento-editar me-2" data-requerimiento="${
                              requerimiento.oic_id
                            }">
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-pencil-fill" viewBox="0 0 16 16">
                                    <path d="M12.854.146a.5.5 0 0 0-.707 0L10.5 1.793 14.207 5.5l1.647-1.646a.5.5 0 0 0 0-.708zm.646 6.061L9.793 2.5 3.293 9H3.5a.5.5 0 0 1 .5.5v.5h.5a.5.5 0 0 1 .5.5v.5h.5a.5.5 0 0 1 .5.5v.5h.5a.5.5 0 0 1 .5.5v.207zm-7.468 7.468A.5.5 0 0 1 6 13.5V13h-.5a.5.5 0 0 1-.5-.5V12h-.5a.5.5 0 0 1-.5-.5V11h-.5a.5.5 0 0 1-.5-.5V10h-.5a.5.5 0 0 1-.175-.032l-.179.178a.5.5 0 0 0-.11.168l-2 5a.5.5 0 0 0 .65.65l5-2a.5.5 0 0 0 .168-.11z"/>
                                </svg>
                            </button>

                            <button title="Ver Detalle/Imprimir" class="btn btn-sm btn-danger btn-requerimiento-pdf me-2" data-requerimiento="${
                              requerimiento.oic_id
                            }">
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-file-earmark-pdf-fill" viewBox="0 0 16 16">
                                    <path d="M5.523 12.424q.21-.124.459-.238a8 8 0 0 1-.45.606c-.28.337-.498.516-.635.572l-.035.012a.3.3 0 0 1-.026-.044c-.056-.11-.054-.216.04-.36.106-.165.319-.354.647-.548m2.455-1.647q-.178.037-.356.078a21 21 0 0 0 .5-1.05 12 12 0 0 0 .51.858q-.326.048-.654.114m2.525.939a4 4 0 0 1-.435-.41q.344.007.612.054c.317.057.466.147.518.209a.1.1 0 0 1 .026.064.44.44 0 0 1-.06.2.3.3 0 0 1-.094.124.1.1 0 0 1-.069.015c-.09-.003-.258-.066-.498-.256M8.278 6.97c-.04.244-.108.524-.2.829a5 5 0 0 1-.089-.346c-.076-.353-.087-.63-.046-.822.038-.177.11-.248.196-.283a.5.5 0 0 1 .145-.04c.013.03.028.092.032.198q.008.183-.038.465z"/>
                                    <path fill-rule="evenodd" d="M4 0h5.293A1 1 0 0 1 10 .293L13.707 4a1 1 0 0 1 .293.707V14a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V2a2 2 0 0 1 2-2m5.5 1.5v2a1 1 0 0 0 1 1h2zM4.165 13.668c.09.18.23.343.438.419.207.075.412.04.58-.03.318-.13.635-.436.926-.786.333-.401.683-.927 1.021-1.51a11.7 11.7 0 0 1 1.997-.406c.3.383.61.713.91.95.28.22.603.403.934.417a.86.86 0 0 0 .51-.138c.155-.101.27-.247.354-.416.09-.181.145-.37.138-.563a.84.84 0 0 0-.2-.518c-.226-.27-.596-.4-.96-.465a5.8 5.8 0 0 0-1.335-.05 11 11 0 0 1-.98-1.686c.25-.66.437-1.284.52-1.794.036-.218.055-.426.048-.614a1.24 1.24 0 0 0-.127-.538.7.7 0 0 0-.477-.365c-.202-.043-.41 0-.601.077-.377.15-.576.47-.651.823-.073.34-.04.736.046 1.136.088.406.238.848.43 1.295a20 20 0 0 1-1.062 2.227 7.7 7.7 0 0 0-1.482.645c-.37.22-.699.48-.897.787-.21.326-.275.714-.08 1.103"/>
                                </svg>
                            </button>
                            
                            <button title="Anular Requerimiento" class="btn btn-sm btn-outline-danger btn-requerimiento-anular me-2 d-flex align-items-center justify-content-center" ${
                              requerimiento.ordenes_compra.length !== 0 || requerimiento.oic_estado === "ANULADO" ? "disabled" : ""
                            } data-cotizaciones='${JSON.stringify(requerimiento.cotizaciones)}' data-requerimiento="${
        requerimiento.oic_id
      }">
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-x-circle-fill" viewBox="0 0 16 16">
                                    <path d="M16 8A8 8 0 1 1 0 8a8 8 0 0 1 16 0M5.354 4.646a.5.5 0 1 0-.708.708L7.293 8l-2.647 2.646a.5.5 0 0 0 .708.708L8 8.707l2.646 2.647a.5.5 0 0 0 .708-.708L8.707 8l2.647-2.646a.5.5 0 0 0-.708-.708L8 7.293z"/>
                                </svg>
                            </button>
                        </div>
                    </td>
                    <td>${requerimiento.oic_feccreacion === null ? "No aplica" : parseDate(requerimiento.oic_feccreacion)}</td>
                    <td>${requerimiento.oic_usucreacion === null ? "No aplica" : requerimiento.oic_usucreacion}</td>
                    <td>${requerimiento.oic_fecmodificacion === null ? "No aplica" : parseDate(requerimiento.oic_fecmodificacion)}</td>
                    <td>${requerimiento.oic_usumodificacion === null ? "No aplica" : requerimiento.oic_usumodificacion}</td>
                </tr>
            `;
    });
    $("#data-container-body").html(content);
  }

  filterFechas.on("click", () => {
    const fechaDesde = transformarFecha($("#fechaDesde").val());
    const fechaHasta = transformarFecha($("#fechaHasta").val());
    let filteredURL = `${apiURL}?fecha_desde=${fechaDesde}&fecha_hasta=${fechaHasta}`;
    initPagination(filteredURL, initDataTable, dataTableOptions);
  });

  filterButton.on("click", () => {
    // seleccionamos el valor del selector
    const filterField = filterSelector.val().trim();
    // seleccionamos el valor del criterio de busqueda
    const filterValue = filterInput.val().trim();

    let filteredURL = apiURL;

    // primero aplicamos el filtro de fechas
    const fechaDesde = transformarFecha($("#fechaDesde").val());
    const fechaHasta = transformarFecha($("#fechaHasta").val());
    // filteredURL += `?fecha_desde=${fechaDesde}&fecha_hasta=${fechaHasta}`

    // debemos adjuntar el filtro de busqueda por criterio
    if (filterField.length !== 0 && filterValue.length !== 0) {
      // filteredURL += `&${filterField}=${encodeURIComponent(filterValue)}`
      filteredURL += `?${filterField}=${encodeURIComponent(filterValue)}`;
    }
    initPagination(filteredURL, initDataTable, dataTableOptions);
  });

  // inicializamos la paginacion con datatable
  initPagination(
    `${apiURL}?fecha_desde=${moment().format("YYYY-MM-DD")}&fecha_hasta=${moment().format("YYYY-MM-DD")}`,
    initDataTable,
    dataTableOptions
  );

  // ----------- FUNCIONES PARA GESTIONAR ACCIONES DE BOTONES -------------
  $("#data-container").on("click", ".btn-requerimiento-editar", function () {
    const id = $(this).data("requerimiento");
    window.location.href = `requerimiento/editar/${id}`;
  });

  $("#data-container").on("click", ".btn-requerimiento-pdf", async function () {
    const id = $(this).data("requerimiento");
    console.log(id);
    try {
      const response = await client.get(`/requerimiento/exportarPDF?oic_id=${id}`, {
        headers: {
          Accept: "application/pdf",
        },
        responseType: "blob",
      });

      const pdfBlob = new Blob([response.data], { type: "application/pdf" });
      const pdfUrl = URL.createObjectURL(pdfBlob);
      showModalPreview(pdfUrl);
    } catch (error) {
      alert("Error al generar el reporte");
    }
  });

  $("#data-container").on("click", ".btn-requerimiento-eliminar", async function () {
    const id = $(this).data("requerimiento");
    if (confirm("¿Desea eliminar este requerimiento?")) {
      // try {
      //     await client.delete(`/requerimiento/${id}`)
      //     initPagination(`${apiURL}?fecha_desde=${transformarFecha($('#fechaDesde').val())}&fecha_hasta=${transformarFecha($('#fechaHasta').val())}`, initDataTable, dataTableOptions)
      // } catch (error) {
      //     const { response } = error
      //     if (response.status === 400) {
      //         alert(response.data.error)
      //     } else {
      //         alert('Error al eliminar el requerimiento')
      //     }
      // }
    }
  });

  $("#data-container").on("click", ".btn-requerimiento-anular", async function () {
    const cotizaciones = $(this).data("cotizaciones");
    if (cotizaciones.length > 0) {
      console.log("habia cotizaciones");
      $("#alert-anular-requerimiento").removeClass("d-none");
    } else {
      console.log("no habia cotizaciones");
      $("#alert-anular-requerimiento").addClass("d-none");
    }
    $($("#btn-anular-requerimiento")).data("requerimiento", $(this).data("requerimiento"));
    const modal = new bootstrap.Modal(document.getElementById("anularRequerimientoModal"));
    modal.show();
  });

  $("#btn-anular-requerimiento").on("click", async function () {
    const id = $(this).data("requerimiento");
    try {
      await client.delete(`/requerimiento/${id}`);
      initPagination(
        `${apiURL}?fecha_desde=${transformarFecha($("#fechaDesde").val())}&fecha_hasta=${transformarFecha($("#fechaHasta").val())}`,
        initDataTable,
        dataTableOptions
      );
      $("#anularRequerimientoModal").modal("hide");
    } catch (error) {
      console.log(error);
      alert("Error al anular el requerimiento");
    }
  });

  function showModalPreview(pdfUrl) {
    document.getElementById("pdf-frame").src = pdfUrl;
    const modal = new bootstrap.Modal(document.getElementById("previewPDFModal"));
    modal.show();
  }
});
