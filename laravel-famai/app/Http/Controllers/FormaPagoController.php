<?php

namespace App\Http\Controllers;

use App\FormaPago;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class FormaPagoController extends Controller
{
    public function index()
    {
        $formasPago = FormaPago::get();
        return response()->json($formasPago);
    }

    public function indexSimple()
    {
        try {
            DB::statement('EXEC dbo.SincronizarFormasPago');
        } catch (\Throwable $th) {
            // 
        }
        $formasPago = FormaPago::where('fpa_activo', 1)->select('fpa_codigo', 'fpa_descripcion', 'fpa_porcadelanto')->get();
        return response()->json($formasPago);
    }
}
