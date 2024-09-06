<?php

namespace App\Http\Controllers;

use App\Rol;
use App\RolModulo;
use Exception;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\Rule;

class RolController extends Controller
{

    // index
    public function index(Request $request)
    {
        $pageSize = $request->input('page_size', 10);
        $page = $request->input('page', 1);
        $descripcion = $request->input('rol_descripcion', null);

        $query = Rol::query();

        if($descripcion !== null){
            $query->where('rol_descripcion', 'like', '%' . $descripcion . '%');
        }

        $roles = $query->paginate($pageSize, ['*'], 'page', $page);

        return response()->json([
            'message' => 'Se listan los roles',
            'data' => $roles->items(),
            'count' => $roles->total()
        ]);
    }

    public function indexSimple()
    {
        $roles = Rol::select('rol_id', 'rol_descripcion')->get();
        return response()->json($roles);
    }

    // traer informacion de modulos por rol
    public function findModulosByRol($id)
    {
        $rol = Rol::with('rolModulo.modulo')
                ->where('rol_id', $id)
                ->get();

        return response()->json($rol);
    }

    // funcion para la creacion de rol
    public function store(Request $request)
    {
        $user = auth()->user();

        try {
            DB::beginTransaction();
            $validator = Validator::make($request->all(), [
                'rol_descripcion' => 'required|string|max:100',
                'modulos' => 'required|array|min:1',
            ]);
    
            // Validamos la información
            if ($validator->fails()) {
                return response()->json(["error" => $validator->errors()->toJson()], 400);
            }
    
            $rol = Rol::create([
                'rol_descripcion' => $request->input('rol_descripcion'),
                'rol_activo' => $request->input('rol_activo', 1),
                'rol_usucreacion' => $user->usu_codigo,
            ]);
    
            $modulos = $request->input('modulos');
            foreach($modulos as $modulo){
                $newRolModulo = RolModulo::create([
                    'rol_id' => $rol->rol_id,
                    'mol_id' => $modulo
                ]);
            }
            DB::commit();
        } catch (Exception $e) {
            DB::rollBack();
            return response()->json(["error" => $e->getMessage()], 500);
        }
    }

    // Actualizar rol
    public function update(Request $request, $id)
    {
        $user = auth()->user();

        $validator = Validator::make($request->all(), [
            'rol_descripcion' => [
                'required',
                'string',
                'max:100',
                Rule::unique('tblroles_rol', 'rol_descripcion')->ignore($id, 'rol_id'),
            ],
            'modulos' => 'required|array|min:1',
        ]);

        // Validamos la información
        if ($validator->fails()) {
            return response()->json(["error" => $validator->errors()->toJson()], 400);
        }

        $rol = Rol::find($id);
        if (!$rol) {
            return response()->json(['error' => 'Rol no encontrado'], 404);
        }

        try{
            DB::beginTransaction();
            // actualizamos el nombre del rol y su informacion de actualizacion
            $rol->update([
                'rol_descripcion' => $request->input('rol_descripcion'),
                'rol_usumodificacion' => $user->usu_codigo,
            ]);
            // primero eliminamos la informacion anterior
            RolModulo::where('rol_id', $id)->delete();

            // ahora vamos a registrar la nueva informacion
            $modulos = $request->input('modulos');
            foreach($modulos as $modulo){
                $newRolModulo = RolModulo::create([
                    'rol_id' => $rol->rol_id,
                    'mol_id' => $modulo
                ]);
            }
            DB::commit();
        } catch(Exception $e) {
            DB::rollBack();
        }
        return response()->json(['message' => 'Rol actualizado correctamente'], 200);
    }
}
