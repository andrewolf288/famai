<?php

namespace App\Jobs;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use App\Helpers\UtilHelper;
use Illuminate\Support\Facades\File;
use App\OrdenCompra;
use App\OrdenCompraDetalle;
use League\Csv\Writer;

class ExportarOrdenesCompraCsvJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    /**
     * Create a new job instance.
     *
     * @return void
     */
    public function __construct()
    {
        //
    }

    /**
     * Execute the job.
     *
     * @return void
     */
    public function handle()
    {
        $series = [
            [
                "sed_codigo" => 10,
                "occ_tipo" => 'SUM',
                "value" => 929
            ],
            [
                "sed_codigo" => 10,
                "occ_tipo" => 'SER',
                "value" => 930
            ],
            [
                "sed_codigo" => 20,
                "occ_tipo" => 'SUM',
                "value" => 931
            ],
            [
                "sed_codigo" => 20,
                "occ_tipo" => 'SER',
                "value" => 932
            ]
        ];
        // Ruta donde se guardaran los archivos
        $rutaDestino = "C:\\OrdenesCompra\\";
        // Verifica si la carpeta existe, si no la crea
        if (!file_exists($rutaDestino)) {
            mkdir($rutaDestino, 0777, true);
        }

        $pathcsvCabeceraTemp = $rutaDestino . "OPOR-Documents.csv";
        $pathcsvDetalleTemp = $rutaDestino . "POR1-Document_Lines.csv";

        // Eliminar archivos existentes si existen
        // if (File::exists($pathcsvCabeceraTemp)) {
        //     File::delete($pathcsvCabeceraTemp);
        // }
        // if (File::exists($pathcsvDetalleTemp)) {
        //     File::delete($pathcsvDetalleTemp);
        // }

        // debemos buscar aquellas ordenes de compra que no se han importado aún
        $ordenescompra = OrdenCompra::with('proveedor', 'moneda', 'trabajador', 'sede.almacenPrincipal')
            ->where('occ_importacion', 0)
            ->where('occ_estado', '!=', 'ANU')
            ->get();
        
        // creamos la cabecera del csv
        $csvCabecera = Writer::createFromPath($pathcsvCabeceraTemp, 'w');
        // $csvCabecera->setEnclosure(' ');
        $csvCabecera->insertOne([
            'DocNum',
            'DocEntry',
            'DocType',
            'Series',
            'DocDate',
            'DocDueDate',
            'CardCode',
            'DocTotal',
            'DocCurrency',
            'DocRate',
            'Comments',
            'PaymentGroupCode',
            'U_EXX_CORDOCOR',
            // 'TaxDate',
            'DocumentsOwner',
            'U_FAM_USUEXT',
            // 'DocTotalFc',
            // 'VatPercent',
            'DocDueDate',
            'NumAtCard'
        ]);
        $csvCabecera->insertOne([
            'DocNum',
            'DocEntry',
            'DocType',
            'Series',
            'DocDate',
            'DocDueDate',
            'CardCode',
            'DocTotal',
            'DocCur',
            'DocRate',
            'Comments',
            'GroupNum',
            'U_EXX_CORDOCOR',
            // 'TaxDate',
            'OwnerCode',
            'U_FAM_USUEXT',
            // 'DocTotalFC',
            // 'VatPercent',
            'DocDueDate',
            'NumAtCard'
        ]);

        // creamos el detalle del csv
        $csvDetalle = Writer::createFromPath($pathcsvDetalleTemp, 'w');
        // $csvDetalle->setEnclosure(' ');
        $csvDetalle->insertOne([
            "ParentKey",
            "LineNum",
            "ItemCode",
            "Quantity",
            "ShipDate",
            "Price",
            "Currency",
            "DiscountPercent",
            "TaxCode",
            "LineTotal",
            "TaxPercentagePerRow",
            "U_FAM_FECINOC",
            "ItemDetails",
            "U_EXF_DOCNUMOT",
            'WarehouseCode'
            // "GrossTotal"
            // "TaxTotal"
        ]);
        $csvDetalle->insertOne([
            "DocNum",
            "LineNum",
            "ItemCode",
            "Quantity",
            "ShipDate",
            "Price",
            "Currency",
            "DiscPrcnt",
            "TaxCode",
            "LineTotal",
            "VatPrcnt",
            "U_FAM_FECINOC",
            "Text",
            "U_EXF_DOCNUMOT",
            'WhsCode'
            // "GTotal"
            // "VatSum"
        ]);

        $contador = 1;
        // generamos el csv de cabecera
        foreach ($ordenescompra as $key => $orden) {
            $sed_codigo = $orden->sed_codigo;
            $occ_tipo = $orden->occ_tipo;
            $serie = UtilHelper::getSerieValue($series, $sed_codigo, $occ_tipo);
            $tipo_documento = 'I';
            $almacen = $orden->sede->almacenPrincipal->alm_codigo;
            
            $csvCabecera->insertOne([
                $contador, // DocNum
                $contador, // DocEntry
                $tipo_documento, // DocType (standard for purchase order)
                $serie,
                UtilHelper::formatDateExportSAP($orden->occ_fecha), // DocDate
                UtilHelper::formatDateExportSAP($orden->occ_fecha), // DocDueDate
                $orden->proveedor->prv_codigo, // CardCode
                $orden->occ_total, // DocTotal (Total)
                $orden->mon_codigo, // DocCur (Moneda)
                $orden->occ_tipocambio ?? 1, // DocRate
                UtilHelper::cleanForCSV($orden->occ_notas), // Comments (Comentarios)
                $orden->fpa_codigo, // GroupNum (Forma de pago)
                // UtilHelper::formatDateExportSAP($orden->occ_fecha), // TaxDate (assuming the same as DocDate)
                // 0, // DocTotalFC (Total en moneda extranjera)
                // 0, // VatPercent 
                $orden->occ_numero,
                $orden->trabajador->tra_codigosap,
                trim($orden->occ_usucreacion),
                UtilHelper::formatDateExportSAP($orden->occ_fechaentrega),
                $orden->occ_referencia
            ]);
            
            $ordenescompradetalle = OrdenCompraDetalle::with('producto', 'detalleMaterial.ordenInternaParte.ordenInterna')
                ->where('occ_id', $orden->occ_id)
                ->get();

            $contadorDetalle = 0;

            foreach ($ordenescompradetalle as $detalle) {
                $csvDetalle->insertOne([
                    $contador, // DocNum
                    $contadorDetalle, // LineNum
                    $detalle->producto->pro_codigo, // ItemCode
                    $detalle->ocd_cantidad, // Quantity
                    UtilHelper::formatDateExportSAP($detalle->ocd_fechaentrega), // ShipDate
                    $detalle->ocd_preciounitario / (1 - $detalle->ocd_porcentajedescuento / 100), // Price
                    $orden->mon_codigo, // Currency
                    $detalle->ocd_porcentajedescuento,
                    $detalle->imp_codigo, // TaxCode
                    $detalle->ocd_total, // LineTotal
                    $detalle->ocd_porcentajeimpuesto, // VatPrcnt
                    // $detalle->ocd_total, // GrossTotal
                    // '', // VatSum (por calcular o llenar según lógica)
                    UtilHelper::formatDateExportSAP($detalle->ocd_fechaentrega), // U_FAM_FECINOC (campo obligatorio)
                    UtilHelper::cleanForCSV($detalle->ocd_observacion),
                    $detalle->detalleMaterial->ordenInternaParte->ordenInterna->oic_otsap,
                    $almacen
                ]);

                $contadorDetalle++;
            }

            $contador++;
        }

        // al finalizar la importacion, cambiamos el flag de importacion
        OrdenCompra::whereIn('occ_id', $ordenescompra->pluck('occ_id'))->update([
            'occ_importacion' => 1,
            'occ_estado' => 'SAP'
        ]);
    }
}
