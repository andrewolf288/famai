<?php

namespace App\Http\Controllers;

use App\Trabajador;
use Illuminate\Support\Facades\Validator;
use Illuminate\Http\Request;

class TrabajadorController extends Controller
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
        $nombre = $request->input('tra_nombre', null);

        $query = Trabajador::with('usuario', 'area', 'sede');

        if($nombre !== null){
            $query->where('tra_nombre', 'like', '%'.$nombre.'%');
        }

        $trabajadores = $query->paginate($pageSize, ['*'], 'page', $page);

        return response()->json([
            'message' => 'Se listan los trabajadores',
            'data' => $trabajadores->items(),
            'count' => $trabajadores->total()
        ]);

    }

    // funcion para traer informacion de un trabajador
    public function show($id)
    {
        $trabajador = Trabajador::find($id);
        if(!$trabajador){
            return response()->json(['message' => 'Trabajador no encontrado'], 404);
        }
        return response()->json($trabajador);
    }

    // funcion para traer informacion simple de trabajadores
    public function indexSimple()
    {
        $trabajadores = Trabajador::where('tra_activo', 1)->whereNotNull('sed_codigo')->select('tra_id', 'tra_nombre')->get();
        return response()->json($trabajadores);
    }

    // buscar trabajador por usuario
    public function findByUsuario($usuario)
    {
        $trabajador = Trabajador::where('usu_codigo', $usuario)->first();
        if(!$trabajador){
            return response()->json(['message' => 'Trabajador no encontrado'], 404);
        }
        return response()->json($trabajador);
    }

    // funcion para crear trabajador
    public function store(Request $request)
    {
        $userAuth = auth()->user();

        $validator = Validator::make($request->all(), [
            'tra_nombre' => 'required|string|max:250',
            'tra_codigosap' => 'nullable|string|max:10',
            'usu_codigo' => 'required|string|max:8|exists:tblusuarios_usu,usu_codigo',
            'are_codigo' => 'required|string|exists:tblareas_are,are_codigo',
            'sed_codigo' => 'required|string|exists:tblsedes_sed,sed_codigo',
        ]);

        if ($validator->fails()) {
            return response()->json(["error" => $validator->errors()->toJson()], 400);
        }

        $trabajador = Trabajador::create([
            'tra_nombre' => $request->tra_nombre,
            'tra_codigosap' => $request->tra_codigosap,
            'tra_activo' => 1,
            'usu_codigo' => $request->usu_codigo,
            'are_codigo' => $request->are_codigo,
            'sed_codigo' => $request->sed_codigo,
            'tra_usucreacion' => $userAuth->usu_codigo,
            'tra_fecmodificacion' => null,
        ]);

        return response()->json($trabajador);
    }

    // funcion para actualizar trabajador
    public function update(Request $request, $id)
    {
        $userAuth = auth()->user(); 
        $trabajador = Trabajador::find($id);

        $validator = Validator::make($request->all(), [
            'tra_nombre' => 'required|string|max:250',
            'tra_codigosap' => 'nullable|string|max:10',
            'usu_codigo' => 'required|string|max:8|exists:tblusuarios_usu,usu_codigo',
            'are_codigo' => 'required|string|exists:tblareas_are,are_codigo',
            'sed_codigo' => 'required|string|exists:tblsedes_sed,sed_codigo',
            'tra_activo' => 'required|boolean',
        ]);

        if ($validator->fails()) {
            return response()->json(["error" => $validator->errors()->toJson()], 400);
        }

        $trabajador->update([
            'tra_nombre' => $request->tra_nombre,
            'tra_codigosap' => $request->tra_codigosap,
            'tra_activo' => $request->tra_activo,
            'usu_codigo' => $request->usu_codigo,
            'are_codigo' => $request->are_codigo,
            'sed_codigo' => $request->sed_codigo,
            'tra_usumodificacion' => $userAuth->usu_codigo,
        ]);
    }
}
