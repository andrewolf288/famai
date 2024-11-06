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

        .table-container-detalle td {
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

    {{-- FOOTER
    <footer>
        <table class="table-container-footer">
            <tbody>
                <tr>
                    <td width="33%">Usuario Creación:
                        {{ $datosCabecera[0]['oic_usucreacion'] ? $datosCabecera[0]['oic_usucreacion'] : '' }} Fecha:
                        {{ $datosCabecera[0]['oic_feccreacion'] ? DateTime::createFromFormat('Y-m-d H:i:s.u', $datosCabecera[0]['oic_feccreacion'])->format('d/m/Y H:i:s') : '' }}
                    </td>
                    <td width="33%" rowspan="2" style="text-align: center;vertical-align: middle;">Pag. {}</td>
                    <td width="33%" rowspan="2" style="text-align: right;">
                        {{ $datosCabecera[0]['odt_numero'] ? $datosCabecera[0]['odt_numero'] : '' }} -
                        {{ date('d/m/Y H:i:s') }}</td>
                </tr>
                <tr>
                    <td>Usuario Modifica:
                        {{ $datosCabecera[0]['oic_usumodificacion'] ? $datosCabecera[0]['oic_usumodificacion'] : '' }}
                        Fecha:
                        {{ $datosCabecera[0]['oic_fecmodificacion'] ? DateTime::createFromFormat('Y-m-d H:i:s.u', $datosCabecera[0]['oic_fecmodificacion'])->format('d/m/Y H:i:s') : '' }}
                    </td>
                </tr>
            </tbody>
        </table>
    </footer> --}}

    {{-- TABLE DE DETALLE DE ORDEN INTERNA --}}
    <table class="table-container-detalle" style="margin-top: 10px;">
        <thead>
            <tr>
                <td rowspan="2" width="3%"></td>
                <td colspan="3">ACTIVIDADES A REALIZAR</td>
                <td colspan="4">PEDIDO DE MATERIALES</td>
            </tr>
            <tr>
                <td width="3%">COD.</td>
                <td width="13%">DESCRIPCIÓN</td>
                <td>OBSERVACIONES</td>
                <td width="5%">COD.</td>
                <td width="21%">DESCRIPCIÓN</td>
                <td width="3%">CANT</td>
                <td>OBSERVACIÓN</td>
            </tr>
        </thead>
        <tbody>
            @foreach ($datosPartes as $parte)
                @php
                    $countMateriales = count($parte['detalle_materiales']);
                    $countProcesos = count($parte['detalle_procesos']);
                    $maximoCount = max($countMateriales, $countProcesos);
                    $nombreParte = '';
                    if ($parte['oip_descripcion'] == 'INICIO') {
                        $nombreParte = 'INI';
                    }
                    if ($parte['oip_descripcion'] == 'CILINDRO') {
                        $nombreParte = 'CIL';
                    }
                    if ($parte['oip_descripcion'] == 'VASTAGO') {
                        $nombreParte = 'VST';
                    }
                    if ($parte['oip_descripcion'] == 'TAPA') {
                        $nombreParte = 'TPA';
                    }
                    if ($parte['oip_descripcion'] == 'EMBOLO') {
                        $nombreParte = 'EMB';
                    }
                    if ($parte['oip_descripcion'] == 'TAPA POSTERIOR') {
                        $nombreParte = 'TPP';
                    }
                    if ($parte['oip_descripcion'] == 'FINAL') {
                        $nombreParte = 'FIN';
                    }
                    if ($parte['oip_descripcion'] == 'OTROS') {
                        $nombreParte = 'OTR';
                    }
                @endphp

                @if ($countMateriales != 0 || $countProcesos != 0)
                    @for ($i = 0; $i < $maximoCount; $i++)
                        @php
                            $colorObservacion = '#ffffff';
                            $fontWeight = 'normal';

                            if ($i < $countMateriales && $parte['detalle_materiales'][$i]['odm_tipo'] == 3) {
                                $colorObservacion = '#8FD0F3';
                            }
                            if ($i < $countMateriales && $parte['detalle_materiales'][$i]['odm_tipo'] == 4) {
                                $colorObservacion = '#EF646B';
                            }
                            if ($i < $countMateriales && $parte['detalle_materiales'][$i]['odm_tipo'] == 5) {
                                $colorObservacion = '#74AE7E';
                            }
                            if ($i < $countMateriales && $parte['detalle_materiales'][$i]['odm_tipo'] == 2) {
                                $fontWeight = 'bold';
                            }
                        @endphp
                        <tr>
                            @if ($i == 0)
                                <td rowspan="{{ $maximoCount }}" style="text-align: center;">
                                    {{ $nombreParte }}
                                </td>
                            @endif
                            {{-- PROCESOS --}}
                            @if ($i < $countProcesos)
                                <td rowspan="{{ $i == $countProcesos - 1 ? $maximoCount - $i : 1 }}"
                                    style="text-align: center;">{{ $parte['detalle_procesos'][$i]['opp_codigo'] }}</td>
                                <td rowspan="{{ $i == $countProcesos - 1 ? $maximoCount - $i : 1 }}">
                                    {{ $parte['detalle_procesos'][$i]['odp_descripcion'] }}</td>
                                <td rowspan="{{ $i == $countProcesos - 1 ? $maximoCount - $i : 1 }}">
                                    {{ $parte['detalle_procesos'][$i]['odp_observacion'] }}</td>
                            @elseif ($i == 0 && $countProcesos == 0)
                                <td rowspan="{{ $maximoCount }}"></td>
                                <td rowspan="{{ $maximoCount }}"></td>
                                <td rowspan="{{ $maximoCount }}"></td>
                            @endif

                            {{-- MATERIALES --}}
                            @if ($i < $countMateriales)
                                <td rowspan="{{ $i == $countMateriales - 1 ? $maximoCount - $i : 1 }}"
                                    style="text-align: center;">{{ $parte['detalle_materiales'][$i]['pro_codigo'] }}
                                </td>
                                <td rowspan="{{ $i == $countMateriales - 1 ? $maximoCount - $i : 1 }}"
                                    style="font-weight: {{ $fontWeight }};">
                                    {{ $parte['detalle_materiales'][$i]['odm_descripcion'] }}</td>
                                <td rowspan="{{ $i == $countMateriales - 1 ? $maximoCount - $i : 1 }}"
                                    style="text-align: center;">{{ $parte['detalle_materiales'][$i]['odm_cantidad'] }}
                                </td>
                                <td rowspan="{{ $i == $countMateriales - 1 ? $maximoCount - $i : 1 }}"
                                    style="background-color: {{ $colorObservacion }}; font-weight: {{ $fontWeight }};">
                                    {{ $parte['detalle_materiales'][$i]['odm_observacion'] }}</td>
                            @elseif ($i == 0 && $countMateriales == 0)
                                <td rowspan="{{ $maximoCount }}"></td>
                                <td rowspan="{{ $maximoCount }}"></td>
                                <td rowspan="{{ $maximoCount }}"></td>
                                <td rowspan="{{ $maximoCount }}"></td>
                            @endif
                        </tr>
                    @endfor
                @endif
            @endforeach
        </tbody>
    </table>
</body>

</html>
