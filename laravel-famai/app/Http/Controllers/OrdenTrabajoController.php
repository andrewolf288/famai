<?php

namespace App\Http\Controllers;

use App\OrdenTrabajo;
use Illuminate\Database\Eloquent\ModelNotFoundException;
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

    // public function findByNumero($numero)
    // {
    //     try {
    //         $ordenTrabajo = OrdenTrabajo::where('odt_numero', $numero)
    //             ->with('cliente')
    //             ->firstOrFail();

    //         return response()->json($ordenTrabajo);
    //     } catch (ModelNotFoundException $e) {
    //         return response()->json([
    //             'error' => 'Orden de trabajo no encontrada',
    //         ], 404);
    //     }
    // }
    public function findByNumero($numero)
    {
        $queryBuilder = DB::connection('sqlsrv_secondary')
                        ->table('OWOR as OT')
                        ->leftJoin('OCRD as C', 'OT.CardCode', '=', 'C.CardCode')
                        ->select(
                            'OT.DocNum as odt_numero',
                            DB::raw('CAST(OT.PostDate AS DATE) as odt_fecha'),
                            'OT.CardCode as cli_nrodocumento',
                            'C.CardName as cli_nombre',  // Obtenemos el CardName con el LEFT JOIN
                            'OT.ProdName as odt_equipo',
                            DB::raw("
                                CASE 
                                    WHEN OT.U_EXX_TIPOSERV = 1 THEN 'Reparacion'
                                    WHEN OT.U_EXX_TIPOSERV = 2 THEN 'Fabricacion'
                                    WHEN OT.U_EXX_TIPOSERV = 3 THEN 'Compra/Venta'
                                    WHEN OT.U_EXX_TIPOSERV = 4 THEN 'Garantia Total'
                                    WHEN OT.U_EXX_TIPOSERV = 5 THEN 'Interno'
                                    WHEN OT.U_EXX_TIPOSERV = 6 THEN 'Garantia Parcial'
                                    WHEN OT.U_EXX_TIPOSERV = 7 THEN 'Sellos'
                                    ELSE 'Otro'
                                END as odt_trabajo
                            "),
                            DB::raw("
                                CASE 
                                    WHEN OT.Status = 'L' THEN 'Cerrado'
                                    WHEN OT.Status = 'R' THEN 'Abierto'
                                    ELSE 'Planificado'
                                END as odt_estado
                            ")
                        )
                        ->where('OT.DocNum', $numero)
                        ->first();
        if(!$queryBuilder){
            return response()->json([
                'message' => 'Registro no encontrado.',
            ], 404);
        }

        return response()->json($queryBuilder);
    }
}
