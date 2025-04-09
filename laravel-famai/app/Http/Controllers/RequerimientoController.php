<?php

namespace App\Http\Controllers;

use App\Helpers\DateHelper;
use App\OrdenInterna;
use App\OrdenInternaMateriales;
use App\OrdenInternaMaterialesAdjuntos;
use App\OrdenInternaPartes;
use App\Parte;
use App\Producto;
use App\ProductoResponsable;
use App\Reporte;
use App\Trabajador;
use App\Unidad;
use Exception;
use Barryvdh\DomPDF\Facade\Pdf;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;

class RequerimientoController extends Controller
{

    // funcion para traer toda la informaicion de requerimientos
    public function index(Request $request)
    {
        $pageSize = $request->input('page_size', 10);
        $page = $request->input('page', 1);
        $odtNumero = $request->input('odt_numero', null);

        $fecha_desde = $request->input('fecha_desde', null);
        $fecha_hasta = $request->input('fecha_hasta', null);

        $query = OrdenInterna::with(['area', 'trabajadorOrigen', 'motivoRequerimiento'])
            ->where('oic_tipo', 'REQ');

        if ($odtNumero !== null) {
            $query->where('odt_numero', $odtNumero);
        }

        if ($fecha_desde !== null && $fecha_hasta !== null) {
            $query->whereBetween('oic_fecha', [$fecha_desde, $fecha_hasta]);
        }
        $query->orderBy('oic_fecha', 'desc');

        $requerimientos = $query->paginate($pageSize, ['*'], 'page', $page);

        // Agregar el total de materiales
        $requerimientos->getCollection()->transform(function ($ordenInterna) {
            $ordenInterna->total_materiales = $ordenInterna->totalMateriales();
            return $ordenInterna;
        });

        return response()->json([
            'message' => 'Se listan los requerimientos',
            'data' => $requerimientos->items(),
            'count' => $requerimientos->total()
        ]);
    }

    public function showDetalleRequerimientos(Request $request)
    {
        $odm_tipo = $request->input('odm_estado', null);

        $query = OrdenInternaMateriales::with([
            'ordenInternaParte.ordenInterna.area',
            'ordenInternaParte.ordenInterna.trabajadorOrigen',
            'producto.unidad'
        ])
            ->whereHas('ordenInternaParte.ordenInterna', function ($q) {
                $q->whereNull('odt_numero');
            });

        // filtro de estado de detalle de material de orden interna
        if ($odm_tipo !== null) {
            $query->where('odm_estado', $odm_tipo);
        }

        $query->orderBy('odm_feccreacion', 'desc');

        $requerimientos = $query->get();

        return response()->json($requerimientos);
    }

