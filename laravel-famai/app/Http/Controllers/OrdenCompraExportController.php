<?php

namespace App\Http\Controllers;

use App\OrdenCompra;
use App\OrdenCompraDetalle;
use App\Proveedor;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\File;
use League\Csv\Writer;

class OrdenCompraExportController extends Controller
{
    public function export()
    {
        $ordenescompra = OrdenCompra::with('proveedor', 'moneda')
            ->get();

        $ordenescompradetalle = OrdenCompraDetalle::with('producto')
            ->get();

        $pathcsvCabeceraTemp = storage_path("app/temp/purchase-order.csv");
        $pathcsvDetalleTemp = storage_path("app/temp/purchase-order-detail.csv");
        // creamos la cabecera del csv
        $csvCabecera = Writer::createFromPath($pathcsvCabeceraTemp, 'w');
        $csvCabecera->insertOne([
            'DocNum',
            'DocEntry',
            'DocType',
            'Handwrtten',
            'Printed',
            'DocDate',
            'DocDueDate',
            'CardCode',
            'CardName',
            'Address',
            'NumAtCard',
            'DocTotal',
            'AtcEntry',
            'DocCur',
            'DocRate',
            'Ref1',
            'Ref2',
            'Comments',
            'JrnlMemo',
            'GroupNum',
            'DocTime',
            'SlpCode',
            'TrnspCode',
            'Confirmed',
            'ImportEnt',
            'SummryType',
            'CntctCode',
            'ShowSCN',
            'Series',
            'TaxDate',
            'PartSupply',
            'ObjType',
            'ShipToCode',
            'Indicator',
            'LicTradNum',
            'DiscPrcnt',
            'PaymentRef',
            'DocTotalFC',
            'Form1099',
            'Box1099',
            'RevisionPo',
            'ReqDate',
            'CancelDate',
            'BlockDunn',
            'Pick',
            'PeyMethod',
            'PayBlock',
            'PayBlckRef',
            'CntrlBnk',
            'MaxDscn',
            'Project',
            'FromDate',
            'ToDate',
            'UpdInvnt',
            'Rounding',
            'CorrExt',
            'CorrInv',
            'DeferrTax',
            'LetterNum',
            'AgentCode',
            'Installmnt',
            'VATFirst',
            'VatDate',
            'OwnerCode',
            'FolioPref',
            'FolioNum',
            'DocSubType',
            'BPChCode',
            'BPChCntc',
            'Address2',
            'PayToCode',
            'ManualNum',
            'UseShpdGd',
            'IsPaytoBnk',
            'BnkCntry',
            'BankCode',
            'BnkAccount',
            'BnkBranch',
            'BPLId',
            'DpmPrcnt',
            'isIns',
            'LangCode',
            'TrackNo',
            'PickRmrk',
            'ClsDate',
            'SeqCode',
            'Serial',
            'SeriesStr',
            'SubStr',
            'Model',
            'UseCorrVat',
            'DpmAmnt',
            'DpmPrcnt',
            'Posted',
            'DpmAmntSC',
            'DpmAmntFC',
            'VatPercent',
            'SrvGpPrcnt',
            'Header',
            'Footer',
            'RoundDif',
            'CtlAccount',
            'InsurOp347',
            'IgnRelDoc',
            'Checker',
            'Payee',
            'ExtraMonth',
            'ExtraDays',
            'CdcOffset',
            'PayDuMonth',
            'NTSApprov',
            'NTSWebSite',
            'NTSeTaxNo',
            'NTSApprNo',
            'EDocGenTyp',
            'ESeries',
            'EDocExpFrm',
            'EDocStatus',
            'EDocErrCod',
            'EDocErrMsg',
            'DpmStatus',
            'PQTGrpSer',
            'PQTGrpNum',
            'PQTGrpHW',
            'ReopOriDoc',
            'ReopManCls',
            'OnlineQuo',
            'POSEqNum',
            'POSManufSN',
            'POSCashN',
            'DpmAsDscnt',
            'ClosingOpt',
            'SpecDate',
            'OpenForLaC',
            'GTSRlvnt',
            'AnnInvDecR',
            'Supplier',
            'Releaser',
            'Receiver',
            'AgrNo',
            'IsAlt',
            'AssetDate',
            'DocDlvry',
            'AuthCode',
            'StDlvDate',
            'StDlvTime',
            'EndDlvDate',
            'EndDlvTime',
            'VclPlate',
            'AtDocType',
            'ElCoStatus',
            'ElCoMsg',
            'IsReuseNum',
            'IsReuseNFN',
            'PrintSEPA',
            'FiscDocNum',
            'ZrdAbs',
            'POSRcptNo',
            'PTICode',
            'Letter',
            'FolNumFrom',
            'FolNumTo',
            'InterimTyp',
            'RelatedTyp',
            'RelatedEnt',
            'DocTaxID',
            'DateReport',
            'RepSection',
            'ExclTaxRep',
            'PosCashReg',
            'PriceMode',
            'ShipToCode',
            'ComTrade',
            'ComTradeRt',
            'UseBilAddr'
        ]);

        // generamos el csv de cabecera
        foreach ($ordenescompra as $key => $orden) {
            $csvCabecera->insertOne([
                $orden->occ_id, // DocNum
                $orden->$key, // DocEntry
                'I', // DocType (standard for purchase order)
                'N', // Handwrtten (default No)
                'N', // Printed (default No)
                $orden->occ_fecha, // DocDate
                $orden->occ_fechaentrega, // DocDueDate
                // $this->mapProveedor($orden->prv_id),
                $orden->proveedor->prv_id, // CardCode
                $orden->proveedor->prv_nombre, // CardName
                $orden->proveedor->prv_direccion, // Address
                '', // NumAtCard
                $orden->occ_total, // DocTotal
                '', // AtcEntry (not provided)
                $orden->mon_codigo, // DocCur
                $orden->occ_tipocambio || 0, // DocRate
                $orden->occ_referencia || '', // Ref1
                '', // Ref2
                $orden->occ_notas, // Comments
                '', // JrnlMemo (not provided)
                '', // GroupNum (not provided)
                '', // DocTime (not provided)
                '', // SlpCode (not provided)
                '', // TrnspCode (not provided)
                'N', // Confirmed (default No)
                '', // ImportEnt (not provided)
                '', // SummryType (not provided)
                '', // CntctCode (not provided)
                '', // ShowSCN (not provided)
                '', // Series (not provided)
                $orden->occ_fecha, // TaxDate (assuming the same as DocDate)
                'N', // PartSupply (default No)
                '', // ObjType (not provided)
                '', // ShipToCode (not provided)
                '', // Indicator (not provided)
                '', // LicTradNum (not provided)
                0, // DiscPrcnt (default 0)
                '', // PaymentRef (not provided)
                $orden->occ_subtotal, // DocTotalFC (not provided)
                '', // Form1099 (not provided)
                '', // Box1099 (not provided)
                '', // RevisionPo (not provided)
                '', // ReqDate (not provided)
                '', // CancelDate (not provided)
                'N', // BlockDunn (default No)
                '', // Pick (not provided)
                '', // PeyMethod (not provided)
                'N', // PayBlock (default No)
                '', // PayBlckRef (not provided)
                '', // CntrlBnk (not provided)
                0, // MaxDscn (default 0)
                '', // Project (not provided)
                '', // FromDate (not provided)
                '', // ToDate (not provided)
                'N', // UpdInvnt (default No)
                0, // Rounding (default 0)
                '', // CorrExt (not provided)
                '', // CorrInv (not provided)
                'N', // DeferrTax (default No)
                '', // LetterNum (not provided)
                '', // AgentCode (not provided)
                '', // Installmnt (not provided)
                'N', // VATFirst (default No)
                '', // VatDate (not provided)
                '', // OwnerCode (not provided)
                '', // FolioPref (not provided)
                '', // FolioNum (not provided)
                '', // DocSubType (not provided)
                '', // BPChCode (not provided)
                '', // BPChCntc (not provided)
                '', // Address2 (not provided)
                '', // PayToCode (not provided)
                '', // ManualNum (not provided)
                'N', // UseShpdGd (default No)
                'N', // IsPaytoBnk (default No)
                '', // BnkCntry (not provided)
                '', // BankCode (not provided)
                '', // BnkAccount (not provided)
                '', // BnkBranch (not provided)
                '', // BPLId (not provided)
                0, // DpmPrcnt (default 0)
                'N', // isIns (default No)
                '', // LangCode (not provided)
                '', // TrackNo (not provided)
                '', // PickRmrk (not provided)
                '', // ClsDate (not provided)
                '', // SeqCode (not provided)
                '', // Serial (not provided)
                '', // SeriesStr (not provided)
                '', // SubStr (not provided)
                '', // Model (not provided)
                'N', // UseCorrVat (default No)
                0, // DpmAmnt (default 0)
                0, // DpmPrcnt (default 0)
                'N', // Posted (default No)
                0, // DpmAmntSC (default 0)
                0, // DpmAmntFC (default 0)
                $orden->occ_igv, // VatPercent (default 0)
                0, // SrvGpPrcnt (default 0)
                '', // Header (not provided)
                '', // Footer (not provided)
                0, // RoundDif (default 0)
                '', // CtlAccount (not provided)
                'N', // InsurOp347 (default No)
                'N', // IgnRelDoc (default No)
                '', // Checker (not provided)
                '', // Payee (not provided)
                0, // ExtraMonth (default 0)
                0, // ExtraDays (default 0)
                0, // CdcOffset (default 0)
                0, // PayDuMonth (default 0)
                'N', // NTSApprov (default No)
                '', // NTSWebSite (not provided)
                '', // NTSeTaxNo (not provided)
                '', // NTSApprNo (not provided)
                '', // EDocGenTyp (not provided)
                '', // ESeries (not provided)
                '', // EDocExpFrm (not provided)
                '', // EDocStatus (not provided)
                '', // EDocErrCod (not provided)
                '', // EDocErrMsg (not provided)
                'N', // DpmStatus (default No)
                '', // PQTGrpSer (not provided)
                '', // PQTGrpNum (not provided)
                '', // PQTGrpHW (not provided)
                'N', // ReopOriDoc (default No)
                'N', // ReopManCls (default No)
                'N', // OnlineQuo (default No)
                '', // POSEqNum (not provided)
                '', // POSManufSN (not provided)
                '', // POSCashN (not provided)
                'N', // DpmAsDscnt (default No)
                '', // ClosingOpt (not provided)
                '', // SpecDate (not provided)
                'N', // OpenForLaC (default No)
                'N', // GTSRlvnt (default No)
                'N', // AnnInvDecR (default No)
                '', // Supplier (not provided)
                '', // Releaser (not provided)
                '', // Receiver (not provided)
                '', // AgrNo (not provided)
                'N', // IsAlt (default No)
                '', // AssetDate (not provided)
                '', // DocDlvry (not provided)
                '', // AuthCode (not provided)
                '', // StDlvDate (not provided)
                '', // StDlvTime (not provided)
                '', // EndDlvDate (not provided)
                '', // EndDlvTime (not provided)
                '', // VclPlate (not provided)
                '', // AtDocType (not provided)
                '', // ElCoStatus (not provided)
                '', // ElCoMsg (not provided)
                'N', // IsReuseNum (default No)
                'N', // IsReuseNFN (default No)
                'N', // PrintSEPA (default No)
                '', // FiscDocNum (not provided)
                '', // ZrdAbs (not provided)
                '', // POSRcptNo (not provided)
                '', // PTICode (not provided)
                '', // Letter (not provided)
                '', // FolNumFrom (not provided)
                '', // FolNumTo (not provided)
                '', // InterimTyp (not provided)
                '', // RelatedTyp (not provided)
                '', // RelatedEnt (not provided)
                '', // DocTaxID (not provided)
                '', // DateReport (not provided)
                '', // RepSection (not provided)
                'N', // ExclTaxRep (default No)
                '', // PosCashReg (not provided)
                '', // PriceMode (not provided)
                '', // ShipToCode (not provided)
                '', // ComTrade (not provided)
                '', // ComTradeRt (not provided)
                'N'  // UseBilAddr (default No)
            ]);
        }

        // creamos el detalle del csv
        $csvDetalle = Writer::createFromPath($pathcsvDetalleTemp, 'w');
        $csvDetalle->insertOne([
            "DocNum",
            "LineNum",
            "ItemCode",
            "Dscription",
            "Quantity",
            "ShipDate",
            "Price",
            "PriceAfVAT",
            "Currency",
            "Rate",
            "DiscPrcnt",
            "VendorNum",
            "SerialNum",
            "WhsCode",
            "SlpCode",
            "Commission",
            "TreeType",
            "AcctCode",
            "UseBaseUn",
            "SubCatNum",
            "OcrCode",
            "Project",
            "CodeBars",
            "VatGroup",
            "Height1",
            "Hght1Unit",
            "Height2",
            "Hght2Unit",
            "Length1",
            "Len1Unit",
            "length2",
            "Len2Unit",
            "Weight1",
            "Wght1Unit",
            "Weight2",
            "Wght2Unit",
            "Factor1",
            "Factor2",
            "Factor3",
            "Factor4",
            "BaseType",
            "BaseEntry",
            "BaseLine",
            "Volume",
            "VolUnit",
            "Width1",
            "Wdth1Unit",
            "Width2",
            "Wdth2Unit",
            "Address",
            "TaxCode",
            "TaxType",
            "TaxStatus",
            "BackOrdr",
            "FreeTxt",
            "TrnsCode",
            "CEECFlag",
            "ToStock",
            "ToDiff",
            "WtLiable",
            "DeferrTax",
            "unitMsr",
            "NumPerMsr",
            "LineTotal",
            "VatPrcnt",
            "VatSum",
            "ConsumeFCT",
            "ExciseAmt",
            "CountryOrg",
            "SWW",
            "TranType",
            "DistribExp",
            "TotalFrgn",
            "CFOPCode",
            "CSTCode",
            "Usage",
            "TaxOnly",
            "PriceBefDi",
            "LineStatus",
            "PackQty",
            "LineType",
            "CogsOcrCod",
            "CogsAcct",
            "ChgAsmBoMW",
            "GrossBuyPr",
            "GrossBase",
            "GPTtlBasPr",
            "OcrCode2",
            "OcrCode3",
            "OcrCode4",
            "OcrCode5",
            "Text",
            "LocCode",
            "ActDelDate",
            "ExLineNo",
            "PQTReqDate",
            "PQTReqQty",
            "CogsOcrCo2",
            "CogsOcrCo3",
            "CogsOcrCo4",
            "CogsOcrCo5",
            "CSTfIPI",
            "CSTfPIS",
            "CSTfCOFINS",
            "CredOrigin",
            "NoInvtryMv",
            "AgrNo",
            "AgrLnNum",
            "ActBaseEnt",
            "ActBaseLn",
            "DocEntry",
            "Surpluses",
            "DefBreak",
            "Shortages",
            "NeedQty",
            "PartRetire",
            "RetireQty",
            "RetireAPC",
            "ThirdParty",
            "ExpType",
            "ExpUUID",
            "ExpOpType",
            "LicTradNum",
            "UomEntry",
            "InvQty",
            "PrntLnNum",
            "Incoterms",
            "TransMod",
            "InvQtyOnly",
            "FreeChrgBP",
            "SacEntry",
            "HsnEntry",
            "GPBefDisc",
            "GTotal",
            "GTotalFC",
            "NCMCode",
            "ShipFromCo",
            "ShipFromDe"
        ]);

        foreach ($ordenescompradetalle as $detalle) {
            $csvDetalle->insertOne([
                $detalle->ocd_id, // DocNum
                $detalle->ocd_orden, // LineNum
                $detalle->producto ? $detalle->producto->pro_codigo : '', // ItemCode (de la relación con 'producto' si necesario)
                $detalle->ocd_descripcion, // Dscription
                $detalle->ocd_cantidad, // Quantity
                $detalle->ocd_feccreacion->format('Y-m-d'), // ShipDate (asumiendo que es la fecha de creación)
                $detalle->ocd_preciounitario, // Price
                '', // PriceAfVAT (por calcular o llenar según lógica)
                '', // Currency (por definir)
                '', // Rate (por definir)
                '', // DiscPrcnt (por definir)
                '', // VendorNum (por definir)
                '', // SerialNum (por definir)
                '', // WhsCode (por definir)
                '', // SlpCode (por definir)
                '', // Commission (por definir)
                '', // TreeType (por definir)
                '', // AcctCode (por definir)
                '', // UseBaseUn (por definir)
                '', // SubCatNum (por definir)
                '', // OcrCode (por definir)
                '', // Project (por definir)
                '', // CodeBars (por definir)
                '', // VatGroup (por definir)
                '', // Height1 (por definir)
                '', // Hght1Unit (por definir)
                '', // Height2 (por definir)
                '', // Hght2Unit (por definir)
                '', // Length1 (por definir)
                '', // Len1Unit (por definir)
                '', // length2 (por definir)
                '', // Len2Unit (por definir)
                '', // Weight1 (por definir)
                '', // Wght1Unit (por definir)
                '', // Weight2 (por definir)
                '', // Wght2Unit (por definir)
                '', // Factor1 (por definir)
                '', // Factor2 (por definir)
                '', // Factor3 (por definir)
                '', // Factor4 (por definir)
                '', // BaseType (por definir)
                '', // BaseEntry (por definir)
                '', // BaseLine (por definir)
                '', // Volume (por definir)
                '', // VolUnit (por definir)
                '', // Width1 (por definir)
                '', // Wdth1Unit (por definir)
                '', // Width2 (por definir)
                '', // Wdth2Unit (por definir)
                '', // Address (por definir)
                '', // TaxCode (por definir)
                '', // TaxType (por definir)
                '', // TaxStatus (por definir)
                '', // BackOrdr (por definir)
                '', // FreeTxt (por definir)
                '', // TrnsCode (por definir)
                '', // CEECFlag (por definir)
                '', // ToStock (por definir)
                '', // ToDiff (por definir)
                '', // WtLiable (por definir)
                '', // DeferrTax (por definir)
                '', // unitMsr (por definir)
                '', // NumPerMsr (por definir)
                $detalle->ocd_total, // LineTotal
                '', // VatPrcnt (por definir)
                '', // VatSum (por definir)
                '', // ConsumeFCT (por definir)
                '', // ExciseAmt (por definir)
                '', // CountryOrg (por definir)
                '', // SWW (por definir)
                '', // TranType (por definir)
                '', // DistribExp (por definir)
                '', // TotalFrgn (por definir)
                '', // CFOPCode (por definir)
                '', // CSTCode (por definir)
                '', // Usage (por definir)
                '', // TaxOnly (por definir)
                '', // PriceBefDi (por definir)
                '', // LineStatus (por definir)
                '', // PackQty (por definir)
                '', // LineType (por definir)
                '', // CogsOcrCod (por definir)
                '', // CogsAcct (por definir)
                '', // ChgAsmBoMW (por definir)
                '', // GrossBuyPr (por definir)
                '', // GrossBase (por definir)
                '', // GPTtlBasPr (por definir)
                '', // OcrCode2 (por definir)
                '', // OcrCode3 (por definir)
                '', // OcrCode4 (por definir)
                '', // OcrCode5 (por definir)
                '', // Text (por definir)
                '', // LocCode (por definir)
                $detalle->ocd_feccreacion->format('Y-m-d'), // ActDelDate (asumiendo que es la fecha de creación)
                '', // ExLineNo (por definir)
                '', // PQTReqDate (por definir)
                '', // PQTReqQty (por definir)
                '', // CogsOcrCo2 (por definir)
                '', // CogsOcrCo3 (por definir)
                '', // CogsOcrCo4 (por definir)
                '', // CogsOcrCo5 (por definir)
                '', // CSTfIPI (por definir)
                '', // CSTfPIS (por definir)
                '', // CSTfCOFINS (por definir)
                '', // CredOrigin (por definir)
                '', // NoInvtryMv (por definir)
                '', // AgrNo (por definir)
                '', // AgrLnNum (por definir)
                '', // ActBaseEnt (por definir)
                '', // ActBaseLn (por definir)
                '', // DocEntry (por definir)
                '', // Surpluses (por definir)
                '', // DefBreak (por definir)
                '', // Shortages (por definir)
                '', // NeedQty (por definir)
                '', // PartRetire (por definir)
                '', // RetireQty (por definir)
                '', // RetireAPC (por definir)
                '', // ThirdParty (por definir)
                '', // ExpType (por definir)
                '', // ExpUUID (por definir)
                '', // ExpOpType (por definir)
                '', // LicTradNum (por definir)
                '', // UomEntry (por definir)
                '', // InvQty (por definir)
                '', // PrntLnNum (por definir)
                '', // Incoterms (por definir)
                '', // TransMod (por definir)
                '', // InvQtyOnly (por definir)
                '', // FreeChrgBP (por definir)
                '', // SacEntry (por definir)
                '', // HsnEntry (por definir)
                '', // GPBefDisc (por definir)
                '', // GTotal (por definir)
                '', // GTotalFC (por definir)
                '', // NCMCode (por definir)
                '', // ShipFromCo (por definir)
                '', // ShipFromDe (por definir)
            ]);
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

    private function mapProveedor($prv_id)
    {
        $proveedor = Proveedor::findOrFail($prv_id);
        $nrodocumento = $proveedor->prv_nrodocumento;

        $consulta = DB::coneccion('sqlsrv_secondary')
            ->table('OCRDO as T1')
            ->select('CardCode')
            ->where('CardCode', 'like', "%$nrodocumento%")
            ->first();

        return $consulta->CardCode;
    }
}
