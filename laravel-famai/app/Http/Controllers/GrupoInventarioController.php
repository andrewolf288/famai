<?php

namespace App\Http\Controllers;

use App\GrupoInventario;
use Illuminate\Support\Facades\Validator;
use Illuminate\Http\Request;

class GrupoInventarioController extends Controller
{
    public function index(Request $request)
    {
        $pageSize = $request->input('page_size', 10);
        $page = $request->input('page', 1);
        $descripcion = $request->input('pgi_descripcion', null);

        $query = GrupoInventario::query();

        if ($descripcion !== null) {
            $query->where('pgi_descripcion', 'like', '%' . $descripcion . '%');
        }

        $grupos = $query->paginate($pageSize, ['*'], 'page', $page);

        return response()->json([
            'message' => 'Se listan los grupos de inventario',
            'data' => $grupos->items(),
            'count' => $grupos->total()
        ]);
    }

    public function show($id)
    {
        $grupo = GrupoInventario::find($id);

        if (!$grupo) {
            return response()->json(['error' => 'Grupo de inventario no encontrado'], 404);
        }

        return response()->json($grupo);
    }

    public function store(Request $request)
    {
        $user = auth()->user();

        $validator = Validator::make($request->all(), [
            'pgi_codigo' => [
                'required',
                'string',
                'size:3',
                'unique:tblproductosgruposinventario_pgi,pgi_codigo',
            ],
            'pgi_descripcion' => 'required|string|max:100',
            'pgi_activo' => 'required|boolean',
        ]);

        if ($validator->fails()) {
            return response()->json(["error" => $validator->errors()->toJson()], 400);
        }

        $grupo = GrupoInventario::create(array_merge(
            $validator->validated(),
            [
                "pgi_usucreacion" => $user->usu_codigo,
                "pgi_feccreacion" => now(),
            ]
        ));

        return response()->json([
            'message' => 'Grupo de inventario registrado exitosamente',
            'data' => $grupo
        ], 201);
    }

    public function update(Request $request, $id)
    {
        $user = auth()->user();

        $grupo = GrupoInventario::find($id);

        if (!$grupo) {
            return response()->json(['error' => 'Grupo de inventario no encontrado'], 404);
        }

        $validator = Validator::make($request->all(), [
            'pgi_descripcion' => 'required|string|max:100',
            'pgi_activo' => 'nullable|boolean',
        ]);

        if ($validator->fails()) {
            return response()->json(["error" => $validator->errors()->toJson()], 400);
        }

        $grupo->update(array_merge(
            $validator->validated(),
            [
                "pgi_usumodificacion" => $user->usu_codigo,
                "pgi_fecmodificacion" => now(),
            ]
        ));

        return response()->json([
            'message' => 'Grupo de inventario actualizado correctamente',
            'data' => $grupo
        ]);
    }

    public function findGrupoInventarioByQuery(Request $request)
    {
        $query = $request->input('query', null);

        $grupos = GrupoInventario::where(function ($q) use ($query) {
                $q->where('pgi_descripcion', 'like', '%' . $query . '%');
            })
            ->where('pgi_activo', 1)
            ->select('pgi_codigo', 'pgi_descripcion')
            ->get();

        return response()->json($grupos);
    }
}
