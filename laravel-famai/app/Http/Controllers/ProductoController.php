<?php

namespace App\Http\Controllers;

use App\AlmacenProducto;
use App\Producto;
use Illuminate\Support\Facades\Validator;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;

class ProductoController extends Controller
{
    /**
     * Display a listing of the resource.
     *
     * @return \Illuminate\Http\Response
     */
    public function index(Request $request)
    {
        $pageSize = $request->input('page_size', 10);
        $page = $request->input('page', 1);
        $descripcion = $request->input('pro_descripcion', null);
        $modeloMaquina = $request->input('pro_modelomaquina', null);
        $codigoMarca = $request->input('pro_codigomarca', null);
        $marcaDescripcion = $request->input('pma_descripcion', null);
        $almID = $request->input('alm_id', 1);

        $query = Producto::with([
            'unidad',
            'grupoInventario',
            'familia',
            'subfamilia',
            'marca',
            'ultimaCompra.proveedor',
            'stock' => function ($q) use ($almID) {
                // Filtrar por almacén si se especifica
                if ($almID !== null) {
                    // Filtrar por almacén si se especifica
                    $q->where('alm_id', $almID)
                        ->select('pro_id', 'alm_id', 'alp_stock');
                } else {
                    // Si no hay alm_id, devolver stock como null
                    $q->selectRaw('null as alp_stock');
                }
            }
        ]);

        if ($descripcion !== null) {
            $query->where('pro_descripcion', 'like', '%' . $descripcion . '%');
        }

        if ($modeloMaquina !== null) {
            $query->where('pro_modelomaquina', 'like', '%' . $modeloMaquina . '%');
        }

        if ($codigoMarca !== null) {
            $query->where('pro_codigomarca', 'like', '%' . $codigoMarca . '%');
        }

        if ($marcaDescripcion !== null) {
            $query->whereHas('marca', function ($q) use ($marcaDescripcion) {
                $q->where('pma_descripcion', 'like', '%' . $marcaDescripcion . '%');
            });
        }

        $productos = $query->paginate($pageSize, ['*'], 'page', $page);

        return response()->json([
            'message' => 'Se listan los productos',
            'data' => $productos->items(),
            'count' => $productos->total()
        ]);
    }

    /**public function findProductoByQuery(Request $request)
    {
        $query = $request->input('query', null);
        // Realiza la búsqueda de materiales por nombre o código
        $materiales = Producto::where('pro_descripcion', 'like', '%' . $query . '%')
            ->orWhere('pro_codigo', 'like', '%' . $query . '%')
            ->where('pro_activo', 1)
            ->select('pro_id', 'pro_codigo', 'pro_descripcion')
            ->get();

        // Devuelve los materiales en formato JSON
        return response()->json($materiales);
    }**/

    public function findProductoByQuery(Request $request)
    {
        $query = $request->input('query', null);
        $almID = $request->input('alm_id', '01_AQPAG');

        if ($query === null) {
            return response()->json(['error' => 'El parámetro de consulta es requerido'], 400);
        }
        $symbol = '+';
        $subqueries = explode($symbol, $query);
        // Construir la consulta
        $queryBuilder = DB::connection('sqlsrv_secondary')
            ->table('OITM as T0')
            ->join('OITW as T1', 'T0.ItemCode', '=', 'T1.ItemCode')
            ->select([
                'T0.ItemCode as pro_codigo',
                'T0.ItemName as pro_descripcion',
                'T0.BuyUnitMsr as uni_codigo',
                'T1.OnHand as alp_stock'
            ])
            ->selectRaw('T0.ItemCode as pro_id')
            ->where('T1.WhsCode', '=', $almID);

        foreach ($subqueries as $term) {
            $queryBuilder->where(function ($q) use ($term) {
                $q->where('T0.ItemCode', 'like', '%' . $term . '%')
                    ->orWhere('T0.ItemName', 'like', '%' . $term . '%');
            });
        }

        // Ejecutar la consulta y devolver los resultados
        $results = $queryBuilder->get();

        return response()->json($results);
    }

