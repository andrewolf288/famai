<?php
namespace App\Services;
use Illuminate\Support\Facades\DB;

class ProductoService
{
    public function findProductoBySAP(string $alm_codigo, string $pro_codigo)
    {
        if (!$alm_codigo || !$pro_codigo) {
            throw new \InvalidArgumentException('Los parámetros alm_codigo y pro_codigo son requeridos.');
        }

        // Consultar el producto en la base de datos
        $producto = DB::connection('sqlsrv_secondary')
            ->table('OITM as T0')
            ->join('OITW as T1', 'T0.ItemCode', '=', 'T1.ItemCode')
            ->select([
                'T0.ItemCode as pro_codigo',
                'T0.ItemName as pro_descripcion',
                DB::raw('MAX(T1.OnOrder) as alp_stock'),
            ])
            ->where('T1.WhsCode', '=', $alm_codigo)
            ->where('T0.validFor', '=', 'Y')
            ->where('T0.ItemCode', '=', $pro_codigo)
            ->first();

        // Convertir el resultado a array o devolver null si no se encuentra
        return $producto ? (array)$producto : null;
    }
}
