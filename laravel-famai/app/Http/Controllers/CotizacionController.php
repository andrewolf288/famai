<?php

namespace App\Http\Controllers;

use App\Cotizacion;
use App\CotizacionDetalle;
use App\CotizacionDetalleArchivos;
use App\EntidadBancaria;
use App\Helpers\DateHelper;
use App\Helpers\UtilHelper;
use App\Moneda;
use App\OrdenInterna;
use App\OrdenInternaMateriales;
use App\OrdenInternaPartes;
use App\Parte;
use App\Proveedor;
use App\ProveedorCuentaBanco;
use App\Trabajador;
use Barryvdh\DomPDF\Facade\Pdf;
use Carbon\Carbon;
use Exception;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use PhpOffice\PhpSpreadsheet\Spreadsheet;
use PhpOffice\PhpSpreadsheet\Writer\Xlsx;

class CotizacionController extends Controller
{
    public function index(Request $request)
    {
        $user = auth()->user();
        $sed_codigo = "10";

        $trabajador = Trabajador::where('usu_codigo', $user->usu_codigo)->first();
        if ($trabajador) {
            $sed_codigo = $trabajador->sed_codigo;
        }

        $pageSize = $request->input('page_size', 10);
        $page = $request->input('page', 1);

        $coc_numero = $request->input('coc_numero', null);
        $coc_estado = $request->input('coc_estado', null);
        $fechaDesde = $request->input('fecha_desde', null);
        $fechaHasta = $request->input('fecha_hasta', null);

        // Ajustar fecha_hasta para incluir toda la fecha si no viene con hora
        if ($fechaHasta !== null && strlen($fechaHasta) === 10) { // formato YYYY-MM-DD
            $fechaHasta .= ' 23:59:59';
        }

        $query = Cotizacion::with(['proveedor', 'moneda'])
            ->where('sed_codigo', $sed_codigo);

        if ($coc_numero !== null) {
            $query->where('coc_numero', $coc_numero);
        }
        if ($coc_estado !== null) {
            $query->where('coc_estado', $coc_estado);
        }

        $query->orderBy('coc_fechacotizacion', 'desc');
        $query->where('coc_fechacotizacion', '>=', $fechaDesde);
        $query->where('coc_fechacotizacion', '<=', $fechaHasta);

        $cotizaciones = $query->paginate($pageSize, ['*'], 'page', $page);
        return response()->json([
            'message' => 'Se listan las cotizaciones',
            'data' => $cotizaciones->items(),
            'count' => $cotizaciones->total()
        ]);
    }

    public function findByNumero(Request $request)
    {
        $numero = $request->input('numero');
        try {
            $cotizacion = Cotizacion::with(['proveedor', 'moneda', 'detalleCotizacion'])->where('coc_numero', $numero)->first();
            return response()->json($cotizacion);
        } catch (Exception $e) {
            return response()->json(['error' => 'No se encontro la cotización'], 404);
        }
    }

    public function store(Request $request)
    {
        $user = auth()->user();
        $sed_codigo = "10";

        $trabajador = Trabajador::where('usu_codigo', $user->usu_codigo)->first();
        if ($trabajador) {
            $sed_codigo = $trabajador->sed_codigo;
        }
        // iniciamos una transaccion
        DB::beginTransaction();
        try {
            $request->validate([
                'cotizacion' => 'required|string',
            ]);

            $data = json_decode($request->input('cotizacion'), true);

            if (json_last_error() !== JSON_ERROR_NONE) {
                return response()->json(['error' => 'El campo data contiene un JSON inválido.'], 400);
            }

            // Valida el request
            $validatedData = validator($data, [
                'prv_id' => 'required|exists:tblproveedores_prv,prv_id',
                'coc_fechacotizacion' => 'required|date',
                'coc_cotizacionproveedor' => 'nullable|string',
                'mon_codigo' => 'nullable|string|exists:tblmonedas_mon,mon_codigo',
                'coc_formapago' => 'nullable|string',
                'tra_solicitante' => 'nullable|exists:tbltrabajadores_tra,tra_id',
                'coc_notas' => 'nullable|string',
                'coc_total' => 'required|numeric|min:1',
                'detalle_productos' => 'required|array|min:1',
                'detalle_descripciones' => 'nullable|array|min:1',
            ])->validate();

            $lastCotizacion = Cotizacion::orderBy('coc_id', 'desc')->first();
            if (!$lastCotizacion) {
                $numero = 1;
            } else {
                $numero = intval($lastCotizacion->coc_numero) + 1;
            }

            $cotizacion = Cotizacion::create([
                'coc_numero' => str_pad($numero, 7, '0', STR_PAD_LEFT),
                'sed_codigo' => $sed_codigo,
                'prv_id' => $validatedData['prv_id'],
                'coc_fechacotizacion' => $validatedData['coc_fechacotizacion'],
                'coc_cotizacionproveedor' => $validatedData['coc_cotizacionproveedor'],
                'mon_codigo' => $validatedData['mon_codigo'],
                'coc_formapago' => $validatedData['coc_formapago'],
                'tra_solicitante' => $validatedData['tra_solicitante'],
                'coc_notas' => $validatedData['coc_notas'],
                'coc_total' => $validatedData['coc_total'],
                'coc_estado' => 1,
                'coc_usucreacion' => $user->usu_codigo,
                'coc_fecmodificacion' => null
            ]);

            foreach ($validatedData['detalle_productos'] as $detalle) {
                $cotizacionDetalle = CotizacionDetalle::create([
                    'pro_id' => $detalle['pro_id'],
                    'coc_id' => $cotizacion->coc_id,
                    'cod_orden' => $detalle['cod_orden'],
                    'cod_descripcion' => $detalle['cod_descripcion'],
                    'cod_cantidad' => $detalle['cod_cantidad'],
                    'cod_preciounitario' => $detalle['cod_preciounitario'],
                    'cod_total' => $detalle['cod_total'],
                    'cod_activo' => 1,
                    'cod_usucreacion' => $user->usu_codigo,
                    'cod_fecmodificacion' => null
                ]);
            }

            $detalle_descripcion = $validatedData['detalle_descripciones'];

            if ($request->hasFile('files')) {
                // Obtenemos todos los archivos
                $files = $request->file('files');
                $countArray = 0;
                foreach ($files as $file) {
                    // obtenemos la extension
                    $extension = $file->getClientOriginalExtension();
                    // Generamos un nombre único para el archivo, conservando la extensión original
                    $fileName = uniqid() . '.' . $extension;

                    // Guardamos el archivo con la extensión correcta
                    $path = $file->storeAs('cotizacion-adjuntos', $fileName, 'public');

                    CotizacionDetalleArchivos::create([
                        'coc_id' => $cotizacion->coc_id,
                        'cda_descripcion' => $detalle_descripcion[$countArray],
                        'cda_url' => $path,
                        'cda_activo' => 1,
                        'cda_usucreacion' => $user->usu_codigo,
                        'cda_fecmodificacion' => null
                    ]);
                    $countArray++;
                }
            }

            DB::commit();
            return response()->json($cotizacion, 200);
        } catch (Exception $e) {
            // hacemos rollback y devolvemos el error
            DB::rollBack();
            return response()->json(["error" => $e->getMessage()], 500);
        }
    }

