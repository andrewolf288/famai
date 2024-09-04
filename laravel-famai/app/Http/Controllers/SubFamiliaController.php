<?php

namespace App\Http\Controllers;

use App\Subfamilia;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class SubFamiliaController extends Controller
{
    public function index(Request $request)
    {
        $pageSize = $request->input('page_size', 10);
        $page = $request->input('page', 1);
        $descripcion = $request->input('psf_descripcion', null);
        $familiaCodigo = $request->input('pfa_codigo', null);

        $query = Subfamilia::with(['familia']);

        if ($descripcion !== null) {
            $query->where('psf_descripcion', 'like', '%' . $descripcion . '%');
        }

        if ($familiaCodigo !== null) {
            $query->where('pfa_codigo', $familiaCodigo);
        }

        $subfamilias = $query->paginate($pageSize, ['*'], 'page', $page);

        return response()->json([
            'message' => 'Se listan las subfamilias',
            'data' => $subfamilias->items(),
            'count' => $subfamilias->total()
        ]);
    }

    public function indexSimple()
    {
        $subfamilias = Subfamilia::where('psf_activo', 1)->select('psf_codigo', 'psf_descripcion')->get();
        return response()->json($subfamilias);
    }


    public function show($id)
    {
        $subfamilia = Subfamilia::find($id);

        if (!$subfamilia) {
            return response()->json(['error' => 'Subfamilia no encontrada'], 404);
        }

        return response()->json($subfamilia);
    }

    public function findSubFamiliaByQuery(Request $request)
    {
        $query = $request->input('query', null);

        $subfamilias = Subfamilia::where(function ($q) use ($query) {
                $q->where('psf_descripcion', 'like', '%' . $query . '%')
                  ->orWhere('psf_codigo', 'like', '%' . $query . '%');
            })
            ->where('psf_activo', 1)
            ->select('psf_codigo', 'pfa_codigo', 'psf_descripcion')
            ->get();

        return response()->json($subfamilias);
    }

    public function store(Request $request)
    {
        $user = auth()->user();

        $validator = Validator::make($request->all(), [
            'psf_codigo' => 'required|string|max:3|unique:tblproductossubfamilias_psf,psf_codigo',
            'pfa_codigo' => 'required|string|max:3|exists:tblproductosfamilias_pfa,pfa_codigo',
            'psf_descripcion' => 'required|string|max:100',
            'psf_activo' => 'nullable|boolean',
        ]);

        if ($validator->fails()) {
            return response()->json(["error" => $validator->errors()->toJson()], 400);
        }

        $subfamilia = Subfamilia::create(array_merge(
            $validator->validated(),
            [
                "psf_usucreacion" => $user->usu_codigo,
                "psf_feccreacion" => now(),
            ]
        ));

        return response()->json([
            'message' => 'Subfamilia registrada exitosamente',
            'data' => $subfamilia
        ], 201);
    }

    public function update(Request $request, $id)
    {
        $user = auth()->user();

        $subfamilia = Subfamilia::find($id);

        if (!$subfamilia) {
            return response()->json(['error' => 'Subfamilia no encontrada'], 404);
        }

        $validator = Validator::make($request->all(), [
            'pfa_codigo' => 'required|string|max:3|exists:tblproductosfamilias_pfa,pfa_codigo',
            'psf_descripcion' => 'required|string|max:100',
            'psf_activo' => 'nullable|boolean',
        ]);

        if ($validator->fails()) {
            return response()->json(["error" => $validator->errors()->toJson()], 400);
        }

        $subfamilia->update(array_merge(
            $validator->validated(),
            [
                "psf_usumodificacion" => $user->usu_codigo,
                "psf_fecmodificacion" => now(),
            ]
        ));

        return response()->json([
            'message' => 'Subfamilia actualizada correctamente',
            'data' => $subfamilia
        ]);
    }
}
