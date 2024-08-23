<?php

namespace App\Http\Controllers;

use App\GrupoInventario;
use Illuminate\Http\Request;

class GrupoInventarioController extends Controller
{
    public function index()
    {
        $gruposinventario = GrupoInventario::get();
        return response()->json($gruposinventario);
    }

    public function indexSimple()
    {
        $gruposinventario = GrupoInventario::select('pgi_codigo', 'pgi_descripcion')->get();
        return response()->json($gruposinventario);
    }
}
