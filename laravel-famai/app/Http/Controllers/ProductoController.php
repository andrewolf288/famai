<?php

namespace App\Http\Controllers;

use App\Producto;
use Illuminate\Support\Facades\Validator;
use Illuminate\Http\Request;

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

        $query = Producto::with(['unidad', 'grupoInventario', 'familia', 'subfamilia', 'marca', 'ultimaCompra.proveedor']);

        if($descripcion !== null){
            $query->where('pro_descripcion', 'like', '%'.$descripcion.'%');
        }

        $productos = $query->paginate($pageSize, ['*'], 'page', $page);

        return response()->json([
            'message' => 'Se listan los productos',
            'data' => $productos->items(),
            'count' => $productos->total()
        ]);

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
        $producto = Producto::with(['unidad', 'grupoInventario', 'familia', 'subfamilia', 'marca', 'ultimaCompra.proveedor'])
                    ->find($id);

        if (!$producto) {
            return response()->json(['error' => 'Producto no encontrado'], 404);
        }

        // Retorna una respuesta JSON con el producto específico
        return response()->json($producto);
    }

    public function storage(Request $request)
    {
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
            'pro_factorunidadmayor' => 'nullable|numeric|min:1|decimal:2',
            'pro_stockminimo' => 'nullable|numeric|min:0|decimal:2',
            'pro_generastock' => 'nullable|boolean',
            'pro_codigosunat' => 'nullable|string|max:8',
        ]);

        // Validamos la información
        if($validator->fails()){
            return response()->json(["error" => $validator->errors()->toJson()], 400);
        }

        // Creamos el nuevo producto
        $producto = Producto::create(array_merge([
            $validator,
            ["pro_activo" => true],
        ]));

        // Devolvemos la información
        return response()->json([
            'message' => 'Producto registrado exitosamente',
            'data' => $producto
        ], 201);
    }
}
