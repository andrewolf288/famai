<!DOCTYPE html>
<html lang="es">

<head>
    <meta charset="UTF-8">
    <title>Reporte Orden Interna</title>
    <style>
        * {
            font-family: sans-serif;
            font-size: 8pt;
            box-sizing: border-box;
        }

        .table-container-encabezado {
            width: 100%;
            border-collapse: collapse;
            border: 0.5mm solid #888888;
        }

        .table-container-encabezado td {
            border: 0.5mm solid #888888;
        }

        .table-container-secundario {
            width: 100%;
            border-collapse: collapse;
            font-size: 8pt;
        }

        .table-container-secundario td {
            text-align: left;
            padding-left: 5px;
        }

        .font-principal {
            font-size: 14pt;
        }

        .font-secundario {
            font-size: 8pt;
        }

        .table-container-informacion {
            width: 100%;
            border-collapse: collapse;
            font-size: 8pt;
        }

        .table-container-informacion td {
            padding-left: 2px;
            padding-top: 1px;
            padding-bottom: 1px;
            border: 0.5mm solid #888888;
        }

        .table-container-responsable {
            width: 100%;
            border-collapse: collapse;
            font-size: 8pt;
        }

        .table-container-responsable td {
            text-align: center;
            border: 0.5mm solid #888888;
            padding-top: 2px;
            padding-bottom: 2px;
        }

        .table-container-detalle {
            width: 100%;
            border-collapse: collapse;
            font-size: 8pt;
        }

        .table-container-detalle thead td {
            border: 0.5mm solid #888888;
        }

        .border-full {
            border: 0.5mm solid #888888;
        }

        .table-container-detalle thead td {
            text-align: center;
            font-weight: bold;
        }

        .table-container-footer {
            width: 100%;
            border-collapse: collapse;
            font-size: 7.5pt;
            border-top: 0.5mm solid #888888;
        }

        .table-container-detalle, .table-container-detalle tbody {
            page-break-inside: auto;
        }
        .table-container-detalle tr {
            page-break-inside: avoid;
            page-break-after: auto;
        }
        .table-container-detalle td {
            page-break-inside: avoid;
        }

        .borde-td {
            border: none;
            border-left: 0.5mm solid #888888;
            border-right: 0.5mm solid #888888;
        }

        .borde-primer-registros {
            border: none;
            border-left: 0.5mm solid #888888;
            border-right: 0.5mm solid #888888;
            border-top: 0.5mm solid #888888;
        }

        .borde-ultimo-registros {
            border: none;
            border-left: 0.5mm solid #888888;
            border-right: 0.5mm solid #888888;
            border-bottom: 0.5mm solid #888888;
        }

        .borde-primer-ultimo {
            border: none;
            border-left: 0.5mm solid #888888;
            border-right: 0.5mm solid #888888;
            border-top: 0.5mm solid #888888;
            border-bottom: 0.5mm solid #888888;
        }

    </style>
</head>

