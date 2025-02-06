<?php

namespace App\Http\Controllers;

use App\MotivoMovimiento;
use Illuminate\Http\Request;

class MotivoMovimientoController extends Controller
{
    public function index(Request $request)
    {
        $tipomovimiento = $request->input('mtm_tipomovimiento', null);

        $query = MotivoMovimiento::query();

        if ($tipomovimiento !== null) {
            $query->where('mtm_tipomovimiento', $tipomovimiento);
        }

        $motivosmovimiento = $query
            ->where('mtm_activo', 1)
            ->orWhere('mtm_tipomovimiento', 'A')
            ->get();

        return response()->json($motivosmovimiento);
    }

    public function indexSimple()
    {
        $motivosmovimiento = MotivoMovimiento::where('mtm_activo', 1)->select('mtm_codigo', 'mtm_descripcion')->get();
        return response()->json($motivosmovimiento);
    }
}
