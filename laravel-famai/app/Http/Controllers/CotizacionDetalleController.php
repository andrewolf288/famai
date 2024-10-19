<?php

namespace App\Http\Controllers;

use App\CotizacionDetalle;
use Illuminate\Http\Request;

class CotizacionDetalleController extends Controller
{
    public function findDetalleByCotizacion($id)
    {
        $detalleCotizacion = CotizacionDetalle::where('coc_id', $id)->get();
        return response()->json($detalleCotizacion);
    }
}
