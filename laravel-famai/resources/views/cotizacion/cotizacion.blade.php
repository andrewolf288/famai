<!DOCTYPE html>
<html lang="es">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Cotizacion proveedor</title>
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
            width: 22%;
        }

        .col-observacion {
            width: 26%;
        }

        .col-observacion-proveedor {
            width: 26%;
        }

        .col-cantidad {
            width: 4%;
        }

        .col-und {
            width: 3%;
        }

        .col-precio {
            width: 6%;
        }

        .col-total {
            width: 6%;
        }

        .col-tiempoentrega {
            width: 4%;
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
    <div class="section-title">DATOS DEL PROVEEDOR</div>
    {{-- Table de datos del proveedor --}}
    <table class="table-proveedor">
        <tr>
            <td></td>
            <td></td>
            <td></td>
            <td></td>
            <td></td>
            <td></td>
        </tr>
        <tr>
            <td style="font-weight: bold;font-size: 10px">EMPRESA:</td>
            <td colspan="2" style="font-size: 10px">{{ $proveedor['prv_nombre'] }}</td>
            <td style="font-weight: bold;font-size: 10px">TLF:</td>
            <td colspan="2" style="font-size: 10px">{{ $proveedor['prv_telefono'] }} /
                {{ $proveedor['prv_whatsapp'] }}</td>
        </tr>
        <tr>
            <td style="font-weight: bold;font-size: 10px">RUC:</td>
            <td colspan="2" style="font-size: 10px">{{ $proveedor['prv_nrodocumento'] }}</td>
            <td style="font-weight: bold;font-size: 10px">CTA S/:</td>
            <td colspan="2" style="font-size: 10px"></td>
        </tr>
        <tr>
            <td style="font-weight: bold;font-size: 10px">DIRECCION:</td>
            <td colspan="2" style="font-size: 10px">{{ $proveedor['prv_direccion'] }}</td>
            <td style="font-weight: bold;font-size: 10px">CTA $/:</td>
            <td colspan="2" style="font-size: 10px"></td>
        </tr>
        <tr>
            <td style="font-weight: bold;font-size: 10px">CONTACTO:</td>
            <td colspan="2" style="font-size: 10px">{{ $proveedor['prv_contacto'] }}</td>
            <td style="font-weight: bold;font-size: 10px">CTA BCO NACION S/:</td>
            <td colspan="2" style="font-size: 10px"></td>
        </tr>
    </table>
    {{-- table de cabecera de factura --}}
    <div class="section-title" style="margin-top: 5px;">DATOS DE LA COTIZACIÓN</div>
    <table class="table-factura-cabecera">
        <tr>
            <td style="font-weight: bold;font-size: 10px">COT. PROVEEDOR:</td>
            <td style="font-size: 10px"></td>
            <td style="font-weight: bold;font-size: 10px">MONEDA:</td>
            <td style="font-size: 10px"></td>
            <td style="font-weight: bold;font-size: 10px">ELABORADO POR:</td>
            <td style="font-size: 10px"></td>
        </tr>
        <tr>
            <td style="font-weight: bold;font-size: 10px">FECH. VALIDEZ</td>
            <td style="font-size: 10px"></td>
            <td style="font-weight: bold;font-size: 10px">FORMA DE PAGO:</td>
            <td style="font-size: 10px"></td>
            <td style="font-weight: bold;font-size: 10px">CORREO CONTACTO:</td>
            <td style="font-size: 10px"></td>
        </tr>
        <tr>
            <td style="font-weight: bold;font-size: 10px">DETALLE PAGO:</td>
            <td colspan="5" style="font-size: 10px"></td>
        </tr>
        <tr>
            <td style="font-weight: bold;font-size: 10px">LUGAR DE ENTREGA:</td>
            <td colspan="5" style="font-size: 10px"></td>
        </tr>
    </table>
    {{-- Detalle de factura --}}
    <table class="table-detalle-factura" style="margin-top: 5px;">
        <thead>
            <tr>
                <th class="col-item" style="text-align: center;">ITEM</th>
                <th class="col-descripcion">DESCRIPCIÓN</th>
                <th class="col-observacion">OBSERVACIÓN</th>
                <th class="col-observacion-proveedor">OBS. PROVEEDOR</th>
                <th class="col-tiempoentrega" style="text-align: center;">TIEMP</th>
                <th class="col-und" style="text-align: center;">UND</th>
                <th class="col-cantidad" style="text-align: center;">CANT.</th>
                <th class="col-precio" style="text-align: center;">PRE. s/IGV</th>
                <th class="col-total" style="text-align: center;">TOT. s/IGV</th>
            </tr>
        </thead>
        <tbody>
            @foreach ($detalleMateriales as $material)
                <tr>
                    <td class="col-item" style="text-align: center;">{{ $material['cod_orden'] }}</td>
                    <td class="col-descripcion">{{ $material['cod_descripcion'] }}</td>
                    <td class="col-observacion">{!! nl2br(e($material['cod_observacion'])) !!}</td>
                    <td class="col-observacion-proveedor">&nbsp;</td>
                    <th class="col-tiempoentrega" style="text-align: center;">&nbsp;</th>
                    <td class="col-und" style="text-align: center;">{{ $material['uni_codigo'] }}</td>
                    <td class="col-cantidad" style="text-align: center;">{{ $material['cod_cantidad'] }}</td>
                    <td class="col-precio">&nbsp;</td>
                    <td class="col-total">&nbsp;</td>
                </tr>
            @endforeach
        </tbody>
    </table>
    <table style="width: 100%;height: 20px;border-collapse: collapse;">
        <tr>
            <td style="width: 88.25%;"></td>
            <td
                style="width: 11.75%;height: 20px;border: 1px solid #000000;font-size: 12px;font-weight: bold;padding: 0px 1px 0px 1px;">
                <span style="float: left;">TOTAL</span>
                <span style="float: right;"></span>
            </td>
        </tr>
    </table>

    {{-- URL COTIZACION --}}
    @if ($url_cotizacion != null)
        <p style="margin-top: 10px;margin-bottom: 10px;font-size: 12.5px;text-align: center;">Para ingresar su
            cotización debes abrir el siguiente enlace en un navegador: <span
                style="color: #0000FF">{{ $url_cotizacion }}</span></p>
    @endif

    {{-- NOTA DE COTIZACION --}}
    <div style="font-size: 15px;font-weight: bold;margin-top: 10px;">NOTA:</div>
    <p style="font-size: 12px;"></p>

</body>

</html>
