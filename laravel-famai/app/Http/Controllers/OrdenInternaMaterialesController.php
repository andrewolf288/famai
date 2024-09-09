<?php

namespace App\Http\Controllers;

use App\OrdenInternaMateriales;

class OrdenInternaMaterialesController extends Controller
{

    public function findByOrdenInterna($id)
    {
        $materiales = OrdenInternaMateriales::with('producto.unidad')
            ->whereHas('ordenInternaParte', function ($query) use ($id) {
                $query->where('oic_id', $id);
            })
            ->get();

        return response()->json($materiales);
    }
}
