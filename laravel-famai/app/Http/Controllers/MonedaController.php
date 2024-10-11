<?php

namespace App\Http\Controllers;

use App\Moneda;
use Illuminate\Http\Request;

class MonedaController extends Controller
{
    public function index()
    {
        $monedas = Moneda::get();
        return response()->json($monedas);
    }

    public function indexSimple()
    {
        $monedas = Moneda::where('mon_activo', 1)->select('mon_codigo', 'mon_descripcion')->get();
        return response()->json($monedas);
    }
}
