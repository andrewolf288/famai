<?php

namespace App\Http\Controllers;

use App\Sede;
use Illuminate\Http\Request;

class SedeController extends Controller
{
    
    public function index()
    {
        $sedes = Sede::get();
        return response()->json($sedes);
    }

    public function indexSimple()
    {
        $sedes = Sede::where('sed_activo', 1)->select('sed_codigo', 'sed_nombre')->get();
        return response()->json($sedes);
    }
}
