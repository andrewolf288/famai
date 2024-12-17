<?php

namespace App\Http\Controllers;

use App\Almacen;
use App\CotizacionDetalle;
use App\OrdenInterna;
use App\Helpers\UtilHelper;
use App\OrdenInternaMateriales;
use App\OrdenInternaPartes;
use Barryvdh\DomPDF\Facade\Pdf;
use Exception;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use PhpOffice\PhpSpreadsheet\Spreadsheet;
use PhpOffice\PhpSpreadsheet\Writer\Xlsx;
use App\Helpers\DateHelper;
use App\OrdenCompraDetalle;
use App\Producto;
use App\Services\ProductoService;
use App\Trabajador;
use App\Unidad;
use Carbon\Carbon;
use Illuminate\Support\Facades\Storage;

class OrdenInternaMaterialesController extends Controller
{

    public function index(Request $request)
    {
        $user = auth()->user();
        $sed_codigo = "10";

        $trabajador = Trabajador::where('usu_codigo', $user->usu_codigo)->first();

        if ($trabajador) {
            $sed_codigo = $trabajador->sed_codigo;
        }

        $ordenTrabajo = $request->input('odt_numero', null);
        $tipoProceso = $request->input('oic_tipo', null);
        $responsable = $request->input('tra_nombre', null);
        $fecha_desde = $request->input('fecha_desde', null);
        $fecha_hasta = $request->input('fecha_hasta', null);
        // multifilters
        $multifilter = $request->input('multifilter', null);

        // se necesita agregar informacion de procedimiento almacenado
        $query = OrdenInternaMateriales::with(
            [
                'responsable',
                'producto.unidad',
                'ordenInternaParte.ordenInterna'
            ]
        )
            ->withCount('cotizaciones')
            ->withCount('ordenesCompra')
            ->whereHas('ordenInternaParte.ordenInterna', function ($q) use ($sed_codigo) {
                $q->where('sed_codigo', $sed_codigo);
            })
            ->whereNotIn('odm_tipo', [3, 4, 5])
            ->whereNotNull('odm_estado');

        // filtro de orden de trabajo
        if ($ordenTrabajo !== null) {
            $query->whereHas('ordenInternaParte.ordenInterna', function ($q) use ($ordenTrabajo) {
                $q->where('odt_numero', $ordenTrabajo);
            });
        }

        // filtro de tipo de proceso
        if ($tipoProceso !== null) {
            $query->whereHas('ordenInternaParte.ordenInterna', function ($q) use ($tipoProceso) {
                $q->where('oic_tipo', $tipoProceso);
            });
        }

        if ($responsable !== null) {
            $query->whereHas('responsable', function ($q) use ($responsable) {
                $q->whereRaw("tra_nombre COLLATE SQL_Latin1_General_CP1_CI_AI LIKE ?", ['%' . $responsable . '%']);
            });
        }

        // filtro de fecha
        if ($fecha_desde !== null && $fecha_hasta !== null) {
            $query->whereBetween('odm_feccreacion', [$fecha_desde, $fecha_hasta]);
        }


        // Procesar el parámetro multiselect
        if ($multifilter !== null) {
            // Separar el string por "OR" y crear un array con cada palabra
            $palabras = explode('OR', $request->input('multifilter'));

            // Agregar el grupo de condiciones OR
            // $query->where(function ($q) use ($palabras, $almID) {
            foreach ($palabras as $palabra) {
                // pendiente de emision de orden de compra
                if ($palabra === 'pendiente_emitir_orden_compra') {
                    $query->where('odm_estado', 'COT');
                }
                // pendiente de emision de cotizacion
                if ($palabra === 'pendiente_emitir_cotizacion') {
                    $query->where('odm_estado', 'REQ');
                }
                // material sin codigo
                if ($palabra === 'material_sin_codigo') {
                    $query->where('pro_id', null);
                }
                // material sin compra
                if ($palabra === 'material_sin_compra') {
                    $query->whereNotNull('pro_id');
                    $query->orderBy('odm_feccreacion', 'desc');

                    $data = $query->get();
                    $dataFiltrada = [];

                    foreach ($data as $item) {
                        $productoCodigo = $item->producto->pro_codigo;

                        $subconsultaOPDN = DB::connection('sqlsrv_secondary')->table('OPDN')
                            ->join('PDN1', 'OPDN.DocEntry', '=', 'PDN1.DocEntry')
                            ->select(DB::raw('MAX(OPDN.DocDate) as ultima_fecha_compra'))
                            ->where('PDN1.ItemCode', '=', $productoCodigo)
                            ->first();

                        // Comprobar si ultima_fecha_compra es null
                        if (!$subconsultaOPDN || $subconsultaOPDN->ultima_fecha_compra === null) {
                            $subconsultaOIGN = DB::connection('sqlsrv_secondary')->table('OIGN')
                                ->join('IGN1', 'OIGN.DocEntry', '=', 'IGN1.DocEntry')
                                ->select(DB::raw('MAX(OIGN.DocDate) as ultima_fecha_compra'))
                                ->where('IGN1.ItemCode', '=', $productoCodigo)
                                ->first();

                            if (!$subconsultaOIGN || $subconsultaOIGN->ultima_fecha_compra === null) {
                                $dataFiltrada[] = $item;
                            }
                        }
                    }

                    return response($dataFiltrada);
                }
            }
        }

        // ordenar de formar descendiente
        $query->orderBy('odm_feccreacion', 'desc');

        return response($query->get());
    }

