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
            margin-top: 3cm;
            margin-left: 20px;
            margin-right: 30px;
        }

        header {
            position: fixed;
            top: 0cm;
            left: 0cm;
            right: 0cm;
            height: 3cm;
            margin-top: 20px;
            margin-bottom: 20px;
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
            border-collapse: collapse;
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
            border-collapse: collapse;
            margin-top: 3px;
            border: 1px solid black;
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
        }

        .table-detalle-factura th,
        .table-detalle-factura td {
            border: 1px solid black;
            text-align: left;
            font-size: 10px;
            padding: 5px;
        }

        /* Ajuste de las proporciones según la base de 12 */
        .col-item {
            width: 5%;
            /* 1/12 */
        }

        .col-descripcion {
            width: 53.60%;
            /* 4/12 */
        }

        .col-cantidad {
            width: 7%;
            /* 2/12 */
        }

        .col-und {
            width: 5%;
            /* 1/12 */
        }

        .col-precio {
            width: 10.20%;
            /* 2/12 */
        }

        .col-total {
            width: 10.20%;
            /* 2/12 */
        }
    </style>
</head>

<body>
    {{-- HEADER --}}
    <header>
        <table class="table-encabezado">
            <tr>
                <td style="width: 30%;">
                    <img src="{{ public_path('famai/logo-blanco-famai.jpg') }}" width="210px" height="35px">
                </td>
                <td style="width: 40%;vertical-align: bottom;text-align: center;color: #0000FF;">
                    <p style="font-weight: bold; font-size: 20px;">
                        FAMAI SEAL JET S.A.C.
                    </p>
                    <p style="font-size: 11px;">
                        CALIDAD, RAPIDEZ Y GARANTIA
                    </p>
                </td>
                <td style="width: 30%; text-align: right;">
                    <table
                        style="width:180px; border: 1px solid black; border-collapse: collapse;margin-left: auto;margin-left: auto;">
                        <tr style="border: 1px solid black;">
                            <td style="text-align: center;font-weight: bold;font-size: 12px;padding: 3px;">R.U.C.
                                20134690080</td>
                        </tr>
                        <tr style="border: 1px solid black;">
                            <td style="text-align: center;font-weight: bold;font-size: 12px;padding: 3px;">COTIZACIÓN</td>
                        </tr>
                        <tr style="border: 1px solid black;">
                            <td style="text-align: center;font-weight: bold;font-size: 12px;padding: 3px;">{{$coc_numero}}</td>
                        </tr>
                    </table>
                </td>
            </tr>
        </table>
        <hr style="margin-top: 5px">
        <p style="font-size: 12px">Arequipa, {{$coc_fecha_formateada}}</p>
    </header>
    <div class="section-title">DATOS DEL PROVEEDOR</div>
    {{-- Table de datos del proveedor --}}
    <table class="table-proveedor">
        <tr>
            <td>
                <div class="info-row">
                    <span class="label">EMPRESA:</span>
                    <span class="value">{{ $proveedor['prv_nombre'] }}</span>
                </div>
                <div class="info-row">
                    <span class="label">RUC:</span>
                    <span class="value">{{ $proveedor['prv_nrodocumento'] }}</span>
                </div>
                <div class="info-row">
                    <span class="label">DIRECCION:</span>
                    <span class="value">{{ $proveedor['prv_direccion'] }}</span>
                </div>
                <div class="info-row">
                    <span class="label">CONTACTO:</span>
                    <span class="value">{{ $proveedor['prv_contacto'] }}</span>
                </div>
            </td>
            {{-- Columna 2 --}}
            <td>
                <div class="info-row">
                    <span class="label">TLF:</span>
                    <span class="value">{{ $proveedor['prv_telefono'] }}/{{ $proveedor['prv_whatsapp'] }}</span>
                </div>
                <div class="info-row">
                    <span class="label">CTA S/:</span>
                    <span class="value"></span>
                </div>
                <div class="info-row">
                    <span class="label">CTA $/:</span>
                    <span class="value"></span>
                </div>
                <div class="info-row">
                    <span class="label">CTA BCO NACION S/:</span>
                    <span class="value"></span>
                </div>
            </td>
        </tr>
    </table>
    {{-- Detalle de factura --}}
    <table class="table-detalle-factura">
        <thead>
            <tr>
                <th class="col-item">ITEM</th>
                <th class="col-descripcion">DESCRIPCIÓN</th>
                <th class="col-cantidad">CANTID</th>
                <th class="col-und">UND</th>
                <th class="col-precio">PRECIO s/IGV</th>
                <th class="col-total">TOTAL s/IGV</th>
            </tr>
        </thead>
        <tbody>
            @foreach ($detalle_cotizacion as $material)
                <tr>
                    <td class="col-item">{{ $loop->iteration }}</td>
                    <td class="col-descripcion">{{ $material['cod_descripcion'] }}</td>
                    <td class="col-cantidad">{{ $material['cod_cantidad'] }}</td>
                    <td class="col-und">{{ $material['detalle_material']['producto'] ? $material['detalle_material']['producto']['unidad']['uni_codigo'] : ''}}</td>
                    <td class="col-precio">{{ $material['cod_preciounitario']}} </td>
                    <td class="col-total">{{ $material['cod_total'] }}</td>
                </tr>
            @endforeach

            @for ($i = count($detalle_cotizacion); $i < 32; $i++)
                <tr>
                    <td class="col-item">&nbsp;</td>
                    <td class="col-descripcion">&nbsp;</td>
                    <td class="col-cantidad">&nbsp;</td>
                    <td class="col-und">&nbsp;</td>
                    <td class="col-precio">&nbsp;</td>
                    <td class="col-total">&nbsp;</td>
                </tr>
            @endfor
        </tbody>
    </table>
    <table style="width: 100%;height: 20px;border-collapse: collapse;">
        <tr>
            <td style="width: 77.5%;"></td>
            <td style="width: 22.5%;height: 20px;border: 1px solid #000000;font-size: 12px;font-weight: bold;padding: 0px 1px 0px 1px;">
                <span style="float: left;">TOTAL S/</span>
                <span style="float: right;">{{ $coc_total }}</span>
            </td>
        </tr>
    </table>

    {{-- URL COTIZACION --}}
    {{-- @if($url_cotizacion != null)
        <p style="margin-top: 10px;margin-bottom: 10px;font-size: 12.5px;text-align: center;">Para ingresar su cotización debes abrir el siguiente enlace en un navegador: <span style="color: #0000FF">{{$url_cotizacion}}</span></p>
    @endif --}}


    <hr style="margin-top: 20px">
    <table style="width: 100%; border-collapse: collapse">
        <tr>
            <td style="width: 45%; color:#0000FF;font-size: 10px;text-align:center;">
                AREQUIPA: Jacinto Ibañez 510 Pque. Industrial <br>
                Telf. 51-054-232827 Telefax 51-054-243999 <br>
                Movil: 994689089 / 959969104 <br>
                E-mail proveedores@famaisealjet.com arequipa@famaisealjet.com
            </td>
            <td style="width: 25%; color:#0000FF;font-size: 10px;text-align:center;">
                LIMA : Ricardo Herrera 699 Lima 1 <br>
                Altura Cdra. 13 Av. Argentina <br>
                Móvil: 994689089 / 959609946
            </td>
            <td style="width: 30%; color:#0000FF;font-size: 10px;text-align:center;">
                MOQUEGUA - ILO : Urb. Tupac Amaru C-12 <br>
                Teléfono: 053-481873 • <br>
                Móvil: 964923629 / 976865311 / 959969107
            </td>
        </tr>
    </table>
</body>

</html>
