<?php

namespace App\Http\Controllers;

use App\FormaPago;
use Illuminate\Http\Request;

class FormaPagoController extends Controller
{
    public function index()
    {
        $formasPago = FormaPago::get();
        return response()->json($formasPago);
    }

    public function indexSimple()
    {
        $formasPago = FormaPago::where('fpa_activo', 1)->select('fpa_codigo', 'fpa_descripcion')->get();
        return response()->json($formasPago);
    }
}
