<?php

namespace App\Http\Controllers;

use App\Cotizacion;
use App\CotizacionDetalle;
use App\CotizacionDetalleArchivos;
use App\Helpers\DateHelper;
use App\OrdenCompraDetalle;
use App\OrdenInternaMateriales;
use App\Producto;
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
        $pageSize = $request->input('page_size', 10);
        $page = $request->input('page', 1);

        $coc_numero = $request->input('coc_numero', null);
        $coc_estado = $request->input('coc_estado', null);

        $query = Cotizacion::with(['proveedor', 'moneda']);

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

            $cotizacion = Cotizacion::create([
                'coc_numero' => str_pad($numero, 7, '0', STR_PAD_LEFT),
                'prv_id' => $proveedor['prv_id'],
                'tra_solicitante' => $tra_solicitante,
                'coc_fechacotizacion' => Carbon::now()->format('Y-m-d'),
                'coc_usucreacion' => $user->usu_codigo,
                'coc_fecmodificacion' => null,
                'coc_estado' => 'SOL',
            ]);

            foreach ($detalleMateriales as $detalle) {
                $detalleMaterial = OrdenInternaMateriales::findOrFail($detalle['odm_id']);

                // si un detalle ya ha sido ordenado para una compra, salimos de la operación
                if ($detalleMaterial->odm_estado == 'ODC') {
                    throw new Exception("El material $detalleMaterial->odm_descripcion con cantidad $detalleMaterial->odm_cantidad, ya ha sido ordenado para una compra");
                }

                CotizacionDetalle::create([
                    'coc_id' => $cotizacion->coc_id,
                    'odm_id' => $detalle['odm_id'],
                    'cod_orden' => $detalle['cod_orden'],
                    'cod_descripcion' => $detalle['cod_descripcion'],
                    'cod_observacion' => $detalle['cod_observacion'],
                    'cod_cantidad' => $detalle['cod_cantidad'],
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

            // retorna la generacion de un PDF
            $API_URL = env('DOMAIN_APPLICATION', 'http://192.168.2.3:8080/logistica');
            $data = [
                'proveedor' => $proveedor,
                'trabajador' => $tra_solicitante,
                'detalleMateriales' => $agrupadosIndexado,
                'fechaActual' => DateHelper::parserFechaActual(),
                'url_cotizacion' => $API_URL . "/cotizacion-proveedor.html?coc_id=$cotizacion->coc_id"
            ];

            $pdf = Pdf::loadView('cotizacion.cotizacion', $data);
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

    public function exportarPDF(Request $request)
    {
        try {
            $coc_id = $request->input('coc_id');
            $cotizacion = Cotizacion::with(['proveedor', 'moneda', 'solicitante'])->findOrFail($coc_id);

            $detalleCotizacion = CotizacionDetalle::with(['detalleMaterial.producto.unidad'])
                ->where('coc_id', $cotizacion->coc_id)
                ->where('cod_cotizar', 1)
                ->get();

            $agrupado = $detalleCotizacion
                ->where('odm_id', '!=', null)
                ->groupBy('cod_orden')
                ->map(function ($grupo, $cod_orden) {
                    return [
                        'cod_orden' => $cod_orden,
                        'cod_descripcion' => $grupo->first()->cod_descripcion,
                        'cod_observacion' => $grupo->first()->cod_observacion,
                        'uni_codigo' => $grupo->first()->detalleMaterial->producto ? $grupo->first()->detalleMaterial->producto->unidad->uni_codigo : 'N/A',
                        'cod_cantidad' => $grupo->sum('cod_cantidad'),
                        'cod_tiempoentrega' => $grupo->first()->cod_tiempoentrega,
                        'cod_preciounitario' => $grupo->first()->cod_preciounitario,
                        'cod_total' => $grupo->sum('cod_total'),
                    ];
                })
                ->values();

            $marcas = $detalleCotizacion
                ->where('odm_id', '==', null)
                ->values();

            $combinado = $agrupado->merge($marcas);
            $combinadoOrdenado = $combinado->sortBy('cod_orden')->values();

            $data = [
                'cotizacion' => $cotizacion,
                'proveedor' => $cotizacion->proveedor,
                'detalle_cotizacion' => $combinadoOrdenado,
                'coc_fecha_formateada' => DateHelper::parserFechaActual(),
            ];

            $pdf = Pdf::loadView('cotizacion.cotizacionformal', $data);
            return $pdf->download('cotizacion.pdf');
        } catch (Exception $e) {
            return response()->json(["error" => $e->getMessage()], 500);
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
                if($odm_id != null){
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

    // CONTROLADOR PARA COTIZACION PROVEEDOR

    // funcion para mostrar cotizacion para proveedor
    public function showCotizacionProveedor($id)
    {
        $cotizacion = Cotizacion::with(['proveedor', 'moneda', 'solicitante'])->findOrFail($id);
        $cotizacionDetalle = CotizacionDetalle::with(['detalleMaterial.producto.unidad'])
            ->where('coc_id', $cotizacion->coc_id)
            ->get();

        $agrupado_detalle = $cotizacionDetalle
            ->where('odm_id', '!=', null)
            ->groupBy('cod_orden')
            ->map(function ($detalle, $cod_orden) {
                return [
                    'cod_orden' => $cod_orden,
                    'cod_descripcion' => $detalle->first()->cod_descripcion,
                    'cod_observacion' => $detalle->first()->cod_observacion,
                    'uni_codigo' => $detalle->first()->detalleMaterial->producto ? $detalle->first()->detalleMaterial->producto->unidad->uni_codigo : 'N/A',
                    'cod_cantidad' => $detalle->sum('cod_cantidad'),
                    'cod_tiempoentrega' => $detalle->first()->cod_tiempoentrega,
                    'cod_preciounitario' => $detalle->first()->cod_preciounitario,
                    'cod_total' => $detalle->first()->cod_total,
                    'cod_cotizar' => $detalle->first()->cod_cotizar,
                    'detalle' => $detalle->values()
                ];
            })
            ->values();

        $detalle_marcas = $cotizacionDetalle
            ->where('odm_id', '==', null)
            ->values();

        return response()->json([
            "cotizacion" => $cotizacion,
            "agrupado_detalle" => $agrupado_detalle,
            "detalle_marcas" => $detalle_marcas
        ]);
    }

    // funcion para editar cotizacion para proveedor
    public function updateCotizacionProveedor(Request $request, $id)
    {
        try {
            DB::beginTransaction();
            $validatedData = validator($request->all(), [
                'coc_cotizacionproveedor' => 'required|string',
                'coc_correocontacto' => 'required|email',
                'coc_fechaentrega' => 'required|date',
                'coc_fechavalidez' => 'required|date',
                'coc_notas' => 'nullable|string',
                'coc_total' => 'required|numeric|min:1',
                'mon_codigo' => 'required|string|exists:tblmonedas_mon,mon_codigo',
                'coc_formapago' => 'required|string',
                'detalle_cotizacion' => 'required|array|min:1',
            ])->validate();

            // actualizamos la cotizacion
            $cotizacion = Cotizacion::findOrFail($id);

            $cotizacion->update([
                'coc_cotizacionproveedor' => $validatedData['coc_cotizacionproveedor'],
                'coc_correocontacto' => $validatedData['coc_correocontacto'],
                'coc_formapago' => $validatedData['coc_formapago'],
                'mon_codigo' => $validatedData['mon_codigo'],
                'coc_fechaentrega' => $validatedData['coc_fechaentrega'],
                'coc_fechavalidez' => $validatedData['coc_fechavalidez'],
                'coc_notas' => $validatedData['coc_notas'],
                'coc_total' => $validatedData['coc_total'],
                'coc_estado' => 'RPR'
            ]);

            // actualizamos los detalles de la cotizacion
            $detalleCotizacion = $validatedData['detalle_cotizacion'];
            foreach ($detalleCotizacion as $detalle) {
                // Buscamos el detalle de cotizacion
                $detalleCotizacionResumido = CotizacionDetalle::where('coc_id', $cotizacion->coc_id)
                    ->where('cod_orden', $detalle['cod_orden'])
                    ->get();

                foreach ($detalleCotizacionResumido as $detalleResumido) {
                    $detalleResumido->update([
                        'cod_observacion' => $detalle['cod_observacion'],
                        'cod_tiempoentrega' => $detalle['cod_tiempoentrega'],
                        'cod_preciounitario' => $detalle['cod_preciounitario'],
                        'cod_total' => $detalleResumido->cod_cantidad * floatval($detalle['cod_preciounitario']),
                        'cod_cotizar' => 1,
                    ]);
                }

                // recorremos el detalle de marcas
                foreach ($detalle['detalle_marcas'] as $marca) {
                    CotizacionDetalle::create([
                        'coc_id' => $cotizacion->coc_id,
                        'cod_orden' => $detalle['cod_orden'],
                        'cod_descripcion' => $marca['cod_descripcion'],
                        'cod_observacion' => $marca['cod_observacion'],
                        'cod_tiempoentrega' => $marca['cod_tiempoentrega'],
                        'cod_cantidad' => $marca['cod_cantidad'],
                        'cod_preciounitario' => $marca['cod_preciounitario'],
                        'cod_total' => $marca['cod_total'],
                        'cod_cotizar' => 1,
                        'cod_fecmodificacion' => null,
                        'cod_usucreacion' => null,
                    ]);
                }
            }

            DB::commit();

            // proveedor
            $cotizacion = Cotizacion::with(['proveedor', 'moneda', 'solicitante'])->findOrFail($id);

            $detalleCotizacion = CotizacionDetalle::with(['detalleMaterial.producto.unidad'])
                ->where('coc_id', $cotizacion->coc_id)
                ->where('cod_cotizar', 1)
                ->get();

            $agrupado = $detalleCotizacion
                ->where('odm_id', '!=', null)
                ->groupBy('cod_orden')
                ->map(function ($grupo, $cod_orden) {
                    return [
                        'cod_orden' => $cod_orden,
                        'cod_descripcion' => $grupo->first()->cod_descripcion,
                        'cod_observacion' => $grupo->first()->cod_observacion,
                        'uni_codigo' => $grupo->first()->detalleMaterial->producto ? $grupo->first()->detalleMaterial->producto->unidad->uni_codigo : 'N/A',
                        'cod_cantidad' => $grupo->sum('cod_cantidad'),
                        'cod_tiempoentrega' => $grupo->first()->cod_tiempoentrega,
                        'cod_preciounitario' => $grupo->first()->cod_preciounitario,
                        'cod_total' => $grupo->sum('cod_total')
                    ];
                })
                ->values();

            $marcas = $detalleCotizacion
                ->where('odm_id', '==', null)
                ->values();

            $combinado = $agrupado->merge($marcas);
            $combinadoOrdenado = $combinado->sortBy('cod_orden')->values();

            $data = [
                'cotizacion' => $cotizacion,
                'proveedor' => $cotizacion->proveedor,
                'detalle_cotizacion' => $combinadoOrdenado,
                'coc_fecha_formateada' => DateHelper::parserFechaActual(),
            ];

            $pdf = Pdf::loadView('cotizacion.cotizacionformal', $data);
            return $pdf->download('cotizacion.pdf');
        } catch (Exception $e) {
            DB::rollBack();
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }
}
