<?php

namespace App\Http\Controllers;

use App\CotizacionDetalle;
use App\OrdenCompraDetalle;
use App\OrdenCompra;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\DB;
use Exception;

class OrdenCompraDetalleController extends Controller
{
    public function findDetalleByOrdenCompra($id)
    {
        $detalleCotizacion = OrdenCompraDetalle::with(['detalleMaterial.ordenInternaParte.ordenInterna', 'ordenCompra.moneda', 'producto'])
            ->where('occ_id', $id)->get();
        return response()->json($detalleCotizacion);
    }

    public function update(Request $request, $id)
    {
        $user = auth()->user();
        $ordencompra = OrdenCompraDetalle::find($id);

        if (!$ordencompra) {
            return response()->json(['error' => 'Orden de compra no encontrada.'], 404);
        }

        $validator = Validator::make($request->all(), [
            'ocd_descripcion' => 'required|string',
            'ocd_cantidad' => 'required',
            'ocd_preciounitario' => 'required',
            'ocd_total' => 'required',
        ])->validate();

        $ordencompra->update([
            'ocd_descripcion' => $request->input('ocd_descripcion'),
            'ocd_cantidad' => $request->input('ocd_cantidad'),
            'ocd_preciounitario' => $request->input('ocd_preciounitario'),
            'ocd_total' => $request->input('ocd_total'),
            'ocd_usumodificacion' => $user->usu_codigo,
        ]);

        // Recalcular totales de la cabecera
        $detalles = OrdenCompraDetalle::where('occ_id', $ordencompra->occ_id)->get();
        $subtotal = $detalles->sum('ocd_total');
        $impuesto = $detalles->sum(function($detalle) {
            return ($detalle->ocd_total * $detalle->ocd_porcentajeimpuesto) / 100;
        });
        $total = $subtotal + $impuesto;

        // Actualizar la cabecera
        $ordenCompraCabecera = OrdenCompra::find($ordencompra->occ_id);
        $ordenCompraCabecera->update([
            'occ_subtotal' => $subtotal,
            'occ_impuesto' => $impuesto,
            'occ_total' => $total,
            'occ_usumodificacion' => $user->usu_codigo,
        ]);

        return response()->json($ordencompra, 200);
    }

    public function show($id)
    {
        $detalleOrdenCompra = OrdenCompraDetalle::with(['ordenCompra.proveedor', 'ordenCompra.moneda', 'detalleMaterial'])->findOrFail($id);
        return response()->json($detalleOrdenCompra);
    }

    // eliminamos un detalle de cotizacion
    public function destroy($id)
    {
        $user = auth()->user();
        
        try {
            DB::beginTransaction();
            
            $ordencompra = OrdenCompraDetalle::find($id);
            $ordencompraID = $ordencompra->occ_id;

            $ordencompra->delete();

            // arreglamos el orden de la cotizacion
            $ordenescompra = OrdenCompraDetalle::where('occ_id', $ordencompraID)->get();
            $numeroOrden = 1;

            foreach ($ordenescompra as $detalle) {
                $detalle->update([
                    'ocd_orden' => $numeroOrden
                ]);
                $numeroOrden++;
            }

            // Recalcular totales de la orden de compra
            $detallesOrden = OrdenCompraDetalle::where('occ_id', $ordencompraID)->get();
            
            if ($detallesOrden->count() > 0) {
                // Calcular subtotal sumando los totales de cada item
                $subtotal = $detallesOrden->sum('ocd_total');
                
                // Calcular impuesto total sumando los impuestos de cada item
                $impuesto = $detallesOrden->sum(function($detalle) {
                    $subtotalItem = $detalle->ocd_cantidad * $detalle->ocd_preciounitario;
                    $descuentoItem = $subtotalItem * ($detalle->ocd_porcentajedescuento ?? 0) / 100;
                    $subtotalConDescuentoItem = $subtotalItem - $descuentoItem;
                    return $subtotalConDescuentoItem * ($detalle->ocd_porcentajeimpuesto ?? 0) / 100;
                });
                
                $total = $subtotal + $impuesto;

                // Actualizar totales en la cabecera
                $ordenCompra = OrdenCompra::find($ordencompraID);
                $ordenCompra->update([
                    'occ_subtotal' => $subtotal,
                    'occ_impuesto' => $impuesto,
                    'occ_total' => $total,
                    'occ_usumodificacion' => $user->usu_codigo,
                    'occ_fecmodificacion' => now()
                ]);
            } else {
                // Si no quedan detalles, poner totales en cero
                $ordenCompra = OrdenCompra::find($ordencompraID);
                $ordenCompra->update([
                    'occ_subtotal' => 0,
                    'occ_impuesto' => 0,
                    'occ_total' => 0,
                    'occ_usumodificacion' => $user->usu_codigo,
                    'occ_fecmodificacion' => now()
                ]);
            }

            DB::commit();
            return response()->json(['success' => 'Orden de compra eliminada correctamente.'], 200);
        } catch (Exception $e) {
            DB::rollBack();
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    // traer informacion de cotizacion detalle asociado
    public function findCotizacionByOrdenCompraDetalle($id)
    {
        $detalleCotizacion = CotizacionDetalle::with('cotizacion.proveedor')->where('odm_id', $id)->get();
        return response()->json($detalleCotizacion);
    }

    // funcion para traer orden de compra by producto
    public function findOrdenCompraByProducto(Request $request)
    {
        $pageSize = $request->input('page_size', 10);
        $page = $request->input('page', 1);
        $producto = $request->input('pro_id');

        $proveedoresFilter = $request->input('param', '');

        if ($proveedoresFilter) {
            $proveedoresFilter = explode(',', $proveedoresFilter);
        }

        $query = OrdenCompraDetalle::with(['detalleMaterial.producto.unidad', 'ordenCompra.proveedor', 'ordenCompra.moneda']);

        if ($producto !== null) {
            $producto = (int) $producto;
            $query->whereHas('detalleMaterial', function ($q) use ($producto) {
                $q->where('pro_id', $producto);
            });
        }

        if (!empty($proveedoresFilter)) {
            $query->whereHas('cotizacion.proveedor', function ($q) use ($proveedoresFilter) {
                $q->whereIn('prv_nrodocumento', $proveedoresFilter);
            });
        }

        $query->orderBy('ocd_feccreacion', 'desc');

        $ordencompraDetalle = $query->paginate($pageSize, ['*'], 'page', $page);

        return response()->json([
            'message' => 'Se listan las ordenes de compra',
            'data' => $ordencompraDetalle->items(),
            'count' => $ordencompraDetalle->total()
        ]);
    }

    public function findUltimoProveedorByProducto(Request $request)
    {
        $productos = $request->input('productos', []);

        $query = OrdenCompraDetalle::with(['ordenCompra.proveedor', 'detalleMaterial.producto'])
            ->whereHas('detalleMaterial.producto', function ($q) use ($productos) {
                $q->whereIn('pro_id', $productos);
            });
        
        $data = $query->get();
        $dataProveedores = $data->map(function ($item) {
            return $item->ordenCompra->proveedor;
        })->unique('prv_id');

        return response()->json($dataProveedores);
    }
}