<body>
    {{-- TABLA DE CABECERA --}}
    <table class="table-container-encabezado">
        <tbody>
            <tr>
                <td width="15%" style="text-align: center;">
                    <img src="{{ asset('famai/logo-blanco-famai.jpg') }}" alt="Logo FAMAI" width="130px" height="auto">
                </td>
                <td width="75%" style="font-weight: bold; text-align: center;font-size: 14pt;">
                    ORDEN INTERNA
                </td>
                <td width="10%" style="margin-right: 5px;">
                    <table class="table-container-secundario">
                        <tbody>
                            <tr>
                                <td style="text-align: center; font-weight: bold;">PR-F-04</td>
                            </tr>
                            <tr>
                                <td style="font-size: 6pt;">Versión : 02</td>
                            </tr>
                            <tr>
                                <td style="font-size: 6pt;">Fecha: 27/09/2024</td>
                            </tr>
                            <tr>
                                <td style="font-size: 6pt;">Enviado: JPR</td>
                            </tr>
                            <tr>
                                <td style="font-size: 6pt;">Aprobado: GG</td>
                            </tr>
                        </tbody>
                    </table>
                </td>
            </tr>
        </tbody>
    </table>

    {{-- TABLE INFORMACION ORDEN INTERNA --}}

    <table class="table-container-informacion" style="margin-top: 5px;">
        <tbody>
            <tr>
                <td width="20%" style="font-weight: bold;">CLIENTE:</td>
                <td width="45%">
                    {{ $datosCabecera[0]['nombre_del_cliente'] ? $datosCabecera[0]['nombre_del_cliente'] : '' }}</td>
                <td width="25%" style="font-weight: bold;">FECHA DE EVALUACIÓN:</td>
                <td width="10%">
                    {{ $datosCabecera[0]['oic_fechaevaluacion'] ? DateTime::createFromFormat('Y-m-d', $datosCabecera[0]['oic_fechaevaluacion'])->format('d/m/Y') : '' }}
                </td>
            </tr>
            <tr>
                <td width="20%" style="font-weight: bold;">EQUIPO:</td>
                <td width="45%">
                    {{ $datosCabecera[0]['descripcion_equipo'] ? $datosCabecera[0]['descripcion_equipo'] : '' }}</td>
                <td width="25%" style="font-weight: bold;">FECHA DE APROBACIÓN:</td>
                <td width="10%">
                    {{ $datosCabecera[0]['oic_fechaaprobacion'] ? DateTime::createFromFormat('Y-m-d', $datosCabecera[0]['oic_fechaaprobacion'])->format('d/m/Y') : '' }}
                </td>
            </tr>
            <tr>
                <td width="20%" style="font-weight: bold;">COMPONENTE:</td>
                <td width="45%">{{ $datosCabecera[0]['oic_componente'] ? $datosCabecera[0]['oic_componente'] : '' }}
                </td>
                <td width="25%" style="font-weight: bold;">FECHA DE ENTREGA LOGÍSTICA:</td>
                <td width="10%">
                    {{ $datosCabecera[0]['oic_fechaentregaproduccion'] ? $datosCabecera[0]['oic_fechaentregaproduccion'] : '' }}
                </td>
            </tr>
            <tr>
                <td width="20%" style="font-weight: bold;">OT:</td>
                <td width="45%">{{ $datosCabecera[0]['odt_numero'] ? $datosCabecera[0]['odt_numero'] : '' }}</td>
                <td width="25%" style="font-weight: bold;">FECHA DE ENTREGA PRODUCCIÓN:</td>
                <td width="10%">
                    {{ $datosCabecera[0]['oic_fechaentregaestimada'] ? DateTime::createFromFormat('Y-m-d', $datosCabecera[0]['oic_fechaentregaestimada'])->format('d/m/Y') : '' }}
                </td>
            </tr>
        </tbody>
    </table>

    {{-- TABLE INFORMACIÓN RESPONSABLES --}}
    <table class="table-container-responsable" style="margin-top: 5px;">
        <tbody>
            <tr>
                <td width="10%" style="font-weight: bold;">Respon. ORIGEN</td>
                <td width="23%">{{ $datosCabecera[0]['tra_idorigen'] ? $datosCabecera[0]['tra_nombreorigen'] : '' }}
                </td>
                <td width="10%" style="font-weight: bold;">Respon. MAES</td>
                <td width="23%">
                    {{ $datosCabecera[0]['tra_idmaestro'] ? $datosCabecera[0]['tra_nombremaestro'] : '' }}</td>
                <td width="10%" style="font-weight: bold;">Respon. ALMA</td>
                <td>{{ $datosCabecera[0]['tra_idalmacen'] ? $datosCabecera[0]['tra_nombrealmacen'] : '' }}</td>
            </tr>
        </tbody>
    </table>

    {{-- TABLE DE DETALLE DE ORDEN INTERNA --}}
    <table class="table-container-detalle" style="margin-top: 10px;">
    <thead>
        <tr>
            <td colspan="4">ACTIVIDADES A REALIZAR</td>
            <td colspan="4">PEDIDO DE MATERIALES</td>
        </tr>
        <tr>
            <td width="3%">COD.</td>
            <td width="13%">DESCRIPCIÓN</td>
            <td width="2%">CC</td>
            <td width="20%">OBSERVACIONES</td>
            <td width="6%">COD.</td>
            <td width="21%">DESCRIPCIÓN</td>
            <td width="4%">UNI</td>
            <td width="4%">CANT</td>
            <td>OBSERVACIÓN</td>
        </tr>
    </thead>
    <tbody id="detalleOrdenInterna">
        @php $categoriaIndex = 0; @endphp

        @foreach ($datosPartes as $parte)
            @php
                $procesos = $parte['detalle_procesos'];
                $materiales = $parte['detalle_materiales'];
                $countP = count($procesos);
                $countM = count($materiales);
                $maxRows = max($countP, $countM);
                $map = [
                  'INICIO'=>'INI','CILINDRO'=>'CIL','VASTAGO'=>'VST',
                  'TAPA'=>'TPA','EMBOLO'=>'EMB','TAPA POSTERIOR'=>'TPP',
                  'FINAL'=>'FIN','OTROS'=>'OTR','EQUIPO'=>'EQP'
                ];
                $codigoParte = $map[$parte['oip_descripcion']] ?? '';
                $bg = ($categoriaIndex % 2 == 0) ? '#d9d9d9' : '#ffffff';
            @endphp

            @if ($countP || $countM)
                {{-- Título de sección --}}
                <tr style="background-color: {{ $bg }}; font-weight: bold;">
                    <td colspan="9" style="text-align: left; border-top: 0.5mm solid #888888;">
                        {{ $codigoParte }} - {{ $parte['oip_descripcion'] }}
                    </td>
                </tr>

                @for ($i = 0; $i < $maxRows; $i++)
    @php
        $hasP = $i < $countP;
        $hasM = $i < $countM;
        $proc = $hasP ? $procesos[$i] : null;
        $mat  = $hasM ? $materiales[$i] : null;
        $obsColor = '#ffffff';
        $fw = 'normal';
        $codigoAnterior = '';
        if ($i > 0 && isset($procesos[$i - 1]) && isset($procesos[$i - 1]['opp_codigo'])) {
            $codigoAnterior = $procesos[$i - 1]['opp_codigo'];
        }
        $ultimoRegistro = $i == $maxRows - 1;
        
        if ($hasM) {
            if ($mat['odm_tipo']==3) $obsColor='#8FD0F3';
            if ($mat['odm_tipo']==4) $obsColor='#EF646B';
            if ($mat['odm_tipo']==5) $obsColor='#74AE7E';
            if ($mat['odm_tipo']==2) $fw='bold';
        }
        
    @endphp
    
    @if ($hasP || $hasM)
        <tr>
            {{-- Procesos --}}
            @if ($hasP)
                <td class="borde-primer-registros" style="background: {{ $bg }};">{{ $proc['opp_codigo'] }}</td>
                <td class="borde-primer-registros" style="background: {{ $bg }};">{{ $proc['odp_descripcion'] }}</td>
                <td class="borde-primer-registros" style="background: {{ $bg }}; text-align:center;">
                    <input type="checkbox" {{ $proc['odp_ccalidad']==1?'checked':'' }} />
                </td>
                <td class="borde-primer-registros" style="background: {{ $bg }};">{!! nl2br(e($proc['odp_observacion'])) !!}</td>
            @else
                <td style="background: {{ $bg }};" class="{{ $ultimoRegistro ? 'borde-ultimo-registros' : 'borde-td' }}"></td>
                <td style="background: {{ $bg }};" class="{{ $ultimoRegistro ? 'borde-ultimo-registros' : 'borde-td' }}"></td>
                <td style="background: {{ $bg }};" class="{{ $ultimoRegistro ? 'borde-ultimo-registros' : 'borde-td' }}"></td>
                <td style="background: {{ $bg }};" class="{{ $ultimoRegistro ? 'borde-ultimo-registros' : 'borde-td' }}"></td>
            @endif

            {{-- Materiales --}}
            @if ($hasM)
                <td class="border-full" style="background: {{ $bg }}; text-align:center;">{{ $mat['pro_codigo'] }}</td>
                <td class="border-full" style="background: {{ $bg }}; font-weight: {{ $fw }};">
                    {{ $mat['odm_descripcion'] }}
                </td>
                <td class="border-full" style="background: {{ $bg }}; text-align:center;">{{ $mat['uni_codigo'] }}</td>
                <td class="border-full" style="background: {{ $bg }}; text-align:center;">{{ $mat['odm_cantidad'] }}</td>
                <td class="border-full" style="background: {{ $obsColor }}; font-weight: {{ $fw }};">
                    {!! nl2br(e($mat['odm_observacion'])) !!}
                </td>
            @else
                <td style="background: {{ $bg }};" class="border-full"></td>
                <td style="background: {{ $bg }};" class="border-full"></td>
                <td style="background: {{ $bg }};" class="border-full"></td>
                <td style="background: {{ $bg }};" class="border-full"></td>
                <td style="background: {{ $bg }};" class="border-full"></td>
            @endif
        </tr>
    @endif
@endfor



                @php $categoriaIndex++; @endphp
            @endif
        @endforeach
    </tbody>
</table>


</body>

</html>
