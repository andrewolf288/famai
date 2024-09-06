<?php

namespace App\Http\Controllers;

use App\Modulo;
use Illuminate\Http\Request;

class ModuloController extends Controller
{
    public function indexSimple(Request $request){
        $modulos = Modulo::where('mol_activo', 1)->select('mol_id', 'mol_descripcion')->get();
        return response()->json($modulos);
    }
}
