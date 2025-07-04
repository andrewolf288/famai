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
        }

        .col-ot {
            width: 7%;
        }

        .col-creador {
            width: 10.20%;
        }

        .col-descripcion {
            width: 36.40%;
        }

        .col-cantidad {
            width: 7%;
        }

        .col-und {
            width: 5%;
        }

        .col-precio {
            width: 10.20%;
            text-align: right !important;
        }

        .col-total {
            width: 10.20%;
            text-align: right !important;
        }

        .page-break {
            page-break-after: always;
        }

        .bold-underline {
            font-weight: bold; /* Negrita */
            text-decoration: underline; /* Subrayado */
        }

        .parrafo {
            width: 100%;
            margin-bottom: 10px;
            font-size: 11px;
        }
        .custom-list {
            margin-left: 20px; /* Ajusta el margen izquierdo según necesites */
            list-style-type: none; /* Quita los puntos predeterminados */
        }
        .custom-list li::before {
            content: "- "; /* Agrega el guion antes del texto */
        }

        .parrafo-nota {
            width: 100%;
            font-size: 10px; 
            font-weight: bold;
            padding: 3px 40px 3px 10px;
            border: 1px solid #000;
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
                            <td style="text-align: center;font-weight: bold;font-size: 12px;padding: 3px;">ORDEN DE
                                COMPRA
                            </td>
                        </tr>
                        <tr style="border: 1px solid black;">
                            <td style="text-align: center;font-weight: bold;font-size: 12px;padding: 3px;">
                                {{ substr($ordencompra['occ_numero'], 0, 1) . '-' . substr($ordencompra['occ_numero'], 1) }}
                            </td>
                        </tr>
                    </table>
                </td>
            </tr>
        </table>
        <hr style="margin-top: 5px">
        <p style="font-size: 12px">Arequipa, {{ $occ_fecha_formateada }}</p>
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
                    <span
                        class="value">{{ $proveedor['prv_nrodocumento'] ? $proveedor['prv_nrodocumento'] : '' }}</span>
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
                    <span
                        class="value">{{ $proveedor['prv_telefono'] ? $proveedor['prv_telefono'] : '' }}{{ $proveedor['prv_whatsapp'] ? " / " . $proveedor['prv_whatsapp'] : '' }}</span>
                </div>
                <div class="info-row">
                    <span class="label">CTA S/:</span>
                    <span class="value">{{ $cuenta_soles ? $cuenta_soles['pvc_numerocuenta'] . ' (' . $cuenta_soles['entidadBancaria']['eba_descripcion'] . ')' : '' }}</span>
                </div>
                {{-- <p style="font-size: 8px">{{$cuenta_soles ? $cuenta_soles['entidadBancaria']['eba_descripcion'] : ''}}</p> --}}
                <div class="info-row">
                    <span class="label">CTA $/:</span>
                    <span class="value">{{ $cuenta_dolares ? $cuenta_dolares['pvc_numerocuenta'] . ' (' . $cuenta_dolares['entidadBancaria']['eba_descripcion'] . ')' : '' }}</span>
                </div>
                {{-- <p style="font-size: 8px">{{$cuenta_dolares ? $cuenta_dolares['entidadBancaria']['eba_descripcion'] : ''}}</p> --}}
                <div class="info-row">
                    <span class="label">CTA BCO NACION S/:</span>
                    <span class="value">{{ $cuenta_banco_nacion ? $cuenta_banco_nacion['pvc_numerocuenta'] . ' (' . $cuenta_banco_nacion['entidadBancaria']['eba_descripcion'] . ')' : '' }}</span>                </div>
                {{-- <p style="font-size: 8px">{{$cuenta_banco_nacion ? $cuenta_banco_nacion['entidadBancaria']['eba_descripcion'] : ''}}</p> --}}
            </td>
        </tr>
    </table>
    {{-- table de cabecera de factura --}}
    <table class="table-factura-cabecera">
        <tr>
            <td>
                <div class="info-row">
                    <span class="label">FEC. ENTREGA:</span>
                    <span
                        class="value">{{ $ordencompra['occ_fechaentrega'] ? DateTime::createFromFormat('Y-m-d', $ordencompra['occ_fechaentrega'])->format('d/m/Y') : '' }}</span>
                </div>
                <div class="info-row">
                    <span class="label">ELABORADO POR:</span>
                    <span
                        class="value">{{ $ordencompra['elaborador'] ? $ordencompra['elaborador']['tra_nombre'] : '' }}</span>
                </div>
            </td>
            <td>
                <div class="info-row">
                    <span class="label">MONEDA:</span>
                    <span class="value">{{ $ordencompra['moneda']['mon_descripcion'] }}</span>
                </div>
                <div class="info-row">
                    <span class="label">FORMA DE PAGO:</span>
                    <span
                        class="value">{{ $ordencompra['fpa_codigo'] ? $ordencompra['formaPago']['fpa_descripcion'] : '' }}</span>
                </div>
            </td>
            <td>
                <div class="info-row">
                    <span class="label">REFERENCIA:</span>
                    <span class="value">{{ $cotizaciones_string ?: '' }}</span>
                </div>
                <div class="info-row">
                    <span class="label">ACTIVO:</span>
                    <span class="value">{{ $ordencompra['occ_esactivo'] ? 'SI' : 'NO' }}</span>
                </div>
            </td>
        </tr>
    </table>
    {{-- Detalle de factura --}}
    <table class="table-detalle-factura">
        <thead>
            <tr>
                <th class="col-item">ITEM</th>
                <th class="col-ot">OT</th>
                <th class="col-creador">Creador</th>
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
                    <td class="col-ot">{{ $detalle['odt_numero'] ? $detalle['odt_numero'] : '' }}</td>
                    <td class="col-creador">{{ $detalle['usu_nombre'] ? $detalle['usu_nombre'] : '' }}</td>
                    <td class="col-descripcion">{{ $detalle['ocd_descripcion'] }} {!! nl2br(e($detalle['ocd_observacion'])) !!}</td>
                    <td class="col-cantidad">{{ $detalle['ocd_cantidad'] }}</td>
                    <td class="col-und">{{ $detalle['uni_codigo'] ? $detalle['uni_codigo'] : '' }}</td>
                    <td class="col-precio">{{ $detalle['ocd_preciounitario'] }}</td>
                    <td class="col-total">{{ $detalle['ocd_total'] }}</td>
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
                            SOLICITADO POR:
                            {{ $ordencompra['solicitador'] ? $ordencompra['solicitador']['tra_nombre'] : '' }}</td>
                        <td
                            style="width: 75%; height: 110px; font-size: 12px; font-weight: bold; border: 1px solid #000000; vertical-align: top; padding: 5px; text-align: center;">
                            <table style="width: 100%; height: 110px; border-collapse: collapse;">
                                <tr>
                                    @if ($ordencompra['elaborador'] && $ordencompra['elaborador']['tra_urlfirma'])
                                        <td style="width: 50%; text-align: center; vertical-align: middle;">
                                            <img src="{{ public_path('storage/' . $ordencompra['elaborador']['tra_urlfirma']) }}"
                                                style="width: 120px; height: 100px;" alt="Firma Andrew" />
                                        </td>
                                    @endif
                                    @if ($ordencompra['autorizador'] && $ordencompra['autorizador']['tra_urlfirma'])
                                        <td style="width: 50%; text-align: center; vertical-align: middle;">
                                            <img src="{{ public_path('storage/' . $ordencompra['autorizador']['tra_urlfirma']) }}"
                                                style="width: 120px; height: 100px;" alt="Firma Andrew" />
                                        </td>
                                    @endif
                                </tr>
                            </table>
                        </td>
                    </tr>
                    <tr>
                        <td style="font-size: 12px;height: 50px;font-weight: bold;border: 1px solid #000000;vertical-align: top;padding-left: 1px;"
                            colspan="2">NOTAS: {{ $ordencompra['occ_notas'] ? $ordencompra['occ_notas'] : '' }}</td>
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
                                    <td style="text-align: left; padding: 0;">SUBTOT
                                        {{ $ordencompra['moneda']['mon_simbolo'] }}</td>
                                    <td style="text-align: right; padding: 0;">{{ $ordencompra['occ_subtotal'] }}</td>
                                </tr>
                                <tr>
                                    <td style="text-align: left; padding: 0;">I.G.V.
                                        {{ $ordencompra['occ_porcentajeimpuesto'] }}%</td>
                                    <td style="text-align: right; padding: 0;">{{ $ordencompra['occ_impuesto'] }}</td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                    <tr>
                        <td
                            style="height: 20px;border: 1px solid #000000;font-size: 12px;font-weight: bold;padding: 0px 1px 0px 1px;">
                            <span style="float: left;">TOTAL {{ $ordencompra['moneda']['mon_simbolo'] }}</span>
                            <span style="float: right;">{{ $ordencompra['occ_total'] }}</span>
                        </td>
                    </tr>
                    <tr>
                        <td
                            style="height: 85px;border: 1px solid #000000;vertical-align: top;font-weight: bold;padding: 0px 2px 0px 2px;">
                            <span style="font-size:10px;">Observación de Pago:
                                {{ $ordencompra['occ_observacionpago'] ? $ordencompra['occ_observacionpago'] : '' }}</span>
                        </td>
                    </tr>
                    <tr>
                        <td
                            style="font-size: 11px;height: 50px;border: 1px solid #000000;font-weight: bold;padding: 0px 4px 0px 4px;">
                            <table style="border-collapse: collapse; width: 100%;">
                                <tr>
                                    <td style="text-align: left; padding: 0;">Adelanto:</td>
                                    <td style="text-align: right; padding: 0;">
                                        {{ $ordencompra['occ_adelanto'] ? $ordencompra['occ_adelanto'] : '' }}</td>
                                </tr>
                                <br>
                                <tr>
                                    <td style="text-align: left; padding: 0;">Saldo:</td>
                                    <td style="text-align: right; padding: 0;">
                                        {{ $ordencompra['occ_saldo'] ? $ordencompra['occ_saldo'] : '' }}</td>
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
    {{-- BREAK PAGE --}}
    <div class="page-break"></div>
    <table class="parrafo">
        <tr>
            <td class="bold-underline">ACEPTACIÓN DEL PEDIDO</td>
        </tr>
        <tr>
            <td>Confirmar al comprador responsable via correo electrónico la recepción y aceptación de la orden de compra.</td>
        </tr>
    </table>
    <table class="parrafo">
        <tr>
            <td class="bold-underline">ENTREGA EN ALMACÉN</td>
        </tr>
        <tr>
            <td>La entrega de los materiales y/o productos será en los almacenes de FAMAI Seal Jet SAC indicados por el comprador.</td>
        </tr>
    </table>
    <table class="parrafo">
        <tr>
            <td class="bold-underline">DOCUMENTACIÓN REQUERIDA</td>
        </tr>
        <tr>
            <td>Deberá presentarse:</td>
        </tr>
        <tr>
            <td>
                <ul class="custom-list">
                    <li>Factura en Original y Copia.</li>
                    <li>Guia de Remisión en Original y copia, está ultima será sellada por el personal del almacén como prueba de la recepción de los bienes.</li>
                    <li>Copia de la Orden de Compra.</li>
                </ul>
            </td>
        </tr>
    </table>
    <table class="parrafo">
        <tr>
            <td class="bold-underline">MATERIALES PELIGROSOS</td>
        </tr>
        <tr>
            <td>Todo material y/o producto calificado como "Material Peligroso", de acuerdo al R.D N°2613-2013-MTC/15 del 26 de junio del 2023, deberá contar con la Hoja MSDS.</td>
        </tr>
        <tr>
            <td>Al momento de la entrega, estos materiales deberán estar claramente identificados con rombos de seguridad y con el embalaje apropiado, según recomendación de su Ficha técnica.</td>
        </tr>
    </table>
    <table class="parrafo">
        <tr>
            <td class="bold-underline">SEGURIDAD Y SALUDO OCUPACIONAL EN EL TRABAJO</td>
        </tr>
        <tr>
            <td>De acuerdo a la Ley de Seguridad y Salud en el trabajo N°29783, el proveedor deberá presentar la siguiente documentación, previo a la descarga y entrega de la orden de compra.</td>
        </tr>
        <tr>
            <ul class="custom-list">
                <li>SCTR de todo el personal involucrado en la actividad.</li>
                <li>Procedimiento de la actividad a realizar.</li>
                <li>Matriz IPERC.</li>
                <li>Matriz de Aspectos e Impactos Ambientales.</li>
                <li>Uso correcto del EPP necesario para la actividad.</li>
            </ul>
        </tr>
    </table>
    <table class="parrafo">
        <tr>
            <td class="bold-underline">INSUMOS QUÍMICOS Y BIENES IQBF</td>
        </tr>
        <tr>
            <td>El proveedor está obligado a informar al comprador responsable de FAMAI Seal Jet si los productos de la presente orden de compra, ya sea como producto final o insumo de los productos y/o materiales a entregar, han sido debidamente catalogados como IQBF por la SUNAT.</td>
        </tr>
    </table>
    <table class="parrafo">
        <tr>
            <td class="bold-underline">CÓDIGO DE CONDUCTA</td>
        </tr>
        <tr>
            <td>El proveedor declara conocer y aceptar plenamente el código de conducta de FAMAI Seal Jet SAC detallado en el sigiente link</td>
        </tr>
    </table>
    <table class="parrafo-nota">
        <tr>
            <td>Nota:</td>
        </tr>
        <tr>
            <td>Se hace de conocimiento de nuestros proveedores que FAMAI SEAL JET S.A.C., mediante RS Nro. 000229-2024/SUNAT ha sido designado como "AGENTE DE RETENCIÓN", a partir del 01 de enero de 2025, la retención y entrega del Comprobante de Retención se realizará en el momento en que se realice el pago, con prescindencia de la fecha en que se efectuó la operación gravada con el IGV.</td>
        </tr>
    </table>
</body>

</html>
