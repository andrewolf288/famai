<?php

namespace App\Http\Controllers;

use App\Area;
use Illuminate\Http\Request;

class AreaController extends Controller
{
    public function index()
    {
        $familias = Area::get();
        return response()->json($familias);
    }

    public function indexSimple()
    {
        $familias = Area::where('are_activo', 1)->select('are_codigo', 'are_descripcion')->get();
        return response()->json($familias);
    }
}
