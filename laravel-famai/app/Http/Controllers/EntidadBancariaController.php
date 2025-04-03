<?php

namespace App\Http\Controllers;

use App\EntidadBancaria;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\Rule;

class EntidadBancariaController extends Controller
{
    public function index(Request $request)
    {
        $pageSize = $request->input('page_size', 10);
        $page = $request->input('page', 1);
        $descripcion = $request->input('eba_descripcion', null);

        $query = EntidadBancaria::query();

        if ($descripcion !== null) {
            $query->where('eba_descripcion', 'like', '%' . $descripcion . '%');
        }

        $entidadesbancaria = $query->paginate($pageSize, ['*'], 'page', $page);

        return response()->json([
            'message' => 'Se listan las entidades bancarias',
            'data' => $entidadesbancaria->items(),
            'count' => $entidadesbancaria->total()
        ]);
    }

    public function indexSimple()
    {
        $entidadesbancarias = EntidadBancaria::where('eba_activo', 1)->select('eba_id', 'eba_descripcion', 'eba_codigo')->get();
        return response()->json($entidadesbancarias);
    }

    public function show($id)
    {
        $entidadbancaria = EntidadBancaria::find($id);

        if (!$entidadbancaria) {
            return response()->json(['error' => 'Entidad bancaria no encontrada'], 404);
        }

        return response()->json($entidadbancaria);
    }

    public function store(Request $request)
    {
        $user = auth()->user();

        $validator = Validator::make($request->all(), [
            'eba_descripcion' => 'required|string',
            'eba_codigo' => 'required|string|unique:tblentidadbancaria_eba,eba_codigo'
        ]);

        if ($validator->fails()) {
            return response()->json(["error" => $validator->errors()->toJson()], 400);
        }

        $entidadBancaria = EntidadBancaria::create([
            'eba_codigo' => $request->eba_codigo,
            'eba_descripcion' => $request->eba_descripcion,
            'eba_usucreacion' => $user->usu_codigo,
            'eba_fecmodificacion' => null,
        ]);

        return response()->json([
            'message' => 'Entidad bancaria registrada exitosamente',
            'data' => $entidadBancaria
        ], 201);
    }

    public function update(Request $request, $id)
    {
        $user = auth()->user();

        $entidadbancaria = EntidadBancaria::find($id);

        if (!$entidadbancaria) {
            return response()->json(['error' => 'Entidad bancaria no encontrada'], 404);
        }

        $validator = Validator::make($request->all(), [
            'eba_descripcion' => 'required|string',
            'eba_codigo' => [
                'required',
                'string',
                Rule::unique('tblentidadbancaria_eba', 'eba_codigo')->ignore($id, 'eba_id'),
            ],
            'eba_activo' => 'required|boolean',
        ]);

        if ($validator->fails()) {
            return response()->json(["error" => $validator->errors()->toJson()], 400);
        }

        $entidadbancaria->update(
            [
                'eba_descripcion' => $request->eba_descripcion,
                'eba_codigo' => $request->eba_codigo,
                'eba_activo' => $request->eba_activo,
                'eba_usumodificacion' => $user->usu_codigo,
            ]
        );

        return response()->json([
            'message' => 'Entidad bancaria actualizada correctamente',
            'data' => $entidadbancaria
        ]);
    }
}
