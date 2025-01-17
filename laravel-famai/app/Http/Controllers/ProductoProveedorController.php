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
        $record = array();

        // registros en cache
        $cachedProveedores = [];
        $cachedProductos = [];

        if (($handle = fopen($filePath, 'r')) !== false) {
            $headers = fgetcsv($handle, 1000, ',');
            DB::beginTransaction();
            try {
                // abrimos una conexion a la base de datos secundaria
                $conexion_SAP = DB::connection('sqlsrv_secondary');

                while (($row = fgetcsv($handle, 1000, ',')) !== false) {
                    $data = array_combine($headers, $row);
                    $prv_codigo = $data['prv_codigo'];
                    $pro_codigo = $data['pro_codigo'];
                    $prp_nroordencompra = $data['prp_nroordencompra'];

                    // buscar el proveedor en la base de datos local
                    if (isset($cachedProveedores[$prv_codigo])) {
                        $proveedor = $cachedProveedores[$prv_codigo];
                    } else {
                        $proveedor = Proveedor::where('prv_codigo', $prv_codigo)->first();
                        if (!$proveedor) {
                            // debemos consultar en la tabla
                            $proveedorFound = $conexion_SAP
                                ->table('OCRD')
                                ->where('CardCode', $prv_codigo)
                                ->first();

                            $numerodocumento = ltrim(preg_replace('/^[A-Z]/', '', $proveedorFound->CardCode), '0');

                            $proveedor = Proveedor::create([
                                "prv_codigo" => $proveedorFound->CardCode,
                                "tdo_codigo" => (strlen($numerodocumento) >= 11) ? 'RUC' : 'DNI',
                                "prv_nombre" => $proveedorFound->CardName,
                                "prv_nrodocumento" => $numerodocumento,
                                "prv_usucreacion" => "ANDREWJA",
                                "prv_feccreacion" => date('Y-m-d H:i:s'),
                            ]);
                        }
                        $cachedProveedores[$prv_codigo] = $proveedor;
                    }

                    // buscamos el producto en la base de datos local
                    if (isset($cachedProductos[$pro_codigo])) {
                        $producto = $cachedProductos[$pro_codigo];
                    } else {
                        $producto = Producto::where('pro_codigo', $pro_codigo)->first();
                        if (!$producto) {
                            $productoFound = $conexion_SAP
                                ->table('OITM as T0')
                                ->select([
                                    'T0.ItemCode as pro_codigo',
                                    'T0.ItemName as pro_descripcion',
                                    'T0.BuyUnitMsr as uni_codigo',
                                ])
                                ->where('T0.ItemCode', $pro_codigo)
                                ->first();

                            $producto = Producto::create([
                                "pro_codigo" => $productoFound->pro_codigo,
                                "pro_descripcion" => $productoFound->pro_descripcion,
                                "uni_codigo" => $productoFound->uni_codigo,
                                'pgi_codigo' => 'SIN',
                                'pfa_codigo' => 'SIN',
                                'psf_codigo' => 'SIN',
                                'pma_codigo' => 'SIN',
                                "pro_usucreacion" => "ANDREWJA",
                                "pro_feccreacion" => date('Y-m-d H:i:s'),
                                'pro_fecmodificacion' => null,
                            ]);
                        }
                        $cachedProductos[$pro_codigo] = $producto;
                    }

                    // $record = [
                    //     "prp_nroordencompra" => $prp_nroordencompra,
                    //     "pro_id" => $producto->pro_id,
                    //     "prv_id" => $proveedor->prv_id,
                    //     "prp_fechaultimacompra" => $data['prp_fechaultimacompra'],
                    //     "prp_preciounitario" => $data['prp_preciounitario'],
                    //     "prp_usucreacion" => "ANDREWJA",
                    //     "prp_feccreacion" => date('Y-m-d H:i:s'),
                    // ];

                    ProductoProveedor::create([
                        "prp_nroordencompra" => $prp_nroordencompra,
                        "pro_id" => $producto->pro_id,
                        "prv_id" => $proveedor->prv_id,
                        "prp_fechaultimacompra" => $data['prp_fechaultimacompra'],
                        "prp_preciounitario" => $data['prp_preciounitario'],
                        "prp_usucreacion" => "ANDREWJA",
                        "prp_feccreacion" => date('Y-m-d H:i:s'),
                    ]);
                    // DB::table('tblproductosproveedores_prp')->insert($record);
                    // if (count($records) == $batchSize) {
                    //     DB::table('tblproductosproveedores_prp')->insert($records);
                    //     $records = [];
                    // }
                }

                // if (!empty($records)) {
                //     DB::table('tblproductosproveedores_prp')->insert($records);
                // }

                DB::commit();
                return response()->json(['success' => 'File processed successfully.']);
            } catch (Exception $e) {
                DB::rollback();
                return response()->json(['error' => 'Error processing file.', 'error_message' => $e->getMessage()], 500);
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