    // index resumido
    public function indexResumido(Request $request)
    {
        $user = auth()->user();
        $sed_codigo = "10";

        $trabajador = Trabajador::where('usu_codigo', $user->usu_codigo)->first();

        if ($trabajador) {
            $sed_codigo = $trabajador->sed_codigo;
        }

        $almacen = Almacen::where('sed_codigo', $sed_codigo)
            ->where('alm_esprincipal', 1)
            ->first();

        $almacen_codigo = $almacen->alm_codigo;

        // incializamos el servicio
        $productoService = new ProductoService();

        $ordenTrabajo = $request->input('odt_numero', null);
        $tipoProceso = $request->input('oic_tipo', null);
        $responsable = $request->input('tra_nombre', null);
        $fecha_desde = $request->input('fecha_desde', null);
        $fecha_hasta = $request->input('fecha_hasta', null);
        $almacen_request = $request->input('alm_codigo', null);
        // multifilters
        $multifilter = $request->input('multifilter', null);

        if($almacen_request !== null){
            $almacen_codigo = $almacen_request;
        }

        // se necesita agregar informacion de procedimiento almacenado
        $query = OrdenInternaMateriales::with(
            [
                'responsable',
                'producto.unidad',
                'ordenInternaParte.ordenInterna'
            ]
        )
            ->withCount('cotizaciones')
            ->withCount('ordenesCompra')
            ->whereHas('ordenInternaParte.ordenInterna', function ($q) use ($sed_codigo) {
                $q->where('sed_codigo', $sed_codigo);
            })
            ->whereHas('ordenInternaParte.ordenInterna', function ($q) {
                $q->where('oic_estado', 'PROCESO');
            })
            ->whereNotIn('odm_tipo', [3, 4, 5])
            ->whereNotNull('odm_estado');

        // filtro de orden de trabajo
        if ($ordenTrabajo !== null) {
            $query->whereHas('ordenInternaParte.ordenInterna', function ($q) use ($ordenTrabajo) {
                $q->where('odt_numero', $ordenTrabajo);
            });
        }

        // filtro de tipo de proceso
        if ($tipoProceso !== null) {
            $query->whereHas('ordenInternaParte.ordenInterna', function ($q) use ($tipoProceso) {
                $q->where('oic_tipo', $tipoProceso);
            });
        }

        if ($responsable !== null) {
            $query->whereHas('responsable', function ($q) use ($responsable) {
                $q->whereRaw("tra_nombre COLLATE SQL_Latin1_General_CP1_CI_AI LIKE ?", ['%' . $responsable . '%']);
            });
        }

        // filtro de fecha
        if ($fecha_desde !== null && $fecha_hasta !== null) {
            $query->whereBetween('odm_feccreacion', [$fecha_desde, $fecha_hasta]);
        }

        // Procesar el parámetro multiselect
        if ($multifilter !== null) {
            // Separar el string por "OR" y crear un array con cada palabra
            $palabras = explode('OR', $request->input('multifilter'));

            // Agregar el grupo de condiciones OR
            foreach ($palabras as $palabra) {
                // pendiente de emision de orden de compra
                if ($palabra === 'pendiente_emitir_orden_compra') {
                    $query->where('odm_estado', 'COT');
                }
                // pendiente de emision de cotizacion
                if ($palabra === 'pendiente_emitir_cotizacion') {
                    $query->where('odm_estado', 'REQ');
                }
                // material sin codigo
                if ($palabra === 'material_sin_codigo') {
                    $query->where('pro_id', null);
                }
                // material sin compra
                if ($palabra === 'material_sin_compra') {
                    $query->whereNotNull('pro_id');
                    $query->orderBy('odm_feccreacion', 'desc');

                    $data = $query->get();
                    $dataFiltrada = [];

                    foreach ($data as $item) {
                        $productoCodigo = $item->producto->pro_codigo;

                        $subconsultaOPDN = DB::connection('sqlsrv_secondary')->table('OPDN')
                            ->join('PDN1', 'OPDN.DocEntry', '=', 'PDN1.DocEntry')
                            ->select(DB::raw('MAX(OPDN.DocDate) as ultima_fecha_compra'))
                            ->where('PDN1.ItemCode', '=', $productoCodigo)
                            ->first();

                        // Comprobar si ultima_fecha_compra es null
                        if (!$subconsultaOPDN || $subconsultaOPDN->ultima_fecha_compra === null) {
                            $subconsultaOIGN = DB::connection('sqlsrv_secondary')->table('OIGN')
                                ->join('IGN1', 'OIGN.DocEntry', '=', 'IGN1.DocEntry')
                                ->select(DB::raw('MAX(OIGN.DocDate) as ultima_fecha_compra'))
                                ->where('IGN1.ItemCode', '=', $productoCodigo)
                                ->first();

                            if (!$subconsultaOIGN || $subconsultaOIGN->ultima_fecha_compra === null) {
                                $dataFiltrada[] = $item;
                            }
                        }
                    }

                    return response($dataFiltrada);
                }
            }
        }
        // ordenamos la data demanera desc
        $query->orderBy('odm_feccreacion', 'desc');

        $data = $query->get();

        // debemos agrupar la información
        $agrupados = $data
            ->whereNotNull('pro_id')
            ->groupBy('pro_id')
            ->map(function ($grupo, $pro_id) use($productoService, $almacen_codigo) {

                $producto = $grupo->first()->producto;
                $producto_codigo = $producto->pro_codigo;
                $productoStock = $productoService->findProductoBySAP($almacen_codigo, $producto_codigo);

                return [
                    'pro_id' => $pro_id,
                    'pro_codigo' => $producto_codigo,
                    'pro_descripcion' => $producto->pro_descripcion,
                    'uni_codigo' => $producto->unidad->uni_codigo,
                    'cantidad' => $grupo->sum('odm_cantidad'),
                    'stock' => $productoStock ? $productoStock['alp_stock'] : 0.00,
                    // 'stock' => 0.00,
                    'cotizaciones_count' => $grupo->sum('cotizaciones_count'),
                    'ordenes_compra_count' => $grupo->sum('ordenes_compra_count'),
                    'detalle' => $grupo->values()
                ];
            })
            ->values();

        $sinAgrupar = $data
            ->whereNull('pro_id')
            ->values();

        // Combinar los resultados
        $resultado = $agrupados->concat($sinAgrupar);

        return response()->json($resultado);
    }

    // mostrar detalle de un material por ID
    public function show($id)
    {
        $ordenInternaMaterial = OrdenInternaMateriales::with(
            [
                'responsable',
            ]
        )->findOrFail($id);
        return response()->json($ordenInternaMaterial);
    }

    public function indexValidacionCodigo(Request $request)
    {
        $user = auth()->user();
        $sed_codigo = "10";

        $trabajador = Trabajador::where('usu_codigo', $user->usu_codigo)->first();

        if ($trabajador) {
            $sed_codigo = $trabajador->sed_codigo;
        }

        $ordenTrabajo = $request->input('odt_numero', null);
        $fecha_desde = $request->input('fecha_desde', null);
        $fecha_hasta = $request->input('fecha_hasta', null);

        // multifilters
        $multifilter = $request->input('multifilter', null);

        $query = OrdenInternaMateriales::with(
            [
                'responsable',
                'producto.unidad',
                'ordenInternaParte.ordenInterna.area'
            ]
        )
            ->whereHas('ordenInternaParte.ordenInterna', function ($q) use ($sed_codigo) {
                $q->where('sed_codigo', $sed_codigo);
            })
            ->whereHas('ordenInternaParte.ordenInterna', function ($q) {
                $q->where('oic_estado', 'ENVIADO')
                    ->orWhere('oic_estado', 'EVALUADO');
            });

        // filtro por orden de trabajo
        if ($ordenTrabajo !== null) {
            $query->whereHas('ordenInternaParte.ordenInterna', function ($q) use ($ordenTrabajo) {
                $q->where('odt_numero', $ordenTrabajo);
            });
        }

        // filtro de fecha
        if ($fecha_desde !== null && $fecha_hasta !== null) {
            $query->whereBetween('odm_feccreacion', [$fecha_desde, $fecha_hasta]);
        }

        // Procesar el parámetro multiselect
        if ($multifilter !== null) {
            // Separar el string por "OR" y crear un array con cada palabra
            $palabras = explode('OR', $request->input('multifilter'));
            // si existe filtro de no verificado y verificado
            if (in_array('no_verificados', $palabras) && in_array('verificados', $palabras)) {
                $query->where(function ($query) {
                    $query->whereNull('odm_estado');
                    $query->orWhereNotNull('odm_estado');
                });
            } else {
                if (in_array('no_verificados', $palabras)) {
                    $query->whereNull('odm_estado');
                }
                if (in_array('verificados', $palabras)) {
                    $query->whereNotNull('odm_estado');
                }
            }

            // si eiste filtro de productos con codigo y sin codigo
            if (in_array('productos_con_codigo', $palabras) && in_array('productos_sin_codigo', $palabras)) {
                $query->where(function ($query) {
                    $query->whereNotNull('pro_id');
                    $query->orWhereNull('pro_id');
                });
            } else {
                if (in_array('productos_con_codigo', $palabras)) {
                    $query->whereNotNull('pro_id');
                }
                if (in_array('productos_sin_codigo', $palabras)) {
                    $query->whereNull('pro_id');
                }
            }
        }

        $resultado = $query->get();
        return response()->json($resultado);
    }