    public function findProductoByQuery2(Request $request)
    {
        $query = $request->input('query', null);
        $almID = $request->input('alm_id', '01_AQPAG');

        if ($query === null) {
            return response()->json(['error' => 'El parámetro de consulta es requerido'], 400);
        }
        $symbol = '+';
        $subqueries = explode($symbol, $query);
        // Construir la consulta
        $queryBuilder = DB::connection('sqlsrv_secondary')
            ->table('OITM as T0')
            ->leftJoin('OITW as T1', function ($join) use ($almID) {
                $join->on('T0.ItemCode', '=', 'T1.ItemCode')
                    ->where('T1.WhsCode', '=', $almID);
            })
            ->select([
                'T0.ItemCode as pro_codigo',
                'T0.ItemName as pro_descripcion',
                'T0.BuyUnitMsr as uni_codigo',
                'T1.OnHand as alp_stock'
            ])
            ->selectRaw('T0.ItemCode as pro_id');

        foreach ($subqueries as $term) {
            $queryBuilder->where(function ($q) use ($term) {
                $q->where('T0.ItemCode', 'like', '%' . $term . '%')
                    ->orWhere('T0.ItemName', 'like', '%' . $term . '%');
            });
        }

        // Ejecutar la consulta y devolver los resultados
        $results = $queryBuilder->get();

        return response()->json($results);
    }

    public function findProductoByQuery3(Request $request)
    {
        $query = $request->input('query', null);
        $almID = $request->input('alm_id', '01_AQPAG');

        if ($query === null) {
            return response()->json(['error' => 'El parámetro de consulta es requerido'], 400);
        }
        $symbol = '+';
        $subqueries = explode($symbol, $query);
        // Construir la consulta
        $queryBuilder = DB::connection('sqlsrv_secondary')
            ->table('OITM as T0')
            ->join('OITW as T1', 'T0.ItemCode', '=', 'T1.ItemCode')
            ->join('OILM as T2', 'T0.ItemCode', '=', 'T2.ItemCode')
            ->select([
                'T0.ItemCode as pro_codigo',
                'T0.ItemName as pro_descripcion',
                'T1.WhsCode',
                // DB::raw('SUM(T2.InQty - T2.OutQty) as alp_stock'),
                DB::raw('MAX(T1.OnOrder) as alp_stock'),
                'T0.CntUnitMsr',
                'T1.AvgPrice',
                'T0.validFor',
                'T0.InvntItem',
                DB::raw('MAX(T2.DocDate) as UltimaFechaMovimiento'),
                DB::raw(
                    "(CASE 
                        WHEN (
                            SELECT MAX(OPDN.DocDate) 
                            FROM OPDN 
                            JOIN PDN1 ON OPDN.DocEntry = PDN1.DocEntry 
                            WHERE PDN1.ItemCode = T0.ItemCode
                        ) IS NULL 
                        THEN (
                            SELECT MAX(OIGN.DocDate) 
                            FROM OIGN 
                            JOIN IGN1 ON OIGN.DocEntry = IGN1.DocEntry 
                            WHERE IGN1.ItemCode = T0.ItemCode
                        )
                        ELSE (
                            SELECT MAX(OPDN.DocDate) 
                            FROM OPDN 
                            JOIN PDN1 ON OPDN.DocEntry = PDN1.DocEntry 
                            WHERE PDN1.ItemCode = T0.ItemCode
                        )
                        END) as UltimaFechaIngreso"
                )
            ])
            ->selectRaw('T0.ItemCode as pro_id')
            ->where('T1.WhsCode', '=', $almID)
            // ->where('T2.Warehouse', '=', $almID)
            //->where('T2.LocCode', '=', $almID)
            // ->where('T1.WhsCode', '=', $almID)
            ->where('T0.validFor', '=', 'Y')
            // ->whereDate('T2.CreateDate', '<=', now())
            ->groupBy(
                'T0.ItemCode',
                'T0.ItemName',
                'T1.WhsCode',
                'T0.CntUnitMsr',
                'T1.AvgPrice',
                'T0.validFor',
                'T0.InvntItem',
                'T0.frozenFor',
                'T1.ItemCode '
            );

        foreach ($subqueries as $term) {
            $queryBuilder->where(function ($q) use ($term) {
                $q->where('T0.ItemCode', 'like', '%' . $term . '%')
                    ->orWhere('T0.ItemName', 'like', '%' . $term . '%');
            });
        }
        $queryBuilder->orderBy('T0.ItemName', 'asc');
        $queryBuilder->orderBy('alp_stock', 'desc');
        $queryBuilder->orderBy('UltimaFechaIngreso', 'desc');

        // Ejecutar la consulta y devolver los resultados
        $results = $queryBuilder->get();

        return response()->json($results);

