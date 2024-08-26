<?php

namespace App\Http\Controllers;

use App\Proceso;
use Illuminate\Http\Request;

class ProcesoController extends Controller
{
    public function index()
    {
        $procesos = Proceso::get();
        return response()->json($procesos);
    }

    public function indexSimple()
    {
        $procesos = Proceso::select('opp_id', 'oip_id', 'opp_codigo', 'opp_descripcion', 'opp_orden')->get();
        return response()->json($procesos);
    }

    public function findByParte($parte)
    {
        $procesos = Proceso::select('opp_id', 'oip_id', 'opp_codigo', 'opp_descripcion', 'opp_orden')
                            ->where('oip_id', $parte)
                            ->where('opp_activo', 1)
                            ->get();
        return response()->json($procesos);
    }
    
}
