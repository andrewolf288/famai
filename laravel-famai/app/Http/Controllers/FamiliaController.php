<?php

namespace App\Http\Controllers;

use App\Familia;
use Illuminate\Support\Facades\Validator;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class FamiliaController extends Controller
{
    public function index(Request $request)
    {
        $pageSize = $request->input('page_size', 10);
        $page = $request->input('page', 1);
        $codigo = $request->input('pfa_codigo', null);
        $descripcion = $request->input('pfa_descripcion', null);

        $query = Familia::query();

        if ($codigo !== null) {
            $query->where('pfa_codigo', 'like', '%' . $codigo . '%');
        }


        if ($descripcion !== null) {
            $query->where('pfa_descripcion', 'like', '%' . $descripcion . '%');
        }

        $familias = $query->paginate($pageSize, ['*'], 'page', $page);

        return response()->json([
            'message' => 'Se listan las familias',
            'data' => $familias->items(),
            'count' => $familias->total()
        ]);
    }

    public function findFamiliaByQuery(Request $request)
    {
        $query = $request->input('query', null);

        $familias = Familia::where(function ($q) use ($query) {
                $q->where('pfa_codigo', 'like', '%' . $query . '%')
                  ->orWhere('pfa_descripcion', 'like', '%' . $query . '%');
            })
            ->where('pfa_activo', 1)
            ->select('pfa_codigo', 'pfa_descripcion')
            ->get();

        return response()->json($familias);
    }

    public function show($codigo)
    {
        $familia = Familia::find($codigo);

        if (!$familia) {
            return response()->json(['error' => 'Familia no encontrada'], 404);
        }

        return response()->json($familia);
    }

    public function store(Request $request)
    {
        $user = auth()->user();

        $validator = Validator::make($request->all(), [
            'pfa_codigo' => 'required|string|max:3|unique:tblproductosfamilias_pfa,pfa_codigo',
            'pfa_descripcion' => 'required|string|max:100',
        ]);

        if ($validator->fails()) {
            return response()->json(["error" => $validator->errors()->toJson()], 400);
        }

        $familia = Familia::create(array_merge(
            $validator->validated(),
            [
                "pfa_usucreacion" => $user->usu_codigo,
                "pfa_feccreacion" => now(),
            ]
        ));

        return response()->json([
            'message' => 'Familia registrada exitosamente',
            'data' => $familia
        ], 201);
    }

    public function update(Request $request, $codigo)
    {
        $user = auth()->user();

        $familia = Familia::find($codigo);

        if (!$familia) {
            return response()->json(['error' => 'Familia no encontrada'], 404);
        }

        $validator = Validator::make($request->all(), [
            'pfa_descripcion' => 'required|string|max:100',
            'pfa_activo' => 'nullable|boolean',
        ]);

        if ($validator->fails()) {
            return response()->json(["error" => $validator->errors()->toJson()], 400);
        }

        $familia->update(array_merge(
            $validator->validated(),
            [
                "pfa_usumodificacion" => $user->usu_codigo,
                "pfa_fecmodificacion" => now(),
            ]
        ));

        return response()->json([
            'message' => 'Familia actualizada correctamente',
            'data' => $familia
        ]);
    }
}
