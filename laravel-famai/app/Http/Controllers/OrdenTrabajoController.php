<?php

namespace App\Http\Controllers;

use App\OrdenTrabajo;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class OrdenTrabajoController extends Controller
{
    public function index()
    {
        $ordenesTrabajos = OrdenTrabajo::get();
        return response()->json($ordenesTrabajos);
    }

    public function show($id)
    {
        $ordenesTrabajos = OrdenTrabajo::find($id);
        return response()->json($ordenesTrabajos);
    }

    public function findByNumero($numero)
    {
        try {
            $ordenTrabajo = OrdenTrabajo::where('odt_numero', $numero)
                ->with('cliente')
                ->firstOrFail();

            return response()->json($ordenTrabajo);
        } catch (ModelNotFoundException $e) {
            return response()->json([
                'error' => 'Orden de trabajo no encontrada',
            ], 404);
        }
    }
}
