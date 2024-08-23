<?php

namespace App\Http\Controllers;

use App\ProductoProveedor;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class ProductoProveedorController extends Controller
{
    public function comprasByProducto(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'pro_id' => 'required|integer|exists:tblproductos_pro,pro_id',
        ]);

        // Validamos la información
        if ($validator->fails()) {
            return response()->json(["error" => $validator->errors()->toJson()], 400);
        }

        // Construcción de la consulta
        $query = ProductoProveedor::with(['proveedor'])
            ->where('pro_id', $request->input('pro_id'))
            ->orderBy('prp_fechaultimacompra', 'desc'); // Ordenar por fecha_compra en orden descendente

        // Ejecuta la consulta y obtiene los resultados
        $compras = $query->get();

        // Retorna los resultados como JSON
        return response()->json($compras);
    }
}