    public function validarMaterialesMasivo(Request $request)
    {
        $user = auth()->user();
        $materiales = $request->input('materiales', []);
        try {
            DB::beginTransaction();
            foreach ($materiales as $material) {
                $ordenInternaMaterial = OrdenInternaMateriales::findOrFail($material);
                $ordenInternaMaterial->update([
                    'odm_estado' => "REQ",
                    'odm_usumodificacion' => $user->usu_codigo
                ]);
            }
            DB::commit();
            return response()->json($materiales, 200);
        } catch (Exception $e) {
            DB::rollBack();
            return response()->json(["error" => $e->getMessage()], 500);
        }
    }

    public function findByNumeroOrdenInterna(Request $request)
    {
        $numero = $request->input('odt_numero', null);
        $ordeninterna = OrdenInterna::with('partes.materiales')
            ->where('odt_numero', $numero)
            ->first();

        $materiales = [];
        foreach ($ordeninterna->partes as $parte) {
            foreach ($parte->materiales as $material) {
                $materiales[] = $material;
            }
        }

        return response()->json($materiales);
    }

    public function findByNumeroOrdenTrabajo(Request $request)
    {
        $numeroOrdenTrabajo = $request->input('odt_numero', null);

        $query = OrdenInternaMateriales::with(['ordenInternaParte.ordenInterna', 'producto.unidad']);

        $query->whereHas('ordenInternaParte.ordenInterna', function ($q) use ($numeroOrdenTrabajo) {
            $q->where('odt_numero', $numeroOrdenTrabajo);
        });

        $materiales = $query->get();

        return response()->json($materiales);
    }

    public function update(Request $request, $id)
    {
        $user = auth()->user();
        try {
            DB::beginTransaction();
            $ordenInternaMaterial = OrdenInternaMateriales::findOrFail($id);
            $request->validate([
                'odm_descripcion' => 'required|string|max:255',
                'odm_cantidad' => 'required|numeric',
                'odm_observacion' => 'nullable|string|max:255',
            ]);

            $ordenInternaMaterial->update([
                'odm_descripcion' => $request->input('odm_descripcion'),
                'odm_cantidad' => $request->input('odm_cantidad'),
                'odm_observacion' => $request->input('odm_observacion'),
                'odm_usumodificacion' => $user->usu_codigo,
            ]);

            // buscamos el detalle de parte
            $ordenInternaParte = OrdenInternaPartes::findOrFail($ordenInternaMaterial->opd_id);
            $ordenInterna = OrdenInterna::findOrFail($ordenInternaParte->oic_id);

            // actualizamos la orden interna
            $ordenInterna->oic_fecmodificacion = date('Y-m-d H:i:s');
            $ordenInterna->oic_fecha = date('Y-m-d H:i:s');
            $ordenInterna->oic_usumodificacion = $user->usu_codigo;
            $ordenInterna->save();

            DB::commit();

            return response()->json($ordenInternaMaterial, 200);
        } catch (Exception $e) {
            DB::rollBack();
            return response()->json(['error' => 'Error al actualizar el detalle de producto: ' . $e->getMessage()], 500);
        }
    }

    public function updatePresupuesto(Request $request, $id)
    {
        $user = auth()->user();
        try {
            DB::beginTransaction();
            $ordenInternaMaterial = OrdenInternaMateriales::findOrFail($id);

            $request->validate([
                'notapresupuesto' => 'required|string',
            ]);

            $data = json_decode($request->input('notapresupuesto'), true);

            if (json_last_error() !== JSON_ERROR_NONE) {
                return response()->json(['error' => 'El campo data contiene un JSON inválido.'], 400);
            }

            // Valida el request
            $validatedData = validator($data, [
                'odm_notapresupuesto' => 'required|string',
            ])->validate();

            $ordenInternaMaterial->odm_notapresupuesto = $validatedData['odm_notapresupuesto'];
            $ordenInternaMaterial->odm_usumodificacion = $user->usu_codigo;

            if ($request->hasFile('adjuntopresupuesto')) {
                // primero debemos eliminar el recurso anteriormente guardado
                if (file_exists($ordenInternaMaterial->odm_adjuntopresupuesto)) {
                    Storage::disk('public')->delete($ordenInternaMaterial->odm_adjuntopresupuesto);
                }

                // obtenemos el file y lo guardamos
                $file = $request->file('adjuntopresupuesto');
                $extension = $file->getClientOriginalExtension();
                $fileName = uniqid() . '.' . $extension;
                $path = $file->storeAs('adjuntos-presupuesto', $fileName, 'public');
                $ordenInternaMaterial->odm_adjuntopresupuesto = $path;
            }

            $ordenInternaMaterial->save();
            DB::commit();
            return response()->json($ordenInternaMaterial, 200);
        } catch (Exception $e) {
            DB::rollBack();
            return response()->json(["error" => $e->getMessage()], 500);
        }
    }

    public function updateResponsableMaterial(Request $request, $id)
    {
        $user = auth()->user();
        try {
            DB::beginTransaction();
            $ordenInternaMaterial = OrdenInternaMateriales::findOrFail($id);
            $request->validate([
                'tra_responsable' => 'required|exists:tbltrabajadores_tra,tra_id',
            ]);

            $ordenInternaMaterial->update([
                'tra_responsable' => $request->input('tra_responsable'),
                'odm_fecasignacionresponsable' => Carbon::now(),
                'odm_usumodificacion' => $user->usu_codigo,
            ]);

            $ordenInternaMaterial->load('responsable');

            DB::commit();
            return response()->json($ordenInternaMaterial, 200);
        } catch (Exception $e) {
            DB::rollBack();
            return response()->json(["error" => $e->getMessage()], 500);
        }
    }

    public function updateResponsableMaterialMasivo(Request $request)
    {
        $user = auth()->user();
        try {
            DB::beginTransaction();

            $request->validate([
                'tra_responsable' => 'required|exists:tbltrabajadores_tra,tra_id',
                'param' => 'required|string',
            ]);

            $detalleMaterialesFilter = $request->input('param', '');

            if ($detalleMaterialesFilter) {
                $detalleMaterialesFilter = explode(',', $detalleMaterialesFilter);
            }

            OrdenInternaMateriales::whereIn('odm_id', $detalleMaterialesFilter)
                ->update([
                    'tra_responsable' => $request->input('tra_responsable'),
                    'odm_fecasignacionresponsable' => Carbon::now(),
                    'odm_usumodificacion' => $user->usu_codigo,
                ]);

            $primerRegistro = OrdenInternaMateriales::whereIn('odm_id', $detalleMaterialesFilter)->first();
            if ($primerRegistro) {
                $primerRegistro->load('responsable');
            }

            DB::commit();
            return response()->json($primerRegistro);
        } catch (Exception $e) {
            DB::rollBack();
        }
    }