    // guardar cotizacion desde despliegue de materiales
    public function storeDespliegueMateriales(Request $request)
    {
        $user = auth()->user();
        $sed_codigo = "10";
        $tra_solicitante = null;
        $trabajador = Trabajador::where('usu_codigo', $user->usu_codigo)->first();

        try {
            DB::beginTransaction();

            if ($trabajador) {
                $sed_codigo = $trabajador->sed_codigo;
                $tra_solicitante = $trabajador->tra_id;
            } else {
                throw new Exception('El usuario no tiene un trabajador asignado');
            }

            $request->validate([
                'cotizacion' => 'required|string',
            ]);

            $data = json_decode($request->input('cotizacion'), true);

            if (json_last_error() !== JSON_ERROR_NONE) {
                return response()->json(['error' => 'El campo data contiene un JSON inválido.'], 400);
            }

            $proveedor = $data['proveedor'];
            $detalleMateriales = $data['detalle_materiales'];
            $proveedor_unico = $data['proveedor_unico'];
            $cotizacion_proveedor_unico = $data['cotizacion'];
            $productos_excedentes = isset($data['productos_excedentes']) ? $data['productos_excedentes'] : null;

            // CREAR O ACTUALIZAR EL PROVEEDOR
            $proveedorExistente = Proveedor::where('prv_codigo', $proveedor['prv_id'])->first();
            
            if ($proveedorExistente) {
                // ACTUALIZAR EL PROVEEDOR
                $proveedorExistente->update([
                    'prv_direccion' => $proveedor['prv_direccion'],
                    'prv_nombre' => $proveedor['prv_nombre'],
                    'tdo_codigo' => $proveedor['tdo_codigo'],
                    'prv_nrodocumento' => $proveedor['prv_nrodocumento'],
                    'prv_contacto' => $proveedor['prv_contacto'],
                    'prv_whatsapp' => $proveedor['prv_whatsapp'],
                    'prv_telefono' => $proveedor['prv_telefono'],
                    'prv_correo' => $proveedor['prv_correo'],
                    'prv_usumodificacion' => $user->usu_codigo,
                    'prv_activo' => 1,
                ]);
                $proveedor = $proveedorExistente;
            } else {
                // AGREGAR EL PROVEEDOR SI NO EXISTE
                $proveedor = Proveedor::create([
                    'prv_codigo' => $proveedor['prv_id'],
                    'prv_direccion' => $proveedor['prv_direccion'],
                    'prv_nombre' => $proveedor['prv_nombre'],
                    'tdo_codigo' => $proveedor['tdo_codigo'],
                    'prv_nrodocumento' => $proveedor['prv_nrodocumento'],
                    'prv_contacto' => $proveedor['prv_contacto'],
                    'prv_whatsapp' => $proveedor['prv_whatsapp'],
                    'prv_telefono' => $proveedor['prv_telefono'],
                    'prv_correo' => $proveedor['prv_correo'],
                    'prv_usucreacion' => $user->usu_codigo,
                    'prv_activo' => 1,
                ]);
            }
            try {
                // Actualizar o crear los datos bancarios del proveedor
                $mapaBancos = [
                    'BANCO DE CREDITO DEL PERU' => 1,
                'SCOTIABANK' => 2,
                'BBVA' => 4,
                'INTERBANK' => 5,
                'BANCO DE LA NACIÓN' => 3,
                ];

                $cuentas = [
                    [
                        'numero' => $data['proveedor']['prv_account_sol'] ?? null,
                        'banco' => $data['proveedor']['prv_banco_sol'] ?? null,
                        'moneda' => 'SOL',
                    ],
                    [
                        'numero' => $data['proveedor']['prv_account_usd'] ?? null,
                        'banco' => $data['proveedor']['prv_banco_usd'] ?? null,
                        'moneda' => 'USD',
                    ],
                    [
                        'numero' => $data['proveedor']['prv_account_nacion'] ?? null,
                        'banco' => 'BANCO DE LA NACIÓN',
                        'moneda' => 'SOL',
                    ],
                ];

                
                foreach ($cuentas as $cuenta) {
                    if (!$cuenta['numero']) continue;
                    $existe = ProveedorCuentaBanco::where('prv_id', $proveedor->prv_id)
                        ->where('pvc_numerocuenta', $cuenta['numero'])
                        ->first();
                    if (!$existe) {
                        $bancoNombre = strtoupper(trim($cuenta['banco']));
                        $eba_id = $mapaBancos[$bancoNombre] ?? 1;
                        ProveedorCuentaBanco::create([
                            'prv_id' => $proveedor->prv_id,
                            'mon_codigo' => $cuenta['moneda'],
                            'eba_id' => $eba_id,
                            'pvc_numerocuenta' => $cuenta['numero'],
                            'pvc_activo' => 1,
                            'pvc_usucreacion' => $user->usu_codigo,
                            'pvc_tipocuenta' => 'Corriente',
                        ]);
                    }
                }
            } catch (Exception $e) {
            }

            // Crear requerimiento para productos excedentes si existen
            $requerimiento_excedente = null;
            if ($productos_excedentes) {
                // Buscar el último requerimiento para generar el número
                $lastRequerimientoCabecera = OrdenInterna::where('sed_codigo', $sed_codigo)
                    ->where('oic_tipo', 'REQ')
                    ->orderBy('oic_id', 'desc')
                    ->first();
                    
                $numero = !$lastRequerimientoCabecera ? 1 : intval(substr($lastRequerimientoCabecera->odt_numero, 3)) + 1;

                $prefijo = $trabajador->sed_codigo == '10' ? 'RQA' : 'RQL';

                // Crear el requerimiento
                $requerimiento_excedente = OrdenInterna::create([
                    'odt_numero' => $prefijo . str_pad($numero, 7, '0', STR_PAD_LEFT),
                    'oic_fecha' => now(),
                    'sed_codigo' => $sed_codigo,
                    'oic_fechaentregaestimada' => now()->addDays(7),
                    'are_codigo' => $trabajador->are_codigo,
                    'tra_idorigen' => $trabajador->tra_id,
                    'mrq_codigo' => 'STK', // Requerimiento de stock
                    'oic_equipo_descripcion' => 'Requerimiento generado automáticamente por excedente en cotización',
                    'oic_tipo' => 'REQ',
                    'oic_estado' => 'ENVIADO',
                    'oic_usucreacion' => $user->usu_codigo,
                    'oic_fecmodificacion' => null,
                    'oic_otsap' => $data['ot_numero']
                ]);

                // Crear parte de requerimiento
                $parteRequerimiento = Parte::where('oip_descripcion', 'REQUERIMIENTO')->first();
                if (!$parteRequerimiento) {
                    throw new Exception('No se encontró la parte requerimiento');
                }

                $detalleParte = OrdenInternaPartes::create([
                    'oic_id' => $requerimiento_excedente->oic_id,
                    'oip_id' => $parteRequerimiento->oip_id,
                    'opd_usucreacion' => $user->usu_codigo,
                    'opd_fecmodificacion' => null
                ]);

                // Crear materiales excedentes
                foreach ($productos_excedentes as $index => $material) {
                    OrdenInternaMateriales::create([
                        'opd_id' => $detalleParte->opd_id,
                        'pro_id' => $material['pro_id'],
                        'odm_item' => $index + 1,
                        'odm_descripcion' => $material['odm_descripcion'],
                        'odm_cantidad' => $material['odm_cantidad'],
                        'odm_cantidadpendiente' => $material['odm_cantidad'],
                        'odm_observacion' => $material['odm_observacion'],
                        'odm_tipo' => $material['odm_tipo'],
                        'odm_usucreacion' => $user->usu_codigo,
                        'odm_fecmodificacion' => null,
                        'odm_estado' => 'REQ',
                        'odm_fecconsultareservacion' => now()
                    ]);
                }
            }

            $lastCotizacion = Cotizacion::orderBy('coc_id', 'desc')->first();
            if (!$lastCotizacion) {
                $numero = 1;
            } else {
                $numero = intval($lastCotizacion->coc_numero) + 1;
            }

            // debemos verificar si el proveedor existe
            $id_proveedor = $proveedor['prv_id'];
            if ($id_proveedor == null) {
                // buscamos si el numero de documento ya se encuentra en nuestra base de datos
                $proveedorByNumero = Proveedor::where('prv_nrodocumento', $proveedor['prv_nrodocumento'])->first();
                if ($proveedorByNumero) {
                    $id_proveedor = $proveedorByNumero->prv_id;
                } else {
                    $proveedor = Proveedor::create([
                        'prv_nrodocumento' => $proveedor['prv_nrodocumento'],
                        'prv_nombre' => $proveedor['prv_nombre'],
                        'tdo_codigo' => $proveedor['tdo_codigo'],
                        'prv_direccion' => $proveedor['prv_direccion'],
                        'prv_contacto' => $proveedor['prv_contacto'],
                        'prv_whatsapp' => $proveedor['prv_whatsapp'],
                        'prv_telefono' => $proveedor['prv_telefono'],
                        'prv_correo' => $proveedor['prv_correo'],
                        'prv_usucreacion' => $user->usu_codigo,
                        'prv_fecmodificacion' => null
                    ]);
                    $id_proveedor = $proveedor->prv_id;
                }
            }

            if ($proveedor_unico) {
                $cotizacion = Cotizacion::create([
                    'coc_numero' => str_pad($numero, 7, '0', STR_PAD_LEFT),
                    'prv_id' => $id_proveedor,
                    'coc_fechacotizacion' => date('Y-m-d'),
                    'tra_solicitante' => $tra_solicitante,
                    'sed_codigo' => $sed_codigo,
                    'coc_proveedorunico' => $proveedor_unico ? 1 : 0,
                    'coc_usucreacion' => $user->usu_codigo,
                    'coc_fecmodificacion' => null,
                    'coc_estado' => $proveedor_unico ? 'RPR' : 'SOL',
                    'mon_codigo' => $cotizacion_proveedor_unico['mon_codigo'],
                    'coc_cotizacionproveedor' => $cotizacion_proveedor_unico['coc_cotizacionproveedor'],
                    'coc_fechavalidez' => $cotizacion_proveedor_unico['coc_fechavalidez'],
                    'coc_formapago' => $cotizacion_proveedor_unico['coc_formapago'],
                    'coc_notas' => $cotizacion_proveedor_unico['coc_notas'],
                    'coc_lugarentrega' => $cotizacion_proveedor_unico['coc_lugarentrega'],
                ]);
            } else {
                $cotizacion = Cotizacion::create([
                    'coc_numero' => str_pad($numero, 7, '0', STR_PAD_LEFT),
                    'prv_id' => $id_proveedor,
                    'coc_fechacotizacion' => date('Y-m-d'),
                    'tra_solicitante' => $tra_solicitante,
                    'sed_codigo' => $sed_codigo,
                    'coc_proveedorunico' => $proveedor_unico ? 1 : 0,
                    'coc_usucreacion' => $user->usu_codigo,
                    'coc_fecmodificacion' => null,
                    'coc_estado' => $proveedor_unico ? 'RPR' : 'SOL',
                    'coc_total' => 0
                ]);
            }

            $total_cotizacion = 0;
            foreach ($detalleMateriales as $detalle) {

                if (isset($detalle['odm_id'])) {
                    $detalleMaterial = OrdenInternaMateriales::findOrFail($detalle['odm_id']);

                    // si un detalle ya ha sido ordenado para una compra, salimos de la operación
                    if ($detalleMaterial->odm_estado == 'ODC') {
                        throw new Exception("El material $detalleMaterial->odm_descripcion con cantidad $detalleMaterial->odm_cantidad, ya ha sido ordenado para una compra");
                    }
                }

                CotizacionDetalle::create([
                    'coc_id' => $cotizacion->coc_id,
                    'cod_orden' => $detalle['cod_orden'],
                    'odm_id' => isset($detalle['odm_id']) ? $detalle['odm_id'] : null,
                    'pro_id' => isset($detalle['pro_id']) ? $detalle['pro_id'] : null,
                    'cod_descripcion' => $detalle['cod_descripcion'],
                    'cod_observacion' => $detalle['cod_observacion'],
                    'cod_cantidad' => $detalle['cod_cantidad'],
                    'cod_parastock' => isset($detalle['cod_parastock']) ? $detalle['cod_parastock'] : 0,
                    'cod_preciounitario' => $detalle['cod_preciounitario'],
                    'cod_total' => $detalle['cod_total'],
                    'cod_activo' => 1,
                    'cod_usucreacion' => $user->usu_codigo,
                    'cod_fecmodificacion' => null,
                    'cod_cantidadcotizada' => $detalle['cod_cantidadcotizada'],
                    'cod_fecentregaoc' => $detalle['cod_fecentregaoc'],
                    'cod_descuento' => $detalle['cod_descuento'],
                    'cod_cotizar' => $proveedor_unico ? 1 : 0,
                    'cod_impuesto' => $detalle['cod_impuesto'],
                    'cod_precioconigv' => $detalle['cod_precioconigv']
                ]);

                $detalleMaterial->odm_estado = 'COT';
                $detalleMaterial->save();

                $total_cotizacion += $detalle['cod_total'];
            }

            // actualizamos total de cotizacion
            $cotizacion->coc_total = round(floatval($total_cotizacion), 4);
            $cotizacion->save();

            // adjuntamos los archivos
            if ($proveedor_unico) {
                if ($request->hasFile('files')) {
                    // Obtenemos todos los archivos
                    $files = $request->file('files');
                    $countArray = 0;
                    foreach ($files as $file) {
                        // obtenemos la extension
                        $extension = $file->getClientOriginalExtension();
                        // Generamos un nombre único para el archivo, conservando la extensión original
                        $fileName = uniqid() . '.' . $extension;

                        // Guardamos el archivo con la extensión correcta
                        $path = $file->storeAs('cotizacion-adjuntos', $fileName, 'public');

                        CotizacionDetalleArchivos::create([
                            'coc_id' => $cotizacion->coc_id,
                            // 'cda_descripcion' => $detalle_descripcion[$countArray],
                            'cda_url' => $path,
                            'cda_activo' => 1,
                            'cda_usucreacion' => $user->usu_codigo,
                            'cda_fecmodificacion' => null
                        ]);
                        $countArray++;
                    }
                }
            }

            DB::commit();

            // actualizamos la cotizacion seleccionada
            $this->seleccionarCotizacionDetalleProducto($cotizacion->coc_id);

            return response()->json([
                'message' => 'Cotización creada correctamente',
                'cotizacion' => $cotizacion,
                'requerimiento_excedente' => $requerimiento_excedente
            ], 200);
        } catch (Exception $e) {
            DB::rollBack();
            return response()->json(["error" => $e->getMessage()], 500);
        }
    }

