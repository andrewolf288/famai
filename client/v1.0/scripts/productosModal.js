$(document).ready(function() {
    //Almacena los elementos de las tablas
    var productos = {
        "inicio": [],
        "cilindro": [],
        "vastago": [],
        "tapa": [],
        "embolo": [],
        "final": [],
        "otros": []
    };

    var allProducts = [];
    var currentElement = "";
    //Crea el datatable
    var table = $('#selectedProductsTable').DataTable({
        "responsive": true,
        "paging": false,
        "searching": false,
        "info": false,
        "ordering": false,
        "autoWidth": false,
        "columnDefs": [
            { "width": "8%", "targets": 0 },
            { "width": "23%", "targets": 1 },
            { "width": "20%", "targets": 2 },
            { "width": "12%", "targets": 3 },
            { "width": "20%", "targets": 4 },
            { "width": "17%", "targets": 5 }
        ]
    });
    //Al acceder a los productos
    function loadProductsIntoSelect() {
        //Carga los productos por ID
        $.getJSON('./php/vistas/leerproductos.php', function(response) {
            console.log(response)
            if (response && response.RESPUESTA) {
                allProducts = response.RESPUESTA;
                $.each(allProducts, function(index, product) {
                    var productExists = productos[currentElement].some(p => p.codigo === product.pro_id);
                    if (!productExists) {
                         //Agrega al select todos
                        $('#productoSelect').append(new Option(product.pro_descripcion, product.pro_id));
                    }
                });
            }
        });
    }
    //Tabla con los productos
    $('#productosModal').on('show.bs.modal', function (e) {
        var triggerLink = $(e.relatedTarget);
        currentElement = triggerLink.data('element');
        
        $('#productoSelect').empty();
        loadProductsIntoSelect();
        //Muestra en la tabla
        table.clear();
        $.each(productos[currentElement], function(index, product) {
            table.row.add([
                product.codigo,
                product.nombre,
                '<input type="text" class="form-control descripcion input-small" value="' + (product.descripcion || '') + '" disabled>',
                '<input type="number" class="form-control cantidad input-small" value="' + (product.cantidad || '') + '" disabled>',
                '<input type="text" class="form-control observacion input-small" value="' + (product.observacion || '') + '" disabled>',
                '<button class="btn btn-guardar btn-sm save-btn d-none"><i class="fa-solid fa-save"></i> Guardar</button>' +
                ' <button class="btn btn-editar btn-sm edit-btn"><i class="fa-solid fa-edit"></i> Editar</button>' +
                ' <button class="btn btn-eliminar btn-sm delete-btn"><i class="fa-solid fa-trash"></i> Eliminar</button>'
            ]).draw(false);
        });
        table.draw();
    });
    //Recalcula responsive
    $('#productosModal').on('shown.bs.modal', function () {
        table.columns.adjust().responsive.recalc();
    });
    //AAñade el producto a la tabla y a su lista correspondiente
    $('#addProductBtn').click(function() {
        var selectedProductCode = $('#productoSelect').val();
        var selectedProduct = allProducts.find(p => p.pro_id === selectedProductCode);
        if (selectedProduct) {
            var newProduct = {
                codigo: selectedProduct.pro_id,
                nombre: selectedProduct.pro_descripcion,
                descripcion: '',
                cantidad: '',
                observacion: ''
            };
            productos[currentElement].push(newProduct);
            table.row.add([
                newProduct.codigo,
                newProduct.nombre,
                '<input type="text" class="form-control descripcion input-small" value="" disabled>',
                '<input type="number" class="form-control cantidad input-small" value="" disabled>',
                '<input type="text" class="form-control observacion input-small" value="" disabled>',
                '<button class="btn btn-guardar btn-sm save-btn d-none"><i class="fa-solid fa-save"></i> Guardar</button>' +
                ' <button class="btn btn-editar btn-sm edit-btn"><i class="fa-solid fa-edit"></i> Editar</button>' +
                ' <button class="btn btn-eliminar btn-sm delete-btn"><i class="fa-solid fa-trash"></i> Eliminar</button>'
            ]).draw(false);

            $('#productoSelect option[value="' + selectedProduct.codigo + '"]').remove();
        }
    });

    //Alterna entre guardar / editar el 
    function toggleEditSaveButtons($row, isEditMode) {
        $row.find('.descripcion, .cantidad, .observacion').prop('disabled', !isEditMode);
        $row.find('.save-btn').toggleClass('d-none', !isEditMode);
        $row.find('.edit-btn').toggleClass('d-none', isEditMode);

        var $childRow = $row.next('.child');
        if ($childRow.length) {
            $childRow.find('.descripcion, .cantidad, .observacion').prop('disabled', !isEditMode);
            $childRow.find('.save-btn').toggleClass('d-none', !isEditMode);
            $childRow.find('.edit-btn').toggleClass('d-none', isEditMode);
        }
    }

    //Guardar los elementos en el array
    $('#selectedProductsTable tbody').on('click', 'button.save-btn', function () {
        var $row = $(this).closest('tr');
        if ($row.hasClass('child')) {
            $row = $row.prev();
        }

        var data = table.row($row).data();
        var productCode = data[0];
        var productIndex = productos[currentElement].findIndex(p => p.codigo === productCode);
        
        var descripcion = $row.find('.descripcion').val();
        var cantidad = $row.find('.cantidad').val();
        var observacion = $row.find('.observacion').val();
        
        if (productIndex >= 0) {
            productos[currentElement][productIndex].descripcion = descripcion;
            productos[currentElement][productIndex].cantidad = cantidad;
            productos[currentElement][productIndex].observacion = observacion;
        }

        var $childRow = $row.next('.child');
        if ($childRow.length) {
            var childDescripcion = $childRow.find('.descripcion').val();
            var childCantidad = $childRow.find('.cantidad').val();
            var childObservacion = $childRow.find('.observacion').val();

            productos[currentElement][productIndex].descripcion = childDescripcion || descripcion;
            productos[currentElement][productIndex].cantidad = childCantidad || cantidad;
            productos[currentElement][productIndex].observacion = childObservacion || observacion;
        }

        toggleEditSaveButtons($row, false);
    });

    //Editar elemento
    $('#selectedProductsTable tbody').on('click', 'button.edit-btn', function () {
        var $row = $(this).closest('tr');
        if ($row.hasClass('child')) {
            $row = $row.prev();
        }

        toggleEditSaveButtons($row, true);
    });

    //Eliminar y agrega al dropdown
    $('#selectedProductsTable tbody').on('click', 'button.delete-btn', function () {
        var $row = $(this).closest('tr');
        if ($row.hasClass('child')) {
            $row = $row.prev();
        }
        var data = table.row($row).data();
        var productCode = data[0];

        productos[currentElement] = productos[currentElement].filter(p => p.codigo !== productCode);
        table.row($row).remove().draw();

        var removedProduct = allProducts.find(p => p.pro_id === productCode);
        $('#productoSelect').append(new Option(removedProduct.pro_descripcion, removedProduct.pro_id));
    });
});
