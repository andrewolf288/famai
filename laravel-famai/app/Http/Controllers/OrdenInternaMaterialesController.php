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
use Illuminate\Support\Facades\Storage;

class OrdenInternaMaterialesController extends Controller
{

    public function index(Request $request)
    {
        $pageSize = $request->input('page_size', 10);
        $page = $request->input('page', 1);
        $ordenTrabajo = $request->input('odt_numero', null);
        $almID = $request->input('alm_id', 1);
        $fecha_desde = $request->input('fecha_desde', null);
        $fecha_hasta = $request->input('fecha_hasta', null);

        // se necesita agregar informacion de procedimiento almacenado
        $query = OrdenInternaMateriales::with(
            [
                'responsable',
                'producto.unidad',
                'ordenInternaParte.ordenInterna'
            ]
        )->where('odm_tipo', "!=" , 3)
        ->where("odm_tipo", "!=" , 4)
        ->where("odm_tipo", "!=" , 5);

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

        $detalleMateriales = $query->paginate($pageSize, ['*'], 'page', $page);
        return response()->json([
            'message' => 'Se listan los materiales de la orden interna',
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
                if(file_exists($ordenInternaMaterial->odm_adjuntopresupuesto)) {
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
        } catch(Exception $e) {
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
            $ordenInternaMaterial = OrdenInternaMateriales::findOrFail($id);

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
            );

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
                $sheet->setCellValue("B{$row}", UtilHelper::getValueFormatExcel($rowData->oic_fechaentregaestimada));
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
            );

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

            $productoConInformacionCompras = $ordenesMateriales->map(function ($material){
                return [
                    'material' => $material,
                    'ultimoPrecioCompras' => null,
                    'ultimaFechaCompras' => null,
                    'stock' => null
                ];
            });

            // $productoConInformacionCompras = $ordenesMateriales->map(function ($material){
            //     $codigoProducto = $material->producto ? $material->producto->pro_codigo : null;
            //     // si es un producto diferente de null
            //     if($codigoProducto !== null){
            //         $compraInfo = DB::connection('sqlsrv_secondary')
            //         ->table('OITM as T0')
            //         ->join('OITW as T1', 'T0.ItemCode', '=', 'T1.ItemCode')
            //         ->select([
            //             'T1.AvgPrice',
            //             DB::raw('MAX(T1.OnOrder) as stock'),
            //             DB::raw(
            //                 "(CASE 
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
            //             )
            //         ])
            //         ->where('T0.ItemCode', '=', $codigoProducto)
            //         ->where('T1.WhsCode', '=', '01_AQPAG')
            //         ->first();

            //         return [
            //             'material' => $material,
            //             'ultimoPrecioCompras' => $compraInfo->value('AvgPrice') ?? null,
            //             'ultimaFechaCompras' => $compraInfo->value('UltimaFechaIngreso') ?? null,
            //             'stock' => $compraInfo->value('stock') ?? null
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

            $headers = ['OT', 'Fec. Det OI', 'Tipo', 'Actividad', 'Cod Producto', 'Producto', 'Obs Producto', 'Ult. Precio de compra', 'Ult. Fecha de compra', 'Stock' ,'Cantidad', 'Und.', 'Reservado', 'Ordenado', 'Atendido'];
            $columnWidths = [15, 19, 5, 18, 10, 50, 40, 10, 15, 10, 10, 7, 10, 10, 10];
            $tipoDato = ['texto', 'texto' ,'texto', 'texto', 'texto', 'texto', 'texto', 'numero', 'text', 'numero', 'numero', 'texto', 'numero', 'numero', 'numero'];

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
                $sheet->setCellValue("F{$row}", UtilHelper::getValueFormatExcel( UtilHelper::limpiarNombreProducto($rowData['material']->odm_descripcion)));
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
            );

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
        $proveedor = $request->input('proveedor', null);
        $detalleMateriales = $request->input('detalle_materiales', []);

        $data = [
            'proveedor' => $proveedor,
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
        $txt_content .= "Correo: " . ($proveedor->correo ?? '') . "\n";
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
}