    public function updateCotizacion(Request $request, $id)
    {
        $user = auth()->user();
        $cotizacion = Cotizacion::find($id);

        if (!$cotizacion) {
            return response()->json(['error' => 'Cotización no encontrada.'], 404);
        }

        try {
            DB::beginTransaction();
            $request->validate([
                'cotizacion' => 'required|string',
            ]);

            $data = json_decode($request->input('cotizacion'), true);

            if (json_last_error() !== JSON_ERROR_NONE) {
                return response()->json(['error' => 'El campo data contiene un JSON inválido.'], 400);
            }

            // Valida el request
            $validatedData = validator($data, [
                'prv_id' => 'required|exists:tblproveedores_prv,prv_id',
                'coc_fechacotizacion' => 'required|date',
                'coc_cotizacionproveedor' => 'nullable|string',
                'mon_codigo' => 'nullable|string|exists:tblmonedas_mon,mon_codigo',
                'coc_formapago' => 'nullable|string',
                'tra_solicitante' => 'nullable|exists:tbltrabajadores_tra,tra_id',
                'coc_notas' => 'nullable|string',
                'coc_total' => 'required|numeric|min:1',
                'detalle_productos' => 'nullable|array|min:0',
                'detalle_descripciones' => 'nullable|array|min:0',
            ])->validate();

            $cotizacion->update([
                'prv_id' => $validatedData['prv_id'],
                'coc_fechacotizacion' => $validatedData['coc_fechacotizacion'],
                'coc_cotizacionproveedor' => $validatedData['coc_cotizacionproveedor'],
                'mon_codigo' => $validatedData['mon_codigo'],
                'coc_formapago' => $validatedData['coc_formapago'],
                'tra_solicitante' => $validatedData['tra_solicitante'],
                'coc_notas' => $validatedData['coc_notas'],
                'coc_total' => $validatedData['coc_total'],
                'cod_usumodificacion' => $user->usu_codigo,
            ]);

            foreach ($validatedData['detalle_productos'] as $detalle) {
                $cotizacionDetalle = CotizacionDetalle::create([
                    'pro_id' => $detalle['pro_id'],
                    'coc_id' => $cotizacion->coc_id,
                    'cod_orden' => $detalle['cod_orden'],
                    'cod_descripcion' => $detalle['cod_descripcion'],
                    'cod_cantidad' => $detalle['cod_cantidad'],
                    'cod_preciounitario' => $detalle['cod_preciounitario'],
                    'cod_total' => $detalle['cod_total'],
                    'cod_activo' => 1,
                    'cod_usucreacion' => $user->usu_codigo,
                    'cod_fecmodificacion' => null
                ]);
            }

            $detalle_descripcion = $validatedData['detalle_descripciones'];

            if ($request->hasFile('files')) {
                // Obtenemos todos los archivos
                $files = $request->file('files');
                $countArray = 0;
                foreach ($files as $file) {
                    // obtenemos la extension
                    $extension = $file->getClientOriginalExtension();
                    // Generamos un nombre único para el archivo, conservando la extensión original
                    $fileName = uniqid() . '.' . $extension;

                    // Guardamos el archivo con la extensión correcta
                    $path = $file->storeAs('cotizacion-adjuntos', $fileName, 'public');

                    CotizacionDetalleArchivos::create([
                        'coc_id' => $cotizacion->coc_id,
                        'cda_descripcion' => $detalle_descripcion[$countArray],
                        'cda_url' => $path,
                        'cda_activo' => 1,
                        'cda_usucreacion' => $user->usu_codigo,
                        'cda_fecmodificacion' => null
                    ]);
                    $countArray++;
                }
            }

            DB::commit();
            return response()->json($cotizacion, 200);
        } catch (Exception $e) {
            // hacemos rollback y devolvemos el error
            DB::rollBack();
            return response()->json(["error" => $e->getMessage()], 500);
        }
    }