    public function updateTipoMaterial(Request $request, $id)
    {
        $user = auth()->user();
        try {
            DB::beginTransaction();
            $ordenInternaMaterial = OrdenInternaMateriales::findOrFail($id);
            $request->validate([
                'odm_tipo' => 'required|integer',
                'odm_observacion' => 'nullable|string|max:255',
            ]);

            $ordenInternaMaterial->update([
                'odm_tipo' => $request->input('odm_tipo'),
                'odm_observacion' => $request->input('odm_observacion'),
                'odm_usumodificacion' => $user->usu_codigo,
            ]);

            // buscamos el detalle de parte
            $ordenInternaParte = OrdenInternaPartes::findOrFail($ordenInternaMaterial->opd_id);
            $ordenInterna = OrdenInterna::findOrFail($ordenInternaParte->oic_id);

            // actualizamos la orden interna
            $ordenInterna->oic_fecmodificacion = date('Y-m-d H:i:s');
            $ordenInterna->oic_fecha = date('Y-m-d H:i:s');
            $ordenInterna->oic_usumodificacion = $user->usu_codigo;
            $ordenInterna->save();

            DB::commit();

            return response()->json($ordenInternaMaterial, 200);
        } catch (Exception $e) {
            DB::rollBack();
            return response()->json(["error" => $e->getMessage()], 500);
        }
    }

    public function destroy($id)
    {
        $user = auth()->user();
        try {
            DB::beginTransaction();
            $ordenInternaMaterial = OrdenInternaMateriales::with('detalleAdjuntos')
                ->findOrFail($id);

            // eliminamos el detalle de adjuntos
            foreach ($ordenInternaMaterial->detalleAdjuntos as $archivo) {
                $urlArchivo = $archivo->oma_url;
                // Eliminar archivo físico del disco
                Storage::disk('public')->delete($urlArchivo);
                // Eliminar el registro de detalleCotizacionArchivos
                $archivo->delete();
            }

            // buscamos el detalle de parte
            $ordenInternaParte = OrdenInternaPartes::findOrFail($ordenInternaMaterial->opd_id);
            $ordenInterna = OrdenInterna::findOrFail($ordenInternaParte->oic_id);

            // actualizamos la orden interna
            $ordenInterna->oic_fecmodificacion = date('Y-m-d H:i:s');
            $ordenInterna->oic_fecha = date('Y-m-d H:i:s');
            $ordenInterna->oic_usumodificacion = $user->usu_codigo;
            $ordenInterna->save();

            // eliminamos fisicamente el detalle de meterial
            $ordenInternaMaterial->delete();

            DB::commit();
            return response()->json(['message' => 'Detalle de material eliminado'], 200);
        } catch (Exception $e) {
            DB::rollBack();
            return response()->json(['error' => 'Error al eliminar el detalle de material: ' . $e->getMessage()], 500);
        }
    }

