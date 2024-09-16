<?php

namespace App\Http\Controllers;

use App\OrdenInterna;
use App\OrdenInternaMateriales;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class OrdenInternaMaterialesController extends Controller
{

    public function index(Request $request)
    {
        $pageSize = $request->input('page_size', 10);
        $page = $request->input('page', 1);
        $ordenTrabajo = $request->input('ot_numero', null);
        $ordenInterna = $request->input('oi_numero', null);
        $almID = $request->input('alm_id', 1);
        $query = OrdenInternaMateriales::with(
            [
                'producto.unidad',
                'producto.stock' => function ($q) use ($almID) {
                    if ($almID !== null) {
                        $q->where('alm_id', $almID)
                            ->select('pro_id', 'alm_id', 'alp_stock');
                    } else {
                        $q->selectRaw('null as alp_stock');
                    }
                },
                'ordenInternaParte.ordenInterna'
            ]
        );

        // filtro de orden de trabajo
        if ($ordenTrabajo !== null) {
            $query->whereHas('ordenInternaParte.ordenInterna', function($q) use ($ordenTrabajo) {
                $q->where('odt_numero', $ordenTrabajo);
            });
        }

        // filtro de orden interna
        if ($ordenInterna !== null) {
            $query->whereHas('ordenInternaParte.ordenInterna', function($q) use ($ordenInterna) {
                $q->where('oic_numero', $ordenInterna);
            });
        }

        // ordenar de formar descendiente
        $query->orderBy('odm_feccreacion', 'desc');

        $detalleMateriales = $query->paginate($pageSize, ['*'], 'page', $page);
        return response()->json([
            'message' => 'Se listan los materiales de la orden interna',
            'data' => $detalleMateriales->items(),
            'count' => $detalleMateriales->total()
        ]);
    }

    public function findByOrdenInterna(Request $request, $id)
    {
        $ordenInterna = OrdenInterna::find($id);
        // obtenemos el dato de almacen enviado
        $almID = $request->input('alm_id', 1);
        $materiales = OrdenInternaMateriales::with(['producto.unidad', 'producto.stock' => function ($q) use ($almID) {
            if ($almID !== null) {
                $q->where('alm_id', $almID)
                    ->select('pro_id', 'alm_id', 'alp_stock');
            } else {
                $q->selectRaw('null as alp_stock');
            }
        }])
            ->whereHas('ordenInternaParte', function ($query) use ($id) {
                $query->where('oic_id', $id);
            })
            ->get();

        return response()->json(["ordenInterna" => $ordenInterna, "materiales" => $materiales]);
    }
}
