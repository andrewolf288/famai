<?php

namespace App\Http\Controllers;


use App\Proveedor;
use Illuminate\Support\Facades\Validator;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class ProveedorController extends Controller
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
        $nombre = $request->input('prv_nombre', null);
        $numerodocumento = $request->input('prv_nrodocumento', null);

        $query = Proveedor::with(['tipoDocumento','ubigeo']);

        if ($nombre !== null) {
            $query->where('prv_nombre', 'like', '%' . $nombre . '%');
        }

        if ($numerodocumento !== null) {
            $query->where('prv_nrodocumento', 'like', '%' . $numerodocumento . '%');
        }

        $proveedor = $query->paginate($pageSize, ['*'], 'page', $page);

        return response()->json([
            'message' => 'Se listan los proveedores',
            'data' => $proveedor->items(),
            'count' => $proveedor->total()
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
        // Busca el proveedor por su ID
        $proveedor = Proveedor::find($id);

        if (!$proveedor) {
            return response()->json(['error' => 'Proveedor no encontrado'], 404);
        }

        // Retorna una respuesta JSON con el proveedor específico
        return response()->json($proveedor);
    }

    public function store(Request $request)
    {
        $user = auth()->user();
        // Validamos los datos
        $validator = Validator::make($request->all(), [
            'prv_nrodocumento' => 'required|string|max:16|unique:tblproveedores_prv,prv_nrodocumento',
            'prv_nombre' => 'required|string|max:500',
            'tdo_codigo' => 'required|string|exists:tbltiposdocumento_tdo,tdo_codigo',
            'prv_direccion' => 'nullable|string|max:1000',
            'ubi_codigo' => 'nullable|string|exists:tblubigeos_ubi,ubi_codigo',
            'prv_telefono' => 'nullable|string|max:30',
            'prv_contacto' => 'nullable|string|max:150',
            'prv_correo' => 'nullable|string|max:250',
            'prv_whatsapp' => 'nullable|string|max:30',
        ]);

        // Validamos la información
        if ($validator->fails()) {
            return response()->json(["error" => $validator->errors()->toJson()], 400);
        }

        // Creamos el nuevo proveedor
        $proveedor = Proveedor::create(array_merge(
            $validator->validated(),
            [
                "prv_activo" => true,
                "prv_usucreacion" => $user->usu_codigo,
                "prv_fecmodificacion" => null,
            ]
        ));

        // Devolvemos la información
        return response()->json([
            'message' => 'Proveedor registrado exitosamente',
            'data' => $proveedor
        ], 201);
    }


    public function update(Request $request, $id)
    {
        $user = auth()->user();

        $proveedor = Proveedor::find($id);

        if (!$proveedor) {
            return response()->json(['error' => 'Proveedor no encontrado'], 404);
        }

        // Validamos los datos
        $validator = Validator::make($request->all(), [
            'prv_nrodocumento' => [
                'required',
                'string',
                'max:16',
                Rule::unique('tblproveedores_prv', 'prv_nrodocumento')->ignore($id, 'prv_id'),
            ],
            'prv_nombre' => [
                'required',
                'string',
                'max:500',
            ],
            'tdo_codigo' => 'required|string|exists:tbltiposdocumento_tdo,tdo_codigo',
            'prv_direccion' => 'nullable|string|max:1000',
            'ubi_codigo' => 'nullable|string|exists:tblubigeos_ubi,ubi_codigo',
            'prv_telefono' => 'required|string|max:30',
            'prv_contacto' => 'nullable|string|max:150',
            'prv_correo' => 'nullable|string|max:250',
            'prv_whatsapp' => 'nullable|string|max:30',
            'prv_activo' => 'required|boolean',
        ]);

        // Validamos la información
        if ($validator->fails()) {
            return response()->json(["error" => $validator->errors()->toJson()], 400);
        }

        $proveedor->update(array_merge(
            $validator->validated(),
            [
                "prv_usumodificacion" => $user->usu_codigo,
            ]
        ));

        return response()->json([
            'message' => 'Proveedor actualizado correctamente',
            'data' => $proveedor
        ]);
    }
}
