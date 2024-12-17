<?php

namespace App\Http\Controllers;

use App\Almacen;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\Rule;

class AlmacenController extends Controller
{
    public function index(Request $request)
    {
        $sede = $request->input('sed_codigo', null);
        $codigo = $request->input('alm_codigo', null);
        $descripcion = $request->input('alm_descripcion', null);
        $es_principal = $request->input('alm_esprincipal', null); 

        $query = Almacen::query();

        if($sede !== null){
            $query->where('sed_codigo', $sede);
        }

        if($codigo !== null){
            $query->where('alm_codigo', $codigo);
        }

        if($descripcion !== null){
            $query->where('alm_descripcion', 'like', "%$descripcion%");
        }

        if($es_principal !== null){
            $query->where('alm_esprincipal', $es_principal);
        }

        $almacenes = $query->get();

        return $almacenes;
    }
}
