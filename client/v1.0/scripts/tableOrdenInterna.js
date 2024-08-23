//Datatable de los elementos de Orden INterna
$(document).ready(function(){
    $('#tbl-orden-interna').DataTable({
        "language": {
            "zeroRecords": "No se encontraron resultados",
            "loadingRecords": "Cargando...",
            "processing": "Procesando...",
            "emptyTable": "No hay datos disponibles en la tabla",
            "aria": {
                "sortAscending": ": activar para ordenar la columna en orden ascendente",
                "sortDescending": ": activar para ordenar la columna en orden descendente"
            }
        },
        "responsive": true,
        "order": [],
        "searching": false,
        "paging": false,
        "lengthChange": false,
        "info": false,
        "ordering": false,
        "columnDefs": [
            { "width": "70%", "targets": 0 },
            { "width": "15%", "targets": 1 },
            { "width": "15%", "targets": 2 } 
        ]
    });
});