    // Exportacion de excel de almacen
    public function exportExcelAlmacen(Request $request)
    {
        try {
            $ordenTrabajo = $request->input('odt_numero', null);

            $findOrdenTrabajo = OrdenInterna::where('odt_numero', $ordenTrabajo)->first();
            if (!$findOrdenTrabajo) {
                return response()->json(['error' => 'No se encontro la orden de trabajo'], 404);
            } else {
                $estadoOrdenTrabajo = $findOrdenTrabajo->oic_estado;
                if ($estadoOrdenTrabajo !== 'PROCESO') {
                    return response()->json(['error' => 'La orden de trabajo no se encuentra en un estado PROCESO'], 404);
                }
            }

            $query = OrdenInternaMateriales::with(
                [
                    'producto.unidad',
                    'ordenInternaParte.ordenInterna',
                    'usuarioCreador'
                ]
            )->whereNotIn('odm_tipo', [3, 4, 5]);
            // ->whereNotNull('odm_estado');

            // filtro de orden de trabajo
            if ($ordenTrabajo !== null) {
                $query->whereHas('ordenInternaParte.ordenInterna', function ($q) use ($ordenTrabajo) {
                    $q->where('odt_numero', $ordenTrabajo);
                });
            }

            $query->orderBy('odm_feccreacion', 'desc');

            // Obtener los resultados de la primera base de datos
            $ordenesMateriales = $query->get();

            $headers = ['OT', 'Fec. Ent. Logística', 'Responsable Origen', 'Cod Producto', 'Descripción', 'Cantidad', 'Obs Producto'];
            $columnWidths = [15, 19, 30, 10, 50, 10, 40];
            $tipoDato = ['texto', 'texto', 'texto', 'texto', 'texto', 'numero', 'texto'];

            $spreadsheet = new Spreadsheet();
            $sheet = $spreadsheet->getActiveSheet();

            // Establecemos anchos de columnas
            foreach ($columnWidths as $columnIndex => $width) {
                $sheet->getColumnDimensionByColumn($columnIndex + 1)->setWidth($width);
            }

            // Establecemos encabezados con formatos
            foreach ($headers as $columnIndex => $header) {
                $columnLetter = \PhpOffice\PhpSpreadsheet\Cell\Coordinate::stringFromColumnIndex($columnIndex + 1);

                // Dar color al fondo del encabezado
                $sheet->getStyle("{$columnLetter}1")->getFill()->setFillType(\PhpOffice\PhpSpreadsheet\Style\Fill::FILL_SOLID)->getStartColor()->setRGB('c7cdd6');

                // Poner el texto en negrita
                $sheet->getStyle("{$columnLetter}1")->getFont()->setBold(true);

                // Establecer el valor en la celda
                $sheet->setCellValue("{$columnLetter}1", $header);
            }

            // Establecer tipos de datos
            $SIZE_DATA = sizeof($ordenesMateriales) + 1;
            foreach ($tipoDato as $columnIndex => $tipoDato) {
                $columnLetter = \PhpOffice\PhpSpreadsheet\Cell\Coordinate::stringFromColumnIndex($columnIndex + 1);
                $sheet->getStyle("{$columnLetter}2:{$columnLetter}{$SIZE_DATA}")->getNumberFormat()->setFormatCode(\PhpOffice\PhpSpreadsheet\Style\NumberFormat::FORMAT_TEXT);
                if ($tipoDato === "numero") {
                    $sheet->getStyle("{$columnLetter}2:{$columnLetter}{$SIZE_DATA}")->getNumberFormat()->setFormatCode('0.00');
                }
            }

            // Agregamos la data
            $row = 2;

            foreach ($ordenesMateriales as $rowData) {
                $sheet->setCellValue("A{$row}", UtilHelper::getValueFormatExcel($rowData->ordenInternaParte && $rowData->ordenInternaParte->ordenInterna ? $rowData->ordenInternaParte->ordenInterna->odt_numero : null));
                $sheet->setCellValue("B{$row}", UtilHelper::getValueFormatExcel($rowData->ordenInternaParte && $rowData->ordenInternaParte->ordenInterna ? $rowData->ordenInternaParte->ordenInterna->oic_fechaentregaestimada : null));
                $sheet->setCellValue("C{$row}", UtilHelper::getValueFormatExcel($rowData->usuarioCreador->usu_nombre));
                $sheet->setCellValue("D{$row}", UtilHelper::getValueFormatExcel($rowData->producto ? $rowData->producto->pro_codigo : null));
                $sheet->setCellValue("E{$row}", UtilHelper::getValueFormatExcel($rowData->odm_descripcion));
                $sheet->setCellValue("F{$row}", UtilHelper::getValueFormatExcel($rowData->odm_cantidad));
                $sheet->setCellValue("G{$row}", UtilHelper::getValueFormatExcel($rowData->odm_observacion));
                $row++;
            }

            return response()->streamDownload(function () use ($spreadsheet) {
                $writer = new Xlsx($spreadsheet);
                $writer->save('php://output');
            }, 'reporte.xlsx', ['Content-Type' => 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet']);
        } catch (Exception $e) {
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    // Exportacion de excel de presupuestos
    public function exportExcelPresupuesto(Request $request)
    {
        try {
            $ordenTrabajo = $request->input('odt_numero', null);
            $fecha_desde = $request->input('fecha_desde', null);
            $fecha_hasta = $request->input('fecha_hasta', null);

            $query = OrdenInternaMateriales::with(
                [
                    'producto.unidad',
                    'ordenInternaParte.ordenInterna'
                ]
            )->whereNotIn('odm_tipo', [3, 4, 5]);

            // filtro de orden de trabajo
            if ($ordenTrabajo !== null) {
                $query->whereHas('ordenInternaParte.ordenInterna', function ($q) use ($ordenTrabajo) {
                    $q->where('odt_numero', $ordenTrabajo);
                });
            }

            // filtro de fecha
            if ($fecha_desde !== null && $fecha_hasta !== null) {
                $query->whereBetween('odm_feccreacion', [$fecha_desde, $fecha_hasta]);
            }

            $query->join('tblordenesinternasdetpartes_opd', 'tblordenesinternasdetpartes_opd.opd_id', '=', 'tblordenesinternasdetmateriales_odm.opd_id')
                ->join('tblordenesinternascab_oic', 'tblordenesinternascab_oic.oic_id', '=', 'tblordenesinternasdetpartes_opd.oic_id')
                ->orderBy('tblordenesinternascab_oic.odt_numero', 'asc')
                ->orderBy('odm_feccreacion', 'desc');


            // Obtener los resultados de la primera base de datos
            $ordenesMateriales = $query->get();

            $productoConInformacionCompras = $ordenesMateriales->map(function ($material) {
                return [
                    'material' => $material,
                    'ultimoPrecioCompras' => null,
                    'ultimaFechaCompras' => null,
                    'stock' => null
                ];
            });

            // $productoConInformacionCompras = $ordenesMateriales->map(function ($material) {
            //     $codigoProducto = $material->producto ? $material->producto->pro_codigo : null;
            //     // si es un producto diferente de null
            //     if ($codigoProducto !== null) {
            //         $compraInfo = DB::connection('sqlsrv_secondary')
            //             ->table('OITM as T0')
            //             ->join('OITW as T1', 'T0.ItemCode', '=', 'T1.ItemCode')
            //             ->select([
            //                 'T1.AvgPrice',
            //                 DB::raw('MAX(T1.OnOrder) as stock'),
            //                 DB::raw(
            //                     "(CASE 
            //                     WHEN (
            //                         SELECT MAX(OPDN.DocDate) 
            //                         FROM OPDN 
            //                         JOIN PDN1 ON OPDN.DocEntry = PDN1.DocEntry 
            //                         WHERE PDN1.ItemCode = T0.ItemCode
            //                     ) IS NULL 
            //                     THEN (
            //                         SELECT MAX(OIGN.DocDate) 
            //                         FROM OIGN 
            //                         JOIN IGN1 ON OIGN.DocEntry = IGN1.DocEntry 
            //                         WHERE IGN1.ItemCode = T0.ItemCode
            //                     )
            //                     ELSE (
            //                         SELECT MAX(OPDN.DocDate) 
            //                         FROM OPDN 
            //                         JOIN PDN1 ON OPDN.DocEntry = PDN1.DocEntry 
            //                         WHERE PDN1.ItemCode = T0.ItemCode
            //                     )
            //                     END) as UltimaFechaIngreso"
            //                 )
            //             ])
            //             ->where('T0.ItemCode', '=', $codigoProducto)
            //             ->where('T1.WhsCode', '=', '01_AQPAG')
            //             ->where('T0.validFor', '=', 'Y')
            //             ->groupBy(
            //                 'T0.ItemCode',
            //                 'T0.ItemName',
            //                 'T1.WhsCode',
            //                 'T0.CntUnitMsr',
            //                 'T1.AvgPrice',
            //                 'T0.validFor',
            //                 'T0.InvntItem',
            //                 'T0.frozenFor',
            //                 'T1.ItemCode '
            //             )
            //             ->first();

            //         return [
            //             'material' => $material,
            //             'ultimoPrecioCompras' => $compraInfo->AvgPrice ?? null,
            //             'ultimaFechaCompras' => $compraInfo->UltimaFechaIngreso ?? null,
            //             'stock' => $compraInfo->stock ?? null
            //         ];
            //     } else {
            //         return [
            //             'material' => $material,
            //             'ultimoPrecioCompras' => null,
            //             'ultimaFechaCompras' => null,
            //             'stock' => null
            //         ];
            //     }
            // });

            $headers = ['OT', 'Fec. Det OI', '', 'Tipo', 'Cod Producto', 'Producto', 'Obs Producto', 'Ult. Precio de compra', 'Ult. Fecha de compra', 'Stock', 'Cantidad', 'Und.', 'Reservado', 'Ordenado', 'Atendido'];
            $columnWidths = [15, 19, 18, 5, 10, 50, 40, 10, 15, 10, 10, 7, 10, 10, 10];
            $tipoDato = ['texto', 'texto', 'texto', 'texto', 'texto', 'texto', 'texto', 'numero', 'text', 'numero', 'numero', 'texto', 'numero', 'numero', 'numero'];

            $spreadsheet = new Spreadsheet();
            $sheet = $spreadsheet->getActiveSheet();

            // Establecemos anchos de columnas
            foreach ($columnWidths as $columnIndex => $width) {
                $sheet->getColumnDimensionByColumn($columnIndex + 1)->setWidth($width);
            }

            // Establecemos encabezados con formatos
            foreach ($headers as $columnIndex => $header) {
                $columnLetter = \PhpOffice\PhpSpreadsheet\Cell\Coordinate::stringFromColumnIndex($columnIndex + 1);

                // Dar color al fondo del encabezado
                $sheet->getStyle("{$columnLetter}1")->getFill()->setFillType(\PhpOffice\PhpSpreadsheet\Style\Fill::FILL_SOLID)->getStartColor()->setRGB('c7cdd6');

                // Poner el texto en negrita
                $sheet->getStyle("{$columnLetter}1")->getFont()->setBold(true);

                // Establecer el valor en la celda
                $sheet->setCellValue("{$columnLetter}1", $header);
            }

            // Establecer tipos de datos
            $SIZE_DATA = sizeof($productoConInformacionCompras) + 1;
            foreach ($tipoDato as $columnIndex => $tipoDato) {
                $columnLetter = \PhpOffice\PhpSpreadsheet\Cell\Coordinate::stringFromColumnIndex($columnIndex + 1);
                $sheet->getStyle("{$columnLetter}2:{$columnLetter}{$SIZE_DATA}")->getNumberFormat()->setFormatCode(\PhpOffice\PhpSpreadsheet\Style\NumberFormat::FORMAT_TEXT);
                if ($tipoDato === "numero") {
                    $sheet->getStyle("{$columnLetter}2:{$columnLetter}{$SIZE_DATA}")->getNumberFormat()->setFormatCode('0.00');
                }
            }

            // Agregamos la data
            $row = 2;

            // Variable para controlar el último odt_numero
            $lastOdtNumero = null;
            $activitiesToAdd = [];  // Variable para almacenar las actividades que se deben agregar al final

            foreach ($productoConInformacionCompras as $rowData) {
                // Verificamos si el odt_numero ha cambiado
                $currentOdtNumero = $rowData['material']->ordenInternaParte && $rowData['material']->ordenInternaParte->ordenInterna
                    ? $rowData['material']->ordenInternaParte->ordenInterna->odt_numero
                    : null;

                // Si el odt_numero ha cambiado, agregamos las actividades para el odt_numero anterior
                if ($currentOdtNumero !== $lastOdtNumero) {
                    // Si ya hay actividades para el último odt_numero, agregamos esas actividades
                    if ($lastOdtNumero !== null) {
                        foreach ($activitiesToAdd as $activity) {
                            $sheet->setCellValue("A{$row}", UtilHelper::getValueFormatExcel($activity['odt_numero']));
                            $sheet->setCellValue("B{$row}", UtilHelper::getValueFormatExcel($activity['odp_feccreacion']));
                            $sheet->setCellValue("C{$row}", 'ACTIVIDAD');
                            $sheet->setCellValue("D{$row}", 'R');
                            $sheet->setCellValue("E{$row}", UtilHelper::getValueFormatExcel($activity['opp_codigo']));
                            $sheet->setCellValue("F{$row}", UtilHelper::getValueFormatExcel($activity['odp_descripcion']));
                            $row++;  // Avanzamos la fila para las actividades
                        }
                    }

                    // Limpiamos las actividades para el nuevo odt_numero
                    $activitiesToAdd = [];

                    // Actualizamos lastOdtNumero
                    $lastOdtNumero = $currentOdtNumero;

                    // Realizamos la consulta de actividades relacionadas con este odt_numero
                    $ordenInternaWithActividades = OrdenInterna::with(['partes.procesos.proceso'])
                        ->where('odt_numero', $currentOdtNumero)
                        ->first();

                    // Si se encuentra la orden interna con actividades, las agregamos a la lista
                    if ($ordenInternaWithActividades) {
                        foreach ($ordenInternaWithActividades->partes as $parte) {
                            foreach ($parte->procesos as $proceso) {
                                $activitiesToAdd[] = [
                                    'odt_numero' => $currentOdtNumero,
                                    'odp_feccreacion' => $proceso->odp_feccreacion,
                                    'opp_codigo' => $proceso->proceso->opp_codigo,
                                    'odp_descripcion' => $proceso->odp_descripcion
                                ];
                            }
                        }
                    }
                }

                // Continuamos con el material
                $sheet->setCellValue("A{$row}", UtilHelper::getValueFormatExcel(strval($currentOdtNumero)));  // Esto ya no es necesario porque se hará solo una vez por odt_numero
                $sheet->setCellValue("B{$row}", UtilHelper::getValueFormatExcel($rowData['material']->odm_feccreacion));
                $sheet->setCellValue("C{$row}", 'MATERIAL');
                $sheet->setCellValue("D{$row}", UtilHelper::getValueFormatExcel($rowData['material']->odm_tipo == 1 ? 'R' : 'A'));
                $sheet->setCellValue("E{$row}", UtilHelper::getValueFormatExcel($rowData['material']->producto ? $rowData['material']->producto->pro_codigo : null));
                $sheet->setCellValue("F{$row}", UtilHelper::getValueFormatExcel(UtilHelper::limpiarNombreProducto($rowData['material']->odm_descripcion)));
                $sheet->setCellValue("G{$row}", UtilHelper::getValueFormatExcel($rowData['material']->odm_observacion));
                $sheet->setCellValue("H{$row}", UtilHelper::getValueFormatExcel($rowData['ultimoPrecioCompras']));
                $sheet->setCellValue("I{$row}", UtilHelper::getValueFormatExcel($rowData['ultimaFechaCompras']));
                $sheet->setCellValue("J{$row}", UtilHelper::getValueFormatExcel($rowData['stock']));
                $sheet->setCellValue("K{$row}", UtilHelper::getValueFormatExcel($rowData['material']->odm_cantidad));
                $sheet->setCellValue("L{$row}", UtilHelper::getValueFormatExcel($rowData['material']->producto && $rowData['material']->producto->unidad ? $rowData['material']->producto->unidad->uni_codigo : null));
                $sheet->setCellValue("M{$row}", 0.00);
                $sheet->setCellValue("N{$row}", 0.00);
                $sheet->setCellValue("O{$row}", 0.00);

                // Avanzamos la fila
                $row++;
            }

            // Después de finalizar todos los materiales, agregamos las actividades para el último odt_numero
            if (!empty($activitiesToAdd)) {
                foreach ($activitiesToAdd as $activity) {
                    $sheet->setCellValue("A{$row}", UtilHelper::getValueFormatExcel(strval($activity['odt_numero'])));
                    $sheet->setCellValue("B{$row}", UtilHelper::getValueFormatExcel($activity['odp_feccreacion']));
                    $sheet->setCellValue("C{$row}", 'ACTIVIDAD');
                    $sheet->setCellValue("D{$row}", 'R');
                    $sheet->setCellValue("E{$row}", UtilHelper::getValueFormatExcel($activity['opp_codigo']));
                    $sheet->setCellValue("F{$row}", UtilHelper::getValueFormatExcel($activity['odp_descripcion']));
                    $row++;  // Avanzamos la fila para las actividades
                }
            }


            return response()->streamDownload(function () use ($spreadsheet) {
                $writer = new Xlsx($spreadsheet);
                $writer->save('php://output');
            }, 'reporte.xlsx', ['Content-Type' => 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet']);
        } catch (Exception $e) {
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    // Exportación de excel
    public function exportExcel(Request $request)
    {
        try {
            $ordenTrabajo = $request->input('odt_numero', null);
            $almID = 1;
            $fecha_desde = $request->input('fecha_desde', null);
            $fecha_hasta = $request->input('fecha_hasta', null);

            $query = OrdenInternaMateriales::with(
                [
                    'producto.unidad',
                    'producto.stock' => function ($q) use ($almID) {
                        if ($almID !== null) {
                            $q->where('alm_id', $almID)
                                ->select('pro_id', 'alm_id', 'alp_stock');
                        } else {
                            $q->selectRaw('null as alp_stock');
                        }
                    },
                    'ordenInternaParte.ordenInterna'
                ]
            )->where('odm_tipo', "!=", 3)
                ->where("odm_tipo", "!=", 4)
                ->where("odm_tipo", "!=", 5);

            // filtro de orden de trabajo
            if ($ordenTrabajo !== null) {
                $query->whereHas('ordenInternaParte.ordenInterna', function ($q) use ($ordenTrabajo) {
                    $q->where('odt_numero', $ordenTrabajo);
                });
            }

            // filtro de fecha
            if ($fecha_desde !== null && $fecha_hasta !== null) {
                $query->whereBetween('odm_feccreacion', [$fecha_desde, $fecha_hasta]);
            }

            // ordenar de formar descendiente
            $query->orderBy('odm_feccreacion', 'desc');

            $data = $query->get();
            $headers = ['OT', 'Fec. Det OI', 'Tipo', 'Cod Producto', 'Producto', 'Obs Producto', 'Cantidad', 'Und.', 'Stock Alm', 'Reservado', 'Ordenado', 'Atendido'];
            $columnWidths = [15, 19, 5, 10, 50, 40, 10, 7, 10, 10, 10, 10];
            $tipoDato = ['texto', 'texto', 'texto', 'texto', 'texto', 'texto', 'numero', 'texto', 'numero', 'numero', 'numero', 'numero'];

            $spreadsheet = new Spreadsheet();
            $sheet = $spreadsheet->getActiveSheet();

            // Establecemos anchos de columnas
            foreach ($columnWidths as $columnIndex => $width) {
                $sheet->getColumnDimensionByColumn($columnIndex + 1)->setWidth($width);
            }

            // Establecemos encabezados con formatos
            foreach ($headers as $columnIndex => $header) {
                $columnLetter = \PhpOffice\PhpSpreadsheet\Cell\Coordinate::stringFromColumnIndex($columnIndex + 1);

                // Dar color al fondo del encabezado
                $sheet->getStyle("{$columnLetter}1")->getFill()->setFillType(\PhpOffice\PhpSpreadsheet\Style\Fill::FILL_SOLID)->getStartColor()->setRGB('c7cdd6');

                // Poner el texto en negrita
                $sheet->getStyle("{$columnLetter}1")->getFont()->setBold(true);

                // Establecer el valor en la celda
                $sheet->setCellValue("{$columnLetter}1", $header);
            }

            // Establecer tipos de datos
            $SIZE_DATA = sizeof($data) + 1;
            foreach ($tipoDato as $columnIndex => $tipoDato) {
                $columnLetter = \PhpOffice\PhpSpreadsheet\Cell\Coordinate::stringFromColumnIndex($columnIndex + 1);
                $sheet->getStyle("{$columnLetter}2:{$columnLetter}{$SIZE_DATA}")->getNumberFormat()->setFormatCode(\PhpOffice\PhpSpreadsheet\Style\NumberFormat::FORMAT_TEXT);
                if ($tipoDato === "numero") {
                    $sheet->getStyle("{$columnLetter}2:{$columnLetter}{$SIZE_DATA}")->getNumberFormat()->setFormatCode('0.00');
                }
            }

            // Agregamos la data
            $row = 2;

            foreach ($data as $rowData) {
                $sheet->setCellValue("A{$row}", UtilHelper::getValueFormatExcel($rowData->ordenInternaParte && $rowData->ordenInternaParte->ordenInterna ? $rowData->ordenInternaParte->ordenInterna->odt_numero : null));
                $sheet->setCellValue("B{$row}", UtilHelper::getValueFormatExcel($rowData->odm_feccreacion));
                $sheet->setCellValue("C{$row}", UtilHelper::getValueFormatExcel($rowData->odm_tipo == 1 ? 'R' : 'A'));
                $sheet->setCellValue("D{$row}", UtilHelper::getValueFormatExcel($rowData->producto ? $rowData->producto->pro_codigo : null));
                $sheet->setCellValue("E{$row}", UtilHelper::getValueFormatExcel($rowData->odm_descripcion));
                $sheet->setCellValue("F{$row}", UtilHelper::getValueFormatExcel($rowData->odm_observacion));
                $sheet->setCellValue("G{$row}", UtilHelper::getValueFormatExcel($rowData->odm_cantidad));
                $sheet->setCellValue("H{$row}", UtilHelper::getValueFormatExcel($rowData->producto && $rowData->producto->unidad ? $rowData->producto->unidad->uni_codigo : null));
                $sheet->setCellValue("I{$row}", UtilHelper::getValueFormatExcel($rowData->producto && $rowData->producto->stock ? $rowData->producto->stock->alp_stock : null, 0.00));
                $sheet->setCellValue("J{$row}", 0.00);
                $sheet->setCellValue("K{$row}", 0.00);
                $sheet->setCellValue("L{$row}", 0.00);
                $row++;
            }

            return response()->streamDownload(function () use ($spreadsheet) {
                $writer = new Xlsx($spreadsheet);
                $writer->save('php://output');
            }, 'reporte.xlsx', ['Content-Type' => 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet']);

            // return $response;
        } catch (Exception $e) {
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    // EXPORTAR EN PDF COTIZACION
    public function exportPDFCotizacion(Request $request)
    {
        $user = auth()->user();
        try {
            $proveedor = $request->input('proveedor', null);
            $detalleMateriales = $request->input('detalle_materiales', []);

            // buscamos informacion de trabajador
            $trabajador = Trabajador::where('usu_codigo', $user->usu_codigo)->first();

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

            $pdfOptions = [
                'paper' => 'a4',
                'orientation' => 'landscape',
            ];

            $data = [
                'proveedor' => $proveedor,
                'trabajador' => $trabajador,
                'detalleMateriales' => $agrupadosIndexado,
                'fechaActual' => DateHelper::parserFechaActual(),
                'usuarioImpresion' => $user->usu_codigo,
                'fechaHoraImpresion' => date('Y-m-d H:i:s'),
                'url_cotizacion' => null
            ];

            $pdf = Pdf::loadView('cotizacion.cotizacion', $data)
                ->setPaper($pdfOptions['paper'], $pdfOptions['orientation']);

            return $pdf->download('cotizacion.pdf');
        } catch (Exception $e) {
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    // EXPORTAR EN TXT COTIZACION
    public function exportTXTCotizacion(Request $request)
    {
        $proveedor = $request->input('proveedor', null);
        $detalleMateriales = $request->input('detalle_materiales', []);

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

        $ruc = "20134690080";
        $razon_social = "FAMAI SEAL JET S.A.C.";
        $fecha = date('d') . ' de ' . date('F') . ' ' . date('Y');

        $txt_content = "Estimado proveedor\n";
        $txt_content .= "Por la presente sírvase cotizar lo siguiente a nombre de:\n";
        $txt_content .= "RUC: $ruc\n";
        $txt_content .= "Razón Social: $razon_social\n";
        $txt_content .= "=========\n";
        $txt_content .= "   PRODUCTO   CANTIDAD\n";

        // Agregar los productos
        foreach ($agrupadosIndexado as $index => $item) {
            $txt_content .= ($index + 1) . ". " . $item["cod_descripcion"] . "     " . $item["cod_cantidad"] . "\n";
        }

        $txt_content .= "======\n";
        $txt_content .= "Contacto: " . ($proveedor['prv_contacto'] ?? '') . "\n";
        $txt_content .= "Nombre: " . ($proveedor['prv_nombre'] ?? '') . "\n";
        $txt_content .= "Correo: " . ($proveedor['prv_correo'] ?? '') . "\n";
        $txt_content .= "Celular/Whatsapp: " . ($proveedor['prv_telefono'] ?? '') . "/" . ($proveedor['prv_whatsapp'] ?? '') . "\n\n";
        $txt_content .= "Arequipa, $fecha\n";


        return response()->streamDownload(function () use ($txt_content) {
            echo $txt_content;
        }, 'cotizacion_proveedor.txt', ['Content-Type' => 'text/plain']);
    }

    // detalle material - cotizacion
    public function findCotizacionByMaterial(Request $request)
    {
        $detalleMaterialesFilter = $request->input('param', '');

        if ($detalleMaterialesFilter) {
            $detalleMaterialesFilter = explode(',', $detalleMaterialesFilter);
        }

        $detalleCotizacion = CotizacionDetalle::with(['cotizacion.proveedor', 'cotizacion.moneda'])
            ->whereIn('odm_id', $detalleMaterialesFilter)
            ->get();
        return response()->json($detalleCotizacion);
    }

    // detalle material - orden compra
    public function findOrdenCompraByMaterial(Request $request)
    {
        $detalleMaterialesFilter = $request->input('param', '');

        if ($detalleMaterialesFilter) {
            $detalleMaterialesFilter = explode(',', $detalleMaterialesFilter);
        }

        $detalleOrdenCompra = OrdenCompraDetalle::with(['ordenCompra.proveedor', 'ordenCompra.moneda'])
            ->whereIn('odm_id', $detalleMaterialesFilter)
            ->get();
        return response()->json($detalleOrdenCompra);
    }

    // funcion para asignar nuevo codigo de producto
    public function asignarCodigoProducto(Request $request)
    {
        $user = auth()->user();

        $validatedData = validator($request->all(), [
            "odm_id" => "required|exists:tblordenesinternasdetmateriales_odm,odm_id",
            "pro_codigo" => "required|string"
        ])->validate();

        try {
            DB::beginTransaction();

            $pro_id = null;
            $pro_descripcion = null;
            // buscamos el material en la base de datos
            $findMaterial = Producto::where('pro_codigo', $request['pro_codigo'])->first();
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
                    ->where('T0.ItemCode', $request['pro_codigo'])
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
                    $pro_descripcion = $productoCreado->pro_descripcion;
                } else {
                    throw new Exception('Material no encontrado en la base de datos secundaria');
                }
            } else {
                // en el caso que se encuentre el producto en base de datos dbfamai
                $pro_id = $findMaterial->pro_id;
                $pro_descripcion = $findMaterial->pro_descripcion;
            }

            // buscamos el material en la base de datos
            $ordenInternaMaterial = OrdenInternaMateriales::with('producto')
                ->where('odm_id', $request['odm_id'])->first();

            if (!$ordenInternaMaterial) {
                throw new Exception('Material no encontrado');
            }

            $codigoIncrustado = $ordenInternaMaterial->pro_id !== null ? $ordenInternaMaterial->producto->pro_codigo . ' - ' : '';
            $descripcionMaterial = $ordenInternaMaterial->odm_descripcion ? $ordenInternaMaterial->odm_descripcion : '';
            $observacionMaterial = $ordenInternaMaterial->odm_observacion ? " - $ordenInternaMaterial->odm_observacion" : '';
            // actualizamos el material
            $ordenInternaMaterial->update([
                'pro_id' => $pro_id,
                'odm_estado' => 'REQ',
                'odm_descripcion' => $pro_descripcion,
                'odm_observacion' => $codigoIncrustado . $descripcionMaterial . $observacionMaterial,
                'odm_usumodificacion' => $user->usu_codigo
            ]);

            DB::commit();
            return response()->json("Material actualizado exitosamente", 200);
        } catch (Exception $e) {
            DB::rollBack();
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    // Información materiales a cotizar
    public function informacionMaterialesCotizar(Request $request)
    {
        $materiales = $request->input('materiales', []);

        $detalleMaterialesCotizar = [];

        foreach ($materiales as $material) {
            $detalle = OrdenInternaMateriales::with(['producto.unidad', 'ordenInternaParte.ordenInterna'])
                ->find($material);
            $detalleMaterialesCotizar[] = $detalle;
        }

        return response()->json($detalleMaterialesCotizar);
    }

    // index para Orden de Compra
    public function indexOrdenCompraResumido(Request $request)
    {
        $user = auth()->user();
        $sed_codigo = "10";

        $trabajador = Trabajador::where('usu_codigo', $user->usu_codigo)->first();

        if ($trabajador) {
            $sed_codigo = $trabajador->sed_codigo;
        }

        $proveedorCotizacion = $request->input('proveedor-cotizacion', null);
        $proveedorOrdenCompra = $request->input('proveedor-orden-compra', null);
        $producto = $request->input('producto', null);

        $query = OrdenInternaMateriales::with('producto')
            ->whereHas('ordenInternaParte.ordenInterna', function ($q) use ($sed_codigo) {
                $q->where('sed_codigo', $sed_codigo);
            })
            ->where('odm_estado', '!=', 'ODC');
        // agregar filtro de reservado ->where();

        // filtro de producto
        if ($producto !== null) {
            $query->whereHas('producto', function ($q) use ($producto) {
                $q->where('pro_descripcion', 'like', "%$producto%");
            });
        }

        $data = $query->get();

        $agrupados = $data
            ->whereNotNull('pro_id')
            ->groupBy('pro_id')
            ->map(function ($grupo, $pro_id) use ($proveedorCotizacion, $proveedorOrdenCompra) {
                $producto = $grupo->first()->producto;

                // consulta la cotizacion con el menor precio
                $cotizacion = $producto->cotizaciones()
                    ->with('cotizacion.proveedor', 'cotizacion.moneda')
                    ->whereHas('cotizacion.proveedor', function ($q) use ($proveedorCotizacion) {
                        if ($proveedorCotizacion) {
                            $q->where('prv_nombre', 'like', "%$proveedorCotizacion%");
                            $q->orWhere('prv_nrodocumento', $proveedorCotizacion);
                        }
                    })
                    ->whereNotNull('cod_preciounitario')
                    ->orderBy('cod_preciounitario', 'asc')
                    ->first();

                // consulta la orden de compra
                $ultimaOrdenCompra = $producto->ordenesCompra()
                    ->with('ordenCompra.proveedor', 'ordenCompra.moneda')
                    ->whereHas('ordenCompra.proveedor', function ($q) use ($proveedorOrdenCompra) {
                        if ($proveedorOrdenCompra) {
                            $q->where('prv_nombre', 'like', "%$proveedorOrdenCompra%");
                            $q->orWhere('prv_nrodocumento', $proveedorOrdenCompra);
                        }
                    })
                    ->orderBy('ocd_feccreacion', 'desc')
                    ->first();

                return [
                    'pro_id' => $pro_id,
                    'pro_codigo' => $producto->pro_codigo,
                    'pro_descripcion' => $producto->pro_descripcion,
                    'uni_codigo' => $producto->uni_codigo,
                    'cantidad' => $grupo->sum('odm_cantidad'),
                    'cotizacion' => $cotizacion,
                    'orden_compra' => $ultimaOrdenCompra,
                    'detalle' => $grupo->values(),
                ];
            })
            ->values();

        $sinAgrupar = $data
            ->whereNull('pro_id')
            ->values();

        $resultado = $agrupados->concat($sinAgrupar);
        return response()->json($resultado);
    }
}
