<?php

namespace App\Http\Controllers;

use App\Producto;
use App\ProductoResponsable;
use App\Trabajador;
use Exception;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class ProductoResponsableController extends Controller
{
    public function obtenerResponsables()
    {
        $tra_ids = ProductoResponsable::distinct()->pluck('tra_id');
        $result = Trabajador::whereIn('tra_id', $tra_ids)->get();
        
        return response()->json($result);
    }

    public function importarData()
    {
        set_time_limit(1200);
        $filePath = storage_path('app/temp/producto_responsable.csv');

        if (!file_exists($filePath)) {
            return response()->json(['error' => 'File not found.'], 404);
        }

        if (($handle = fopen($filePath, 'r')) !== false) {
            $headers = fgetcsv($handle, 1000, ',');
            try {
                DB::beginTransaction();
                while (($row = fgetcsv($handle, 1000, ',')) !== false) {
                    $data = array_combine($headers, $row);
                    $pro_codigo = $data['codigo'];
                    $tra_id = $data['cod_usuario'];

                    // consultados el producto
                    $producto = Producto::where('pro_codigo', $pro_codigo)->first();
                    $trabajador = Trabajador::where('tra_id', $tra_id)->first();
                    if($producto && $trabajador){
                        ProductoResponsable::create([
                            "pro_id" => $producto->pro_id,
                            "tra_id" => $trabajador->tra_id,
                            "sed_codigo" => $trabajador->sed_codigo,
                            "pre_usucreacion" => "ANDREWJA",
                            "pre_feccreacion" => "2025-03-10",
                            "pre_fecmodificacion" => null
                        ]);
                    }
                }
                DB::commit();
            } catch (Exception $e) {
                DB::rollback();
                return response()->json(['error' => 'Error processing file.', 'error_message' => $e->getMessage()], 500);
            }
        }
    }
}
