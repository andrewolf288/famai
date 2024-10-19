<?php

namespace App\Http\Controllers;

use App\OrdenInterna;
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

    public function findByNumero2($numero)
    {
        // primero debemos verificar si ya se uso este numero de OT
        $ordeninterna = OrdenInterna::where('odt_numero', $numero)->first();
        if ($ordeninterna) {
            return response()->json(['error' => 'Ya se uso el numero de OT ' . $numero], 404);
        }

        $queryBuilder = DB::connection('sqlsrv_andromeda')
            ->table('OT_OrdenTrabajo as T1')
            ->leftJoin('OT_Equipo as T8', 'T8.IdEquipo', '=', 'T1.IdEquipo')
            ->leftJoin('OT_TipoEstadoOrdenTrabajo as T4', 'T4.IdTipoEstado', '=', 'T1.IdTipoEstado')
            ->leftJoin('OT_Componente as T9', 'T9.IdComponente', '=', 'T1.IdComponente')
            ->leftJoin('SAP_Cliente as T2', function ($join) {
                $join->on(DB::raw('T2.CardCode COLLATE SQL_Latin1_General_CP1_CI_AS'), '=', DB::raw('T1.CardCode COLLATE SQL_Latin1_General_CP1_CI_AS'));
            })
            ->select(
                'T1.NumOTSAP as odt_numero',
                'T4.DesTipoEstado as odt_estado',
                'T2.CardName as cli_nombre',
                'T2.CardCode as cli_nrodocumento',
                'T8.NomEquipo as odt_equipo',
                'T1.FecIngreso as odt_fecha',
                'T1.FecAprobacion as odt_fechaaprobacion',
                'T1.FecEntregaEstimada as odt_fechaentregaestimada',
                'T9.NomComponente as odt_componente'
            )
            ->where(DB::raw('T1.NumOTSAP COLLATE SQL_Latin1_General_CP1_CI_AS'), $numero)
            ->first();

        if (!$queryBuilder) {
            return response()->json([
                'error' => 'Registro no encontrado.',
            ], 404);
        }

        return response()->json($queryBuilder);
    }

    public function findByNumero($numero)
    {
        // primero debemos verificar si ya se uso este numero de OT
        $ordeninterna = OrdenInterna::where('odt_numero', $numero)->first();
        if ($ordeninterna) {
            return response()->json(['error' => 'Ya se uso el numero de OT ' . $numero], 404);
        }

        // caso contrario consultamos la informacion
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
        if (!$queryBuilder) {
            return response()->json([
                'error' => 'Registro no encontrado.',
            ], 404);
        }

        return response()->json($queryBuilder);
    }
}
