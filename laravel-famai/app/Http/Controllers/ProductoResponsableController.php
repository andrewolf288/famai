<?php

namespace App\Http\Controllers;

use App\ProductoResponsable;
use App\Trabajador;
use Illuminate\Http\Request;

class ProductoResponsableController extends Controller
{
    public function obtenerResponsables()
    {
        $tra_ids = ProductoResponsable::distinct()->pluck('tra_id');
        $result = Trabajador::whereIn('tra_id', $tra_ids)->get();
        
        return response()->json($result);
    }
}
