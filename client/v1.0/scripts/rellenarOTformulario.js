//Dado un OT rellena campos faltantes
$(document).ready(function() {
    console.log("search")
    const ordenInterna = {
        odt_numero: 0,
        cliente: {
            cli_id: 0,
            cli_nombre: '',
            cli_nrodocumento: ''
        },
        area: {
            are_codigo: 0,
            are_descripcion: ''
        },
        detalle_partes: []
    }

    $('#searchButton').click(function() {
        console.log("Search button clicked");
        // Obtener el valor del campo de texto
        var otValue = $('#oi-ot-input').val().trim();

        // Validar si el campo está vacío
        if (otValue === '') {
            alert('Por favor, ingrese un valor para buscar.');
            return; // Salir de la función si el campo está vacío
        }

        // Realizar la solicitud AJAX
        // $.ajax({
        //     url: 'TU_ENDPOINT_AQUI', // Reemplaza con la URL del endpoint
        //     type: 'GET',
        //     data: { ot: otValue }, // Envía el valor del campo de texto como parámetro
        //     success: function(response) {
        //         // Manejar la respuesta aquí
        //         console.log('Respuesta del servidor:', response);
        //         // Puedes actualizar el DOM con los datos recibidos aquí
        //     },
        //     error: function(xhr, status, error) {
        //         // Manejar errores aquí
        //         console.error('Error en la solicitud AJAX:', status, error);
        //     }
        // });

        ordenInterna["odt_numero"] = 1;
        ordenInterna["cliente"]["cli_id"] = 2;  
        ordenInterna["cliente"]["cli_nombre"] = "Rosa Apipa Jacobo";
        $('#clienteInput').val() = "Rosa Apipa Jacobo";
        ordenInterna["cliente"]["cli_nrodocumento"] = "20192381293";
    });

    // $.ajax({
    //     url: './php/vistas/leerOTlista.php',
    //     type: 'GET',
    //     dataType: 'json',
    //     success: function(response) {
    //         if (response.ORDENES && response.ORDENES.length > 0) {
    //             $('#otSelect').empty();
    //             $('#otSelect').append('<option selected>Seleccionar OT</option>'); // Agregar opción por defecto

    //             $.each(response.ORDENES, function(index, orden) {
    //                 $('#otSelect').append('<option value="' + orden.ord_numero + '">OT ' + orden.ord_numero + '</option>');
    //             });
    //         }
    //     },
    //     error: function(xhr, status, error) {
    //         console.error('Error al obtener los datos:', error);
    //     }
    // });
    //Obtiene datos de la fecha cliente y equipo, y los muestra
    // $('#otSelect').change(function() {
    //     var selectedOT = $(this).val();

    //     if (selectedOT !== 'Seleccionar OT') {
    //         $.ajax({
    //             url: './php/vistas/LeerFechaClienteEquipo.php',
    //             type: 'POST',
    //             contentType: 'application/json',
    //             dataType: 'json',
    //             data: JSON.stringify({ ord_numero: selectedOT }),
    //             success: function(response) {
    //                 if (response.RESPUESTA && response.RESPUESTA.length > 0) {
    //                     var data = response.RESPUESTA[0];

    //                     $('#clienteInput').val(data.cli_nombre);
                        
    //                     var date = new Date(data.oic_fecha.date);
    //                     var formattedDate = date.toISOString().split('T')[0];
    //                     $('#fechaPicker').val(formattedDate);

    //                     $('#equipoInput').val(data.oic_equipo_descripcion);
    //                 }
    //             },
    //             error: function(xhr, status, error) {
    //                 console.error('Error al obtener los datos:', error);
    //             }
    //         });
    //     }
    // });
});