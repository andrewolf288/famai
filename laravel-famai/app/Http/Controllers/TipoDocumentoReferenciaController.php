<?php

namespace App\Http\Controllers;

use App\TipoDocumentoReferencia;

class TipoDocumentoReferenciaController extends Controller
{
    public function index()
    {
        $tiposdocumentosreferencia = TipoDocumentoReferencia::get();
        return response()->json($tiposdocumentosreferencia);
    }

    public function indexSimple()
    {
        $tiposdocumentosreferencia = TipoDocumentoReferencia::where('tdr_activo', 1)->select('tdr_codigo', 'tdr_descripcion')->get();
        return response()->json($tiposdocumentosreferencia);
    }
}
