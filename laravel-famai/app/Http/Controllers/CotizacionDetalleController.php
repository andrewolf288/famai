<?php

namespace App\Http\Controllers;

use App\Cotizacion;
use App\CotizacionDetalle;
use App\Proveedor;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class CotizacionDetalleController extends Controller
{

    public function findDetalleByEstadoPendiente()
    {
        $cotizacionesDetalle = CotizacionDetalle::with(['cotizacion.proveedor', 'cotizacion.moneda', 'detalleMaterial.ordenInternaParte.ordenInterna', 'detalleMaterial.producto.unidad'])
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

        $marcas = $detalleCotizacion->filter(function ($detalle) {
            return $detalle->odm_id === null && $detalle->cod_parastock == 0;
        });

        $materiales = $detalleCotizacion->filter(function ($detalle) {
            return $detalle->odm_id !== null || $detalle->cod_parastock == 1;
        })->sort(function ($a, $b) {
            return $a->cod_orden - $b->cod_orden;
        });

        $agrupadoDetalle = $agrupado
            ->groupBy('cod_orden')
            ->map(function ($detalle, $cod_orden) {
                return [
                    'cod_orden' => $cod_orden,
                    'cod_descripcion' => $detalle->first()->cod_descripcion,
                    'cod_observacion' => $detalle->first()->cod_observacion,
                    'uni_codigo' => $detalle->first()->producto ? $detalle->first()->producto->uni_codigo : 'N/A',
                    'cod_cantidad' => $detalle->sum('cod_cantidad'),
                    'cod_preciounitario' => $detalle->first()->cod_preciounitario,
                    'cod_total' => $detalle->sum('cod_total'),
                    'mon_simbolo' => $detalle->first()->cotizacion->moneda ? $detalle->first()->cotizacion->moneda->mon_simbolo : '',
                    'cod_cotizar' => $detalle->first()->cod_cotizar,
                ];
            })
            ->values();

        $marcasDetalle = $marcas
            ->values();

        $materialesDetalle = $materiales
            ->values();

        $data = [
            'agrupado' => $agrupadoDetalle,
            'marcas' => $marcasDetalle,
            'detalle_materiales' => $materialesDetalle
        ];

        return response()->json($data);
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
}
