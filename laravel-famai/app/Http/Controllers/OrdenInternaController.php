<?php

namespace App\Http\Controllers;

use App\Cliente;
use App\Helpers\DateHelper;
use App\OrdenInterna;
use App\OrdenInternaMateriales;
use App\OrdenInternaPartes;
use App\OrdenInternaProcesos;
use App\OrdenTrabajo;
use App\Producto;
use App\Unidad;
use Carbon\Carbon;
use Dompdf\Dompdf;
use Dompdf\Options;
use Exception;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\View;
use App\Reporte;

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
        $odtNumero = $request->input('odt_numero', null);
        $oicNumero = $request->input('oic_numero', null);
        $oicEstado = $request->input('oic_estado', null);

        $fecha_desde = $request->input('fecha_desde', null);
        $fecha_hasta = $request->input('fecha_hasta', null);

        $query = OrdenInterna::with(['cliente', 'area', 'trabajadorOrigen', 'trabajadorMaestro', 'trabajadorAlmacen', 'ordenTrabajo']);
        if ($odtNumero !== null) {
            $query->where('odt_numero', $odtNumero);
        }

        if ($oicNumero !== null) {
            $query->where('oic_numero', $oicNumero);
        }

        if ($oicEstado !== null) {
            $query->where('oic_estado', $oicEstado);
        }

        if ($fecha_desde !== null && $fecha_hasta !== null) {
            $query->whereBetween('oic_fecha', [$fecha_desde, $fecha_hasta]);
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

    public function findByNumero($numero)
    {
        $ordenInterna = OrdenInterna::with(['cliente', 'area', 'trabajadorOrigen', 'trabajadorMaestro', 'trabajadorAlmacen', 'partes.parte', 'partes.materiales.producto', 'partes.procesos.proceso'])
            ->where('oic_numero', $numero)
            ->first();
        if (!$ordenInterna) {
            return response()->json(['error' => 'Orden interna no encontrada'], 404);
        }
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
                // buscamos el material en la base de datos
                $pro_id = null;
                // si se debe asociat el amterial
                if ($material['odm_asociar']) {
                    // buscamos el material en la base de datos
                    $findMaterial = Producto::where('pro_codigo', $material['pro_id'])->first();
                    // en caso no se encuentre, se crea el registro
                    if (!$findMaterial) {
                        // hacemos una busqueda de los datos en la base de datos secundaria
                        $productoSecondary = DB::connection('sqlsrv_secondary')
                            ->table('OITM as T0')
                            ->select([
                                'T0.ItemCode as pro_codigo',
                                'T0.ItemName as pro_descripcion',
                                'T0.BuyUnitMsr as uni_codigo',
                            ])
                            ->where('T0.ItemCode', $material['pro_id'])
                            ->first();

                        if ($productoSecondary) {
                            // debemos hacer validaciones de la unidad
                            $uni_codigo = 'SIN';
                            $uni_codigo_secondary = trim($productoSecondary->uni_codigo);
                            if (!empty($uni_codigo)) {
                                $unidadFound = Unidad::where('uni_codigo', $uni_codigo_secondary)->first();
                                if ($unidadFound) {
                                    $uni_codigo = $unidadFound->uni_codigo;
                                } else {
                                    $unidadCreated = Unidad::create([
                                        'uni_codigo' => $uni_codigo_secondary,
                                        'uni_descripcion' => $uni_codigo_secondary,
                                        'uni_activo' => 1,
                                        'uni_usucreacion' => $user->usu_codigo,
                                        'uni_fecmodificacion' => null
                                    ]);
                                    $uni_codigo = $unidadCreated->uni_codigo;
                                }
                            }
                            // creamos el producto con los valores correspondientes
                            $productoCreado = Producto::create([
                                'pro_codigo' => $productoSecondary->pro_codigo,
                                'pro_descripcion' => $productoSecondary->pro_descripcion,
                                'uni_codigo' => $uni_codigo,
                                'pgi_codigo' => 'SIN',
                                'pfa_codigo' => 'SIN',
                                'psf_codigo' => 'SIN',
                                'pma_codigo' => 'SIN',
                                'pro_usucreacion' => $user->usu_codigo,
                                'pro_fecmodificacion' => null
                            ]);
                            // se establece el ID correspondiente
                            $pro_id = $productoCreado->pro_id;
                        } else {
                            throw new Exception('Material no encontrado en la base de datos secundaria');
                        }
                    } else {
                        // en el caso que se encuentre el producto en base de datos dbfamai
                        $pro_id = $findMaterial->pro_id;
                    }
                }

                $newMaterial = OrdenInternaMateriales::create([
                    'opd_id' => $ordenInternaParte->opd_id,
                    'pro_id' => $pro_id,
                    'odm_item' => $material['odm_item'],
                    'odm_descripcion' => $material['odm_descripcion'],
                    'odm_cantidad' => $material['odm_cantidad'],
                    'odm_observacion' => $material['odm_observacion'],
                    'odm_tipo' => $material['odm_tipo'],
                    'odm_estado' => 1,
                    'odm_usucreacion' => $user->usu_codigo,
                    'odm_fecmodificacion' => null
                ]);

                $newMaterial->load('producto');

                // Añadimos el proceso creado al arreglo
                $createdMateriales[] = $newMaterial;
            }

            // actualizamos informacion de actualizacion de orden interna
            $ordenInterna = OrdenInterna::find($ordenInternaParte->oic_id);
            $ordenInterna->oic_fecmodificacion = date('Y-m-d H:i:s');
            $ordenInterna->oic_fecha = date('Y-m-d H:i:s');
            $ordenInterna->oic_usumodificacion = $user->usu_codigo;
            $ordenInterna->save();

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
                    'odp_ccalidad' => $proceso['odp_ccalidad'],
                    'odp_descripcion' => $proceso['odp_descripcion'],
                    'odp_observacion' => $proceso['odp_observacion'],
                    'odp_estado' => true,
                    'odp_usucreacion' => $user->usu_codigo,
                    'odp_fecmodificacion' => null
                ]);

                $newProceso->load('proceso');

                // Añadimos el proceso creado al arreglo
                $createdProcesses[] = $newProceso;
            }

            // actualizamos informacion de actualizacion de orden interna
            $ordenInterna = OrdenInterna::find($ordenInternaParte->oic_id);
            $ordenInterna->oic_fecmodificacion = date('Y-m-d H:i:s');
            $ordenInterna->oic_fecha = date('Y-m-d H:i:s');
            $ordenInterna->oic_usumodificacion = $user->usu_codigo;
            $ordenInterna->save();

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
                'cli_id' => 'required|string',
                'oic_numero' => 'required|string|unique:tblordenesinternascab_oic,oic_numero',
                'are_codigo' => 'required|string|exists:tblareas_are,are_codigo',
                'oic_fecha' => 'required|date',
                'oic_fechaaprobacion' => 'nullable|date',
                'oic_fechaentregaestimada' => 'nullable|date',
                'oic_fechaevaluacion' => 'nullable|date',
                'tra_idalmacen' => 'nullable|integer|exists:tbltrabajadores_tra,tra_id',
                'tra_idmaestro' => 'nullable|integer|exists:tbltrabajadores_tra,tra_id',
                'tra_idorigen' => 'required|integer|exists:tbltrabajadores_tra,tra_id',
                'oic_equipo_descripcion' => 'required|string',
                'detalle_partes' => 'required|array|min:1',
            ])->validate();

            // ---------- MANEJO DE INFORMACION DEL CLIENTE ----------
            $cli_id = null;
            // debemos buscar si el cliente existe en nuestra base de datos
            $clienteFound = Cliente::where('cli_nrodocumento', $request->input('cli_id'))->first();
            if ($clienteFound) {
                $cli_id = $clienteFound->cli_id;
            } else {
                // si no existe debemos crearlo
                // debemos buscar la informacion correspondiente en la tabla secundaria
                // $clienteSecondary = DB::connection('sqlsrv_secondary')
                //     ->table('OCRD')
                //     ->select('CardCode', 'CardName')
                //     ->where('CardCode', $request->input('cli_id'))
                //     ->first();
                $clienteSecondary = DB::connection('sqlsrv_andromeda')
                    ->table('SAP_Cliente')
                    ->select('CardCode', 'CardName')
                    ->where(DB::raw('CardCode COLLATE SQL_Latin1_General_CP1_CI_AS'), $request->input('cli_id'))
                    ->first();

                if ($clienteSecondary) {
                    $documento = substr($clienteSecondary->CardCode, 1);
                    $longitud = strlen($documento);
                    $clienteCreated = Cliente::create([
                        'tdo_codigo' => $longitud == 8 ? 'DNI' : 'RUC', // verificar??
                        'cli_nrodocumento' => $clienteSecondary->CardCode,
                        'cli_nombre' => $clienteSecondary->CardName,
                        'cli_activo' => 1,
                        'cli_usucreacion' => $user->usu_codigo,
                        'cli_fecmodificacion' => null
                    ]);
                    $cli_id = $clienteCreated->cli_id;
                } else {
                    throw new Exception('El cliente no existe en la base de datos secundaria');
                }
            }

            // ---------- MANEJO DE INFORMACION DE LA ORDEN DE TRABAJO ----------
            $flagErrors = '';
            $odt_numero = null;
            // debemos buscar si existe la informacion de orden de trabajo en nuestra base de datos
            $odtFound = OrdenTrabajo::where('odt_numero', $request->input('odt_numero'))
                ->first();
            if ($odtFound) {
                $odt_numero = $odtFound->odt_numero;
            } else {
                // si no existe debemos crearlo
                // debemos buscar la informacion correspondiente en la tabla secundaria
                // $otSecondary = DB::connection('sqlsrv_secondary')
                //     ->table('OWOR as OT')
                //     ->select(
                //         'OT.DocNum as odt_numero',
                //         DB::raw('CAST(OT.PostDate AS DATE) as odt_fecha'),
                //         'OT.ProdName as odt_equipo',
                //         DB::raw("
                //                 CASE 
                //                     WHEN OT.U_EXX_TIPOSERV = 1 THEN 'Reparacion'
                //                     WHEN OT.U_EXX_TIPOSERV = 2 THEN 'Fabricacion'
                //                     WHEN OT.U_EXX_TIPOSERV = 3 THEN 'Compra/Venta'
                //                     WHEN OT.U_EXX_TIPOSERV = 4 THEN 'Garantia Total'
                //                     WHEN OT.U_EXX_TIPOSERV = 5 THEN 'Interno'
                //                     WHEN OT.U_EXX_TIPOSERV = 6 THEN 'Garantia Parcial'
                //                     WHEN OT.U_EXX_TIPOSERV = 7 THEN 'Sellos'
                //                     ELSE 'Otro'
                //                 END as odt_trabajo
                //             "),
                //         DB::raw("
                //                 CASE 
                //                     WHEN OT.Status = 'L' THEN 'Cerrado'
                //                     WHEN OT.Status = 'R' THEN 'Abierto'
                //                     ELSE 'Planificado'
                //                 END as odt_estado
                //             ")
                //     )
                //     ->where('OT.DocNum', $request->input('odt_numero'))
                //     ->first();

                $otSecondary = DB::connection('sqlsrv_andromeda')
                    ->table('OT_OrdenTrabajo as T1')
                    ->leftJoin('OT_Equipo as T8', 'T8.IdEquipo', 'T1.IdEquipo')
                    ->leftJoin('OT_TipoEstadoOrdenTrabajo as T4', 'T4.IdTipoEstado', 'T1.IdTipoEstado')
                    ->leftJoin('SAP_Cliente as T2', function ($join) {
                        $join->on(DB::raw('T2.CardCode COLLATE SQL_Latin1_General_CP1_CI_AS'), '=', DB::raw('T1.CardCode COLLATE SQL_Latin1_General_CP1_CI_AS'));
                    })
                    ->leftJoin('OT_TipoServicio as T3', 'T3.IdTipoServicio', 'T1.IdTipoServicio')
                    ->select(
                        'T1.NumOTSAP as odt_numero',
                        'T4.DesTipoEstado as odt_estado',
                        'T2.CardName as cli_nombre',
                        'T2.CardCode as cli_nrodocumento',
                        'T8.NomEquipo as odt_equipo',
                        'T1.FecIngreso as odt_fecha',
                        'T1.FecAprobacion as odt_fechaaprobacion',
                        'T1.FecEntregaEstimada as odt_fechaentregaestimada',
                        'T3.DesTipoServicio as odt_trabajo'
                    )
                    ->where(DB::raw('T1.NumOTSAP COLLATE SQL_Latin1_General_CP1_CI_AS'), $request->input('odt_numero'))
                    ->first();

                if ($otSecondary) {
                    $data = [
                        'odt_numero' => $otSecondary->odt_numero,
                        'odt_fecha' => $otSecondary->odt_fecha,
                        'cli_id' => $cli_id,
                        'odt_equipo' => $otSecondary->odt_equipo,
                        'odt_trabajo' => $otSecondary->odt_trabajo,
                        'odt_estado' => $otSecondary->odt_estado,
                        'odt_usucreacion' => $user->usu_codigo,
                        'odt_feccreacion' => Carbon::now(),
                    ];
                    DB::table('tblordenesdetrabajo_odt')->insert($data);

                    // Obtener el registro insertado
                    $odtCreated = DB::table('tblordenesdetrabajo_odt')
                        ->where('odt_numero', $otSecondary->odt_numero) // Asumiendo que 'odt_numero' es único
                        ->first();
                    $flagErrors .= "Se ha creado la orden interna con numero {$odtCreated->odt_numero}. De base de datos secundaria se obtiene: {$otSecondary->odt_numero} y cliente: {$cli_id} y fecha: {$otSecondary->odt_fecha} " . "toda la data fue: " . print_r($data, true);
                    $odt_numero = $odtCreated->odt_numero;
                } else {
                    throw new Exception('La orden de trabajo no existe en la base de datos secundaria');
                }
            }

            if (is_null($odt_numero) || $odt_numero === 0) {
                throw new Exception('No se pudo encontrar un número de orden de trabajo válido para: ' . $odt_numero . ' Valor en la insercion: ' . $flagErrors);
            }

            // creamos la orden interna
            $ordeninterna = OrdenInterna::create([
                'oic_numero' => $request->input('oic_numero'),
                'oic_fecha' => $request->input('oic_fecha'),
                'oic_fechaaprobacion' => $request->input('oic_fechaaprobacion'),
                'oic_fechaentregaestimada' => $request->input('oic_fechaentregaestimada'),
                'odt_numero' => $odt_numero,
                'cli_id' => $cli_id,
                'are_codigo' => $request->input('are_codigo'),
                'oic_equipo_descripcion' => $request->input('oic_equipo_descripcion'),
                'oic_componente' => $request->input('oic_componente'),
                'tra_idorigen' => $request->input('tra_idorigen'),
                'tra_idmaestro' => $request->input('tra_idmaestro'),
                'tra_idalmacen' => $request->input('tra_idalmacen'),
                'oic_activo' => 1,
                'oic_estado' => 'INGRESO',
                'oic_usucreacion' => $user->usu_codigo,
                'oic_fecmodificacion' => null, // para colocar que la fecha de modificacion no se setee al crearse el registro
            ]);

            $detallePartes = $request->input('detalle_partes');
            foreach ($detallePartes as $parte) {
                $validatorParte = Validator::make($parte, [
                    'oip_id' => 'required|integer|exists:tblordenesinternaspartes_oip,oip_id',
                ])->validate();

                $ordenInternaParte = OrdenInternaPartes::create([
                    'oic_id' => $ordeninterna->oic_id,
                    'oip_id' => $parte['oip_id'],
                    'opd_usucreacion' => $user->usu_codigo
                ]);

                // recorremos el detalle de procesos
                $detalle_procesos = $parte['detalle_procesos'] ?? [];
                foreach ($detalle_procesos as $proceso) {
                    $validatorProceso = Validator::make($proceso, [
                        'opp_id' => 'required|integer|exists:tblordenesinternasprocesos_opp,opp_id',
                        'odp_descripcion' => 'required|string', # se añadio el campo de descripcion
                        'odp_observacion' => 'nullable|string',
                        'odp_ccalidad' => 'required|boolean',
                    ])->validate();

                    OrdenInternaProcesos::create([
                        'opd_id' => $ordenInternaParte->opd_id,
                        'opp_id' => $proceso['opp_id'],
                        'odp_descripcion' => $proceso['odp_descripcion'],
                        'odp_observacion' => $proceso['odp_observacion'],
                        'odp_ccalidad' => $proceso['odp_ccalidad'],
                        'odp_estado' => 1,
                        'odp_usucreacion' => $user->usu_codigo,
                        'odp_fecmodificacion' => null
                    ]);
                }

                // recorremos el detalle de materiales
                $detalle_materiales = $parte['detalle_materiales'] ?? [];
                foreach ($detalle_materiales as $material) {
                    $validatorMaterial = Validator::make($material, [
                        'odm_descripcion' => 'required|string',
                        'odm_cantidad' => 'required|numeric|min:1',
                        'odm_item' => 'required|integer',
                        'odm_observacion' => 'nullable|string',
                        'odm_tipo' => 'required|integer',
                        'odm_asociar' => 'required|boolean'
                    ])->validate();

                    // buscamos el material en la base de datos
                    $pro_id = null;
                    // si se debe asociat el material
                    if ($material['odm_asociar']) {
                        // buscamos el material en la base de datos
                        $findMaterial = Producto::where('pro_codigo', $material['pro_id'])->first();
                        // en caso no se encuentre, se crea el registro
                        if (!$findMaterial) {
                            // hacemos una busqueda de los datos en la base de datos secundaria
                            $productoSecondary = DB::connection('sqlsrv_secondary')
                                ->table('OITM as T0')
                                ->select([
                                    'T0.ItemCode as pro_codigo',
                                    'T0.ItemName as pro_descripcion',
                                    'T0.BuyUnitMsr as uni_codigo',
                                ])
                                ->where('T0.ItemCode', $material['pro_id'])
                                ->first();

                            if ($productoSecondary) {
                                // debemos hacer validaciones de la unidad
                                $uni_codigo = 'SIN';
                                $uni_codigo_secondary = trim($productoSecondary->uni_codigo);
                                if (!empty($uni_codigo)) {
                                    $unidadFound = Unidad::where('uni_codigo', $uni_codigo_secondary)->first();
                                    if ($unidadFound) {
                                        $uni_codigo = $unidadFound->uni_codigo;
                                    } else {
                                        $unidadCreated = Unidad::create([
                                            'uni_codigo' => $uni_codigo_secondary,
                                            'uni_descripcion' => $uni_codigo_secondary,
                                            'uni_activo' => 1,
                                            'uni_usucreacion' => $user->usu_codigo,
                                            'uni_fecmodificacion' => null
                                        ]);
                                        $uni_codigo = $unidadCreated->uni_codigo;
                                    }
                                }
                                // creamos el producto con los valores correspondientes
                                $productoCreado = Producto::create([
                                    'pro_codigo' => $productoSecondary->pro_codigo,
                                    'pro_descripcion' => $productoSecondary->pro_descripcion,
                                    'uni_codigo' => $uni_codigo,
                                    'pgi_codigo' => 'SIN',
                                    'pfa_codigo' => 'SIN',
                                    'psf_codigo' => 'SIN',
                                    'pma_codigo' => 'SIN',
                                    'pro_usucreacion' => $user->usu_codigo,
                                    'pro_fecmodificacion' => null
                                ]);
                                // se establece el ID correspondiente
                                $pro_id = $productoCreado->pro_id;
                            } else {
                                throw new Exception('Material no encontrado en la base de datos secundaria');
                            }
                        } else {
                            // en el caso que se encuentre el producto en base de datos dbfamai
                            $pro_id = $findMaterial->pro_id;
                        }
                    }

                    OrdenInternaMateriales::create([
                        'opd_id' => $ordenInternaParte->opd_id,
                        'pro_id' => $pro_id,
                        'odm_descripcion' => $material['odm_descripcion'],
                        'odm_cantidad' => $material['odm_cantidad'],
                        'odm_item' => $material['odm_item'],
                        'odm_observacion' => $material['odm_observacion'],
                        'odm_tipo' => $material['odm_tipo'],
                        'odm_estado' => 1,
                        'odm_usucreacion' => $user->usu_codigo,
                        'odm_fecmodificacion' => null
                    ]);
                }
            };

            // hacemos commit
            DB::commit();

            return response()->json($ordeninterna, 200);
        } catch (Exception $e) {
            // hacemos rollback y devolvemos el error
            DB::rollBack();
            return response()->json(["error" => $e->getMessage()], 500);
        }
    }

    // actualizamos el estado de la orden interna
    public function update(Request $request, $id)
    {
        $user = auth()->user();
        try {
            DB::beginTransaction();

            $ordenInterna = OrdenInterna::find($id);
            if (!$ordenInterna) {
                throw new Exception('Orden Interna no encontrada');
            }

            $validator = Validator::make($request->all(), [
                'oic_estado' => 'required|string',
            ])->validate();

            $ordenInterna->update([
                'oic_estado' => $request->input('oic_estado'),
                'oic_usumodificacion' => $user->usu_codigo,
            ]);

            DB::commit();

            return response()->json($ordenInterna, 200);
        } catch (Exception $e) {
            DB::rollBack();
            return response()->json(["error" => $e->getMessage()], 500);
        }
    }

    public function destroy($id)
    {
        $ordenInterna = OrdenInterna::with(['partes.materiales', 'partes.procesos'])->findOrFail($id);

        // Verificar si alguna parte tiene materiales asociados
        foreach ($ordenInterna->partes as $parte) {
            if ($parte->materiales->count() > 0 || $parte->procesos->count() > 0) {
                // Si alguna parte tiene materiales, no se puede eliminar
                return response()->json(['error' => 'No se puede eliminar la orden interna porque alguna de sus partes tiene materiales o actividades asociados.'], 400);
            }
        }

        // Iniciar una transacción para asegurar la consistencia
        DB::transaction(function () use ($ordenInterna) {
            // Primero eliminar los detalles de procesos de cada parte
            foreach ($ordenInterna->partes as $parte) {
                $parte->procesos()->delete();  // Eliminar procesos
                $parte->materiales()->delete(); // Eliminar materiales (por seguridad)
            }

            // Luego eliminar las partes
            $ordenInterna->partes()->delete();

            // Finalmente eliminar la orden interna
            $ordenInterna->delete();
        });

        return response()->json(['success' => 'Orden interna eliminada correctamente.'], 200);
    }

    // previsualizar orden interna
    public function previsualizarOrdenInternaPDF(Request $request)
    {
        $reporte = new Reporte();
        $datosCabecera = array(
            ['nombre_del_cliente' => $request->input('cli_id'),
            'descripcion_equipo' => $request->input('oic_equipo_descripcion'),
            'oic_componente' => $request->input('oic_componente'),
            'oic_fecha' => $request->input('oic_fecha'),
            'odt_numero' => $request->input('odt_numero'),
            'oic_numero' => $request->input('oic_numero'),
            'are_descripcion' => $request->input('are_codigo'),
            'tra_idorigen' => $request->input('tra_idorigen'),
            'tra_nombreorigen' => $request->input('tra_idorigen'),
            'tra_idmaestro' => null,
            'tra_nombremaestro' => $request->input('tra_idmaestro'),
            'tra_idalmacen' => null,
            'tra_nombrealmacen' => $request->input('tra_idalmacen'),
            'oic_fechaevaluacion' => null,
            'oic_fechaaprobacion' => null,
            'oic_fechaentregaproduccion' => null,
            'oic_fechaentregaestimada' => null,
            'oic_usucreacion' => null,
            'oic_feccreacion' => null,
            'oic_usumodificacion' => null,
            'oic_fecmodificacion' => null]
        );
        $datosPartes = $request->input('detalle_partes', []);

        // Configurar opciones de DOMPDF
        $options = new Options();
        $options->set('isHtml5ParserEnabled', true);
        $options->set('isRemoteEnabled', true);
        $options->set('isPhpEnabled', true);
        $options->set('isJavascriptEnabled', true);

        // Crear instancia de DOMPDF
        $dompdf = new Dompdf($options);

        // Cargar la vista Blade y pasar datos si es necesario
        $html = View::make('orden-interna.ordeninterna', compact('datosCabecera', 'datosPartes'))->render();
        $dompdf->loadHtml($html);

        // Configurar el tamaño de papel y orientación
        $dompdf->setPaper('A4', 'landscape');

        // Renderizar el PDF
        $dompdf->render();

        // Mostrar el PDF en el navegador o descargar
        return response()->streamDownload(
            function () use ($dompdf) {
                echo $dompdf->output();
            },
            'reporte.pdf',
            [
                'Content-Type' => 'application/pdf',
                'Content-Disposition' => 'attachment; filename="reporte.pdf"'
            ]
        );
    }

    // exportar orden interna
    public function exportOrdenInternaPDF(Request $request)
    {
        $reporte = new Reporte();
        $idOIC = $request->input('oic_id');
        $datosCabecera = $reporte->metobtenerCabecera($idOIC);
        $calculoFechaEntregaLogistica = DateHelper::calcularFechaLimiteLogistica($datosCabecera[0]['oic_fechaaprobacion'], $datosCabecera[0]['oic_fechaentregaestimada']);
        $datosCabecera[0]['oic_fechaentregaproduccion'] = $calculoFechaEntregaLogistica;

        $datosPartes = $reporte->metobtenerPartes($idOIC);
        foreach ($datosPartes as &$parte) {
            $procesos = $reporte->metobtenerProcesos($idOIC, $parte['oip_id']);
            $materiales = $reporte->metobtenerMateriales($idOIC, $parte['oip_id']);
            $parte['detalle_procesos'] = $procesos;
            $parte['detalle_materiales'] = $materiales;
        }

        // Configurar opciones de DOMPDF
        $options = new Options();
        $options->set('isHtml5ParserEnabled', true);
        $options->set('isRemoteEnabled', true);
        $options->set('isPhpEnabled', true);
        $options->set('isJavascriptEnabled', true);

        // Crear instancia de DOMPDF
        $dompdf = new Dompdf($options);

        // Cargar la vista Blade y pasar datos si es necesario
        $html = View::make('orden-interna.ordeninterna', compact('datosCabecera', 'datosPartes'))->render();
        $dompdf->loadHtml($html);

        // Configurar el tamaño de papel y orientación
        $dompdf->setPaper('A4', 'landscape');

        // Renderizar el PDF
        $dompdf->render();

        // Mostrar el PDF en el navegador o descargar
        return response()->streamDownload(
            function () use ($dompdf) {
                echo $dompdf->output();
            },
            'reporte.pdf',
            [
                'Content-Type' => 'application/pdf',
                'Content-Disposition' => 'attachment; filename="reporte.pdf"'
            ]
        );
    }
}
