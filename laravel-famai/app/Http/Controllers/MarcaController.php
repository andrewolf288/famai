<?php

namespace App\Http\Controllers;

use App\Marca;
use Illuminate\Http\Request;

class MarcaController extends Controller
{
    public function index()
    {
        $marcas = Marca::get();
        return response()->json($marcas);
    }

    public function indexSimple()
    {
        $marcas = Marca::select('pma_codigo', 'pma_descripcion')->get();
        return response()->json($marcas);
    }
}