    public function show($id)
    {
        $cotizacion = Cotizacion::with(['proveedor', 'moneda', 'solicitante', 'detalleCotizacion.detalleMaterial.producto.unidad', 'detalleCotizacionArchivos'])->findOrFail($id);
        return response()->json($cotizacion);
    }

    // generar PDF
    private function generarPDF($coc_id, $user = null)
    {
        $cotizacion = Cotizacion::with(['proveedor.cuentasBancarias.entidadBancaria', 'moneda', 'solicitante'])->findOrFail($coc_id);

        $detalleCotizacion = CotizacionDetalle::with(['producto'])
            ->where('coc_id', $cotizacion->coc_id)
            ->where('cod_cotizar', 1)
            ->get();

        // Filtrar agrupados y no agrupados
        $agrupado = $detalleCotizacion->filter(function ($detalle) {
            return $detalle->odm_id !== null || $detalle->cod_parastock == 1;
        });

        $cuentas_bancarias = UtilHelper::obtenerCuentasBancarias($cotizacion->proveedor->cuentasBancarias ?? []);

        $agrupado_detalle = $agrupado
            ->groupBy('cod_orden')
            ->map(function ($detalle, $cod_orden) {
                return [
                    'pro_id' => $detalle->first()->pro_id,
                    'cod_orden' => $cod_orden,
                    'cod_descripcion' => $detalle->first()->cod_descripcion,
                    'cod_observacion' => $detalle->first()->cod_observacion,
                    'cod_observacionproveedor' => $detalle->first()->cod_observacionproveedor,
                    'uni_codigo' => $detalle->first()->producto ? $detalle->first()->producto->uni_codigo : '',
                    // 'cod_cantidadcotizada' => $detalle->sum('cod_cantidadcotizada'),
                    'cod_cantidadcotizada' => $detalle->sum(function ($d) {
                        return floatval($d->cod_cantidadcotizada);
                    }),
                    'cod_tiempoentrega' => $detalle->first()->cod_tiempoentrega,
                    'cod_preciounitario' => $detalle->first()->cod_preciounitario,
                    // 'cod_total' => $detalle->sum('cod_total'),
                    'cod_total' => $detalle->sum(function ($d) {
                        return floatval($d->cod_total);
                    }),
                    'flag_selecto' => true
                ];
            })
            ->values();

        $pdfOptions = [
            'paper' => 'a4',
            'orientation' => 'landscape',
        ];

        $data = [
            'cotizacion' => $cotizacion,
            'proveedor' => $cotizacion->proveedor,
            'detalle_cotizacion' => $agrupado_detalle,
            'coc_fecha_formateada' => DateHelper::parserFecha($cotizacion->coc_fechacotizacion),
            'usuarioImpresion' => $user ? $user->usu_codigo : null,
            'fechaHoraImpresion' => date('Y-m-d H:i:s'),
            'cuenta_banco_nacion' => $cuentas_bancarias['cuenta_banco_nacion'],
            'cuenta_soles' => $cuentas_bancarias['cuenta_soles'],
            'cuenta_dolares' => $cuentas_bancarias['cuenta_dolares'],
            // 'total_format' => UtilHelper::convertirNumeroALetras($cotizacion->coc_total),
            'total_format' => UtilHelper::convertirNumeroALetras(floatval($cotizacion->coc_total)),
        ];

        return Pdf::loadView('cotizacion.cotizacionformal', $data)
            ->setPaper($pdfOptions['paper'], $pdfOptions['orientation']);
    }

