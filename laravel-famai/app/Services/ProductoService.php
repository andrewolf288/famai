<?php

namespace App\Services;

use App\Producto;
use App\Unidad;
use Exception;
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
                DB::raw('MAX(T1.OnOrder) as alp_stock'),
            ])
            ->where('T1.WhsCode', '=', $alm_codigo)
            ->where('T0.validFor', '=', 'Y')
            ->where('T0.ItemCode', '=', $pro_codigo)
            ->first();

        // Convertir el resultado a array o devolver null si no se encuentra
        return $producto ? (array)$producto : null;
    }

    public function findProductoOrCreate($pro_codigo, $user)
    {
        $findMaterial = Producto::where('pro_codigo', $pro_codigo)->first();
        if (!$findMaterial) {
            // hacemos una busqueda de los datos en la base de datos secundaria
            $productoSecondary = DB::connection('sqlsrv_secondary')
                ->table('OITM as T0')
                ->select([
                    'T0.ItemCode as pro_codigo',
                    'T0.ItemName as pro_descripcion',
                    'T0.BuyUnitMsr as uni_codigo',
                ])
                ->where('T0.ItemCode', $pro_codigo)
                ->first();

            if ($productoSecondary) {
                // debemos hacer validaciones de la unidad
                $uni_codigo = 'SIN';
                $uni_codigo_secondary = trim($productoSecondary->uni_codigo);
                if (!empty($uni_codigo)) {
                    $unidadFound = Unidad::where('uni_codigo', $uni_codigo_secondary)->first();
                    if ($unidadFound) {
                        $uni_codigo = $unidadFound->uni_codigo;
                    } else {
                        $unidadCreated = Unidad::create([
                            'uni_codigo' => $uni_codigo_secondary,
                            'uni_descripcion' => $uni_codigo_secondary,
                            'uni_activo' => 1,
                            'uni_usucreacion' => $user->usu_codigo,
                            'uni_fecmodificacion' => null
                        ]);
                        $uni_codigo = $unidadCreated->uni_codigo;
                    }
                }
                // creamos el producto con los valores correspondientes
                $productoCreado = Producto::create([
                    'pro_codigo' => $productoSecondary->pro_codigo,
                    'pro_descripcion' => $productoSecondary->pro_descripcion,
                    'uni_codigo' => $uni_codigo,
                    'pgi_codigo' => 'SIN',
                    'pfa_codigo' => 'SIN',
                    'psf_codigo' => 'SIN',
                    'pma_codigo' => 'SIN',
                    'pro_usucreacion' => $user->usu_codigo,
                    'pro_fecmodificacion' => null
                ]);
                // se establece el ID correspondiente
                return $productoCreado->pro_id;
            } else {
                throw new Exception('Material no encontrado en la base de datos secundaria');
            }
        } else {
            // en el caso que se encuentre el producto en base de datos dbfamai
            return $findMaterial->pro_id;
        }
    }
}
