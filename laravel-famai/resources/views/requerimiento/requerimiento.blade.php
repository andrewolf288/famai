<!DOCTYPE html>
<html lang="es">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Requerimiento</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: Arial, sans-serif;
            margin-top: 1.5cm;
            margin-left: 10px;
            margin-right: 10px;
            margin-bottom: 0.5cm;
        }

        header {
            position: fixed;
            top: 0cm;
            left: 0cm;
            right: 0cm;
            height: 1.5cm;
            margin-top: 20px;
            margin-bottom: 20px;
            margin-left: 10px;
            margin-right: 10px;
        }

        footer {
            position: fixed;
            bottom: 0cm;
            left: 0cm;
            right: 0cm;
            height: 1.5cm;
            margin-left: 20px;
            margin-right: 30px;
        }

        .table-encabezado {
            width: 100%;
            border-collapse: collapse;
        }

        .section-title {
            text-align: center;
            background-color: #C0C0C0;
            font-size: 15px;
            font-weight: bold;
            border: 1px solid black;
        }

        .table-proveedor {
            width: 100%;
            border: 1px solid black;
            border-spacing: 5px 10px;
        }

        .table-proveedor td {
            vertical-align: top;
            width: 50%;
        }

        .info-row {
            display: table;
            width: 100%;
            margin-bottom: 10px;
        }

        .label {
            display: table-cell;
            width: 33.33%;
            font-weight: bold;
            font-size: 10px
        }

        .value {
            display: table-cell;
            width: 66.66%;
            font-size: 10px
        }

        .table-factura-cabecera {
            width: 100%;
            border: 1px solid black;
            border-spacing: 5px 10px;
        }

        .table-factura-cabecera td {
            vertical-align: top;
            width: 33.33%;
        }

        .table-factura-cabecera td {
            vertical-align: top;
            width: 33.33%;
        }

        /* Estilos para la tabla de detalles de factura */
        .table-detalle-factura {
            width: 100%;
            border-collapse: collapse;
            border: 1px solid black;
        }

        .table-detalle-factura thead {
            background-color: #C0C0C0;
            display: table-header-group;
        }

        .table-detalle-factura th,
        .table-detalle-factura td {
            border: 1px solid black;
            text-align: left;
            font-size: 10px;
            padding: 5px;
        }

        .col-item {
            width: 3%;
        }

        .col-descripcion {
            width: 43%;
        }

        .col-observacion {
            width: 47%;
        }

        .col-cantidad {
            width: 4%;
        }

        .col-und {
            width: 3%;
        }
    </style>
</head>

<body>
    {{-- HEADER --}}
    <header>
        <table class="table-encabezado">
            <tr>
                <td style="text-align: left" style="font-size: 12px;"><span style="font-weight: bold;">Usu.
                        impresión:</span> {{ $usuarioImpresion }}</td>
            </tr>
            <tr>
                <td style="text-align: left" style="font-size: 12px;"><span style="font-weight: bold;">Fecha y hora
                        impresión:</span> {{ $fechaHoraImpresion }}</td>
            </tr>
        </table>
    </header>
    <hr style="margin-top: 5px">
    <p style="font-size: 12px; text-align: right">Arequipa, {{ $fechaActual }}</p>
    {{-- table de cabecera de factura --}}
    <div class="section-title" style="margin-top: 5px;">DATOS DEL REQUERIMIENTO</div>
    <table class="table-factura-cabecera">
        <tr>
            <td style="font-weight: bold;font-size: 10px">NUM. REQUERIMIENTO:</td>
            <td style="font-size: 10px">{{ $requerimiento['odt_numero'] }}</td>
            <td style="font-weight: bold;font-size: 10px">ÁREA:</td>
            <td style="font-size: 10px">{{ $requerimiento['area'] ? $requerimiento['area']['are_descripcion'] : '' }}</td>
        </tr>
        <tr>
            <td style="font-weight: bold;font-size: 10px">FEC. ELABORACIÓN</td>
            <td style="font-size: 10px">{{ $requerimiento['oic_fecha'] ? DateTime::createFromFormat('Y-m-d', $requerimiento['oic_fecha'])->format('d/m/Y'): '' }}</td>
            <td style="font-weight: bold;font-size: 10px">FEC. ENTREGA:</td>
            <td style="font-size: 10px">{{ $requerimiento['oic_fechaentregaestimada'] ? DateTime::createFromFormat('Y-m-d', $requerimiento['oic_fechaentregaestimada'])->format('d/m/Y'): '' }}</td>
        </tr>
        <tr>
            <td style="font-weight: bold;font-size: 10px">ELABORADO POR:</td>
            <td style="font-size: 10px">{{ $requerimiento['trabajadorOrigen'] ? $requerimiento['trabajadorOrigen']['tra_nombre']: '' }}</td>
            <td style="font-weight: bold;font-size: 10px">MOTIVO:</td>
            <td style="font-size: 10px">{{ $requerimiento['motivoRequerimiento'] ? $requerimiento['motivoRequerimiento']['mrq_descripcion'] : '' }}</td>
        </tr>
        <tr>
            <td style="font-weight: bold;font-size: 10px">OBSERVACIÓN:</td>
            <td colspan="5" style="font-size: 10px">{!! nl2br(e($requerimiento['oic_equipo_descripcion'])) !!}</td>
        </tr>
    </table>
    {{-- Detalle de factura --}}
    <table class="table-detalle-factura" style="margin-top: 5px;">
        <thead>
            <tr>
                <th class="col-item" style="text-align: center;">ITEM</th>
                <th class="col-descripcion">DESCRIPCIÓN</th>
                <th class="col-und" style="text-align: center;">UND</th>
                <th class="col-cantidad" style="text-align: center;">CANT.</th>
                <th class="col-observacion">OBSERVACIÓN</th>
            </tr>
        </thead>
        <tbody>
            @foreach ($detalleMateriales as $index => $detalle)
                <tr>
                    <td class="col-item" style="text-align: center;">{{ $loop->iteration }}</td>
                    <td class="col-descripcion">{{ $detalle['odm_descripcion'] }}</td>
                    <td class="col-und" style="text-align: center;">{{ $detalle['uni_codigo'] }}</td>
                    <td class="col-cantidad" style="text-align: center;">{{ $detalle['odm_cantidad'] }}</td>
                    <td class="col-observacion">{!! nl2br(e($detalle['odm_observacion'])) !!}</td>
                </tr>
            @endforeach
        </tbody>
    </table>
</body>

</html>
