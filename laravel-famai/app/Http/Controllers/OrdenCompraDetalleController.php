<?php

namespace App\Http\Controllers;

use App\CotizacionDetalle;
use App\OrdenCompraDetalle;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class OrdenCompraDetalleController extends Controller
{
    public function findDetalleByOrdenCompra($id)
    {
        $detalleCotizacion = OrdenCompraDetalle::with('detalleMaterial.ordenInternaParte.ordenInterna')->where('occ_id', $id)->get();
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

        return response()->json($ordencompra, 200);
    }

    // eliminamos un detalle de cotizacion
    public function destroy($id)
    {
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
        return response()->json(['success' => 'Orden de compra eliminada correctamente.'], 200);
    }

    // traer informacion de cotizacion detalle asociado
    public function findCotizacionByOrdenCompraDetalle($id)
    {
        $detalleCotizacion = CotizacionDetalle::with('cotizacion.proveedor')->where('odm_id', $id)->get();
        return response()->json($detalleCotizacion);
    }
}
