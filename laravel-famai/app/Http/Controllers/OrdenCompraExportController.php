<?php

namespace App\Http\Controllers;

use App\Helpers\UtilHelper;
use App\OrdenCompra;
use App\OrdenCompraDetalle;
use Illuminate\Support\Facades\File;
use League\Csv\Writer;

class OrdenCompraExportController extends Controller
{
    public function export()
    {
        // Ruta donde se guardaran los archivos
        $rutaDestino = "C:\\OrdenesCompra\\";
        // Verifica si la carpeta existe, si no la crea
        if (!file_exists($rutaDestino)) {
            mkdir($rutaDestino, 0777, true);
        }

        $pathcsvCabeceraTemp = $rutaDestino . "OPOR-Documents.csv";
        $pathcsvDetalleTemp = $rutaDestino . "POR1-Document_Lines.csv";

        // Eliminar archivos existentes si existen
        if (File::exists($pathcsvCabeceraTemp)) {
            File::delete($pathcsvCabeceraTemp);
        }
        if (File::exists($pathcsvDetalleTemp)) {
            File::delete($pathcsvDetalleTemp);
        }

        // debemos buscar aquellas ordenes de compra que no se han importado aún
        $ordenescompra = OrdenCompra::with('proveedor', 'moneda')
            ->where('occ_importacion', 0)
            ->get();

        // creamos la cabecera del csv
        if (!$ordenescompra->isEmpty()) {
            $csvCabecera = Writer::createFromPath($pathcsvCabeceraTemp, 'w');
            $csvCabecera->insertOne([
                'DocNum',
                'DocEntry',
                'DocType',
                'DocDate',
                'DocDueDate',
                'CardCode',
                'CardName',
                'Address',
                'DocTotal',
                'DocCurrency',
                'DocRate',
                'Comments',
                'PaymentGroupCode',
                // 'TaxDate',
                // 'DocTotalFc',
                // 'VatPercent',
            ]);
            $csvCabecera->insertOne([
                'DocNum',
                'DocEntry',
                'DocType',
                'DocDate',
                'DocDueDate',
                'CardCode',
                'CardName',
                'Address',
                'DocTotal',
                'DocCur',
                'DocRate',
                'Comments',
                'GroupNum',
                // 'TaxDate',
                // 'DocTotalFC',
                // 'VatPercent',
            ]);

            // creamos el detalle del csv
            $csvDetalle = Writer::createFromPath($pathcsvDetalleTemp, 'w');
            $csvDetalle->insertOne([
                "ParentKey",
                "LineNum",
                "ItemCode",
                "ItemDescription",
                "Quantity",
                "ShipDate",
                "Price",
                "Currency",
                "DiscountPercent",
                // "TaxCode",
                "LineTotal",
                "TaxPercentagePerRow",
                "U_FAM_FECINOC"
                // "GrossTotal"
                // "TaxTotal"
            ]);
            $csvDetalle->insertOne([
                "DocNum",
                "LineNum",
                "ItemCode",
                "Dscription",
                "Quantity",
                "ShipDate",
                "Price",
                "Currency",
                "DiscPrcnt",
                // "TaxCode",
                "LineTotal",
                "VatPrcnt",
                "U_FAM_FECINOC"
                // "GTotal"
                // "VatSum"
            ]);

            $contador = 1;
            // generamos el csv de cabecera
            foreach ($ordenescompra as $key => $orden) {
                $csvCabecera->insertOne([
                    $contador, // DocNum
                    $contador, // DocEntry
                    'I', // DocType (standard for purchase order)
                    UtilHelper::formatDateExportSAP($orden->occ_fecha), // DocDate
                    UtilHelper::formatDateExportSAP($orden->occ_fecha), // DocDueDate
                    $orden->proveedor->prv_codigo, // CardCode
                    UtilHelper::cleanForCSV($orden->proveedor->prv_nombre), // CardName
                    UtilHelper::cleanForCSV($orden->proveedor->prv_direccion), // Address 
                    $orden->occ_total, // DocTotal (Total)
                    $orden->mon_codigo, // DocCur (Moneda)
                    $orden->occ_tipocambio ?? 1, // DocRate
                    UtilHelper::cleanForCSV($orden->occ_notas), // Comments (Comentarios)
                    $orden->fpa_codigo, // GroupNum (Forma de pago)
                    UtilHelper::formatDateExportSAP($orden->occ_fecha), // TaxDate (assuming the same as DocDate)
                    // 0, // DocTotalFC (Total en moneda extranjera)
                    // 0, // VatPercent 
                ]);

                $ordenescompradetalle = OrdenCompraDetalle::with('producto')
                    ->where('occ_id', $orden->occ_id)
                    ->get();

                $contadorDetalle = 0;

                foreach ($ordenescompradetalle as $detalle) {
                    $csvDetalle->insertOne([
                        $contador, // DocNum
                        $contadorDetalle, // LineNum
                        $detalle->producto->pro_codigo, // ItemCode
                        UtilHelper::cleanForCSV($detalle->ocd_descripcion), // Dscription
                        $detalle->ocd_cantidad, // Quantity
                        UtilHelper::formatDateExportSAP($detalle->ocd_fechaentrega), // ShipDate
                        $detalle->ocd_preciounitario, // Price
                        $orden->mon_codigo, // Currency
                        $detalle->ocd_porcentajedescuento,
                        // $detalle->imp_codigo, // TaxCode
                        $detalle->ocd_total, // LineTotal
                        $detalle->ocd_porcentajeimpuesto, // VatPrcnt
                        // $detalle->ocd_total, // GrossTotal
                        // '', // VatSum (por calcular o llenar según lógica)
                        UtilHelper::formatDateExportSAP($detalle->ocd_fechaentrega), // U_FAM_FECINOC (campo obligatorio)
                    ]);

                    $contadorDetalle++;
                }

                $contador++;
            }

            // al finalizar la importacion, cambiamos el flag de importacion
            OrdenCompra::whereIn('occ_id', $ordenescompra->pluck('occ_id'))->update(['occ_importacion' => 1]);
        }
    }
}
