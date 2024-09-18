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


    /*
    //Funcion alternativa que usa Procedimientos almacenados
    public function findByNumero2($numero)
    {
        // Instancia el SP OrdenTrabajo
        $ordenTrabajo = new OrdenTrabajo();
        $result = $ordenTrabajo->metListadoOTSecondary($numero);
    
        if ($result && is_array($result)) {
            try {
                $cliente = Cliente::where('cli_nrodocumento', $result['cli_nrodocumento'])
                    ->firstOrFail();
    
                return response()->json($cliente);
            } catch (ModelNotFoundException $e) {
                $user = auth()->user();
    
                $validator = Validator::make($result, [
                    'cli_nrodocumento' => [
                        'required',
                        'string',
                        'max:16',
                        Rule::unique('tblclientes_cli', 'cli_nrodocumento'),
                    ],
                    'cli_nombre' => [
                        'required',
                        'string',
                        'max:250',
                        Rule::unique('tblclientes_cli', 'cli_nombre'),
                    ],
                ]);
    
                if ($validator->fails()) {
                    return response()->json(["error" => $validator->errors()], 400);
                }
    
                $cliente = Cliente::create(array_merge(
                    $validator->validated(),
                    [
                        "tdo_codigo" => "RUC",
                        "cli_activo" => "1",
                        "cli_usucreacion" => $user->usu_codigo,
                        "cli_fecmodificacion" => null,
                    ]
                ));
    
                return response()->json([
                    'message' => 'Cliente registrado exitosamente',
                    'data' => $cliente
                ], 201);
            }
        } else {
            return response()->json([
                'error' => 'Orden de trabajo no encontrada',
            ], 404);
        }
    }*/
}
