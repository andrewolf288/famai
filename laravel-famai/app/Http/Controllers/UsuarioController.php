<?php

namespace App\Http\Controllers;

use App\User;
use Exception;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\Rule;

class UsuarioController extends Controller
{
    // funcion para mostrar informacion de usuarios
    public function index(Request $request)
    {
        $pageSize = $request->input('page_size', 10);
        $page = $request->input('page', 1);
        $codigo = $request->input('usu_codigo', null);
        $nombre = $request->input('usu_nombre', null);

        $query = User::with('rol');

        if ($codigo !== null) {
            $query->where('usu_codigo', 'like', '%' . $codigo . '%');
        }

        if ($nombre !== null) {
            $query->where('usu_nombre', 'like', '%' . $nombre . '%');
        }

        $users = $query->paginate($pageSize, ['*'], 'page', $page);

        return response()->json([
            'message' => 'Se listan los usuarios',
            'data' => $users->items(),
            'count' => $users->total()
        ]);
    }

    // funcion para mostrar de manera simplicada los usuarios
    public function indexSimple()
    {
        $users = User::where('usu_activo', 1)->select('usu_codigo', 'usu_nombre')->get();
        return response()->json($users);
    }

    // funcion para mostrar informacion de un usuario
    public function show($id)
    {
        $user = User::with('rol')->find($id);

        if (!$user) {
            return response()->json(['error' => 'Usuario no encontrado'], 404);
        }

        $user->makeHidden('usu_contrasena');

        return response()->json($user);
    }

    // funcion para actualizar informacion de un usuario
    public function update(Request $request, $id)
    {
        $userAuth = auth()->user();

        $user = User::find($id);

        if (!$user) {
            return response()->json(['error' => 'Usuario no encontrado'], 404);
        }

        $validator = Validator::make($request->all(), [
            'usu_codigo' => [
                'required',
                'string',
                'max:8',
                Rule::unique('tblusuarios_usu', 'usu_codigo')->ignore($id, 'usu_codigo'),
            ],
            'usu_nombre' => 'required|string|max:250',
            'rol_id' => 'required|integer|exists:tblroles_rol,rol_id',
            'usu_activo' => 'required|boolean',
        ]);

        // Validamos la información
        if ($validator->fails()) {
            return response()->json(["error" => $validator->errors()->toJson()], 400);
        }

        $user->update([
            'usu_codigo' => $request->usu_codigo,
            'usu_nombre' => $request->usu_nombre,
            'rol_id' => $request->rol_id,
            'usu_activo' => $request->usu_activo,
            'usu_usumodificacion' => $userAuth->usu_codigo,
        ]);

        return response()->json([
            'message' => 'Usuario actualizado correctamente',
            'data' => $user
        ]);
    }

    // funcion para guardar informacion de un usuario
    public function store(Request $request)
    {
        $userAuth = auth()->user();
        try {
            DB::beginTransaction();
            $validator = Validator::make($request->all(), [
                'usu_codigo' => 'required|string|max:8|unique:tblusuarios_usu',
                'usu_contrasena' => 'required|string|min:6',
                'usu_nombre' => 'required|string|max:250',
                'rol_id' => 'required|integer|exists:tblroles_rol,rol_id',
                // 'sed_codigo' => 'required|string|exists:tblsedes_sed,sed_codigo',
                // 'are_codigo' => 'required|integer|exists:tblareas_are,are_codigo',
            ]);

            if ($validator->fails()) {
                return response()->json(["error" => $validator->errors()->toJson()], 400);
            }

            $user = User::create([
                'usu_codigo' => $request->usu_codigo,
                'usu_contrasena' => bcrypt($request->usu_contrasena),
                'usu_nombre' => $request->usu_nombre,
                'rol_id' => $request->rol_id,
                'usu_usucreacion' => $userAuth->usu_codigo,
                'usu_fecmodificacion' => null,
            ]);
            // $trabajador = Trabajador::create([
            //     'usu_codigo' => $user->usu_codigo,
            //     'tra_nombre' => $request->usu_nombre,
            //     'sed_codigo' => $request->sed_codigo,
            //     'are_codigo' => $request->are_codigo,
            //     'tra_activo' => 1,
            //     'tra_usucreacion' => $userAuth->usu_codigo,
            //     'tra_fecmodificacion' => null,
            // ]);

            DB::commit();
            return response()->json([
                'message' => 'Usuario registrado exitosamente',
                'user' => $user
            ], 201);
        } catch (Exception $e) {
            DB::rollBack();
            return response()->json(["error" => $e->getMessage()], 500);
        }
    }

    // reset password usuario
    public function resetPassword(Request $request, $codigo)
    {
        $user = User::where('usu_codigo', $codigo)->first();

        if (!$user) {
            return response()->json(['error' => 'Usuario no encontrado'], 404);
        }

        $user->update([
            'usu_contrasena' => bcrypt($request->usu_contrasena),
            'usu_usumodificacion' => auth()->user()->usu_codigo,
        ]);

        return response()->json([
            'message' => 'Contraseña actualizada correctamente',
            'data' => $user
        ]);
    }
}
