<?php

namespace App\Http\Controllers;

use App\OrdenInterna;
use App\OrdenInternaMateriales;
use App\OrdenInternaPartes;
use App\Proveedor;
use Barryvdh\DomPDF\Facade\Pdf;
use Exception;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use PhpOffice\PhpSpreadsheet\Spreadsheet;
use PhpOffice\PhpSpreadsheet\Writer\Xlsx;

class OrdenInternaMaterialesController extends Controller
{

    public function index(Request $request)
    {
        $pageSize = $request->input('page_size', 10);
        $page = $request->input('page', 1);
        $ordenTrabajo = $request->input('ot_numero', null);
        $ordenInterna = $request->input('oi_numero', null);
        $almID = $request->input('alm_id', 1);
        $fecha_desde = $request->input('fecha_desde', null);
        $fecha_hasta = $request->input('fecha_hasta', null);

        $query = OrdenInternaMateriales::with(
            [
                'responsable',
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

        // filtro de orden interna
        if ($ordenInterna !== null) {
            $query->whereHas('ordenInternaParte.ordenInterna', function ($q) use ($ordenInterna) {
                $q->where('oic_numero', $ordenInterna);
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
        } catch(Exception $e) {
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

    public function exportExcel(Request $request)
    {
        try {
            $ordenTrabajo = $request->input('ot_numero', null);
            $ordenInterna = $request->input('oi_numero', null);
            $almID = $request->input('alm_id', 1);
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

            // filtro de orden interna
            if ($ordenInterna !== null) {
                $query->whereHas('ordenInternaParte.ordenInterna', function ($q) use ($ordenInterna) {
                    $q->where('oic_numero', $ordenInterna);
                });
            }

            // filtro de fecha
            if ($fecha_desde !== null && $fecha_hasta !== null) {
                $query->whereBetween('odm_feccreacion', [$fecha_desde, $fecha_hasta]);
            }

            // ordenar de formar descendiente
            $query->orderBy('odm_feccreacion', 'desc');

            $data = $query->get();
            $headers = ['OT', 'OI', 'Fec. Det OI', 'Tipo', 'Cod Producto', 'Producto', 'Obs Producto', 'Cantidad', 'Und.', 'Stock Alm', 'Reservado', 'Ordenado', 'Atendido'];
            $columnWidths = [15, 15, 19, 5, 10, 50, 40, 10, 7, 10, 10, 10, 10];
            $tipoDato = ['texto', 'texto', 'texto', 'texto', 'texto', 'texto', 'texto', 'numero', 'texto', 'numero', 'numero', 'numero', 'numero'];

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

            function getValue($relation, $default = 'N/A')
            {
                return $relation ?? $default;
            }

            // Agregamos la data
            $row = 2;

            foreach ($data as $rowData) {
                $sheet->setCellValue("A{$row}", getValue($rowData->ordenInternaParte && $rowData->ordenInternaParte->ordenInterna) ? $rowData->ordenInternaParte->ordenInterna->oic_numero : null);
                $sheet->setCellValue("B{$row}", getValue($rowData->ordenInternaParte && $rowData->ordenInternaParte->ordenInterna ? $rowData->ordenInternaParte->ordenInterna->odt_numero : null));
                $sheet->setCellValue("C{$row}", getValue($rowData->odm_feccreacion));
                $sheet->setCellValue("D{$row}", getValue($rowData->odm_tipo == 1 ? 'R' : 'A'));
                $sheet->setCellValue("E{$row}", getValue($rowData->producto ? $rowData->producto->pro_codigo : null));
                $sheet->setCellValue("F{$row}", getValue($rowData->odm_descripcion));
                $sheet->setCellValue("G{$row}", getValue($rowData->odm_observacion));
                $sheet->setCellValue("H{$row}", getValue($rowData->odm_cantidad));
                $sheet->setCellValue("I{$row}", getValue($rowData->producto && $rowData->producto->unidad ? $rowData->producto->unidad->uni_codigo : null));
                $sheet->setCellValue("J{$row}", getValue($rowData->producto && $rowData->producto->stock ? $rowData->producto->stock->alp_stock : null, 0.00));
                $sheet->setCellValue("K{$row}", 0.00);
                $sheet->setCellValue("L{$row}", 0.00);
                $sheet->setCellValue("M{$row}", 0.00);
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

    public function exportPDFCotizacion(Request $request)
    {
        $idProveedor = $request->input('id_proveedor', null);
        $detalleMateriales = $request->input('detalle_materiales', []);

        $proveedor = Proveedor::find($idProveedor);

        $data = [
            'proveedor' => $proveedor,
            'detalleMateriales' => $detalleMateriales
        ];

        $pdf = Pdf::loadView('cotizacion.cotizacion', $data);
        return $pdf->download('cotizacion.pdf');
    }

    public function exportTXTCotizacion(Request $request)
    {
        $idProveedor = $request->input('id_proveedor', null);
        $detalleMateriales = $request->input('detalle_materiales', []);

        $proveedor = Proveedor::find($idProveedor);

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
            $txt_content .= ($index + 1) . ". " . $item["odm_descripcion"] . "     " . $item["odm_cantidad"] . "\n";
        }

        $txt_content .= "======\n";
        $txt_content .= "Contacto: " . ($proveedor->prv_contacto ?? '') . "\n";
        $txt_content .= "Nombre: " . ($proveedor->prv_nombre ?? '') . "\n";
        $txt_content .= "Correo: " . ($proveedor->correo ?? '') . "\n";
        $txt_content .= "Celular/Whatsapp: " . ($proveedor->prv_telefono ?? '') . "/" . ($proveedor->prv_whatsapp ?? '') . "\n\n";
        $txt_content .= "Arequipa, $fecha\n";


        return response()->streamDownload(function () use ($txt_content) {
            echo $txt_content;
        }, 'cotizacion_proveedor.txt', ['Content-Type' => 'text/plain']);
    }
}
