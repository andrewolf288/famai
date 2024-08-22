$(document).ready(function() {
    //Almacena los elementos de las tablas
    var procesos = {
        "inicio": [],
        "cilindro": [],
        "vastago": [],
        "tapa": [],
        "embolo": [],
        "final": [],
        "otros": []
    };

    var allProcesos = [];
    var currentElement = "";
    var filaSeleccionada;

    //Crea el datatable
    var table = $('#selectedProcesosTable').DataTable({
        "responsive": true,
        "paging": false,
        "searching": false,
        "info": false,
        "ordering": false,
        "autoWidth": false,
        "columnDefs": [
            { "width": "8%", "targets": 0 },
            { "width": "35%", "targets": 1 },
            { "width": "20%", "targets": 2 },
            { "width": "20%", "targets": 3 },
            { "width": "17%", "targets": 4 }
        ]
    });

    //Al acceder a los procesos
    $('#tbl-orden-interna').on('click', '.btn-editar', function() {
        var fila = $(this).closest('tr');
        filaSeleccionada = $('#tbl-orden-interna tbody tr').index(fila) + 1;
        //Carga los procesos por ID
        $.ajax({
            url: './php/vistas/leerProcesosPartID.php',
            type: 'POST',
            dataType: 'json',
            contentType: 'application/json',
            data: JSON.stringify({ "oip_id": filaSeleccionada }),
            success: function(response) {
                if (response.RESPUESTA) {
                    allProcesos = response.RESPUESTA.map(function(proceso) {
                        return {
                            "codigo": proceso.opr_codigo,
                            "nombre": proceso.opr_descripcion
                        };
                    });
                    //Agrega al select todos
                    $('#procesoSelect').empty();
                    $.each(allProcesos, function(index, proceso) {
                        var procesoExists = procesos[currentElement].some(p => p.codigo === proceso.codigo);
                        if (!procesoExists) {
                            $('#procesoSelect').append(new Option(proceso.nombre, proceso.codigo));
                        }
                    });
                    //Muestra en la tabla
                    table.clear();
                    $.each(procesos[currentElement], function(index, proceso) {
                        table.row.add([
                            proceso.codigo,
                            proceso.nombre,
                            '<input type="text" class="form-control especificacion input-small" value="' + (proceso.especificacion || '') + '" disabled>',
                            '<input type="text" class="form-control observacion input-small" value="' + (proceso.observacion || '') + '" disabled>',
                            '<button class="btn btn-guardar btn-sm save-btn d-none"><i class="fa-solid fa-save"></i> Guardar</button>' +
                            ' <button class="btn btn-editar btn-sm edit-btn"><i class="fa-solid fa-edit"></i> Editar</button>' +
                            ' <button class="btn btn-eliminar btn-sm delete-btn"><i class="fa-solid fa-trash"></i> Eliminar</button>'
                        ]);
                    });
                    table.draw();
                }
            },
            error: function(error) {
                console.error('Error en la llamada AJAX:', error);
            }
        });
    });
    //Muestra
    $('#procesosModal').on('show.bs.modal', function (e) {
        var triggerLink = $(e.relatedTarget);
        currentElement = triggerLink.data('element');
    });
    //Recalcula - Responsive
    $('#procesosModal').on('shown.bs.modal', function () {
        table.columns.adjust().responsive.recalc();
    });
    //Añade el proceso a la tabla y a su lista correspondiente
    $('#addProcesoBtn').click(function() {
        var selectedProcesoCode = $('#procesoSelect').val();
        var selectedProceso = allProcesos.find(p => p.codigo === selectedProcesoCode);
        if (selectedProceso) {
            var newProceso = {
                codigo: selectedProceso.codigo,
                nombre: selectedProceso.nombre,
                especificacion: '',
                observacion: ''
            };
            procesos[currentElement].push(newProceso);
            table.row.add([
                newProceso.codigo,
                newProceso.nombre,
                '<input type="text" class="form-control especificacion input-small" value="" disabled>',
                '<input type="text" class="form-control observacion input-small" value="" disabled>',
                '<button class="btn btn-guardar btn-sm save-btn d-none"><i class="fa-solid fa-save"></i> Guardar</button>' +
                ' <button class="btn btn-editar btn-sm edit-btn"><i class="fa-solid fa-edit"></i> Editar</button>' +
                ' <button class="btn btn-eliminar btn-sm delete-btn"><i class="fa-solid fa-trash"></i> Eliminar</button>'
            ]).draw(false);

            $('#procesoSelect option[value="' + selectedProceso.codigo + '"]').remove();
        }
    });
    //Alterna entre guardar / editar el 
    function toggleEditSaveButtons($row, isEditMode) {
        $row.find('.observacion, .especificacion').prop('disabled', !isEditMode);
        $row.find('.save-btn').toggleClass('d-none', !isEditMode);
        $row.find('.edit-btn').toggleClass('d-none', isEditMode);

        var $childRow = $row.next('.child');
        if ($childRow.length) {
            $childRow.find('.observacion, .especificacion').prop('disabled', !isEditMode);
            $childRow.find('.save-btn').toggleClass('d-none', !isEditMode);
            $childRow.find('.edit-btn').toggleClass('d-none', isEditMode);
        }
    }
    //Guardar los elementos en el array
    $('#selectedProcesosTable tbody').on('click', 'button.save-btn', function () {
        var $row = $(this).closest('tr');
        if ($row.hasClass('child')) {
            $row = $row.prev();
        }

        var data = table.row($row).data();
        var procesoCode = data[0];
        var procesoIndex = procesos[currentElement].findIndex(p => p.codigo === procesoCode);
        
        var especificacion = $row.find('.especificacion').val();
        var observacion = $row.find('.observacion').val();
        
        // Guardar datos de la fila original
        if (procesoIndex >= 0) {
            procesos[currentElement][procesoIndex].especificacion = especificacion;
            procesos[currentElement][procesoIndex].observacion = observacion;
        }

        // Manejo del child si existe
        var $childRow = $row.next('.child');
        if ($childRow.length) {
            var childEspecificacion = $childRow.find('.especificacion').val();
            var childObservacion = $childRow.find('.observacion').val();

            // Guardar datos en el child
            procesos[currentElement][procesoIndex].especificacion = childEspecificacion || especificacion; // Prioriza el child si tiene valor
            procesos[currentElement][procesoIndex].observacion = childObservacion || observacion; // Prioriza el child si tiene valor
        }

        toggleEditSaveButtons($row, false);
    });
    //Editar elemento
    $('#selectedProcesosTable tbody').on('click', 'button.edit-btn', function () {
        var $row = $(this).closest('tr');
        if ($row.hasClass('child')) {
            $row = $row.prev();
        }

        toggleEditSaveButtons($row, true);
    });
    //Eliminar y agrega al dropdown
    $('#selectedProcesosTable tbody').on('click', 'button.delete-btn', function () {
        var $row = $(this).closest('tr');
        if ($row.hasClass('child')) {
            $row = $row.prev();
        }
        var data = table.row($row).data();
        var procesoCode = data[0];

        procesos[currentElement] = procesos[currentElement].filter(p => p.codigo !== procesoCode);
        table.row($row).remove().draw();

        var removedProceso = allProcesos.find(p => p.codigo === procesoCode);
        $('#procesoSelect').append(new Option(removedProceso.nombre, removedProceso.codigo));
    });
});
