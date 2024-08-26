<?php

namespace App\Http\Controllers;

use App\Parte;
use Illuminate\Http\Request;

class ParteController extends Controller
{

    public function index()
    {
        $partes = Parte::get();
        return response()->json($partes);
    }

    public function indexSimple()
    {
        $partes = Parte::select('oip_id', 'oip_descripcion', 'oip_orden')->get();
        return response()->json($partes);
    }
}