    // funcion para exportar PDF de cotizacion
    public function exportarPDF(Request $request)
    {
        $user = auth()->user();
        try {
            $pdf = $this->generarPDF($request->input('coc_id'), $user);
            return $pdf->download('cotizacion.pdf');
        } catch (Exception $e) {
            return response()->json([
                "error" => $e->getMessage(),
                "linea" => $e->getLine()
            ], 500);
        }
    }

    public function destroy($id)
    {
        try {
            DB::beginTransaction();

            // Buscar la cotización junto con sus detalles y archivos
            $cotizacion = Cotizacion::with(['detalleCotizacion', 'detalleCotizacionArchivos'])->findOrFail($id);

            // Eliminamos los archivos relacionados a la cotización
            foreach ($cotizacion->detalleCotizacionArchivos as $archivo) {
                $urlArchivo = $archivo->cda_url;
                // Eliminar archivo físico del disco
                Storage::disk('public')->delete($urlArchivo);
                // Eliminar el registro de detalleCotizacionArchivos
                $archivo->delete();
            }

            // Eliminamos los detalles de la cotización
            foreach ($cotizacion->detalleCotizacion as $detalle) {
                $odm_id = $detalle->odm_id;
                if ($odm_id != null) {
                    // comprobamos si es la unica cotizacion del material
                    $cotizacionesDetalle = CotizacionDetalle::where('odm_id', $odm_id)->count();
                    if ($cotizacionesDetalle == 1) {
                        // buscamos el detalle de material
                        $material = OrdenInternaMateriales::findOrFail($odm_id);
                        // si el detalle de material es un estado diferente de ODC
                        if ($material->odm_estado != 'ODC') {
                            $material->update([
                                'odm_estado' => 'REQ',
                                'odm_fecmodificacion' => Carbon::now()
                            ]);
                        }
                    }
                }
                $detalle->delete();
            }

            // Finalmente, eliminamos la cotización principal
            $cotizacion->delete();

            DB::commit();
            return response()->json(['success' => 'Cotización y sus detalles eliminados correctamente.'], 200);
        } catch (Exception $e) {
            DB::rollBack();
            return response()->json(['error' => 'Error al eliminar la cotización: ' . $e->getMessage()], 500);
        }
    }

    // funcion para mostrar cotizacion para proveedor
    public function showCotizacionProveedor($id)
    {
        // información de monedas
        $monedas = Moneda::select('mon_codigo', 'mon_descripcion', 'mon_simbolo', 'mon_activo')
            ->where('mon_activo', 1)
            ->get();

        // informacion de bancos
        $bancos = EntidadBancaria::select('eba_id', 'eba_descripcion', 'eba_activo', 'eba_codigo')
            ->where('eba_activo', 1)
            ->get();

        // informacion de cotizacion
        $cotizacion = Cotizacion::with(['proveedor.cuentasBancarias.entidadBancaria', 'moneda', 'solicitante'])->findOrFail($id);
        $cotizacionDetalle = CotizacionDetalle::with(['producto'])
            ->where('coc_id', $cotizacion->coc_id)
            ->get();

        // Filtrar agrupados y no agrupados
        $agrupado = $cotizacionDetalle->filter(function ($detalle) {
            return $detalle->odm_id !== null || $detalle->cod_parastock == 1;
        });

        $marcas = $cotizacionDetalle->filter(function ($detalle) {
            return $detalle->odm_id === null && $detalle->cod_parastock == 0;
        });

        $agrupado_detalle = $agrupado
            ->groupBy('cod_orden')
            ->map(function ($detalle, $cod_orden) {
                return [
                    'pro_id' => $detalle->first()->pro_id,
                    'cod_orden' => $cod_orden,
                    'cod_descripcion' => $detalle->first()->cod_descripcion,
                    'cod_observacion' => $detalle->first()->cod_observacion,
                    'cod_observacionproveedor' => $detalle->first()->cod_observacionproveedor,
                    'uni_codigo' => $detalle->first()->producto ? $detalle->first()->producto->uni_codigo : 'N/A',
                    'cod_cantidad' => $detalle->sum('cod_cantidad'),
                    'cod_cantidadcotizada' => $detalle->sum('cod_cantidadcotizada'),
                    'cod_tiempoentrega' => $detalle->first()->cod_tiempoentrega,
                    'cod_preciounitario' => $detalle->first()->cod_preciounitario,
                    'cod_total' => $detalle->sum('cod_total'),
                    'cod_cotizar' => $detalle->first()->cod_cotizar,
                    'detalle' => $detalle->values()
                ];
            })
            ->values();

        $detalle_marcas = $marcas
            ->values();

        return response()->json([
            "cotizacion" => $cotizacion,
            "monedas" => $monedas,
            "bancos" => $bancos,
            "agrupado_detalle" => $agrupado_detalle,
            "detalle_marcas" => $detalle_marcas
        ]);
    }

