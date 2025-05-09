<?php

namespace App\Http\Controllers;

use App\Unidad;
use Illuminate\Http\Request;

class UnidadController extends Controller
{
    public function index()
    {
        $unidades = Unidad::get();
        return response()->json($unidades);
    }

    public function indexSimple()
    {
        $unidades = Unidad::where('uni_activo', 1)->select('uni_codigo', 'uni_descripcion')->get();
        return response()->json($unidades);
    }
}
