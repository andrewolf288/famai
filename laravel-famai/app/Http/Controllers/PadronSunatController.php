<?php

namespace App\Http\Controllers;

use App\PadronSunat;
use Illuminate\Http\Request;

class PadronSunatController extends Controller
{
    public function showByQuery(Request $request)
    {
        $nrodocumento = $request->input('nrodocumento');
        $padron = PadronSunat::where('xps_nrodocumento', $nrodocumento)->first();

        if(!$padron){
            return response()->json(['error' => 'RUC/DNI no encontrado'], 404);
        }

        return response()->json($padron);
    }
}
