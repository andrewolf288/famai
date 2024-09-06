<?php

namespace App\Http\Controllers;

use App\Producto;
use Illuminate\Support\Facades\Validator;
use Illuminate\Http\Request;
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

        $query = Producto::with(['unidad', 'grupoInventario', 'familia', 'subfamilia', 'marca', 'ultimaCompra.proveedor']);

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
        
        if ($query === null) {
            return response()->json(['error' => 'El parámetro de consulta es requerido'], 400);
        }
    
        $symbols = ['!', '@', '#', '$']; // Aquí defines los símbolos permitidos
    
        $pattern = '/[' . preg_quote(implode('', $symbols), '/') . ']/';
    
        $subqueries = preg_split($pattern, $query);
    
        $materialesQuery = Producto::where('pro_activo', 1);
    
        foreach ($subqueries as $subquery) {
            $materialesQuery->where(function($q) use ($subquery) {
                $q->where('pro_descripcion', 'like', '%' . $subquery . '%')
                  ->orWhere('pro_codigo', 'like', '%' . $subquery . '%');
            });
        }
    
        $materiales = $materialesQuery->select('pro_id', 'pro_codigo', 'pro_descripcion')->get();
    
        return response()->json($materiales);
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
            'pro_codigo' => 'required|string|max:16|unique:tblproductos_pro,pro_codigo',
            'pro_descripcion' => 'required|string|max:250|unique:tblproductos_pro,pro_descripcion',
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
            ],
            'pro_descripcion' => [
                'required',
                'string',
                'max:250',
                Rule::unique('tblproductos_pro', 'pro_descripcion')->ignore($id, 'pro_id'),
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
