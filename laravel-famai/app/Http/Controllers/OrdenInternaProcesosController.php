<?php

namespace App\Http\Controllers;

use App\OrdenInterna;
use App\OrdenInternaPartes;
use App\OrdenInternaProcesos;
use Exception;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class OrdenInternaProcesosController extends Controller
{
    // actualizar detalle de proceso
    public function update(Request $request, $id)
    {
        $user = auth()->user();
        try {
            DB::beginTransaction();
            $ordenInternaProceso = OrdenInternaProcesos::findOrFail($id);
            $request->validate([
                'odp_descripcion' => 'required|string',
                'odp_observacion' => 'nullable|string|max:500',
                'odp_ccalidad' => 'required|boolean',
            ]);

            $ordenInternaProceso->update([
                'odp_descripcion' => $request->input('odp_descripcion'),
                'odp_observacion' => $request->input('odp_observacion'),
                'odp_ccalidad' => $request->input('odp_ccalidad'),
                'odp_usumodificacion' => $user->usu_codigo,
            ]);

            // buscamos el detalle de parte
            $ordenInternaParte = OrdenInternaPartes::findOrFail($ordenInternaProceso->opd_id);
            $ordenInterna = OrdenInterna::findOrFail($ordenInternaParte->oic_id);

            // actualizamos la orden interna
            $ordenInterna->oic_fecmodificacion = date('Y-m-d H:i:s');
            $ordenInterna->oic_usumodificacion = $user->usu_codigo;
            $ordenInterna->save();

            DB::commit();

            return response()->json($ordenInternaProceso, 200);
        } catch(Exception $e) {
            DB::rollBack();
            return response()->json(['error' => 'Error al actualizar el detalle de proceso: ' . $e->getMessage()], 500);
        }
    }

    public function destroy($id)
    {
        $user = auth()->user();
        try {
            DB::beginTransaction();
            $ordenInternaProceso = OrdenInternaProcesos::findOrFail($id);

            // buscamos el detalle de parte
            $ordenInternaParte = OrdenInternaPartes::findOrFail($ordenInternaProceso->opd_id);
            $ordenInterna = OrdenInterna::findOrFail($ordenInternaParte->oic_id);

            // actualizamos la orden interna
            $ordenInterna->oic_fecmodificacion = date('Y-m-d H:i:s');
            $ordenInterna->oic_usumodificacion = $user->usu_codigo;
            $ordenInterna->save();

            // eliminamos fisicamente el detalle de proceso
            $ordenInternaProceso->delete();

            DB::commit();
            return response()->json(['message' => 'Detalle de proceso eliminado'], 200);
        } catch(Exception $e) {
            DB::rollBack();
            return response()->json(['error' => 'Error al eliminar el detalle de proceso: ' . $e->getMessage()], 500);
        }
    }
}
