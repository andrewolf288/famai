<?php

namespace App\Http\Controllers;

use App\Cotizacion;
use App\CotizacionDetalle;
use App\CotizacionDetalleArchivos;
use App\EntidadBancaria;
use App\Helpers\DateHelper;
use App\Helpers\UtilHelper;
use App\Moneda;
use App\OrdenCompraDetalle;
use App\OrdenInternaMateriales;
use App\Producto;
use App\Proveedor;
use App\ProveedorCuentaBanco;
use App\Trabajador;
use Barryvdh\DomPDF\Facade\Pdf;
use Carbon\Carbon;
use Exception;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;

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

        $query = Cotizacion::with(['proveedor', 'moneda'])
            ->where('sed_codigo', $sed_codigo);

        if ($coc_numero !== null) {
            $query->where('coc_numero', $coc_numero);
        }
        if ($coc_estado !== null) {
            $query->where('coc_estado', $coc_estado);
        }

        $query->orderBy('coc_fechacotizacion', 'desc');

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
        $trabajador = Trabajador::where('usu_codigo', $user->usu_codigo)->first();
        if ($trabajador) {
            $sed_codigo = $trabajador->sed_codigo;
        }

        try {
            DB::beginTransaction();

            $proveedor = $request->input('proveedor');
            $detalleMateriales = $request->input('detalle_materiales');

            $lastCotizacion = Cotizacion::orderBy('coc_id', 'desc')->first();
            if (!$lastCotizacion) {
                $numero = 1;
            } else {
                $numero = intval($lastCotizacion->coc_numero) + 1;
            }

            // buscamos informacion de trabajador
            $tra_solicitante = null;
            $trabajador = Trabajador::where('usu_codigo', $user->usu_codigo)->first();

            if ($trabajador) {
                $tra_solicitante = $trabajador->tra_id;
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

            $cotizacion = Cotizacion::create([
                'coc_numero' => str_pad($numero, 7, '0', STR_PAD_LEFT),
                'prv_id' => $id_proveedor,
                'tra_solicitante' => $tra_solicitante,
                'sed_codigo' => $sed_codigo,
                'coc_usucreacion' => $user->usu_codigo,
                'coc_fecmodificacion' => null,
                'coc_estado' => 'SOL',
            ]);

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
                    'cod_activo' => 1,
                    'cod_usucreacion' => $user->usu_codigo,
                    'cod_fecmodificacion' => null
                ]);

                $detalleMaterial->odm_estado = 'COT';
                $detalleMaterial->save();
            }

            DB::commit();

            $agrupados = [];
            foreach ($detalleMateriales as $detalle) {
                $cod_orden = $detalle['cod_orden'];

                if (!isset($agrupados[$cod_orden])) {
                    // Si no existe el grupo, inicializamos con el primer elemento
                    $agrupados[$cod_orden] = $detalle;
                    $agrupados[$cod_orden]['cod_cantidad'] = floatval($detalle['cod_cantidad']);
                } else {
                    // Si ya existe el grupo, sumamos la cantidad
                    $agrupados[$cod_orden]['cod_cantidad'] += floatval($detalle['cod_cantidad']);
                }
            }
            $agrupadosIndexado = array_values($agrupados);

            // cuentas bancarias
            $cuentasBancariasProveedor = ProveedorCuentaBanco::with('entidadBancaria')
                ->where('prv_id', $id_proveedor)->get();

            $cuentas_bancarias = UtilHelper::obtenerCuentasBancarias($cuentasBancariasProveedor ?? []);

            // retorna la generacion de un PDF
            $API_URL = env('DOMAIN_APPLICATION', 'http://192.168.2.3:8080/logistica');
            $data = [
                'proveedor' => $proveedor,
                'trabajador' => $tra_solicitante,
                'detalleMateriales' => $agrupadosIndexado,
                'fechaActual' => DateHelper::parserFechaActual(),
                'usuarioImpresion' => $user->usu_codigo,
                'fechaHoraImpresion' => date('Y-m-d H:i:s'),
                'url_cotizacion' => $API_URL . "/cotizacion-proveedor.html?coc_id=$cotizacion->coc_id",
                'cuenta_banco_nacion' => $cuentas_bancarias['cuenta_banco_nacion'],
                'cuenta_soles' => $cuentas_bancarias['cuenta_soles'],
                'cuenta_dolares' => $cuentas_bancarias['cuenta_dolares']
            ];

            $pdfOptions = [
                'paper' => 'a4',
                'orientation' => 'landscape',
            ];

            $pdf = Pdf::loadView('cotizacion.cotizacion', $data)
                ->setPaper($pdfOptions['paper'], $pdfOptions['orientation']);

            return $pdf->download('cotizacion.pdf');
        } catch (Exception $e) {
            DB::rollBack();
            return response()->json(["error" => $e->getMessage()], 500, ['Content-Type' => 'application/json']);
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
                    'cod_cantidadcotizada' => $detalle->sum('cod_cantidadcotizada'),
                    'cod_tiempoentrega' => $detalle->first()->cod_tiempoentrega,
                    'cod_preciounitario' => $detalle->first()->cod_preciounitario,
                    'cod_total' => $detalle->sum('cod_total'),
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
            'total_format' => UtilHelper::convertirNumeroALetras($cotizacion->coc_total),
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
        $bancos = EntidadBancaria::select('eba_id', 'eba_descripcion', 'eba_activo')
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
        // obtenemos el detalle de cotizacion de acuerdo al id de cotizacion y ademas estos detalles deben estar cotizados
        $cotizacionDetalle = CotizacionDetalle::where('coc_id', $coc_id)
            ->where('cod_cotizar', 1)
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
                if (CotizacionDetalle::whereIn('odm_id', $identificadores_id)
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
            $this->seleccionarCotizacionDetalleProducto($id);

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
}