        // Devolver los resultados filtrados en formato JSON
        return response()->json($filteredResults);
    }

    /**
     * Display the specified resource.
     *
     * @param  int  $id
     * @return \Illuminate\Http\Response
     */
    public function show($id)
    {
        // Busca el producto por su ID
        $producto = Producto::find($id);

        if (!$producto) {
            return response()->json(['error' => 'Producto no encontrado'], 404);
        }

        // Retorna una respuesta JSON con el producto específico
        return response()->json($producto);
    }

    public function store(Request $request)
    {
        $user = auth()->user();
        // Validamos los datos
        $validator = Validator::make($request->all(), [
            'pro_codigo' => [
                'required',
                'string',
                'max:16',
                'unique:tblproductos_pro,pro_codigo',
                'regex:/^[^+]*$/', // No permitir el caracter '+'
            ],
            'pro_descripcion' => [
                'required',
                'string',
                'max:250',
                'unique:tblproductos_pro,pro_descripcion',
                'regex:/^[^+]*$/', // No permitir el caracter '+'
            ],
            'uni_codigo' => 'required|string|exists:tblunidades_uni,uni_codigo',
            'pgi_codigo' => 'required|string|exists:tblproductosgruposinventario_pgi,pgi_codigo',
            'pfa_codigo' => 'required|string|exists:tblproductosfamilias_pfa,pfa_codigo',
            'psf_codigo' => 'required|string|exists:tblproductossubfamilias_psf,psf_codigo',
            'pma_codigo' => 'required|string|exists:tblproductosmarcas_pma,pma_codigo',
            'pro_codigosap' => 'nullable|string|max:16',
            'uni_codigomayor' => 'nullable|string|exists:tblunidades_uni,uni_codigo',
            'pro_factorunidadmayor' => 'nullable|numeric|min:1',
            'pro_stockminimo' => 'nullable|numeric|min:0',
            'pro_generastock' => 'nullable|boolean',
            'pro_codigosunat' => 'nullable|string|max:8',
            'pro_codigomarca' => 'nullable|string',
            'pro_medidas' => 'nullable|string',
            'pro_modelomaquina' => 'nullable|string',
            'pro_observacion' => 'nullable|string',
        ]);

        // Validamos la información
        if ($validator->fails()) {
            return response()->json(["error" => $validator->errors()->toJson()], 400);
        }

        // Creamos el nuevo producto
        $producto = Producto::create(array_merge(
            $validator->validated(),
            [
                "pro_activo" => true,
                "pro_usucreacion" => $user->usu_codigo,
                "pro_fecmodificacion" => null,
            ]
        ));

        // Devolvemos la información
        return response()->json([
            'message' => 'Producto registrado exitosamente',
            'data' => $producto
        ], 201);
    }


    public function update(Request $request, $id)
    {
        $user = auth()->user();

        $producto = Producto::find($id);

        if (!$producto) {
            return response()->json(['error' => 'Producto no encontrado'], 404);
        }

        // Validamos los datos
        $validator = Validator::make($request->all(), [
            'pro_codigo' => [
                'required',
                'string',
                'max:16',
                Rule::unique('tblproductos_pro', 'pro_codigo')->ignore($id, 'pro_id'),
                'regex:/^[^+]*$/', // No permitir el carácter '+'
            ],
            'pro_descripcion' => [
                'required',
                'string',
                'max:250',
                Rule::unique('tblproductos_pro', 'pro_descripcion')->ignore($id, 'pro_id'),
                'regex:/^[^+]*$/', // No permitir el carácter '+'
            ],
            'uni_codigo' => 'required|string|exists:tblunidades_uni,uni_codigo',
            'pgi_codigo' => 'required|string|exists:tblproductosgruposinventario_pgi,pgi_codigo',
            'pfa_codigo' => 'required|string|exists:tblproductosfamilias_pfa,pfa_codigo',
            'psf_codigo' => 'required|string|exists:tblproductossubfamilias_psf,psf_codigo',
            'pma_codigo' => 'required|string|exists:tblproductosmarcas_pma,pma_codigo',
            'pro_codigosap' => 'nullable|string|max:16',
            'uni_codigomayor' => 'nullable|string|exists:tblunidades_uni,uni_codigo',
            'pro_factorunidadmayor' => 'nullable|numeric|min:1',
            'pro_stockminimo' => 'nullable|numeric|min:0',
            'pro_generastock' => 'nullable|boolean',
            'pro_codigosunat' => 'nullable|string|max:8',
            'pro_codigomarca' => 'nullable|string',
            'pro_medidas' => 'nullable|string',
            'pro_modelomaquina' => 'nullable|string',
            'pro_observacion' => 'nullable|string',
            'pro_activo' => 'required|boolean',
        ]);

        // Validamos la información
        if ($validator->fails()) {
            return response()->json(["error" => $validator->errors()->toJson()], 400);
        }

        $producto->update(array_merge(
            $validator->validated(),
            [
                "pro_usumodificacion" => $user->usu_codigo,
            ]
        ));

        return response()->json([
            'message' => 'Producto actualizado correctamente',
            'data' => $producto
        ]);
    }
}
