<?php

namespace App\Http\Controllers;

use App\OrdenInterna;
use App\OrdenInternaMateriales;
use App\OrdenInternaPartes;
use App\OrdenInternaProcesos;
use Exception;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;

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
        $odtNumero = $request->input('ot_numero', null);
        $oicNumero = $request->input('oi_numero', null);
        $equipo = $request->input('oic_equipo_descripcion', null);

        $query = OrdenInterna::with(['cliente', 'area', 'trabajadorOrigen', 'trabajadorMaestro', 'trabajadorAlmacen']);

        if ($odtNumero !== null) {
            $query->where('odt_numero', $odtNumero);
        }

        if ($oicNumero !== null) {
            $query->where('oic_numero', $oicNumero);
        }

        if ($equipo !== null) {
            $query->where('oic_equipo_descripcion', 'like', "%{$equipo}%");
        }

        $query->orderBy('oic_fecha', 'desc');

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

    public function show($id)
    {
        $ordenInterna = OrdenInterna::with(['cliente', 'area', 'trabajadorOrigen', 'trabajadorMaestro', 'trabajadorAlmacen', 'partes.parte', 'partes.materiales.producto', 'partes.procesos.proceso'])
            ->findOrFail($id);
        return response()->json($ordenInterna);
    }

    public function update_material(Request $request, $id)
    {
        $user = auth()->user();
        try {
            DB::beginTransaction();

            $ordenInternaParte = OrdenInternaPartes::find($id);
            if (!$ordenInternaParte) {
                throw new Exception('Orden Interna Parte no encontrada');
            }

            $validator = Validator::make($request->all(), [
                'materiales' => 'required|array|min:1',
            ])->validate();

            // Arreglo para almacenar los registros creados
            $createdMateriales = [];
            
            $materiales = $request->input('materiales');
            foreach ($materiales as $material) {
                $newMaterial = OrdenInternaMateriales::create([
                    'opd_id' => $ordenInternaParte->opd_id,
                    'pro_id' => $material['odm_asociar'] === true ? $material['pro_id'] : null,
                    'odm_item' => $material['odm_item'],
                    'odm_descripcion' => $material['odm_descrcipcion'],
                    'odm_cantidad' => $material['odm_cantidad'],
                    'odm_observacion' => $material['odm_observacion'],
                    'odm_tipo' => 2,
                    'odm_estado' => 1,
                    'usu_usucreacion' => $user->usu_codigo,
                ]);

                $newMaterial->load('producto');

                // Añadimos el proceso creado al arreglo
                $createdMateriales[] = $newMaterial;
            }

            DB::commit();

            // Retornamos los procesos creados
            return response()->json([
                'success' => true,
                'data' => $createdMateriales,
            ], 201);
            
        } catch (Exception $e) {
            DB::rollBack();
            return response()->json([
                'error' => $e->getMessage(),
            ]);
        }
    }

    public function update_proceso(Request $request, $id)
    {
        $user = auth()->user();
        try {
            DB::beginTransaction();

            $ordenInternaParte = OrdenInternaPartes::find($id);
            if (!$ordenInternaParte) {
                throw new Exception('Orden Interna Parte no encontrada');
            }

            $validator = Validator::make($request->all(), [
                'procesos' => 'required|array|min:1',
            ])->validate();

            // Arreglo para almacenar los registros creados
            $createdProcesses = [];
            
            $procesos = $request->input('procesos');
            foreach ($procesos as $proceso) {
                $newProceso = OrdenInternaProcesos::create([
                    'opd_id' => $ordenInternaParte->opd_id,
                    'opp_id' => $proceso['opp_id'],
                    'odp_observacion' => $proceso['odp_observacion'],
                    'odp_estado' => true,
                    'usu_usucreacion' => $user->usu_codigo,
                ]);

                $newProceso->load('proceso');

                // Añadimos el proceso creado al arreglo
                $createdProcesses[] = $newProceso;
            }

            DB::commit();

            // Retornamos los procesos creados
            return response()->json([
                'success' => true,
                'data' => $createdProcesses,
            ], 201);
            
        } catch (Exception $e) {
            DB::rollBack();
            return response()->json([
                'error' => $e->getMessage(),
            ]);
        }
    }

    public function store(Request $request)
    {
        $user = auth()->user();
        try {
            // iniciamos una transaccion
            DB::beginTransaction();

            $validator = Validator::make($request->all(), [
                'odt_numero' => 'required|string',
                'cli_id' => 'required|integer|exists:tblclientes_cli,cli_id',
                'are_codigo' => 'required|string|exists:tblareas_are,are_codigo',
                'oic_fecha' => 'required|date',
                'tra_idalmacen' => 'required|integer|exists:tbltrabajadores_tra,tra_id',
                'tra_idmaestro' => 'required|integer|exists:tbltrabajadores_tra,tra_id',
                'tra_idorigen' => 'required|integer|exists:tbltrabajadores_tra,tra_id',
                'oic_equipo_descripcion' => 'required|string',
                'detalle_partes' => 'required|array|min:1',
            ])->validate();

            $ordeninterna = OrdenInterna::create([
                'oic_numero' => 12345,
                'oic_fecha' => $request->input('oic_fecha'),
                'odt_numero' => $request->input('odt_numero'),
                'cli_id' => $request->input('cli_id'),
                'are_codigo' => $request->input('are_codigo'),
                'oic_equipo_descripcion' => $request->input('oic_equipo_descripcion'),
                'tra_idorigen' => $request->input('tra_idorigen'),
                'tra_idmaestro' => $request->input('tra_idmaestro'),
                'tra_idalmacen' => $request->input('tra_idalmacen'),
                'oic_estado' => 1,
                'usu_usucreacion' => $user->usu_codigo,
            ]);

            $detallePartes = $request->input('detalle_partes');
            foreach ($detallePartes as $parte) {
                $validatorParte = Validator::make($parte, [
                    'oip_id' => 'required|integer|exists:tblordenesinternaspartes_oip,oip_id',
                ])->validate();

                $ordenInternaParte = OrdenInternaPartes::create([
                    'oic_id' => $ordeninterna->oic_id,
                    'oip_id' => $parte['oip_id'],
                    'usu_usucreacion' => $user->usu_codigo
                ]);

                // recorremos el detalle de procesos
                $detalle_procesos = $parte['detalle_procesos'] ?? [];
                foreach ($detalle_procesos as $proceso) {
                    $validatorProceso = Validator::make($proceso, [
                        'opp_id' => 'required|integer|exists:tblordenesinternasprocesos_opp,opp_id',
                        'odp_observacion' => 'nullable|string',
                    ])->validate();

                    OrdenInternaProcesos::create([
                        'opd_id' => $ordenInternaParte->opd_id,
                        'opp_id' => $proceso['opp_id'],
                        'odp_observacion' => $proceso['odp_observacion'],
                        'odp_estado' => 1,
                        'usu_usucreacion' => $user->usu_codigo
                    ]);
                }

                // recorremos el detalle de materiales
                $detalle_materiales = $parte['detalle_materiales'] ?? [];
                foreach ($detalle_materiales as $material) {
                    $validatorMaterial = Validator::make($material, [
                        'pro_id' => 'required|integer|exists:tblproductos_pro,pro_id',
                        'odm_descripcion' => 'required|string',
                        'odm_cantidad' => 'required|numeric|min:1',
                        'odm_item' => 'required|integer',
                        'odm_observacion' => 'nullable|string',
                        'odm_asociar' => 'required|boolean'
                    ])->validate();

                    OrdenInternaMateriales::create([
                        'opd_id' => $ordenInternaParte->opd_id,
                        'pro_id' => $material['odm_asociar'] === true ? $material['pro_id'] : null,
                        'odm_descripcion' => $material['odm_descripcion'],
                        'odm_cantidad' => $material['odm_cantidad'],
                        'odm_item' => $material['odm_item'],
                        'odm_observacion' => $material['odm_observacion'],
                        'odm_tipo' => 1,
                        'odm_estado' => 1,
                        'usu_usucreacion' => $user->usu_codigo
                    ]);
                }
            };

            // hacemos commit
            DB::commit();
        } catch (Exception $e) {
            // hacemos rollback y devolvemos el error
            DB::rollBack();
            return response()->json(["error" => $e->getMessage()], 500);
        }
    }
}
