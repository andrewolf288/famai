<?php

namespace App\Http\Controllers;

use App\Producto;
use App\ProductoProveedor;
use App\Proveedor;
use App\OrdenCompra;
use App\Cotizacion;
use Exception;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;
use App\FormaPago;
use App\OrdenInternaMateriales;
use App\CotizacionDetalle;

class ProductoProveedorController extends Controller
{
    public function findProveedoresByOrdenInternaMateriales(Request $request)
    {
        $materiales = $request->input('materiales', []);

        $materialesConProducto = OrdenInternaMateriales::select('odm_id', 'pro_id')
            ->whereIn('odm_id', $materiales)
            ->get();

        $gruposPorProducto = $materialesConProducto->groupBy('pro_id');

        $productosSinCotizacion = [];
        $cotizacionesPorGrupo = [];

        foreach ($gruposPorProducto as $pro_id => $materialesDelGrupo) {
            $odmIdsDelGrupo = $materialesDelGrupo->pluck('odm_id')->toArray();
            
            $cotizacionesDelGrupo = CotizacionDetalle::with([
                'cotizacion' => function ($query) {
                    $query->select('coc_id', 'prv_id');
                },
                'cotizacion.proveedor' => function ($query) {
                    $query->select('prv_id', 'prv_nombre');
                }
            ])
                ->select('cod_id', 'odm_id', 'coc_id', 'pro_id')
                ->whereIn('odm_id', $odmIdsDelGrupo)
                ->whereHas('cotizacion', function ($query) {
                    $query->where('coc_estado', 'RPR');
                })
                ->get();

            if ($cotizacionesDelGrupo->isEmpty()) {
                $productosSinCotizacion[] = $pro_id;
            } else {
                $cotizacionesPorGrupo[$pro_id] = $cotizacionesDelGrupo;
            }
        }

        // Si algún grupo no tiene cotizaciones, retornar error
        if (!empty($productosSinCotizacion)) {
            return response()->json([
                'error' => 'Algunos productos no tienen cotizaciones registradas',
                'productos_sin_cotizacion' => $productosSinCotizacion
            ], 400);
        }

        // Obtener todos los prv_id únicos por grupo
        $proveedoresPorGrupo = [];
        foreach ($cotizacionesPorGrupo as $pro_id => $cotizaciones) {
            $proveedoresPorGrupo[$pro_id] = $cotizaciones->pluck('cotizacion.proveedor.prv_id')->unique()->toArray();
        }

        // Encontrar el prv_id común entre todos los grupos
        $prvIdsComunes = null;
        foreach ($proveedoresPorGrupo as $pro_id => $proveedores) {
            if ($prvIdsComunes === null) {
                $prvIdsComunes = $proveedores;
            } else {
                $prvIdsComunes = array_intersect($prvIdsComunes, $proveedores);
            }
        }

        // Si no hay prv_id común, retornar error
        if (empty($prvIdsComunes)) {
            $proveedoresDiferentes = [];
            foreach ($proveedoresPorGrupo as $pro_id => $proveedores) {
                $proveedoresDiferentes = array_merge($proveedoresDiferentes, $proveedores);
            }
            $proveedoresDiferentes = array_unique($proveedoresDiferentes);

            return response()->json([
                'error' => 'Los productos seleccionados tienen diferentes proveedores. No se puede crear una orden de compra con múltiples proveedores.',
                'proveedores_diferentes' => $proveedoresDiferentes
            ], 400);
        }

        // Obtener información de los proveedores comunes
        $proveedoresComunes = Proveedor::select('prv_id', 'prv_nombre')
            ->whereIn('prv_id', $prvIdsComunes)
            ->get()
            ->map(function ($proveedor) {
                return [
                    'prv_id' => $proveedor->prv_id,
                    'prv_nombre' => $proveedor->prv_nombre
                ];
            })
            ->toArray();

        return response()->json($proveedoresComunes);
    }

    public function findCotizacionesByProducto(Request $request)
    {
        $producto = $request->input('producto', null);

        $cotizaciones = Cotizacion::with(['proveedor', 'moneda', 'detalleCotizacion'])
            ->whereHas('detalleCotizacion', function ($query) use ($producto) {
                $query->where('pro_id', $producto);
            })
            ->orderBy('coc_feccreacion', 'desc')
            ->limit(10)
            ->get();

        return response()->json($cotizaciones);
    }

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
        set_time_limit(1200);
        $filePath = storage_path('app/temp/ordenes_compra_proveedor_producto.csv');

        if (!file_exists($filePath)) {
            return response()->json(['error' => 'File not found.'], 404);
        }

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
                            // continue;
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
                            // continue;
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
                                "pro_descripcion" => $productoFound->pro_descripcion ?? 'DESCRIPCION VACIA',
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

