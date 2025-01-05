<!DOCTYPE html>
<html lang="es">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>PDF de Prueba</title>
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
                            <td style="text-align: center;font-weight: bold;font-size: 12px;padding: 3px;">ORDEN DE COMPRA
                            </td>
                        </tr>
                        <tr style="border: 1px solid black;">
                            <td style="text-align: center;font-weight: bold;font-size: 12px;padding: 3px;">L- {{$ordencompra["occ_numero"]}}
                            </td>
                        </tr>
                    </table>
                </td>
            </tr>
        </table>
        <hr style="margin-top: 5px">
        <p style="font-size: 12px">Arequipa, {{$occ_fecha_formateada}}</p>
    </header>
    <div class="section-title">DATOS DEL PROVEEDOR</div>
    {{-- Table de datos del proveedor --}}
    <table class="table-proveedor">
        <tr>
            <td>
                <div class="info-row">
                    <span class="label">EMPRESA:</span>
                    <span class="value">{{ $proveedor['prv_nombre'] ? $proveedor['prv_nombre'] : '' }}</span>
                </div>
                <div class="info-row">
                    <span class="label">RUC:</span>
                    <span class="value">{{ $proveedor['prv_nrodocumento'] ? $proveedor['prv_nrodocumento'] : '' }}</span>
                </div>
                <div class="info-row">
                    <span class="label">DIRECCION:</span>
                    <span class="value">{{ $proveedor['prv_direccion'] ? $proveedor['prv_direccion'] : '' }}</span>
                </div>
                <div class="info-row">
                    <span class="label">CONTACTO:</span>
                    <span class="value">{{ $proveedor['prv_contacto'] ? $proveedor['prv_contacto'] : '' }}</span>
                </div>
            </td>
            {{-- Columna 2 --}}
            <td>
                <div class="info-row">
                    <span class="label">TLF:</span>
                    <span class="value">{{ $proveedor['prv_telefono'] ? $proveedor['prv_telefono'] : '' }}/{{ $proveedor['prv_whatsapp'] ? $proveedor['prv_whatsapp'] : '' }}</span>
                </div>
                <div class="info-row">
                    <span class="label">CTA S/:</span>
                    <span class="value">{{ $cuenta_soles ? $cuenta_soles['pvc_numerocuenta'] : '' }}</span>
                </div>
                <div class="info-row">
                    <span class="label">CTA $/:</span>
                    <span class="value">{{ $cuenta_dolares ? $cuenta_dolares['pvc_numerocuenta'] : '' }}</span>
                </div>
                <div class="info-row">
                    <span class="label">CTA BCO NACION S/:</span>
                    <span class="value">{{ $cuenta_banco_nacion ? $cuenta_banco_nacion['pvc_numerocuenta'] : '' }}</span>
                </div>
            </td>
        </tr>
    </table>
    {{-- table de cabecera de factura --}}
    <table class="table-factura-cabecera">
        <tr>
            <td>
                <div class="info-row">
                    <span class="label">FEC. ENTREGA:</span>
                    <span class="value">{{$ordencompra["occ_fechaentrega"] ? DateTime::createFromFormat('Y-m-d', $ordencompra["occ_fechaentrega"])->format('d/m/Y'): ''}}</span>
                </div>
                <div class="info-row">
                    <span class="label">ELABORADO POR:</span>
                    <span class="value">{{$ordencompra["elaborador"] ? $ordencompra['elaborador']['tra_nombre'] : ''}}</span>
                </div>
            </td>
            <td>
                <div class="info-row">
                    <span class="label">Moneda</span>
                    <span class="value">{{$ordencompra['moneda']['mon_descripcion']}}</span>
                </div>
                <div class="info-row">
                    <span class="label">FORMA DE PAGO</span>
                    <span class="value">{{$ordencompra["occ_formapago"] ? $ordencompra["occ_formapago"] : '' }}</span>
                </div>
            </td>
            <td>
                <div class="info-row">
                    <span class="label">REFERENCIA</span>
                    <span class="value">{{$ordencompra["occ_referencia"] ? $ordencompra["occ_referencia"] : ''}}</span>
                </div>
                <div class="info-row">
                    <span class="label">ACTIVO:</span>
                    <span class="value">{{$ordencompra["occ_activo"] == 1 ? 'Activo' : 'Inactivo'}}</span>
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
            @foreach ($detalle_ordencompra as $index => $detalle)
                <tr>
                    <td class="col-item">{{ $loop->iteration }}</td>
                    <td class="col-descripcion">{{ $detalle['ocd_descripcion'] }}</td>
                    <td class="col-cantidad">{{ $detalle['ocd_cantidad'] }}</td>
                    <td class="col-und">{{ $detalle['uni_codigo'] ? $detalle['uni_codigo'] : '' }}</td>
                    <td class="col-precio">{{$detalle['ocd_preciounitario']}}</td>
                    <td class="col-total">{{$detalle['ocd_total']}}</td>
                </tr>
            @endforeach
        </tbody>
    </table>
    <table style="width: 100%;height: 210px;border-collapse: collapse;">
        <tr>
            <td style="width: 77.5%;">
                <table style="border-collapse: collapse">
                    <tr>
                        <td
                            style="width: 25%;height: 110px;font-size: 12px; font-weight: bold;border: 1px solid #000000;vertical-align: top;padding-left: 1px;">
                            SOLICITADO POR: {{$ordencompra["solicitador"] ? $ordencompra["solicitador"]['tra_nombre'] : ''}}</td>
                        <td
                            style="width: 75%;height: 110px;font-size: 12px; font-weight: bold;border: 1px solid #000000;vertical-align: top;padding-left: 1px;">
                            AUTORIZADO POR: {{$ordencompra["autorizador"] ? $ordencompra["autorizador"]['tra_nombre'] : ''}}</td>
                    </tr>
                    <tr>
                        <td style="font-size: 12px;height: 50px;font-weight: bold;border: 1px solid #000000;vertical-align: top;padding-left: 1px;"
                            colspan="2">NOTAS: {{$ordencompra["occ_notas"] ? $ordencompra["occ_notas"] : ''}}</td>
                    </tr>
                    <tr>
                        <td style="font-size: 9px;height: 50px;border: 1px solid #000000;padding-left: 1px;"
                            colspan="2">
                            <span style="font-weight: bold;">COLOCAR EL NUMERO DE ORDEN DE COMPRA EN LA
                                FACTURA.</span><br>
                            SIRVANSE ENTREGAR EL MATERIAL DEBIDAMENTE EMBALADO Y ROTULADO CON EL NUMERO DE ORDEN DE
                            COMPRA Y LA CANTIDAD DE PAQUETES QUE SE ENTREGAN DE ACUERDO A LO SIGUIENTE : REFERENCIA DE
                            O/C (ADJUNTANDO GUIA DE REMISION Y FACTURA ORIGINAL MAS TRES COPIAS).
                        </td>
                    </tr>
                </table>
            </td>
            <td style="width: 22.5%;">
                <table style="border-collapse: collapse; width: 100%;">
                    <tr>
                        <td
                            style="height: 55px;border: 1px solid #000000;font-size: 12px;font-weight: bold;vertical-align: top;padding: 0px 1px 0px 1px">
                            <table style="border-collapse: collapse; width: 100%;">
                                <tr>
                                    <td style="text-align: left; padding: 0;">SUBTOT {{$ordencompra["moneda"]["mon_simbolo"]}}</td>
                                    <td style="text-align: right; padding: 0;">{{$ordencompra["occ_subtotal"]}}</td>
                                </tr>
                                <tr>
                                    <td style="text-align: left; padding: 0;">I.G.V. {{$ordencompra["occ_porcentajeimpuesto"]}}%</td>
                                    <td style="text-align: right; padding: 0;">{{$ordencompra["occ_impuesto"]}}</td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                    <tr>
                        <td
                            style="height: 20px;border: 1px solid #000000;font-size: 12px;font-weight: bold;padding: 0px 1px 0px 1px;">
                            <span style="float: left;">TOTAL {{$ordencompra["moneda"]["mon_simbolo"]}}</span>
                            <span style="float: right;">{{$ordencompra["occ_total"]}}</span>
                        </td>
                    </tr>
                    <tr>
                        <td
                            style="height: 85px;border: 1px solid #000000;vertical-align: top;font-weight: bold;padding: 0px 2px 0px 2px;">
                            <span style="font-size:10px;">Observación de Pago: {{$ordencompra["occ_observacionpago"] ? $ordencompra["occ_observacionpago"] : ''}}</span>
                        </td>
                    </tr>
                    <tr>
                        <td
                            style="font-size: 11px;height: 50px;border: 1px solid #000000;font-weight: bold;padding: 0px 4px 0px 4px;">
                            <table style="border-collapse: collapse; width: 100%;">
                                <tr>
                                    <td style="text-align: left; padding: 0;">Adelanto:</td>
                                    <td style="text-align: right; padding: 0;">{{$ordencompra["occ_adelanto"] ? $ordencompra["occ_adelanto"] : ''}}</td>
                                </tr>
                                <br>
                                <tr>
                                    <td style="text-align: left; padding: 0;">Saldo:</td>
                                    <td style="text-align: right; padding: 0;">{{$ordencompra["occ_saldo"] ? $ordencompra["occ_saldo"] : ''}}</td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
    <hr style="margin-top: 5px">
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
