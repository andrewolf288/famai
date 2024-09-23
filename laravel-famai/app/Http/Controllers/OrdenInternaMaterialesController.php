<?php

namespace App\Http\Controllers;

use App\OrdenInterna;
use App\OrdenInternaMateriales;
use App\OrdenInternaPartes;
use Exception;
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

    public function update(Request $request, $id)
    {
        $user = auth()->user();
        try {
            DB::beginTransaction();
            $ordenInternaMaterial = OrdenInternaMateriales::findOrFail($id);
            $request->validate([
                'odm_descripcion' => 'required|string|max:255',
                'odm_cantidad' => 'required|numeric',
                'odm_observacion' => 'nullable|string|max:255',
            ]);

            $ordenInternaMaterial->update([
                'odm_descripcion' => $request->input('odm_descripcion'),
                'odm_cantidad' => $request->input('odm_cantidad'),
                'odm_observacion' => $request->input('odm_observacion'),
                'odm_usumodificacion' => $user->usu_codigo,
            ]);

            // buscamos el detalle de parte
            $ordenInternaParte = OrdenInternaPartes::findOrFail($ordenInternaMaterial->opd_id);
            $ordenInterna = OrdenInterna::findOrFail($ordenInternaParte->oic_id);

            // actualizamos la orden interna
            $ordenInterna->oic_fecmodificacion = date('Y-m-d H:i:s');
            $ordenInterna->oic_usumodificacion = $user->usu_codigo;
            $ordenInterna->save();

            DB::commit();

            return response()->json($ordenInternaMaterial, 200);
        } catch(Exception $e) {
            DB::rollBack();
            return response()->json(['error' => 'Error al actualizar el detalle de producto: ' . $e->getMessage()], 500);
        }
    }

    public function destroy($id)
    {
        $user = auth()->user();
        try {
            DB::beginTransaction();
            $ordenInternaMaterial = OrdenInternaMateriales::findOrFail($id);

            // buscamos el detalle de parte
            $ordenInternaParte = OrdenInternaPartes::findOrFail($ordenInternaMaterial->opd_id);
            $ordenInterna = OrdenInterna::findOrFail($ordenInternaParte->oic_id);

            // actualizamos la orden interna
            $ordenInterna->oic_fecmodificacion = date('Y-m-d H:i:s');
            $ordenInterna->oic_usumodificacion = $user->usu_codigo;
            $ordenInterna->save();

            // eliminamos fisicamente el detalle de meterial
            $ordenInternaMaterial->delete();

            DB::commit();
            return response()->json(['message' => 'Detalle de material eliminado'], 200);
        } catch(Exception $e) {
            DB::rollBack();
            return response()->json(['error' => 'Error al eliminar el detalle de material: ' . $e->getMessage()], 500);
        }
    }
}
