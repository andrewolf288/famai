<?php

namespace App\Http\Controllers;

use App\Area;
use App\Cliente;
use App\Helpers\DateHelper;
use App\Notificaciones;
use App\OrdenInterna;
use App\OrdenInternaMateriales;
use App\OrdenInternaPartes;
use App\OrdenInternaProcesos;
use App\OrdenTrabajo;
use App\Parte;
use App\Producto;
use App\Unidad;
use Carbon\Carbon;
use Exception;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\View;
use App\Reporte;
use App\Trabajador;
use DateTime;

// use PDF;

class OrdenInternaController extends Controller
{
    /**
     * Display a listing of the resource.
     *
     * @return \Illuminate\Http\Response
     */
    public function index(Request $request)
    {
        $user = auth()->user();
        $sed_codigo = "10";

        $trabajador = Trabajador::where('usu_codigo', $user->usu_codigo)->first();
        if($trabajador){
            $sed_codigo = $trabajador->sed_codigo;
        }

        $pageSize = $request->input('page_size', 10);
        $page = $request->input('page', 1);
        $odtNumero = $request->input('odt_numero', null);
        $oicEstado = $request->input('oic_estado', null);

        $fecha_desde = $request->input('fecha_desde', null);
        $fecha_hasta = $request->input('fecha_hasta', null);

        $query = OrdenInterna::with(['cliente', 'area', 'trabajadorOrigen', 'trabajadorMaestro', 'trabajadorAlmacen', 'ordenTrabajo'])
            ->where('oic_tipo', 'OI')
            ->where('sed_codigo', $sed_codigo);

        if ($odtNumero !== null) {
            $query->where('odt_numero', $odtNumero);
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

    // funcion que trae toda la informacion necesaria para la creación de orden interna
    public function informacionCreacionOrdenInterna(Request $request)
    {
        $usuario = $request->input('usu_codigo');
        // buscamos algun trabajador que este relacionado con el usuario
        $trabajador = Trabajador::where('usu_codigo', $usuario)->first();
        $are_codigo = null;
        if ($trabajador) {
            $are_codigo = $trabajador->are_codigo;
        }

        // traemos informacion de los responsables
        $responsables = Trabajador::all();
        // traemos informacion de las areas
        $areas = Area::where('are_codigo', 'CAR')
            ->orWhere('are_codigo', 'HID')
            ->get();
        // traemos informacion de las partes involucradas
        $partes = [];
        if ($are_codigo) {
            $partes = Parte::where('are_codigo', $are_codigo)
                ->orderBy('oip_orden', 'asc')
                ->get();
        }
        return response()->json([
            'trabajador' => $trabajador,
            'responsables' => $responsables,
            'areas' => $areas,
            'partes' => $partes
        ]);
    }

    public function show($id)
    {
        $ordenInterna = OrdenInterna::with(['cliente', 'area', 'trabajadorOrigen', 'trabajadorMaestro', 'trabajadorAlmacen', 'partes.parte', 'partes.materiales.producto', 'partes.procesos.proceso', 'partes.materiales.detalleAdjuntos'])
            ->findOrFail($id);
        return response()->json($ordenInterna);
    }

    public function findByNumero($numero)
    {
        $ordenInterna = OrdenInterna::with(['cliente', 'area', 'trabajadorOrigen', 'trabajadorMaestro', 'trabajadorAlmacen', 'partes.parte', 'partes.materiales.producto', 'partes.procesos.proceso', 'partes.materiales.detalleAdjuntos'])
            ->where('odt_numero', $numero)
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
                    'odm_estado' => null,
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
        $sed_codigo = "10";
        try {
            // iniciamos una transaccion
            DB::beginTransaction();
            $trabajador = Trabajador::where('usu_codigo', $user->usu_codigo)->first();
            if($trabajador){
                $sed_codigo = $trabajador->sed_codigo;
            }

            $validator = Validator::make($request->all(), [
                'odt_numero' => 'required|string',
                'cli_id' => 'required|string',
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
            $clienteFound = Cliente::where('cli_nrodocumento', $request->input('cli_id'))->first();
            if ($clienteFound) {
                $cli_id = $clienteFound->cli_id;
            } else {
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
                'oic_fecha' => $request->input('oic_fecha'),
                'oic_fechaaprobacion' => $request->input('oic_fechaaprobacion'),
                'oic_fechaentregaestimada' => $request->input('oic_fechaentregaestimada'),
                'sed_codigo' => $sed_codigo,
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
                'oic_tipo' => 'OI',
                'oic_usucreacion' => $user->usu_codigo,
                'oic_fecmodificacion' => null,
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
                        'odm_estado' => null,
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

            // si el estado cambiado es "ENVIADO"
            if ($request->input('oic_estado') == 'ENVIADO') {
                // buscamos todos los trabajadores pertenecientes al área de logistica
                $trabajadores = Trabajador::where('are_codigo', 'LOG')->get();
                foreach ($trabajadores as $trabajador) {
                    // creamos una nueva orden interna para cada trabajador
                    Notificaciones::create([
                        'ntf_fecha' => Carbon::now(),
                        'are_codigo' => 'LOG',
                        'usu_codigo' => $trabajador->usu_codigo,
                        'ntf_proceso' => "Ordenes Internas",
                        'ntf_descripcion' => "OI Nro $ordenInterna->odt_numero - Estado Enviado",
                        'ntf_visto' => null
                    ]);
                }
            }

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
            [
                'nombre_del_cliente' => $request->input('cli_id'),
                'descripcion_equipo' => $request->input('oic_equipo_descripcion'),
                'oic_componente' => $request->input('oic_componente'),
                'oic_fecha' => $request->input('oic_fecha'),
                'odt_numero' => $request->input('odt_numero'),
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
                'oic_fecmodificacion' => null
            ]
        );
        $datosPartes = $request->input('detalle_partes', []);
        // Cargar la vista Blade y pasar datos si es necesario
        $html = View::make('orden-interna.ordeninterna', compact('datosCabecera', 'datosPartes'))->render();
        // Crear una instancia de mPDF
        $mpdf = new \Mpdf\Mpdf([
            'mode' => 'utf-8',
            'format' => 'A4',
            'orientation' => 'L',
            'setAutoBottomMargin' => 'pad',
            'margin_left' => 1,
            'margin_right' => 1,
            'margin_top' => 1,
            'margin-footer' => 1,
            'margin_bottom' => 0,
        ]);

        $footer = '
        <table class="table-container-footer" width="100%">
            <tbody>
                <tr>
                    <td width="33%">Usuario Creación:
                        ' . ($datosCabecera[0]['oic_usucreacion'] ?? '') . ' Fecha:
                        ' . ($datosCabecera[0]['oic_feccreacion'] ? DateTime::createFromFormat('Y-m-d H:i:s.u', $datosCabecera[0]['oic_feccreacion'])->format('d/m/Y H:i:s') : '') . '
                    </td>
                    <td width="33%" style="text-align: center;vertical-align: middle;">Pag. {PAGENO}/{nbpg}</td>
                    <td width="33%" style="text-align: right;">
                        ' . ($datosCabecera[0]['odt_numero'] ?? '') . ' - ' . date('d/m/Y H:i:s') . '
                    </td>
                </tr>
                <tr>
                    <td>Usuario Modifica:
                        ' . ($datosCabecera[0]['oic_usumodificacion'] ?? '') . ' Fecha:
                        ' . ($datosCabecera[0]['oic_fecmodificacion'] ? DateTime::createFromFormat('Y-m-d H:i:s.u', $datosCabecera[0]['oic_fecmodificacion'])->format('d/m/Y H:i:s') : '') . '
                    </td>
                </tr>
            </tbody>
        </table>
        ';

        // Establecemos el footer
        $mpdf->SetHTMLFooter($footer);

        // Escribir el HTML renderizado en el PDF
        $mpdf->WriteHTML($html);

        // Generar el PDF y enviarlo al navegador
        return response()->streamDownload(
            function () use ($mpdf) {
                echo $mpdf->Output('voucher.pdf', 'I');
            },
            'reporte.pdf',
            [
                'Content-Type' => 'application/pdf',
                'Content-Disposition' => 'attachment; filename="reporte.pdf"'
            ]
        );
    }

    // --------- GENERAR PDF CON MPDF -----------------------
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

        // Cargar la vista Blade y pasar datos si es necesario
        $html = View::make('orden-interna.ordeninterna', compact('datosCabecera', 'datosPartes'))->render();
        // Crear una instancia de mPDF
        $mpdf = new \Mpdf\Mpdf([
            'mode' => 'utf-8',
            'format' => 'A4',
            'orientation' => 'L',
            'setAutoBottomMargin' => 'pad',
            'margin_left' => 1,
            'margin_right' => 1,
            'margin_top' => 1,
            'margin-footer' => 1,
            'margin_bottom' => 0,
        ]);

        $footer = '
        <table class="table-container-footer" width="100%">
            <tbody>
                <tr>
                    <td width="33%">Usuario Creación:
                        ' . ($datosCabecera[0]['oic_usucreacion'] ?? '') . ' Fecha:
                        ' . ($datosCabecera[0]['oic_feccreacion'] ? DateTime::createFromFormat('Y-m-d H:i:s.u', $datosCabecera[0]['oic_feccreacion'])->format('d/m/Y H:i:s') : '') . '
                    </td>
                    <td width="33%" style="text-align: center;vertical-align: middle;">Pag. {PAGENO}/{nbpg}</td>
                    <td width="33%" style="text-align: right;">
                        ' . ($datosCabecera[0]['odt_numero'] ?? '') . ' - ' . date('d/m/Y H:i:s') . '
                    </td>
                </tr>
                <tr>
                    <td>Usuario Modifica:
                        ' . ($datosCabecera[0]['oic_usumodificacion'] ?? '') . ' Fecha:
                        ' . ($datosCabecera[0]['oic_fecmodificacion'] ? DateTime::createFromFormat('Y-m-d H:i:s.u', $datosCabecera[0]['oic_fecmodificacion'])->format('d/m/Y H:i:s') : '') . '
                    </td>
                </tr>
            </tbody>
        </table>
        ';

        // Establecemos el footer
        $mpdf->SetHTMLFooter($footer);

        // Escribir el HTML renderizado en el PDF
        $mpdf->WriteHTML($html);

        // Generar el PDF y enviarlo al navegador
        return response()->streamDownload(
            function () use ($mpdf) {
                echo $mpdf->Output('voucher.pdf', 'I');
            },
            'reporte.pdf',
            [
                'Content-Type' => 'application/pdf',
                'Content-Disposition' => 'attachment; filename="reporte.pdf"'
            ]
        );
    }
}
