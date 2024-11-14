<?php

namespace App\Http\Controllers;

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
use App\Trabajador;
use App\Unidad;
use Illuminate\Support\Facades\Storage;

class OrdenInternaMaterialesController extends Controller
{

    public function index(Request $request)
    {
        // $pageSize = $request->input('page_size', 10);
        // $page = $request->input('page', 1);
        $ordenTrabajo = $request->input('odt_numero', null);
        $tipoProceso = $request->input('oic_tipo', null);
        $almID = $request->input('alm_id', '01_AQPAG');
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
        )->where('odm_tipo', "!=", 3)
            ->where("odm_tipo", "!=", 4)
            ->where("odm_tipo", "!=", 5);

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

        // filtro de fecha
        if ($fecha_desde !== null && $fecha_hasta !== null) {
            $query->whereBetween('odm_feccreacion', [$fecha_desde, $fecha_hasta]);
        }

        // Procesar el parámetro multiselect
        if ($multifilter !== null) {
            // Separar el string por "OR" y crear un array con cada palabra
            $palabras = explode('OR', $request->input('multifilter'));

            // Agregar el grupo de condiciones OR
            $query->where(function ($q) use ($palabras, $almID) {
                foreach ($palabras as $palabra) {
                    // pendiente de emision de orden de compra
                    if ($palabra === 'pendiente_emitir_orden_compra') {
                        $q->orWhere('odm_estado', 'COT');
                    }
                    // pendiente de emision de cotizacion
                    if ($palabra === 'pendiente_emitir_cotizacion') {
                        $q->orWhere('odm_estado', 'CRD');
                    }
                    // material sin codigo
                    if ($palabra === 'material_sin_codigo') {
                        $q->orWhere('pro_id', null);
                    }
                    // material sin compra
                    if ($palabra === 'material_sin_compra') {
                        $q->orWhere(function ($subQuery) use ($almID) {
                            $subQuery->whereNotNull('pro_id')
                                ->whereDoesntExist(function ($query) use ($almID) {
                                    // Selecciona las tablas con prefijo para la conexión secundaria
                                    $oitmTable = DB::connection('sqlsrv_secondary')->getTablePrefix() . 'OITM as T0';
                                    $oitwTable = DB::connection('sqlsrv_secondary')->getTablePrefix() . 'OITW as T1';
                                    $oilmTable = DB::connection('sqlsrv_secondary')->getTablePrefix() . 'OILM as T2';

                                    $query->select(DB::raw(1))
                                        ->from($oitmTable)
                                        ->join($oitwTable, 'T0.ItemCode', '=', 'T1.ItemCode')
                                        ->join($oilmTable, 'T0.ItemCode', '=', 'T2.ItemCode')
                                        ->whereColumn('T0.ItemCode', 'producto.pro_codigo')
                                        ->where('T1.WhsCode', '=', $almID)
                                        ->where('T2.LocCode', '=', $almID)
                                        ->where('T0.validFor', '=', 'Y')
                                        ->whereNull(DB::raw(
                                            "(CASE 
                                                WHEN (
                                                    SELECT MAX(OPDN.DocDate) 
                                                    FROM OPDN 
                                                    JOIN PDN1 ON OPDN.DocEntry = PDN1.DocEntry 
                                                    WHERE PDN1.ItemCode = T0.ItemCode
                                                ) IS NULL 
                                                THEN (
                                                    SELECT MAX(OIGN.DocDate) 
                                                    FROM OIGN 
                                                    JOIN IGN1 ON OIGN.DocEntry = IGN1.DocEntry 
                                                    WHERE IGN1.ItemCode = T0.ItemCode
                                                )
                                                ELSE (
                                                    SELECT MAX(OPDN.DocDate) 
                                                    FROM OPDN 
                                                    JOIN PDN1 ON OPDN.DocEntry = PDN1.DocEntry 
                                                    WHERE PDN1.ItemCode = T0.ItemCode
                                                )
                                            END)"
                                        ));
                                });
                        });
                    }
                }
            });
        }

        // ordenar de formar descendiente
        $query->orderBy('odm_feccreacion', 'desc');

        return response($query->get());
    }

    public function indexValidacionCodigo(Request $request)
    {
        $pageSize = $request->input('page_size', 10);
        $page = $request->input('page', 1);
        $ordenTrabajo = $request->input('odt_numero', null);
        $fecha_desde = $request->input('fecha_desde', null);
        $fecha_hasta = $request->input('fecha_hasta', null);

        $flagIsNull = $request->input('flag_is_null', 'true');

        $query = OrdenInternaMateriales::with(
            [
                'responsable',
                'producto.unidad',
                'ordenInternaParte.ordenInterna'
            ]
        )->whereHas('ordenInternaParte.ordenInterna', function ($query) {
            $query->where('oic_estado', 'ENVIADO')
                ->orWhere('oic_estado', 'EVALUADO');
        });

        // flag NULL
        if ($flagIsNull === 'true') {
            $query->whereNull('pro_id');
        }

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

        // ordenar de formar descendiente
        $query->orderBy('odm_feccreacion', 'desc');

        $detalleMateriales = $query->paginate($pageSize, ['*'], 'page', $page);
        return response()->json([
            'message' => 'Se listan los materiales de la orden interna para validacion de codigo',
            'data' => $detalleMateriales->items(),
            'count' => $detalleMateriales->total()
        ]);
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

    public function findByOrdenInterna(Request $request, $id)
    {
        $ordenInterna = OrdenInterna::find($id);
        // obtenemos el dato de almacen enviado
        $almID = $request->input('alm_id', 1);
        $materiales = OrdenInternaMateriales::with(['producto.unidad', 'producto.stock' => function ($q) use ($almID) {
            if ($almID !== null) {
                $q->where('alm_id', $almID)
                    ->select('pro_id', 'alm_id', 'alp_stock');
            } else {
                $q->selectRaw('null as alp_stock');
            }
        }])
            ->whereHas('ordenInternaParte', function ($query) use ($id) {
                $query->where('oic_id', $id);
            })
            ->get();

        return response()->json(["ordenInterna" => $ordenInterna, "materiales" => $materiales]);
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
                'odm_usumodificacion' => $user->usu_codigo,
            ]);

            DB::commit();
            return response()->json($ordenInternaMaterial, 200);
        } catch (Exception $e) {
            DB::rollBack();
            return response()->json(["error" => $e->getMessage()], 500);
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
            $fecha_desde = $request->input('fecha_desde', null);
            $fecha_hasta = $request->input('fecha_hasta', null);

            $query = OrdenInternaMateriales::with(
                [
                    'producto.unidad',
                    'ordenInternaParte.ordenInterna',
                    'usuarioCreador'
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
                    'ordenInternaParte.ordenInterna',
                    'ordenInternaParte.parte',
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

            $query->orderBy('odm_feccreacion', 'desc');

            // Obtener los resultados de la primera base de datos
            $ordenesMateriales = $query->get();

            // $productoConInformacionCompras = $ordenesMateriales->map(function ($material) {
            //     return [
            //         'material' => $material,
            //         'ultimoPrecioCompras' => null,
            //         'ultimaFechaCompras' => null,
            //         'stock' => null
            //     ];
            // });

            $productoConInformacionCompras = $ordenesMateriales->map(function ($material) {
                $codigoProducto = $material->producto ? $material->producto->pro_codigo : null;
                // si es un producto diferente de null
                if ($codigoProducto !== null) {
                    $compraInfo = DB::connection('sqlsrv_secondary')
                        ->table('OITM as T0')
                        ->join('OITW as T1', 'T0.ItemCode', '=', 'T1.ItemCode')
                        ->select([
                            'T1.AvgPrice',
                            DB::raw('MAX(T1.OnOrder) as stock'),
                            DB::raw(
                                "(CASE 
                                WHEN (
                                    SELECT MAX(OPDN.DocDate) 
                                    FROM OPDN 
                                    JOIN PDN1 ON OPDN.DocEntry = PDN1.DocEntry 
                                    WHERE PDN1.ItemCode = T0.ItemCode
                                ) IS NULL 
                                THEN (
                                    SELECT MAX(OIGN.DocDate) 
                                    FROM OIGN 
                                    JOIN IGN1 ON OIGN.DocEntry = IGN1.DocEntry 
                                    WHERE IGN1.ItemCode = T0.ItemCode
                                )
                                ELSE (
                                    SELECT MAX(OPDN.DocDate) 
                                    FROM OPDN 
                                    JOIN PDN1 ON OPDN.DocEntry = PDN1.DocEntry 
                                    WHERE PDN1.ItemCode = T0.ItemCode
                                )
                                END) as UltimaFechaIngreso"
                            )
                        ])
                        ->where('T0.ItemCode', '=', $codigoProducto)
                        ->where('T1.WhsCode', '=', '01_AQPAG')
                        ->where('T0.validFor', '=', 'Y')
                        ->groupBy(
                            'T0.ItemCode',
                            'T0.ItemName',
                            'T1.WhsCode',
                            'T0.CntUnitMsr',
                            'T1.AvgPrice',
                            'T0.validFor',
                            'T0.InvntItem',
                            'T0.frozenFor',
                            'T1.ItemCode '
                        )
                        ->first();

                    return [
                        'material' => $material,
                        'ultimoPrecioCompras' => $compraInfo->AvgPrice ?? null,
                        'ultimaFechaCompras' => $compraInfo->UltimaFechaIngreso ?? null,
                        'stock' => $compraInfo->stock ?? null
                    ];
                } else {
                    return [
                        'material' => $material,
                        'ultimoPrecioCompras' => null,
                        'ultimaFechaCompras' => null,
                        'stock' => null
                    ];
                }
            });

            $headers = ['OT', 'Fec. Det OI', 'Tipo', 'Actividad', 'Cod Producto', 'Producto', 'Obs Producto', 'Ult. Precio de compra', 'Ult. Fecha de compra', 'Stock', 'Cantidad', 'Und.', 'Reservado', 'Ordenado', 'Atendido'];
            $columnWidths = [15, 19, 5, 18, 10, 50, 40, 10, 15, 10, 10, 7, 10, 10, 10];
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

            foreach ($productoConInformacionCompras as $rowData) {
                $sheet->setCellValue("A{$row}", UtilHelper::getValueFormatExcel($rowData['material']->ordenInternaParte && $rowData['material']->ordenInternaParte->ordenInterna ? $rowData['material']->ordenInternaParte->ordenInterna->odt_numero : null));
                $sheet->setCellValue("B{$row}", UtilHelper::getValueFormatExcel($rowData['material']->odm_feccreacion));
                $sheet->setCellValue("C{$row}", UtilHelper::getValueFormatExcel($rowData['material']->odm_tipo == 1 ? 'R' : 'A'));
                $sheet->setCellValue("D{$row}", UtilHelper::getValueFormatExcel($rowData['material']->ordenInternaParte->parte->oip_descripcion));
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
        $proveedor = $request->input('proveedor', null);
        $detalleMateriales = $request->input('detalle_materiales', []);

        // buscamos informacion de trabajador
        $trabajador = Trabajador::where('usu_codigo', $user->usu_codigo)->first();

        $data = [
            'proveedor' => $proveedor,
            'trabajador' => $trabajador,
            'detalleMateriales' => $detalleMateriales,
            'fechaActual' => DateHelper::parserFechaActual(),
            'url_cotizacion' => null
        ];

        $pdf = Pdf::loadView('cotizacion.cotizacion', $data);
        return $pdf->download('cotizacion.pdf');
    }

    // EXPORTAR EN TXT COTIZACION
    public function exportTXTCotizacion(Request $request)
    {
        $proveedor = $request->input('proveedor', null);
        $detalleMateriales = $request->input('detalle_materiales', []);

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
        foreach ($detalleMateriales as $index => $item) {
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
    public function findCotizacionByMaterial($id)
    {
        $detalleCotizacion = CotizacionDetalle::with('cotizacion.proveedor')->where('odm_id', $id)->get();
        return response()->json($detalleCotizacion);
    }

    // detalle material - orden compra
    public function findOrdenCompraByMaterial($id)
    {
        $detalleOrdenCompra = OrdenCompraDetalle::with('ordenCompra.proveedor')->where('odm_id', $id)->get();
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
                } else {
                    throw new Exception('Material no encontrado en la base de datos secundaria');
                }
            } else {
                // en el caso que se encuentre el producto en base de datos dbfamai
                $pro_id = $findMaterial->pro_id;
            }

            // buscamos el material en la base de datos
            $ordenInternaMaterial = OrdenInternaMateriales::with('producto')
                ->where('odm_id', $request['odm_id'])->first();

            if (!$ordenInternaMaterial) {
                throw new Exception('Material no encontrado');
            }

            $codigoIncrustado = $ordenInternaMaterial->pro_id !== null ? $ordenInternaMaterial->producto->pro_codigo . ' - ' : '';
            // actualizamos el material
            $ordenInternaMaterial->update([
                'pro_id' => $pro_id,
                'odm_observacion' => $codigoIncrustado . $ordenInternaMaterial->odm_descripcion . ' - ' . $ordenInternaMaterial->odm_observacion,
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
}