    private function seleccionarCotizacionDetalleProducto($coc_id)
    {
        // obtenemos el detalle de cotizacion de acuerdo al id de cotizacion
        $cotizacionDetalle = CotizacionDetalle::where('coc_id', $coc_id)
            // ->where('cod_cotizar', 1)
            ->where('cod_parastock', 0)
            ->get();

        // agrupo por productos los odm_id correspondientes para los registro que tiene producto asignado
        $identificadores_by_producto = $cotizacionDetalle
            ->whereNotNull('pro_id')
            ->groupBy('pro_id')
            ->map(function ($detalle) {
                return [
                    'identificadores' => $detalle->pluck('odm_id')->toArray(),
                ];
            });

        // agrupo por productos los odm_id correspondientes para los registro que no tiene producto asignado
        $identificadores_by_no_producto = $cotizacionDetalle
            ->whereNull('pro_id')
            ->map(function ($detalle) {
                return [
                    'identificadores' => [$detalle->odm_id]
                ];
            });

        $identificadores_union = $identificadores_by_producto->concat($identificadores_by_no_producto);

        # recorremos los identificadores por producto
        foreach ($identificadores_union as $identificador) {
            $identificadores_id = $identificador['identificadores'];
            $cotizacionesDetalle = CotizacionDetalle::whereIn('odm_id', $identificadores_id)
                ->distinct()
                ->count('coc_id');
            # si existe mas de una cotizacion
            if ($cotizacionesDetalle > 1) {
                # si no fue seleccionado un detalle de cotizacion
                if (
                    CotizacionDetalle::whereIn('odm_id', $identificadores_id)
                    ->where('cod_estado', 'SML')
                    ->count() == 0
                ) {
                    // deseleccionamos cualquier detalle de cotizacion con un estado SAT
                    CotizacionDetalle::whereIn('odm_id', $identificadores_id)
                        ->where('cod_estado', 'SAT')
                        ->update(['cod_estado' => null]);
                }
            }
            # si existe una cotizacion
            else {
                # si no fue seleccionado un detalle de cotizacion de manera automatica
                if (
                    CotizacionDetalle::whereIn('odm_id', $identificadores_id)
                    ->where('cod_estado', 'SAT')
                    ->count() == 0
                ) {
                    // seleccionamos cualquier detalle de cotizacion como seleccionado automaticamente
                    CotizacionDetalle::whereIn('odm_id', $identificadores_id)
                        ->first()
                        ->update(['cod_estado' => 'SAT']);
                }
            }
        }
    }

