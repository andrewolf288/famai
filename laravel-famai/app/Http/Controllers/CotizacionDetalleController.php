<?php

namespace App\Http\Controllers;

use App\Cotizacion;
use App\CotizacionDetalle;
use App\Proveedor;
use App\Trabajador;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class CotizacionDetalleController extends Controller
{

    public function copiarCotizacionDetalle(Request $request, $id)
    {
        $user = auth()->user();
        $sed_codigo = "10";

        $trabajador = Trabajador::where('usu_codigo', $user->usu_codigo)->first();

        if ($trabajador) {
            $sed_codigo = $trabajador->sed_codigo;
        }

        $cotizacionOriginal = Cotizacion::where('coc_id', $id)->firstOrFail();
        $detalles = CotizacionDetalle::where('coc_id', $id)
            ->where('pro_id', $request->pro_id)
            ->get();

        if ($detalles->isEmpty()) {
            return response()->json(['error' => 'No existen detalles para ese producto en la cotización.'], 404);
        }

        $lastCotizacion = Cotizacion::orderBy('coc_id', 'desc')->first();
        $nuevoNumero = $lastCotizacion ? str_pad(intval($lastCotizacion->coc_numero) + 1, 7, '0', STR_PAD_LEFT) : '0000001';

        $nuevaCotizacion = $cotizacionOriginal->replicate();
        $nuevaCotizacion->coc_numero = $nuevoNumero;
        $nuevaCotizacion->coc_fechacotizacion = now();
        $nuevaCotizacion->save();
        $nuevaCotizacion->sed_codigo = $user->sed_codigo;

        foreach ($detalles as $detalle) {
            $nuevoDetalle = $detalle->replicate();
            $nuevoDetalle->coc_id = $nuevaCotizacion->coc_id;
            $nuevoDetalle->cod_feccreacion = now();
            $nuevoDetalle->cod_usucreacion = $user->usu_codigo;
            $nuevoDetalle->cod_fecmodificacion = null;
            $nuevoDetalle->cod_usumodificacion = null;
            $nuevoDetalle->save();
        }

        $nuevaCotizacion->load(['detalleCotizacion' => function ($query) use ($request) {
            $query->where('pro_id', $request->pro_id);
        }]);

        return response()->json([
            'message' => 'Cotización copiada correctamente',
            'cotizacion' => $nuevaCotizacion
        ], 201);
    }

    public function findDetalleByEstadoPendiente()
    {
        $cotizacionesDetalle = CotizacionDetalle::with(['cotizacion.proveedor', 'cotizacion.moneda', 'detalleMaterial.ordenInternaParte.ordenInterna', 'detalleMaterial.producto'])
            ->whereHas('cotizacion', function ($query) {
                $query->where('coc_estado', 'RPR');
            })
            ->where('cod_cotizar', 1)
            ->orderBy('cod_feccreacion', 'desc')
            ->get();

        return response()->json($cotizacionesDetalle);
    }

    public function findDetalleByCotizacion($id)
    {
        $detalleCotizacion = CotizacionDetalle::with(
            [
                'cotizacion.moneda',
                'producto',
                'detalleMaterial.ordenInternaParte.ordenInterna'
            ]
        )
            ->where('coc_id', $id)
            ->get();

        // Filtrar agrupados y no agrupados
        $agrupado = $detalleCotizacion->filter(function ($detalle) {
            return $detalle->odm_id !== null || $detalle->cod_parastock == 1;
        });

        $materiales = $detalleCotizacion->filter(function ($detalle) {
            return $detalle->odm_id !== null || $detalle->cod_parastock == 1;
        });

        $agrupadoDetalle = $agrupado
            ->groupBy('cod_orden')
            ->map(function ($detalle, $cod_orden) {
                return [
                    'cod_orden' => $cod_orden,
                    'cod_descripcion' => $detalle->first()->cod_descripcion,
                    'cod_observacion' => $detalle->first()->cod_observacion,
                    'cod_observacionproveedor' => $detalle->first()->cod_observacionproveedor,
                    'uni_codigo' => $detalle->first()->producto ? $detalle->first()->producto->uni_codigo : 'N/A',
                    'cod_cantidad' => $detalle->sum('cod_cantidad'),
                    'cod_cantidadcotizada' => $detalle->sum('cod_cantidadcotizada'),
                    'cod_preciounitario' => $detalle->first()->cod_preciounitario,
                    'cod_tiempoentrega' => $detalle->first()->cod_tiempoentrega,
                    'cod_total' => $detalle->sum('cod_total'),
                    'mon_simbolo' => $detalle->first()->cotizacion->moneda ? $detalle->first()->cotizacion->moneda->mon_simbolo : '',
                    'cod_cotizar' => $detalle->first()->cod_cotizar,
                ];
            })
            ->values();

        $materialesDetalle = $materiales
            ->values();

        $data = [
            'agrupado' => $agrupadoDetalle,
            'detalle_materiales' => $materialesDetalle
        ];

        return response()->json($data);
    }

    public function show($id)
    {
        $detalleCotizacion = CotizacionDetalle::with(['cotizacion.proveedor', 'cotizacion.moneda', 'detalleMaterial'])->findOrFail($id);
        return response()->json($detalleCotizacion);
    }

    public function update(Request $request, $id)
    {
        $user = auth()->user();
        $cotizacion = CotizacionDetalle::find($id);

        if (!$cotizacion) {
            return response()->json(['error' => 'Cotizacion no encontrada.'], 404);
        }

        $validator = Validator::make($request->all(), [
            'cod_descripcion' => 'required|string',
            'cod_cantidad' => 'required',
            'cod_preciounitario' => 'required',
            'cod_total' => 'required',
        ])->validate();

        $cotizacion->update([
            'cod_descripcion' => $request->input('cod_descripcion'),
            'cod_cantidad' => $request->input('cod_cantidad'),
            'cod_preciounitario' => $request->input('cod_preciounitario'),
            'cod_total' => $request->input('cod_total'),
            'cod_usumodificacion' => $user->usu_codigo,
        ]);

        return response()->json($cotizacion, 200);
    }

    // eliminamos un detalle de cotizacion
    public function destroy($id)
    {
        $cotizacion = CotizacionDetalle::find($id);
        $cotizacionID = $cotizacion->coc_id;

        $cotizacion->delete();

        // arreglamos el orden de la cotizacion
        $cotizaciones = CotizacionDetalle::where('coc_id', $cotizacionID)->get();
        $numeroOrden = 1;

        foreach ($cotizaciones as $cotizacion) {
            $cotizacion->update([
                'cod_orden' => $numeroOrden
            ]);
            $numeroOrden++;
        }
        return response()->json(['success' => 'Cotizacion eliminada correctamente.'], 200);
    }

    // traer informacion de cotizacion by materiales
    public function informacionMaterialesMasivo(Request $request)
    {
        $materiales = $request->input('materiales', []);
        $detalleMaterialesCotizar = [];

        foreach ($materiales as $material) {
            $detalle = CotizacionDetalle::with(['cotizacion.proveedor', 'detalleMaterial.producto.unidad', 'detalleMaterial.ordenInternaParte.ordenInterna'])
                ->findOrFail($material);
            $detalleMaterialesCotizar[] = $detalle;
        }

        // obtenemos informacion del proveedor
        $cotizacion = Cotizacion::with(['moneda'])
            ->findOrFail($detalleMaterialesCotizar[0]->cotizacion->coc_id);

        $proveedor = Proveedor::with(['cuentasBancarias.entidadBancaria', 'cuentasBancarias.moneda'])
            ->findOrFail($detalleMaterialesCotizar[0]->cotizacion->proveedor->prv_id);

        $data = [
            'cotizacion' => $cotizacion,
            'proveedor' => $proveedor,
            'materiales' => $detalleMaterialesCotizar
        ];

        return response()->json($data);
    }

    // funcion para traer cotizacion by producto
    public function findCotizacionByProducto(Request $request)
    {
        $pageSize = $request->input('page_size', 10);
        $page = $request->input('page', 1);
        $producto = $request->input('pro_id', null);

        $proveedoresFilter = $request->input('param', '');

        if ($proveedoresFilter) {
            $proveedoresFilter = explode(',', $proveedoresFilter);
        }

        $query = CotizacionDetalle::with(['cotizacion.proveedor', 'cotizacion.moneda', 'detalleMaterial.producto.unidad'])
            ->whereHas('cotizacion', function ($query) {
                $query->where('coc_estado', '!=', 'SOL');
            })
            ->where('cod_cotizar', 1);

        if ($producto !== null) {
            $producto = (int) $producto;
            $query->whereHas('detalleMaterial.producto', function ($q) use ($producto) {
                $q->where('pro_id', $producto);
            });
        }

        if (!empty($proveedoresFilter)) {
            $query->whereHas('cotizacion.proveedor', function ($q) use ($proveedoresFilter) {
                $q->whereIn('prv_nrodocumento', $proveedoresFilter);
            });
        }

        // ordenamos de manera descendente
        $query->orderBy('cod_feccreacion', 'desc');

        $cotizacionDetalle = $query->paginate($pageSize, ['*'], 'page', $page);

        return response()->json([
            'message' => 'Se listan las cotizaciones',
            'data' => $cotizacionDetalle->items(),
            'count' => $cotizacionDetalle->total()
        ]);
    }

    // funcion para seleccionar cotizacion detalle
    public function seleccionarCotizacionDetalle($id)
    {
        $cotizacionDetalle = CotizacionDetalle::findOrFail($id);

        $arreglo_identificadores = [];

        if ($cotizacionDetalle->pro_id !== null) {
            $cotizacionesDetalleRelacionadas = CotizacionDetalle::where('coc_id', $cotizacionDetalle->coc_id)
                ->where('pro_id', $cotizacionDetalle->pro_id)
                ->get();

            $arreglo_identificadores = $cotizacionesDetalleRelacionadas->pluck('odm_id')->toArray();
        } else {
            $arreglo_identificadores = [$cotizacionDetalle->odm_id];
        }

        // buscamos todos los registros de cotizacion detalle con los identificadores obtenidos
        CotizacionDetalle::whereIn('odm_id', $arreglo_identificadores)
            ->update([
            'cod_estado' => null
        ]);

        // actualizamos el detalle de cotizacion con el estado de "SELECCIONANDO MANUALMENTE"
        $cotizacionDetalle->update([
            'cod_estado' => 'SML'
        ]);

        return response()->json(['success' => 'Cotizacion seleccionada correctamente.'], 200);
    }
}
