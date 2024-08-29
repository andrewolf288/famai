<?php

namespace App\Http\Controllers;

use App\Subfamilia;
use Illuminate\Http\Request;

class SubFamiliaController extends Controller
{
    public function index()
    {
        $subfamilias = Subfamilia::get();
        return response()->json($subfamilias);
    }

    public function indexSimple()
    {
        $subfamilias = Subfamilia::where('psf_activo', 1)->select('psf_codigo', 'pfa_codigo', 'psf_descripcion')->get();
        return response()->json($subfamilias);
    }
}