    // funcion para editar cotizacion para proveedor
    public function updateCotizacionProveedor(Request $request, $id)
    {
        try {
            DB::beginTransaction();

            $proveedorRequest = $request->input('proveedor');
            // validacion de cotizacion
            $validatedData = validator($request->all(), [
                'coc_cotizacionproveedor' => 'required|string',
                'coc_correocontacto' => 'nullable|email',
                'coc_fechavalidez' => 'required|date',
                'coc_lugarentrega' => 'nullable|string',
                'coc_conigv' => 'required|boolean',
                'coc_notas' => 'nullable|string',
                'coc_total' => 'required|numeric|min:1',
                'mon_codigo' => 'required|string|exists:tblmonedas_mon,mon_codigo',
                'coc_formapago' => 'required|string',
                'detalle_cotizacion' => 'required|array|min:1',
            ])->validate();

            // validacion de proveedor
            $validatedDataProveedor = validator($proveedorRequest, [
                'prv_id' => 'required|exists:tblproveedores_prv,prv_id',
                'prv_correo' => 'nullable|email',
                'prv_direccion' => 'nullable|string',
                'prv_contacto' => 'nullable|string',
                'prv_telefono' => 'nullable|string',
                'prv_whatsapp' => 'nullable|string',
                'cuentas_bancarias' => 'required|array|min:1',
            ])->validate();

            // actualizamos informacion de proveedor
            $proveedor = Proveedor::findOrFail($validatedDataProveedor['prv_id']);
            $proveedor->update([
                'prv_correo' => $validatedDataProveedor['prv_correo'],
                'prv_direccion' => $validatedDataProveedor['prv_direccion'],
                'prv_contacto' => $validatedDataProveedor['prv_contacto'],
                'prv_telefono' => $validatedDataProveedor['prv_telefono'],
                'prv_whatsapp' => $validatedDataProveedor['prv_whatsapp']
            ]);

            // actualizamos las cuentas
            foreach ($validatedDataProveedor['cuentas_bancarias'] as $cuenta) {
                if (isset($cuenta['pvc_id'])) {
                    $cuentaBancaria = ProveedorCuentaBanco::findOrFail($cuenta['pvc_id']);
                    $cuentaBancaria->update([
                        'pvc_numerocuenta' => $cuenta['pvc_numerocuenta'],
                        'mon_codigo' => $cuenta['mon_codigo'],
                        'eba_id' => $cuenta['eba_id'],
                    ]);
                } else {
                    ProveedorCuentaBanco::create([
                        'prv_id' => $proveedor->prv_id,
                        'pvc_numerocuenta' => $cuenta['pvc_numerocuenta'],
                        'mon_codigo' => $cuenta['mon_codigo'],
                        'eba_id' => $cuenta['eba_id'],
                    ]);
                }
            }

            // actualizamos la cotizacion
            $cotizacion = Cotizacion::findOrFail($id);

            $cotizacion->update([
                'coc_cotizacionproveedor' => $validatedData['coc_cotizacionproveedor'],
                'coc_correocontacto' => $validatedData['coc_correocontacto'],
                'coc_formapago' => $validatedData['coc_formapago'],
                'mon_codigo' => $validatedData['mon_codigo'],
                'coc_fechavalidez' => $validatedData['coc_fechavalidez'],
                'coc_fechacotizacion' => Carbon::now(),
                'coc_notas' => $validatedData['coc_notas'],
                'coc_total' => $validatedData['coc_total'],
                'coc_conigv' => $validatedData['coc_conigv'],
                'coc_lugarentrega' => $validatedData['coc_lugarentrega'],
                'coc_estado' => 'RPR',
            ]);

            // actualizamos los detalles de la cotizacion
            $detalleCotizacion = $validatedData['detalle_cotizacion'];
            foreach ($detalleCotizacion as $detalle) {
                // Buscamos el detalle de cotizacion
                $detalleCotizacionResumido = CotizacionDetalle::where('coc_id', $cotizacion->coc_id)
                    ->where('cod_orden', $detalle['cod_orden'])
                    ->get();

                $cantidadCotizadaTotal = intval($detalle['cod_cantidadcotizada']);
                foreach ($detalleCotizacionResumido as $detalleResumido) {
                    $cantidadRequerida = intval($detalleResumido->cod_cantidad);
                    $cantidadCotizadaDetalle = min($cantidadCotizadaTotal, $cantidadRequerida);

                    $precioUnitario = round(floatval($detalle['cod_preciounitario']), 2);
                    $total = round($cantidadCotizadaDetalle * $precioUnitario, 2);

                    $detalleResumido->update([
                        'cod_cantidadcotizada' => $cantidadCotizadaDetalle,
                        'cod_observacionproveedor' => $detalle['cod_observacionproveedor'],
                        'cod_tiempoentrega' => $detalle['cod_tiempoentrega'],
                        'cod_preciounitario' => $precioUnitario,
                        'cod_total' => $total,
                        'cod_cotizar' => 1,
                    ]);

                    $cantidadCotizadaTotal -= $cantidadCotizadaDetalle;
                }
            }

            DB::commit();

            // actualizamos la cotizacion seleccionada
            // $this->seleccionarCotizacionDetalleProducto($id);

            // debemos obtener el pdf correspondiente
            $pdf = $this->generarPDF($id);
            return $pdf->download('cotizacion.pdf');
        } catch (Exception $e) {
            DB::rollBack();
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    public function updateEstadoCotizacion($id)
    {
        $user = auth()->user();
        try {
            $validatedData = validator(request()->all(), [
                'coc_estado' => 'required',
            ])->validate();

            $cotizacion = Cotizacion::findOrFail($id);

            $cotizacion->update([
                'coc_usumodificacion' => $user->usu_codigo,
                'coc_estado' => $validatedData['coc_estado'],
            ]);

            return response()->json([
                'message' => 'Cotización actualizada',
            ]);
        } catch (Exception $e) {
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    public function exportTXTCotizacion($id)
    {
        // vamos a consultar la cotizacion
        $cotizacion = Cotizacion::with('proveedor', 'moneda')
            ->findOrFail($id);
        // vamos a consultar su detalle
        $cotizacion_detalle = CotizacionDetalle::where('coc_id', $id)
            ->get();

        $agrupados = [];
        foreach ($cotizacion_detalle as $detalle) {
            $cod_orden = $detalle->cod_orden;

            if (!isset($agrupados[$cod_orden])) {
                // Si no existe el grupo, inicializamos con el primer elemento
                $agrupados[$cod_orden] = $detalle->toArray();
                $agrupados[$cod_orden]['cod_cantidad'] = floatval($detalle->cod_cantidad);
            } else {
                // Si ya existe el grupo, sumamos la cantidad
                $agrupados[$cod_orden]['cod_cantidad'] += floatval($detalle->cod_cantidad);
            }
        }
        $agrupadosIndexado = array_values($agrupados);


        $ruc = "20134690080";
        $razon_social = "FAMAI SEAL JET S.A.C.";
        $fecha = date('d') . ' de ' . date('F') . ' ' . date('Y');

        $txt_content = "Estimado proveedor\n";
        $txt_content .= "Por la presente sírvase cotizar lo siguiente a nombre de:\n";
        $txt_content .= "RUC: " .  $ruc . "\n";
        $txt_content .= "Razón Social: " . $razon_social . "\n";
        $txt_content .= "=========\n";
        $txt_content .= "   PRODUCTO   CANTIDAD\n";

        // Agregar los productos
        foreach ($agrupadosIndexado as $index => $item) {
            $txt_content .= ($index + 1) . ". " . $item["cod_descripcion"] . "     " . $item["cod_cantidad"] . "\n";
        }

        $txt_content .= "======\n";
        $txt_content .= "Contacto: " . ($cotizacion->proveedor->prv_contacto ?? '') . "\n";
        $txt_content .= "Nombre: " . ($cotizacion->proveedor->prv_nombre ?? '') . "\n";
        $txt_content .= "Correo: " . ($cotizacion->proveedor->prv_correo ?? '') . "\n";
        $txt_content .= "Celular/Whatsapp: " . ($cotizacion->proveedor->prv_telefono ?? '') . "/" . ($cotizacion->proveedor->prv_whatsapp ?? '') . "\n\n";
        $txt_content .= "Arequipa, $fecha\n";


        return response()->streamDownload(function () use ($txt_content) {
            echo $txt_content;
        }, 'cotizacion_proveedor.txt', ['Content-Type' => 'text/plain']);
    }

    public function exportExcelCotizacion($id)
    {
        $detalleCotizacion = CotizacionDetalle::with(['producto'])
            ->where('coc_id', $id)
            ->get();

        // Filtrar agrupados y no agrupados
        $agrupado = $detalleCotizacion->filter(function ($detalle) {
            return $detalle->odm_id !== null || $detalle->cod_parastock == 1;
        });

        $agrupado_detalle = $agrupado
            ->groupBy('cod_orden')
            ->map(function ($detalle, $cod_orden) {
                return [
                    'pro_id' => $detalle->first()->pro_id,
                    'cod_orden' => $cod_orden,
                    'cod_descripcion' => $detalle->first()->cod_descripcion,
                    'cod_observacion' => $detalle->first()->cod_observacion,
                    'cod_observacionproveedor' => $detalle->first()->cod_observacionproveedor,
                    'uni_codigo' => $detalle->first()->producto ? $detalle->first()->producto->uni_codigo : '',
                    'cod_cantidadcotizada' => $detalle->sum('cod_cantidadcotizada'),
                    'cod_tiempoentrega' => $detalle->first()->cod_tiempoentrega,
                    'cod_preciounitario' => $detalle->first()->cod_preciounitario,
                    'cod_total' => $detalle->sum('cod_total'),
                    'flag_selecto' => true
                ];
            })
            ->values();

        $columns = [
            ['header' => "Item", 'field' => 'cod_orden', 'type' => 'string'],
            ['header' => "Descripción", 'field' => 'cod_descripcion', 'type' => 'string'],
            ['header' => "Observación", 'field' => 'cod_observacion', 'type' => 'string'],
            ['header' => "Observacion Proveedor", 'field' => 'cod_observacionproveedor', 'type' => 'string'],
            ['header' => "Tiempo entrega", 'field' => 'cod_tiempoentrega', 'type' => 'string'],
            ['header' => "Unidad", 'field' => 'uni_codigo', 'type' => 'string'],
            ['header' => "Cantidad", 'field' => 'cod_cantidadcotizada', 'type' => 'number'],
            ['header' => "Precio Unitario", 'field' => 'cod_preciounitario', 'type' => 'number'],
            ['header' => "Total", 'field' => 'cod_total', 'type' => 'number'],
        ];

        $spreadsheet = new Spreadsheet();
        $sheet = $spreadsheet->getActiveSheet();

        // agregar encabezados
        foreach ($columns as $index => $column) {
            $columnLetter = \PhpOffice\PhpSpreadsheet\Cell\Coordinate::stringFromColumnIndex($index + 1);
            $sheet->setCellValue("{$columnLetter}1", $column['header']);
            $sheet->getColumnDimension($columnLetter)->setAutoSize(true);

            $sheet->getStyle("{$columnLetter}1")
                ->getFill()
                ->setFillType(\PhpOffice\PhpSpreadsheet\Style\Fill::FILL_SOLID)
                ->getStartColor()->setRGB('ffcd57');

            $sheet->getStyle("{$columnLetter}1")
                ->getFont()
                ->getColor()->setRGB('000000');
        }

        $rowIndex = 2;
        foreach ($agrupado_detalle as $detalle) {
            foreach ($columns as $index => $column) {
                $columnLetter = \PhpOffice\PhpSpreadsheet\Cell\Coordinate::stringFromColumnIndex($index + 1);

                $fieldPath = explode('.', $column['field']);
                $value = $detalle;
                foreach ($fieldPath as $path) {
                    $value = $value[$path] ?? null;
                }

                switch ($column['type']) {
                    case 'string':
                        $sheet->setCellValueExplicit("{$columnLetter}{$rowIndex}", (string)$value, \PhpOffice\PhpSpreadsheet\Cell\DataType::TYPE_STRING);
                        break;
                    case 'date':
                        if ($value !== null) {
                            $formattedDate = \PhpOffice\PhpSpreadsheet\Shared\Date::PHPToExcel(strtotime($value));
                            $sheet->setCellValue("{$columnLetter}{$rowIndex}", $formattedDate);
                            $sheet->getStyle("{$columnLetter}{$rowIndex}")
                                ->getNumberFormat()
                                ->setFormatCode(\PhpOffice\PhpSpreadsheet\Style\NumberFormat::FORMAT_DATE_DDMMYYYY);  // Solo fecha
                        } else {
                            $sheet->setCellValue("{$columnLetter}{$rowIndex}", '');
                        }
                        break;
                    case 'number':
                        $sheet->setCellValue("{$columnLetter}{$rowIndex}", (float)$value);
                        $sheet->getStyle("{$columnLetter}{$rowIndex}")
                            ->getNumberFormat()
                            ->setFormatCode(\PhpOffice\PhpSpreadsheet\Style\NumberFormat::FORMAT_NUMBER_00);
                        break;
                    default:
                        $sheet->setCellValue("{$columnLetter}{$rowIndex}", $value ?? 'N/A');
                }
            }
            $rowIndex++;
        }

        return response()->streamDownload(function () use ($spreadsheet) {
            $writer = new Xlsx($spreadsheet);
            $writer->save('php://output');
        }, "cotizacion-$id.xlsx", ['Content-Type' => 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet']);
    }

    // funcion para traer proveedores con cotizaciones
    public function obtenerProveedoresCotizaciones(Request $request)
    {
        $solicitantes = $request->input('solicitantes', null);

        $detalleCotizaciones = CotizacionDetalle::whereHas('detalleMaterial', function ($query) {
            $query->where('odm_estado', 'COT');
        })
            ->whereHas('cotizacion', function ($query) use ($solicitantes) {
                if ($solicitantes) {
                    if (!is_array($solicitantes)) {
                        $solicitantes = [$solicitantes];
                    }
                    $query->whereIn('tra_solicitante', $solicitantes);
                }
            })
            ->whereNotNull('cod_estado')
            ->whereNotNull('pro_id')
            ->get();

        // debemos agrupar por proveedor
        $proveedores = $detalleCotizaciones
            ->groupBy(function ($item) {
                return $item->cotizacion->prv_id . '-' . $item->cotizacion->mon_codigo;
            })
            ->map(function ($grupo, $key) {
                $primerItem = $grupo->first();
                return [
                    'prv_id' => $primerItem->cotizacion->prv_id,
                    'proveedor' => $primerItem->cotizacion->proveedor,
                    'moneda' => $primerItem->cotizacion->moneda,
                    'items' => $grupo->values(),
                    'total_items' => $grupo->count(),
                ];
            })
            ->values();

        return response()->json($proveedores);
    }

    public function obtenerDetallesProveedoresCotizaciones(Request $request)
    {
        // obtenemos las cotizaciones detalles
        $detalles = $request["detalles"];
        $proveedor = $request["proveedor"];
        // buscamos informacion de proveedor
        $proveedor = Proveedor::with(['cuentasBancarias.entidadBancaria', 'formaPago'])
            ->findOrFail($proveedor);
        // buscamos las cotizaciones detalle correspondientes
        $detallesCotizaciones = CotizacionDetalle::whereIn('cod_id', $detalles)
            ->get();

        $cotizacion = null;
        if (count($detallesCotizaciones) > 0) {
            $coc_id = $detallesCotizaciones[0]->coc_id;
            $cotizacion = Cotizacion::findOrFail($coc_id);
        }

        $detalles = $detallesCotizaciones->map(function ($detalle) {
            // debemos buscar los detalles relacionados en la cotizacion
            $detallesRelacionados = CotizacionDetalle::with(['detalleMaterial.ordenInternaParte.ordenInterna', 'detalleMaterial.producto', 'cotizacion'])
                ->where('pro_id', $detalle->pro_id)
                ->where('coc_id', $detalle->coc_id)
                ->get();

            return [
                "producto" => $detalle->detalleMaterial->producto,
                "detalles" => $detallesRelacionados,
                "cantidad_requerida" => $detallesRelacionados->sum('detalleMaterial.odm_cantidadpendiente'),
                "precio_unitario" => $detalle->cod_preciounitario,
            ];
        })->values();

        $formatData = array(
            "proveedor" => $proveedor,
            "detalles" => $detalles,
            "cotizacion" => $cotizacion
        );

        return response()->json($formatData);
    }

    public function obtenerSolicitantes()
    {
        $tra_ids = Cotizacion::distinct()->pluck('tra_solicitante');
        $result = Trabajador::whereIn('tra_id', $tra_ids)->get();

        return response()->json($result);
    }
}
