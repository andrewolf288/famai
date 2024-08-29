<?php

namespace App\Http\Controllers;

use App\Familia;
use Illuminate\Http\Request;

class FamiliaController extends Controller
{

    public function index()
    {
        $familias = Familia::get();
        return response()->json($familias);
    }

    public function indexSimple()
    {
        $familias = Familia::where('pfa_activo', 1)->select('pfa_codigo', 'pfa_descripcion')->get();
        return response()->json($familias);
    }
}
