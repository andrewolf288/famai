<?php

namespace App\Http\Controllers;

use App\Impuesto;
use Illuminate\Http\Request;

class ImpuestoController extends Controller
{
    public function index()
    {
        $impuestos = Impuesto::get();
        return response()->json($impuestos);
    }

    public function indexSimple()
    {
        $formasPago = Impuesto::where('imp_activo', 1)->select('imp_codigo', 'imp_descripcion', 'imp_porcentaje')->get();
        return response()->json($formasPago);
    }
}
