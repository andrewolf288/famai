<?php

namespace App\Http\Controllers;

use App\OrdenTrabajo;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Http\Request;

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

    public function findByNumero2($numero)
    {
        $ordenTrabajo = new OrdenTrabajo();
        $result = $ordenTrabajo->metListadoOTSecondary($numero);
    
        if ($result && is_array($result)) {
            return response()->json($result, 200);
        } else {
            return response()->json([
                'error' => 'Orden de trabajo no encontrada',
            ], 404);
        }
    }
    
}