    // Funcion multipart para guardar requeriminetos
    public function store(Request $request)
    {
        $user = auth()->user();
        $sed_codigo = "10";
        // Valida la solicitud JSON y el FormData
        $validator = Validator::make($request->all(), [
            'data' => 'required|json'
        ]);

        if ($validator->fails()) {
            return response()->json(['error' => $validator->errors()], 422);
        }

        // Decodifica los datos JSON
        $data = json_decode($request->input('data'), true);

        $validator = Validator::make($data, [
            'oic_fecha' => 'required|date',
            'oic_fechaentregaestimada' => 'required|date',
            'are_codigo' => 'required|exists:tblareas_are,are_codigo',
            'tra_idorigen' => 'required|exists:tbltrabajadores_tra,tra_id',
            'oic_equipo_descripcion' => 'nullable|string',
            'mrq_codigo' => 'required|exists:tblmotivorequerimiento_mrq,mrq_codigo'
        ]);

        if ($validator->fails()) {
            return response()->json(['error' => $validator->errors()], 422);
        }

        try {
            DB::beginTransaction();
            $trabajador = Trabajador::where('usu_codigo', $user->usu_codigo)->first();
            if ($trabajador) {
                $sed_codigo = $trabajador->sed_codigo;
            }

            // debemos buscar el numero de movimiento segun la sede
            $lastRequerimientoCabecera = OrdenInterna::where('sed_codigo', $sed_codigo)
                ->where('oic_tipo', 'REQ')
                ->orderBy('oic_id', 'desc')
                ->first();
            if (!$lastRequerimientoCabecera) {
                $numero = 1;
            } else {
                $numero = intval(substr($lastRequerimientoCabecera->odt_numero, 2)) + 1;
            }

            // primero creamos una orden interna
            $requerimiento = OrdenInterna::create([
                'odt_numero' => 'RQ' . str_pad($numero, 7, '0', STR_PAD_LEFT),
                'oic_fecha' => $data['oic_fecha'],
                'sed_codigo' => $sed_codigo,
                'oic_fechaentregaestimada' => $data['oic_fechaentregaestimada'],
                'are_codigo' => $data['are_codigo'],
                'tra_idorigen' => $data['tra_idorigen'],
                'mrq_codigo' => $data['mrq_codigo'],
                'oic_equipo_descripcion' => $data['oic_equipo_descripcion'],
                'oic_tipo' => 'REQ',
                'oic_estado' => 'ENVIADO',
                'oic_usucreacion' => $user->usu_codigo,
                'oic_fecmodificacion' => null
            ]);

            // luego creamos un detalle de parte
            $parteRequerimiento = Parte::where('oip_descripcion', 'REQUERIMIENTO')->first();

            if (!$parteRequerimiento) {
                return response()->json(['error' => 'No se encontro la parte requerimiento'], 400);
            }

            $detalleParte = OrdenInternaPartes::create([
                'oic_id' => $requerimiento->oic_id,
                'oip_id' => $parteRequerimiento->oip_id,
                'opd_usucreacion' => $user->usu_codigo,
                'opd_fecmodificacion' => null
            ]);

            foreach ($data['detalle_requerimiento'] as $index => $material) {
                $pro_id = null;
                $tra_id = null;
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
                        // buscamos si tiene un responsable asociado
                        $responsable_producto = ProductoResponsable::where('pro_id', $pro_id)
                        ->where('sed_codigo', $sed_codigo)
                        ->first();
                        // extraemos el responsable correspondiente
                        if($responsable_producto){
                            $tra_id = $responsable_producto->tra_id;
                        }
                    }
                }

                // creamos el detalle de material
                $ordenInternaDetalleMaterial = OrdenInternaMateriales::create([
                    'opd_id' => $detalleParte->opd_id,
                    'pro_id' => $pro_id,
                    'odm_item' => $material['odm_item'],
                    'odm_descripcion' => $material['odm_descripcion'],
                    'odm_cantidad' => $material['odm_cantidad'],
                    'odm_cantidadpendiente' => $material['odm_cantidad'],
                    'odm_observacion' => $material['odm_observacion'],
                    'odm_tipo' => $material['odm_tipo'],
                    'odm_usucreacion' => $user->usu_codigo,
                    'odm_fecmodificacion' => null,
                    'tra_responsable' => $tra_id,
                    'odm_fecasignacionresponsable' => $tra_id ? Carbon::now() : null,
                    // Condiciones especiales si es requerimientos de stock
                    'odm_estado' => $data['mrq_codigo'] === 'STK' ? 'REQ' : null,
                    'odm_fecconsultareservacion' => $data['mrq_codigo'] === 'STK' ? Carbon::now() : null
                ]);

                // detalle de descripciones
                $detalle_adjuntos = $material['detalle_adjuntos'];

                // proceso de guardar los files
                if ($request->hasFile("files.$index")) {
                    foreach ($request->file("files.$index") as $indexFile => $file) {
                        $extension = $file->getClientOriginalExtension();
                        $fileName = uniqid() . '.' . $extension;
                        $path = $file->storeAs('detalle-materiales-adjuntos', $fileName, 'public');

                        OrdenInternaMaterialesAdjuntos::create([
                            'odm_id' => $ordenInternaDetalleMaterial->odm_id,
                            'oma_url' => $path,
                            'oma_descripcion' => $detalle_adjuntos[$indexFile],
                            'oma_usucreacion' => $user->usu_codigo,
                            'oma_fecmodificacion' => null
                        ]);
                    }
                }
            }
            DB::commit();
            return response()->json(['message' => 'Requerimiento creado correctamente'], 200);
        } catch (Exception $e) {
            DB::rollBack();
            return response()->json(["error" => $e->getMessage()], 500);
        }
    }

    // Funcion para generar el pdf
    public function generarPDF($oic_id, $user = null)
    {
        $requerimiento = OrdenInterna::with(['area', 'trabajadorOrigen', 'motivoRequerimiento'])->findOrFail($oic_id);
        $reporte = new Reporte();

        $datosPartes = $reporte->metobtenerPartes($oic_id);
        foreach ($datosPartes as &$parte) {
            $materiales = $reporte->metobtenerMateriales($oic_id, $parte['oip_id']);
            $parte['detalle_materiales'] = $materiales;
        }

        $pdfOptions = [
            'paper' => 'a4',
            'orientation' => 'landscape',
        ];

        $data = [
            'requerimiento' => $requerimiento,
            'detalleMateriales' => $datosPartes[0]['detalle_materiales'],
            'fechaActual' => DateHelper::parserFechaActual(),
            'usuarioImpresion' => $user ? $user->usu_codigo : null,
            'fechaHoraImpresion' => date('Y-m-d H:i:s'),
        ];

        return Pdf::loadView('requerimiento.requerimiento', $data)
            ->setPaper($pdfOptions['paper'], $pdfOptions['orientation']);
    }
    // Funcion para exportar en pdf
    public function exportarPDF(Request $request) {
        $user = auth()->user();
        try {
            $pdf = $this->generarPDF($request->input('oic_id'), $user);
            return $pdf->download('requerimiento.pdf');
        } catch (Exception $e) {
            return response()->json([
                "error" => $e->getMessage(),
                "linea" => $e->getLine()
            ], 500);
        }
    }
}
