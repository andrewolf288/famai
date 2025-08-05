$(document).ready(async () => {
  const oic_id = window.location.pathname.split("/").pop();
  let abortController;
  const detalle_requerimiento = [];

  $("#fechaPicker")
    .datepicker({
      dateFormat: "dd/mm/yy",
      setDate: new Date(),
    })
    .datepicker("setDate", new Date());

  $("#fechaEntregaPicker")
    .datepicker({
      dateFormat: "dd/mm/yy",
      setDate: new Date(),
    })
    .datepicker("setDate", new Date());

  const cargarMotivosRequerimientos = async () => {
    try {
      const { data } = await client.get("/motivosrequerimientoSimple");
      const $motivoRequerimientoSelect = $("#motivoRequerimientoSelect");

      data.forEach((motivo) => {
        const option = $("<option>").val(motivo["mrq_codigo"]).text(motivo["mrq_descripcion"]);
        $motivoRequerimientoSelect.append(option);
      });
    } catch (error) {
      alert("Error al obtener los motivos de requerimientos");
    }
  };

  const cargarAreas = async () => {
    try {
      const { data } = await client.get("/areasSimple");
      const $areaSelect = $("#areaSelect");

      data.sort((a, b) => a["are_descripcion"].localeCompare(b["are_descripcion"]));

      data.forEach((area) => {
        const option = $("<option>").val(area["are_codigo"]).text(area["are_descripcion"]);
        $areaSelect.append(option);
      });
    } catch (error) {
      alert("Error al obtener las áreas");
    }
  };

  const cargarResponsables = async () => {
    try {
      const { data } = await client.get("/trabajadoresSimple");
      const $responsableOrigen = $("#responsableOrigen");

      data.sort((a, b) => a.tra_nombre.localeCompare(b.tra_nombre));

      data.forEach((responsable) => {
        const option = $("<option>").val(responsable.tra_id).text(responsable.tra_nombre);
        $responsableOrigen.append(option.clone());
      });
    } catch (error) {
      alert("Error al obtener los encargados");
    }
  };

  const cargarInformacionUsuario = async () => {
    const usu_codigo = decodeJWT(localStorage.getItem("authToken")).usu_codigo;
    try {
      const { data } = await client.get(`/trabajadorByUsuario/${usu_codigo}`);
      $("#areaSelect").val(data.are_codigo);
      $("#responsableOrigen").val(data.tra_id);
    } catch (error) {
      const { response } = error;
      if (response.status === 404) {
        alert("El usuario logeado no está relacionado con ningún trabajador");
      } else {
        alert("Ocurrió un error al traer la información de trabajador");
      }
    }
  };

  const cargarRequerimiento = async () => {
    try {
      const response = await client.get(`/requerimiento/${oic_id}`);
      // const requerimiento = {
      //     "oic_id": 21339,
      //     "oic_fecha": "2025-08-01",
      //     "odt_numero": "RQA0000002",
      //     "cli_id": null,
      //     "are_codigo": "HID",
      //     "oic_equipo_descripcion": "Requerimiento generado automáticamente por productos nuevos en orden de compra",
      //     "tra_idorigen": "177",
      //     "tra_idmaestro": null,
      //     "tra_idalmacen": null,
      //     "oic_usucreacion": "ADMIN   ",
      //     "oic_feccreacion": "2025-08-01T07:48:33.907000Z",
      //     "oic_usumodificacion": null,
      //     "oic_fecmodificacion": null,
      //     "oic_activo": "1",
      //     "oic_estado": "ENVIADO",
      //     "oic_fechaaprobacion": null,
      //     "oic_fechaentregaestimada": "2025-08-08",
      //     "oic_componente": null,
      //     "oic_fechaevaluacion": null,
      //     "oic_tipo": "REQ",
      //     "sed_codigo": "10",
      //     "mrq_codigo": "STK",
      //     "oic_otsap": null,
      //     "area": {
      //         "are_codigo": "HID",
      //         "are_descripcion": "Hidraulica"
      //     },
      //     "trabajador_origen": {
      //         "tra_id": 177,
      //         "tra_nombre": "LEO SANCA CAHUANA",
      //         "tra_codigosap": "406"
      //     },
      //     "motivo_requerimiento": {
      //         "mrq_codigo": "STK",
      //         "mrq_descripcion": "Stock"
      //     },
      //     "partes": [
      //         {
      //             "opd_id": 29150,
      //             "oip_id": "12",
      //             "oic_id": "21339",
      //             "opd_usucreacion": "ADMIN   ",
      //             "opd_feccreacion": "2025-08-01T07:48:33.947000Z",
      //             "opd_usumodificacion": null,
      //             "opd_fecmodificacion": null,
      //             "materiales": [
      //                 {
      //                     "odm_id": 30729,
      //                     "opd_id": "29150",
      //                     "pro_id": "359",
      //                     "odm_item": "1",
      //                     "odm_descripcion": "(04-A-05-//) PASTA ANTIOXIDANTE PENETROX ¨A¨",
      //                     "odm_cantidad": "1.00",
      //                     "odm_observacion": null,
      //                     "odm_tipo": "1",
      //                     "odm_estado": "COT",
      //                     "odm_usucreacion": "ADMIN   ",
      //                     "odm_feccreacion": "2025-08-01T07:48:33.953000Z",
      //                     "odm_usumodificacion": null,
      //                     "odm_fecmodificacion": null,
      //                     "tra_responsable": null,
      //                     "odm_notapresupuesto": null,
      //                     "odm_adjuntopresupuesto": null,
      //                     "odm_fecasignacionresponsable": null,
      //                     "odm_cantidadreservada": null,
      //                     "odm_cantidadordenada": ".00",
      //                     "odm_cantidadpendiente": "1.00",
      //                     "odm_cantidadatendida": null,
      //                     "odm_cantidadajuste": null,
      //                     "odm_cantidaddespachada": null,
      //                     "odm_fecconsultareservacion": "2025-08-01 02:48:33.953",
      //                     "odm_solped": null,
      //                     "ordenes_compra": [],
      //                     "cotizaciones": []
      //                 }
      //             ]
      //         }
      //     ]
      // };
      const requerimiento = response.data.data;

      // CABECERA
      $("#fechaPicker").val(moment(requerimiento.oic_fecha).format("DD/MM/YYYY"));
      $("#fechaEntregaPicker").val(moment(requerimiento.oic_fechaentregaestimada).format("DD/MM/YYYY"));
      $("#areaSelect").val(requerimiento.are_codigo);
      $("#responsableOrigen").val(requerimiento.tra_idorigen);
      $("#otInput").val(requerimiento.oic_otsap);
      $("#motivoRequerimientoSelect").val(requerimiento.mrq_codigo);
      $("#motivoRequerimientoSelect").trigger("change");
      $("#equipoInput").val(requerimiento.oic_equipo_descripcion);

      // DETALLE
      const partes = requerimiento.partes;
      partes.forEach((parte) => {
        parte.materiales.forEach((material) => {
          const row = `
                        <tr>
                            <td >${material["producto"]["pro_codigo"]}</td>

                            <td>
                                <input type="text" class="form-control descripcion-input" value='${material["odm_descripcion"].replace(
                                  /'/g,
                                  "&#39;"
                                )}' readonly/>
                            </td>

                            <td>
                                <input type="number" class="form-control cantidad-input" value='${material["odm_cantidad"]}' readonly/>
                            </td>

                            <td>${material["producto"]["uni_codigo"] ?? ""}</td>

                            <td>
                                <input type="text" class="form-control observacion-input" value='${
                                  material["odm_observacion"] ? material["odm_observacion"].replace(/'/g, "&#39;") : ""
                                }' readonly/>
                            </td>

                            <td>
                                <div class="d-flex justify-content-around">
                                    <button class="btn btn-sm btn-warning btn-detalle-producto-editar me-2" data-producto="${
                                      material["producto"]["pro_id"]
                                    }" data-odm-id="${material["odm_id"]}">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-pencil-fill" viewBox="0 0 16 16">
                                            <path d="M12.854.146a.5.5 0 0 0-.707 0L10.5 1.793 14.207 5.5l1.647-1.646a.5.5 0 0 0 0-.708zm.646 6.061L9.793 2.5 3.293 9H3.5a.5.5 0 0 1 .5.5v.5h.5a.5.5 0 0 1 .5.5v.5h.5a.5.5 0 0 1 .5.5v.5h.5a.5.5 0 0 1 .5.5v.207zm-7.468 7.468A.5.5 0 0 1 6 13.5V13h-.5a.5.5 0 0 1-.5-.5V12h-.5a.5.5 0 0 1-.5-.5V11h-.5a.5.5 0 0 1-.5-.5V10h-.5a.5.5 0 0 1-.175-.032l-.179.178a.5.5 0 0 0-.11.168l-2 5a.5.5 0 0 0 .65.65l5-2a.5.5 0 0 0 .168-.11z"/>
                                        </svg>
                                    </button>
                                    <button class="btn btn-sm btn-danger btn-detalle-producto-eliminar me-2" data-producto="${
                                      material["producto"]["pro_id"]
                                    }" data-odm-id="${material["odm_id"]}">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-trash3-fill" viewBox="0 0 16 16">
                                            <path d="M11 1.5v1h3.5a.5.5 0 0 1 0 1h-.538l-.853 10.66A2 2 0 0 1 11.115 16h-6.23a2 2 0 0 1-1.994-1.84L2.038 3.5H1.5a.5.5 0 0 1 0-1H5v-1A1.5 1.5 0 0 1 6.5 0h3A1.5 1.5 0 0 1 11 1.5m-5 0v1h4v-1a.5.5 0 0 0-.5-.5h-3a.5.5 0 0 0-.5.5M4.5 5.029l.5 8.5a.5.5 0 1 0 .998-.06l-.5-8.5a.5.5 0 1 0-.998.06m6.53-.528a.5.5 0 0 0-.528.47l-.5 8.5a.5.5 0 0 0 .998.058l.5-8.5a.5.5 0 0 0-.47-.528M8 4.5a.5.5 0 0 0-.5.5v8.5a.5.5 0 0 0 1 0V5a.5.5 0 0 0-.5-.5"/>
                                        </svg>
                                    </button>
                                    <button class="btn btn-sm btn-primary btn-detalle-producto-adjuntos" data-producto="${
                                      material["producto"]["pro_id"]
                                    }" data-odm-id="${material["odm_id"]}">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-file-earmark-text-fill" viewBox="0 0 16 16">
                                            <path d="M9.293 0H4a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V4.707A1 1 0 0 0 13.707 4L10 .293A1 1 0 0 0 9.293 0M9.5 3.5v-2l3 3h-2a1 1 0 0 1-1-1M4.5 9a.5.5 0 0 1 0-1h7a.5.5 0 0 1 0 1zM4 10.5a.5.5 0 0 1 .5-.5h7a.5.5 0 0 1 0 1h-7a.5.5 0 0 1-.5-.5m.5 2.5a.5.5 0 0 1 0-1h4a.5.5 0 0 1 0 1z"/>
                                        </svg>
                                    </button>
                                </div>
                            </td>
                        </tr>
                    `;

          $("#tbl-requerimientos tbody").append(row);
        });
      });
    } catch (error) {
      console.log(error);
      alert("Error al cargar el requerimiento");
    }
  };

  function limpiarLista() {
    $("#resultadosLista").empty();
  }

  async function buscarMateriales(query) {
    if (abortController) {
      abortController.abort();
    }
    abortController = new AbortController();
    const signal = abortController.signal;

    try {
      const queryEncoded = encodeURIComponent(query);
      // TODO: Cambiar a productosByQuery2 para probar en local
      const { data } = await client.get(`/productosByQuery?query=${queryEncoded}`);
      // Limpiamos la lista
      limpiarLista();
      // formamos la lista
      data.forEach((material) => {
        const listItem = document.createElement("li");
        listItem.className = "list-group-item list-group-item-action";
        listItem.textContent = `${material.pro_codigo} - ${material.pro_descripcion} - Stock: ${
          material.alp_stock || "0.000000"
        } - Fec. Ult. Ingreso: ${material["UltimaFechaIngreso"] ? parseDateSimple(material["UltimaFechaIngreso"]) : "No Aplica"}`;
        listItem.dataset.id = material.pro_id;
        listItem.addEventListener("click", () => seleccionarMaterial(material));

        $("#resultadosLista").append(listItem);
      });
    } catch (error) {
      if (error.name === "AbortError") {
        console.log("Petición abortada"); // Maneja el error de la petición abortada
      } else {
        console.error("Error al buscar materiales:", error);
        alert("Error al buscar materiales. Inténtalo de nuevo."); // Muestra un mensaje de error al usuario
      }
    }
  }

  function seleccionarMaterial(material) {
    const { pro_id, pro_codigo, pro_descripcion, uni_codigo } = material;
    const findProducto = detalle_requerimiento.find((element) => element.pro_id == pro_id);

    const estaEnTabla = $("#tbl-requerimientos tbody").find("tr").find("td:first").text() === pro_codigo;

    // Excepcion de validacion
    if (findProducto || estaEnTabla) {
      bootbox.alert("Este producto ya fué agregado");
    } else {
      limpiarLista();
      $("#productosInput").val("");

      const data = {
        pro_id,
        pro_codigo,
        odm_descripcion: pro_descripcion,
        odm_cantidad: 1.0,
        uni_codigo,
        odm_observacion: "",
        odm_tipo: 1,
        odm_asociar: true,
        detalle_adjuntos: [],
      };

      const row = `
            <tr>
                <td style="background-color:rgb(248, 229, 165);">${data["pro_codigo"]}</td>

                <td style="background-color:rgb(248, 229, 165);">
                    <input type="text" class="form-control descripcion-input" value='${data["odm_descripcion"].replace(
                      /'/g,
                      "&#39;"
                    )}' readonly/>
                </td>

                <td style="background-color:rgb(248, 229, 165);">
                    <input type="number" class="form-control cantidad-input" value='${data["odm_cantidad"]}' readonly/>
                </td>

                <td style="background-color:rgb(248, 229, 165);">${data["uni_codigo"] ?? ""}</td>

                <td style="background-color:rgb(248, 229, 165);">
                    <input type="text" class="form-control observacion-input" value='${data["odm_observacion"].replace(
                      /'/g,
                      "&#39;"
                    )}' readonly/>
                </td>

                <td style="background-color:rgb(248, 229, 165);">
                    <div class="d-flex justify-content-around">
                        <button class="btn btn-sm btn-warning btn-detalle-producto-editar me-2" data-producto="${data["pro_id"]}">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-pencil-fill" viewBox="0 0 16 16">
                                <path d="M12.854.146a.5.5 0 0 0-.707 0L10.5 1.793 14.207 5.5l1.647-1.646a.5.5 0 0 0 0-.708zm.646 6.061L9.793 2.5 3.293 9H3.5a.5.5 0 0 1 .5.5v.5h.5a.5.5 0 0 1 .5.5v.5h.5a.5.5 0 0 1 .5.5v.5h.5a.5.5 0 0 1 .5.5v.207zm-7.468 7.468A.5.5 0 0 1 6 13.5V13h-.5a.5.5 0 0 1-.5-.5V12h-.5a.5.5 0 0 1-.5-.5V11h-.5a.5.5 0 0 1-.5-.5V10h-.5a.5.5 0 0 1-.175-.032l-.179.178a.5.5 0 0 0-.11.168l-2 5a.5.5 0 0 0 .65.65l5-2a.5.5 0 0 0 .168-.11z"/>
                            </svg>
                        </button>
                        <button class="btn btn-sm btn-danger btn-detalle-producto-eliminar me-2" data-producto="${data["pro_id"]}">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-trash3-fill" viewBox="0 0 16 16">
                                <path d="M11 1.5v1h3.5a.5.5 0 0 1 0 1h-.538l-.853 10.66A2 2 0 0 1 11.115 16h-6.23a2 2 0 0 1-1.994-1.84L2.038 3.5H1.5a.5.5 0 0 1 0-1H5v-1A1.5 1.5 0 0 1 6.5 0h3A1.5 1.5 0 0 1 11 1.5m-5 0v1h4v-1a.5.5 0 0 0-.5-.5h-3a.5.5 0 0 0-.5.5M4.5 5.029l.5 8.5a.5.5 0 1 0 .998-.06l-.5-8.5a.5.5 0 1 0-.998.06m6.53-.528a.5.5 0 0 0-.528.47l-.5 8.5a.5.5 0 0 0 .998.058l.5-8.5a.5.5 0 0 0-.47-.528M8 4.5a.5.5 0 0 0-.5.5v8.5a.5.5 0 0 0 1 0V5a.5.5 0 0 0-.5-.5"/>
                            </svg>
                        </button>
                        <button class="btn btn-sm btn-primary btn-detalle-producto-adjuntos" data-producto="${data["pro_id"]}">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-file-earmark-text-fill" viewBox="0 0 16 16">
                                <path d="M9.293 0H4a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V4.707A1 1 0 0 0 13.707 4L10 .293A1 1 0 0 0 9.293 0M9.5 3.5v-2l3 3h-2a1 1 0 0 1-1-1M4.5 9a.5.5 0 0 1 0-1h7a.5.5 0 0 1 0 1zM4 10.5a.5.5 0 0 1 .5-.5h7a.5.5 0 0 1 0 1h-7a.5.5 0 0 1-.5-.5m.5 2.5a.5.5 0 0 1 0-1h4a.5.5 0 0 1 0 1z"/>
                            </svg>
                         </button>
                    </div>
                </td>

            </tr>`;

      $("#tbl-requerimientos tbody").append(row);
      detalle_requerimiento.push(data);
    }
  }

  // al momento de ir ingresando valores en el input
  $("#productosInput").on(
    "input",
    debounce(async function () {
      const isChecked = $("#checkAsociarProducto").is(":checked");
      const query = $(this).val().trim();
      if (query.length >= 3 && !isChecked) {
        await buscarMateriales(query);
      } else {
        limpiarLista();
      }
    })
  );

  $("#tbl-requerimientos").on("click", ".btn-detalle-producto-editar", function () {
    const $row = $(this).closest("tr");
    const $descripcionInput = $row.find(".descripcion-input");
    const $cantidadInput = $row.find(".cantidad-input");
    const $observacionInput = $row.find(".observacion-input");

    // Habilitar los inputs
    $descripcionInput.prop("readonly", false);
    $cantidadInput.prop("readonly", false);
    $observacionInput.prop("readonly", false);

    // ACTUALIZAMOS EL ELEMENTO
    $(this)
      .removeClass("btn-warning btn-detalle-producto-editar")
      .addClass(
        "btn-success btn-detalle-producto-guardar"
      ).html(`<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-floppy-fill" viewBox="0 0 16 16">
                    <path d="M0 1.5A1.5 1.5 0 0 1 1.5 0H3v5.5A1.5 1.5 0 0 0 4.5 7h7A1.5 1.5 0 0 0 13 5.5V0h.086a1.5 1.5 0 0 1 1.06.44l1.415 1.414A1.5 1.5 0 0 1 16 2.914V14.5a1.5 1.5 0 0 1-1.5 1.5H14v-5.5A1.5 1.5 0 0 0 12.5 9h-9A1.5 1.5 0 0 0 2 10.5V16h-.5A1.5 1.5 0 0 1 0 14.5z"/>
                    <path d="M3 16h10v-5.5a.5.5 0 0 0-.5-.5h-9a.5.5 0 0 0-.5.5zm9-16H4v5.5a.5.5 0 0 0 .5.5h7a.5.5 0 0 0 .5-.5zM9 1h2v4H9z"/>
                </svg>`);
  });

  $("#tbl-requerimientos").on("click", ".btn-detalle-producto-guardar", async function () {
    const id_producto = $(this).data("producto");
    const id_odm = $(this).data("odm-id");
    const $row = $(this).closest("tr");

    const $descripcionInput = $row.find(".descripcion-input");
    const $cantidadInput = $row.find(".cantidad-input");
    const $observacionInput = $row.find(".observacion-input");

    const valueDescripcion = $descripcionInput.val();
    const valueCantidad = $cantidadInput.val();
    const valueObservacion = $observacionInput.val();

    if (valueCantidad < 0) {
      bootbox.alert("La cantidad no puede ser menor a 0");
      return;
    }

    if (id_odm) {
      try {
        await client.put(`/requerimiento/materiales/${id_odm}`, {
          odm_descripcion: valueDescripcion,
          odm_cantidad: valueCantidad,
          odm_observacion: valueObservacion,
        });
      } catch (error) {
        bootbox.alert(error.response.data.error);
        return;
      }
    } else {
      const findElementProducto = detalle_requerimiento.find((element) => element.pro_id == id_producto);
      findElementProducto["odm_descripcion"] = valueDescripcion;
      findElementProducto["odm_cantidad"] = valueCantidad;
      findElementProducto["odm_observacion"] = valueObservacion;
    }

    $descripcionInput.prop("readonly", true);
    $cantidadInput.prop("readonly", true);
    $observacionInput.prop("readonly", true);

    // ACTUALIZAMOS EL ELEMENTO
    $(this)
      .removeClass("btn-success btn-detalle-producto-guardar")
      .addClass(
        "btn-warning btn-detalle-producto-editar"
      ).html(`<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-pencil-fill" viewBox="0 0 16 16">
                        <path d="M12.854.146a.5.5 0 0 0-.707 0L10.5 1.793 14.207 5.5l1.647-1.646a.5.5 0 0 0 0-.708zm.646 6.061L9.793 2.5 3.293 9H3.5a.5.5 0 0 1 .5.5v.5h.5a.5.5 0 0 1 .5.5v.5h.5a.5.5 0 0 1 .5.5v.5h.5a.5.5 0 0 1 .5.5v.207zm-7.468 7.468A.5.5 0 0 1 6 13.5V13h-.5a.5.5 0 0 1-.5-.5V12h-.5a.5.5 0 0 1-.5-.5V11h-.5a.5.5 0 0 1-.5-.5V10h-.5a.5.5 0 0 1-.175-.032l-.179.178a.5.5 0 0 0-.11.168l-2 5a.5.5 0 0 0 .65.65l5-2a.5.5 0 0 0 .168-.11z"/>
                    </svg>`);
  });

  $("#tbl-requerimientos").on("click", ".btn-detalle-producto-eliminar", async function () {
    try {
      const id_producto = $(this).data("producto");
      const id_odm = $(this).data("odm-id");
      const $row = $(this).closest("tr");

      if (id_odm) {
        const continuar = await new Promise((resolve) => {
          bootbox.confirm({
            title: "Eliminar producto",
            message: "¿Estás seguro de querer eliminar este material?",
            callback: function (result) {
              resolve(result);
            },
          });
        });

        if (!continuar) return;

        await client.delete(`/requerimiento/materiales/${id_odm}`);
      }

      // removemos el DOM
      $row.remove();

      const findIndexElementProceso = detalle_requerimiento.findIndex((element) => element.pro_id == id_producto);
      detalle_requerimiento.splice(findIndexElementProceso, 1);
    } catch (error) {
      bootbox.alert("Error al eliminar el material");
      console.error("Error al eliminar el material:", error);
    }
  });

  $("#btn-guardar-requerimiento").on("click", async function () {
    try {
      await client.put(`/requerimiento/${oic_id}`, {
        // CABEZERA
        oic_fecha: moment($("#fechaPicker").val(), "DD/MM/YYYY").format("YYYY-MM-DD"),
        oic_fechaentregaestimada: moment($("#fechaEntregaPicker").val(), "DD/MM/YYYY").format("YYYY-MM-DD"),
        are_codigo: $("#areaSelect").val(),
        tra_idorigen: $("#responsableOrigen").val(),
        oic_otsap: $("#otInput").val(),
        mrq_codigo: $("#motivoRequerimientoSelect").val(),
        oic_equipo_descripcion: $("#equipoInput").val(),

        // DETALLE
        detalle_requerimiento,
      });
      bootbox.alert("Requerimiento actualizado correctamente");
    } catch (error) {
      bootbox.alert("Error al guardar el requerimiento");
      console.error("Error al guardar el requerimiento:", error);
    }
  });

  try {
    await Promise.all([cargarMotivosRequerimientos(), cargarAreas(), cargarResponsables(), cargarInformacionUsuario()]);

    await cargarRequerimiento();
  } catch (error) {
    bootbox.alert("Error al cargar los datos");
    console.error("Error al cargar los datos:", error);
  }
});
