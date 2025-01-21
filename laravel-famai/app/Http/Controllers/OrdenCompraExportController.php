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
        $ordenescompra = OrdenCompra::with('proveedor', 'moneda')
            ->get();

        $pathcsvCabeceraTemp = storage_path("app/temp/purchase-order.csv");
        $pathcsvDetalleTemp = storage_path("app/temp/purchase-order-detail.csv");

        // creamos la cabecera del csv
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
            'TaxDate',
            'Indicator',
            'DocTotalFc',
            'VatPercent',
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
            'TaxDate',
            'Indicator',
            'DocTotalFC',
            'VatPercent',
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
            "WarehouseCode",
            "TaxCode",
            "LineTotal",
            "TaxPercentagePerRow",
            "TaxTotal"
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
            "WhsCode",
            "TaxCode",
            "LineTotal",
            "VatPrcnt",
            "VatSum"
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
                $orden->proveedor->prv_nombre, // CardName
                $orden->proveedor->prv_direccion, // Address 
                $orden->occ_total, // DocTotal (Total)
                $orden->mon_codigo, // DocCur (Moneda)
                $orden->occ_tipocambio || 1, // DocRate
                $orden->occ_notas, // Comments (Comentarios)
                -1, // GroupNum (Forma de pago)
                UtilHelper::formatDateExportSAP($orden->occ_fecha), // TaxDate (assuming the same as DocDate)
                '01', // Indicator (Tipo de documento, FAC, BOL)
                0, // DocTotalFC (Total en moneda extranjera)
                0, // VatPercent 
            ]);

            $ordenescompradetalle = OrdenCompraDetalle::with('producto')
                ->where('occ_id', $orden->occ_id)
                ->get();

            $contadorDetalle = 0;
            
            foreach ($ordenescompradetalle as $detalle) {
                $csvDetalle->insertOne([
                    $contador, // DocNum
                    $contadorDetalle, // LineNum
                    $detalle->producto ? $detalle->producto->pro_codigo : '', // ItemCode (de la relación con 'producto' si necesario)
                    $detalle->ocd_descripcion, // Dscription
                    $detalle->ocd_cantidad, // Quantity
                    $detalle->ocd_feccreacion->format('Y-m-d'), // ShipDate (asumiendo que es la fecha de creación)
                    $detalle->ocd_preciounitario, // Price
                    $orden->mon_codigo, // Currency (por definir)
                    '', // WhsCode (por definir)
                    '', // TaxCode (por definir)
                    $detalle->ocd_total, // LineTotal (por calcular o llenar según lógica)
                    '', // VatPrcnt (por definir)
                    '', // VatSum (por calcular o llenar según lógica)
                ]);

                $contadorDetalle++;
            }

            $contador++;
        }

        $zip = new \ZipArchive();
        $zipFilename = storage_path('app/temp/files.zip');

        if ($zip->open($zipFilename, \ZipArchive::CREATE) === TRUE) {
            // Añadir los archivos CSV al ZIP
            $zip->addFile($pathcsvCabeceraTemp, 'OPOR - Documents.csv');
            $zip->addFile($pathcsvDetalleTemp, 'POR1 - Document_Lines.csv');
            $zip->close();
        }

        // eliminamos los archivos temporales
        File::delete($pathcsvCabeceraTemp);
        File::delete($pathcsvDetalleTemp);

        // Devolver el archivo ZIP para descarga
        return response()->download($zipFilename)->deleteFileAfterSend(true);
    }
}
