<?php

namespace App\Http\Controllers;

use App\CotizacionDetalle;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class CotizacionDetalleController extends Controller
{
    public function findDetalleByCotizacion($id)
    {
        $detalleCotizacion = CotizacionDetalle::where('coc_id', $id)->get();
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
}
