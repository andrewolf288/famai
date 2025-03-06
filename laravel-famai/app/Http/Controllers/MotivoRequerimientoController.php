<?php

namespace App\Http\Controllers;

use App\MotivoRequerimiento;

class MotivoRequerimientoController extends Controller
{
    public function index()
    {
        $motivos = MotivoRequerimiento::get();
        return response()->json($motivos);
    }

    public function indexSimple()
    {
        $motivos = MotivoRequerimiento::where('mrq_activo', 1)->select('mrq_codigo', 'mrq_descripcion')->get();
        return response()->json($motivos);
    }
}
