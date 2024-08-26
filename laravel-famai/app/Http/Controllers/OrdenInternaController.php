<?php

namespace App\Http\Controllers;

use App\OrdenInterna;
use Illuminate\Http\Request;

class OrdenInternaController extends Controller
{
    /**
     * Display a listing of the resource.
     *
     * @return \Illuminate\Http\Response
     */
    public function index(Request $request)
    {
        $pageSize = $request->input('page_size', 10);
        $page = $request->input('page', 1);
        $otNumero = $request->input('ot_numero', null);
        $oiNumero = $request->input('oi_numero', null);
        $equipo = $request->input('oic_equipo_descripcion', null);

        $query = OrdenInterna::with(['cliente', 'area', 'trabajadorOrigen', 'trabajadorMaestro', 'trabajadorAlmacen']);

        $ordenesInternas = $query->paginate($pageSize, ['*'], 'page', $page);

        // Agregar el total de materiales
        $ordenesInternas->getCollection()->transform(function ($ordenInterna) {
            $ordenInterna->total_materiales = $ordenInterna->totalMateriales();
            return $ordenInterna;
        });

        return response()->json([
            'message' => 'Se listan las ordenes internas',
            'data' => $ordenesInternas->items(),
            'count' => $ordenesInternas->total()
        ]);
    }
}
