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
                'opd_ccalidad' => 'required|boolean',
            ]);

            $ordenInternaProceso->update([
                'opd_ccalidad' => $request->input('opd_ccalidad'),
                'opd_usumodificacion' => $user->usu_codigo,
            ]);

            // buscamos el detalle de parte
            $ordenInternaParte = OrdenInternaPartes::findOrFail($ordenInternaProceso->opd_id);
            $ordenInterna = OrdenInterna::findOrFail($ordenInternaParte->oic_id);

            // actualizamos la orden interna
            $ordenInterna->oic_fecmodificacion = date('Y-m-d H:i:s');
            $ordenInterna->oic_usumodificacion = $user->usu_codigo;
            $ordenInterna->save();

            DB::commit();
            return response()->json(['message' => 'Se actualizo el detalle de proceso'], 200);
        } catch(Exception $e) {
            DB::rollBack();
            return response()->json(['error' => 'Error al actualizar el detalle de proceso: ' . $e->getMessage()], 500);
        }
    }
}
