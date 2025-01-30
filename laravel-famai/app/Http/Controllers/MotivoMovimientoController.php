<?php

namespace App\Http\Controllers;

use App\MotivoMovimiento;

class MotivoMovimientoController extends Controller
{
    public function index()
    {
        $motivosmovimiento = MotivoMovimiento::get();
        return response()->json($motivosmovimiento);
    }

    public function indexSimple()
    {
        $motivosmovimiento = MotivoMovimiento::where('mtm_activo', 1)->select('mtm_codigo', 'mtm_descripcion')->get();
        return response()->json($motivosmovimiento);
    }
}
