<?php

namespace App\Http\Controllers;

use App\TipoDocumento;
use Illuminate\Http\Request;

class TipoDocumentoController extends Controller
{
    public function index()
    {
        $tiposDocumentos = TipoDocumento::get();
        return response()->json($tiposDocumentos);
    }

    public function indexSimple()
    {
        $tiposDocumentos = TipoDocumento::where('tdo_activo', 1)->select('tdo_codigo', 'tdo_descripcion', 'tdo_codigosunat')->get();
        return response()->json($tiposDocumentos);
    }
}
