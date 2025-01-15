<?php

namespace App\Http\Controllers;

use App\Producto;
use App\ProductoProveedor;
use App\Proveedor;
use Exception;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
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

    public function importarData()
    {
        $filePath = storage_path('app/temp/ordenes_compra_proveedor_producto.csv');

        if (!file_exists($filePath)) {
            return response()->json(['error' => 'File not found.'], 404);
        }

        $batchSize = 1000;
        $records = [];

        // registros en cache
        $cachedProveedores = [];
        $cachedProductos = [];

        if (($handle = fopen($filePath, 'r')) !== false) {
            $headers = fgetcsv($handle, 1000, ',');
            DB::beginTransaction();
            try {
                while (($row = fgetcsv($handle, 1000, ',')) !== false) {
                    $data = array_combine($headers, $row);
                    $numeroDocumento = ltrim(preg_replace('/^[A-Z]/', '', $data['cod_prov']), '0');
                    $tipoDocumento = (strlen($numeroDocumento) >= 11) ? 'RUC' : 'DNI';
                    $codigoProducto = $data['cod_prod'];

                    // buscar el proveedor en la base de datos local
                    if (isset($cachedProveedores[$numeroDocumento])) {
                        $proveedor = $cachedProveedores[$numeroDocumento];
                    } else {
                        $proveedor = Proveedor::where('prv_nrodocumento', $numeroDocumento)->first();
                        if (!$proveedor) {
                            $proveedor = Proveedor::create([
                                "tdo_codigo" => $tipoDocumento,
                                "prv_nrodocumento" => $numeroDocumento,
                                "prv_nombre" => $data['nom_prov'],
                                "prv_usucreacion" => "ANDREWJA",
                                "prv_feccreacion" => date('Y-m-d H:i:s'),
                            ]);
                        }
                        $cachedProveedores[$numeroDocumento] = $proveedor;
                    }

                    // buscamos el producto en la base de datos local
                    if (isset($cachedProductos[$codigoProducto])) {
                        $producto = $cachedProductos[$codigoProducto];
                    } else {
                        $producto = Producto::where('pro_codigo', $codigoProducto)->first();
                        if (!$producto) {
                            $productoSecondary = DB::connection('sqlsrv_secondary')
                                ->table('OITM as T0')
                                ->select([
                                    'T0.ItemCode as pro_codigo',
                                    'T0.ItemName as pro_descripcion',
                                    'T0.BuyUnitMsr as uni_codigo',
                                ])
                                ->where('T0.ItemCode', $data['cod_prod'])
                                ->first();

                            $producto = Producto::create([
                                "pro_codigo" => $productoSecondary->pro_codigo,
                                "pro_descripcion" => $productoSecondary->pro_descripcion,
                                "uni_codigo" => $productoSecondary->uni_codigo,
                                "pro_usucreacion" => "ANDREWJA",
                                "pro_feccreacion" => date('Y-m-d H:i:s'),
                            ]);
                        }
                        $cachedProductos[$codigoProducto] = $producto;
                    }

                    $records[] = [
                        "pro_id" => $producto->pro_id,
                        "prv_id" => $proveedor->prv_id,
                        "prp_fechaultimacompra" => $data['fecha_orden'],
                        "prp_preciounitario" => $data['val_uni'],
                        "prp_usucreacion" => "ANDREWJA",
                        "prp_feccreacion" => date('Y-m-d H:i:s'),
                    ];

                    if (count($records) == $batchSize) {
                        DB::table('producto_proveedor')->insert($records);
                        $records = [];
                    }
                }

                if (!empty($records)) {
                    DB::table('producto_proveedor')->insert($records);
                }

                DB::commit();
                return response()->json(['success' => 'File processed successfully.']);
            } catch (Exception $e) {
                DB::rollback();
                return response()->json(['error' => 'Error processing file.'], 500);
            }

            fclose($handle);
        }
    }

    public function findByProductoUltimaCompra(Request $request)
    {
        $productos = $request->input('productos', []);

        $data = ProductoProveedor::with(['proveedor', 'producto'])
            ->select('pro_id', 'prv_id', 'prp_fechaultimacompra')
            ->whereIn('pro_id', $productos)
            ->orderBy('prp_fechaultimacompra', 'desc')
            ->get()
            ->groupBy('pro_id')
            ->map(function ($group) {
                return $group->first();
            });

        $dataProveedores = $data->map(function ($item) {
            return $item->proveedor;
        })->unique('prv_id')->values();

        return response()->json($dataProveedores);
    }

    public function findOrdenCompraByProveedorProducto(Request $request)
    {
        $productos = $request->input('productos', []);
        $proveedor = $request->input('proveedor', null);

        $data = ProductoProveedor::with('producto', 'proveedor')
            ->whereIn('pro_id', $productos)
            ->where('prv_id', $proveedor)
            ->orderBy('prp_fechaultimacompra', 'desc')
            ->get();

        return response()->json($data);
    }
}
