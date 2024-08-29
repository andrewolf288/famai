<?php

namespace App\Http\Controllers;

use App\Almacen;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\Rule;

class AlmacenController extends Controller
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
        $codigo = $request->input('alm_codigo', null);
        $descripcion = $request->input('alm_descripcion', null);
        $tipo = $request->input('alm_tipo', null);

        $query = Almacen::query();

        if ($codigo !== null) {
            $query->where('alm_codigo', 'like', '%' . $codigo . '%');
        }

        if ($descripcion !== null) {
            $query->where('alm_descripcion', 'like', '%' . $descripcion . '%');
        }

        if ($tipo !== null) {
            $query->where('alm_tipo', 'like', '%' . $tipo . '%');
        }

        $almacenes = $query->paginate($pageSize, ['*'], 'page', $page);

        return response()->json([
            'message' => 'Se listan los almacenes',
            'data' => $almacenes->items(),
            'count' => $almacenes->total()
        ]);
    }

    /**
     * Store a newly created resource in storage.
     *
     * @param  \Illuminate\Http\Request  $request
     * @return \Illuminate\Http\Response
     */
    public function store(Request $request)
    {
        $user = auth()->user();

        $validator = Validator::make($request->all(), [
            'alm_codigo' => [
                'required',
                'string',
                'max:16',
                Rule::unique('tblalmacenes_alm', 'alm_codigo'),
            ],
            'alm_descripcion' => 'required|string|max:250',
            'alm_tipo' => 'nullable|string|max:50',
        ]);

        if ($validator->fails()) {
            return response()->json(["error" => $validator->errors()->toJson()], 400);
        }

        $almacen = Almacen::create(array_merge(
            $validator->validated(),
            [
                "alm_usucreacion" => $user->usu_codigo,
                "alm_feccreacion" => now(),
            ]
        ));

        return response()->json([
            'message' => 'Almacén registrado exitosamente',
            'data' => $almacen
        ], 201);
    }

    public function findAlmacenByQuery(Request $request)
    {
        $query = $request->input('query', null);
        $activo = 1;

        // Realizar la búsqueda en la tabla de almacenes
        $almacenes = Almacen::where(function ($q) use ($query) {
                $q->where('alm_codigo', 'like', '%' . $query . '%')
                ->orWhere('alm_descripcion', 'like', '%' . $query . '%')
                ->orWhere('alm_tipo', 'like', '%' . $query . '%');;
            })
            ->when($activo == 1, function ($q) {
                $q->where('alm_activo', 1);
            })
            ->select('alm_id', 'alm_codigo', 'alm_descripcion', 'alm_tipo')
            ->get();

        return response()->json($almacenes);
    }
    /**
     * Display the specified resource.
     *
     * @param  int  $id
     * @return \Illuminate\Http\Response
     */
    public function show($id)
    {
        $almacen = Almacen::find($id);

        if (!$almacen) {
            return response()->json(['error' => 'Almacén no encontrado'], 404);
        }

        return response()->json($almacen);
    }

    /**
     * Update the specified resource in storage.
     *
     * @param  \Illuminate\Http\Request  $request
     * @param  int  $id
     * @return \Illuminate\Http\Response
     */
    public function update(Request $request, $id)
    {
        $user = auth()->user();

        $almacen = Almacen::find($id);

        if (!$almacen) {
            return response()->json(['error' => 'Almacén no encontrado'], 404);
        }

        $validator = Validator::make($request->all(), [
            'alm_codigo' => [
                'required',
                'string',
                'max:16',
                Rule::unique('tblalmacenes_alm', 'alm_codigo')->ignore($id, 'alm_id'),
            ],
            'alm_descripcion' => 'required|string|max:250',
            'alm_tipo' => 'nullable|string|max:50',
        ]);

        if ($validator->fails()) {
            return response()->json(["error" => $validator->errors()->toJson()], 400);
        }

        $almacen->update(array_merge(
            $validator->validated(),
            [
                "alm_usumodificacion" => $user->alm_codigo,
                "alm_fecmodificacion" => now(),
            ]
        ));

        return response()->json([
            'message' => 'Almacén actualizado correctamente',
            'data' => $almacen
        ]);
    }
}