                    ProductoProveedor::create([
                        "prp_nroordencompra" => $prp_nroordencompra,
                        "pro_id" => $producto->pro_id,
                        "prv_id" => $proveedor->prv_id,
                        "prp_fechaultimacompra" => $data['prp_fechaultimacompra'],
                        "prp_preciounitario" => $data['prp_preciounitario'],
                        "prp_usucreacion" => "ANDREWJA",
                        "prp_feccreacion" => date('Y-m-d H:i:s'),
                    ]);
                }

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
            ->select('pro_id', 'prv_id', 'prp_fechaultimacompra', 'prp_preciounitario', 'prp_nroordencompra', 'prp_descuentoporcentaje')
            ->whereIn('pro_id', $productos)
            ->orderBy('prp_fechaultimacompra', 'desc')
            ->get()
            ->groupBy('pro_id')
            ->map(function ($group) {
                return $group->first();
            });

        $dataProveedores = $data->map(function ($item, $key) use (&$data) {
            // Buscar la orden de compra para obtener el mon_codigo
            $ordenCompra = OrdenCompra::where('occ_numero', $item->prp_nroordencompra)->first();
            $formaPago = null;
            if ($ordenCompra) {
                $formaPago = FormaPago::where('fpa_codigo', $ordenCompra->fpa_codigo)->first();
            }

            // Obtener datos actualizados del proveedor desde SAP
            $cardCode = $item->proveedor->prv_codigo;
            $proveedorSAP = null;
            
            if ($cardCode) {
                try {
                    $proveedorSAP = DB::select("EXEC dbo.FAM_LOG_Proveedores @parCardCode = ?", [$cardCode]);
                    $proveedorSAP = $proveedorSAP[0] ?? null;
                } catch (\Exception $e) {
                    // Log del error si es necesario
                    $proveedorSAP = null;
                }
            }

            // Actualizar el proveedor en la base de datos si se obtuvieron datos de SAP
            if ($proveedorSAP) {
                $proveedor = $item->proveedor;
                $proveedor->update([
                    'prv_nrodocumento' => $proveedorSAP->RUC,
                    'prv_nombre' => $proveedorSAP->RazSocial,
                    'prv_direccion' => $proveedorSAP->Direccion,
                    'prv_contacto' => $proveedorSAP->Contacto,
                    'prv_telefono' => $proveedorSAP->Telefono,
                    'prv_whatsapp' => $proveedorSAP->Celular,
                    'prv_correo' => $proveedorSAP->E_Mail,
                    'prv_usumodificacion' => auth()->user()->usu_codigo,
                    'prv_fecmodificacion' => now(),
                ]);
                
                // Recargar el modelo para obtener los datos actualizados
                $proveedor->refresh();
            }

            $proveedorArray = $item->proveedor->toArray();

            // Solo para el primer proveedor, ejecuta el stored procedure y agrega CodFormaPago
            if ($key === array_key_first($data->toArray())) {
                $ruc = $item->proveedor->prv_nrodocumento;
                $bancos = DB::select("EXEC dbo.FAM_LOG_Proveedores @parRUC = ?", [$ruc]);
                $primerBanco = count($bancos) > 0 ? $bancos[0] : null;
                $codFormaPago = $primerBanco ? ($primerBanco->CodFormaPago ?? null) : null;
                $proveedorArray['CodFormaPago'] = $codFormaPago;
            }

            return array_merge(
                $proveedorArray,
                [
                    'precio_unitario' => $item->prp_preciounitario,
                    'descuento_porcentaje' => $item->prp_descuentoporcentaje,
                    'pro_id' => $item->pro_id,
                    'mon_codigo' => $ordenCompra ? $ordenCompra->mon_codigo : null,
                    'fpa_descripcion' => $formaPago ? $formaPago->fpa_descripcion : null,
                    'prp_fechaultimacompra' => $item->prp_fechaultimacompra,
                ]
            );
        })->unique('pro_id')->values();

        return response()->json($dataProveedores);
    }

    public function findOrdenCompraByProveedorProducto(Request $request)
    {
        $productos = $request->input('productos', []);
        $proveedorCodigo = $request->input('proveedor', null);

        $proveedor = Proveedor::where('prv_codigo', $proveedorCodigo)->first();

        $data = ProductoProveedor::with('producto', 'proveedor')
            ->whereIn('pro_id', $productos)
            ->where('prv_id', $proveedor->prv_id)
            ->orderBy('prp_fechaultimacompra', 'desc')
            ->get();

        return response()->json($data);
    }

    public function findOrdenCompraByProducto(Request $request)
    {
        $producto = $request->input('producto', null);

        $latestPurchaseIds = ProductoProveedor::select('prp_id')
            ->whereIn('prp_id', function ($query) use ($producto) {
                $query->selectRaw('MAX(prp_id)')
                    ->from('tblproductosproveedores_prp')
                    ->where('pro_id', $producto)
                    ->groupBy('prv_id');
            })
            ->orderByDesc('prp_fechaultimacompra')
            ->limit(5)
            ->pluck('prp_id');

        $result = ProductoProveedor::with(['producto', 'proveedor'])
            ->whereIn('prp_id', $latestPurchaseIds)
            ->orderByDesc('prp_fechaultimacompra')
            ->get();

        $result->each(function ($item) {
            $customQuery = DB::select("
                SELECT coc.coc_numero, coc.coc_fechavalidez, coc.coc_id
                FROM tblproductosproveedores_prp prp 
                INNER JOIN tblordencompracab_occ occ 
                    ON occ.occ_nrosap = prp.prp_nroordencompra 
                INNER JOIN tblordencompradet_ocd ocd 
                    ON ocd.occ_id = occ.occ_id 
                    AND ocd.pro_id = prp.pro_id
                INNER JOIN tblcotizacionesdet_cod as cod 
                    ON cod.odm_id = ocd.odm_id AND prp.pro_id = cod.pro_id
                INNER JOIN tblcotizacionescab_coc as coc
                    ON coc.coc_id = cod.coc_id
                WHERE prp.prp_id = ?
            ", [$item->prp_id]);
    
            $item->cotizacion = $customQuery;
        });

        return response()->json($result);
    }
}
