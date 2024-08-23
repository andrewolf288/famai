<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use App\User;
use Tymon\JWTAuth\Exceptions\JWTException;
use Tymon\JWTAuth\Facades\JWTAuth;

class AuthController extends Controller
{
    /**
     * Create a new AuthController instance.
     *
     * @return void
     */
    public function __construct()
    {
        $this->middleware('auth:api', ['except' => ['login']]);
    }

    /**
     * Get a JWT via given credentials.
     *
     * @return \Illuminate\Http\JsonResponse
     */
    public function login(Request $request)
    {
        $request->validate([
            'usu_codigo' => 'required|string',
            'usu_contrasena' => 'required|string',
        ]);

        // Mapear 'usu_contrasena' a 'password'
        $credentials = [
            'usu_codigo' => $request->input('usu_codigo'),
            'password' => $request->input('usu_contrasena'),
        ];

        $user = User::where('usu_codigo', $credentials['usu_codigo'])->first();

        if (!$user) {
            return response()->json(['error' => 'Usuario no encontrado'], 404);
        }

        if (!$token = auth()->attempt($credentials)) {
            return response()->json(['error' => 'Credenciales incorrectas'], 401);
        }

        // actualizamos el ultimo acceso
        $user->usu_ultimoacceso = now();
        $user->save();

        return $this->respondWithToken($token);
    }


    /**
     * Get the authenticated User.
     *
     * @return \Illuminate\Http\JsonResponse
     */
    public function me()
    {
        return response()->json(auth()->user());
    }

    /**
     * Log the user out (Invalidate the token).
     *
     * @return \Illuminate\Http\JsonResponse
     */
    public function logout()
    {
        auth()->logout();
        // Respuesta JSON para indicar éxito
        return response()->json(['message' => 'Successfully logged out']);
    }

    /**
     * Refresh a token.
     *
     * @return \Illuminate\Http\JsonResponse
     */
    public function refresh()
    {
        return $this->respondWithToken(auth()->refresh());
    }

    /**
     * Get the token array structure.
     *
     * @param  string $token
     *
     * @return \Illuminate\Http\JsonResponse
     */
    protected function respondWithToken($token)
    {
        return response()->json([
            'access_token' => $token,
            'token_type' => 'bearer',
            'expires_in' => auth()->factory()->getTTL() * 60
        ]);
    }


    public function register(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'usu_codigo' => 'required|string|max:8|unique:tblusuarios_usu',
            'usu_contrasena' => 'required|string|min:6',
            'usu_nombre' => 'required|string|max:250',
        ]);

        if ($validator->fails()) {
            return response()->json(["error" => $validator->errors()->toJson()], 400);
        }

        $user = User::create([
            'usu_codigo' => $request->usu_codigo,
            'usu_contrasena' => bcrypt($request->usu_contrasena),
            'usu_nombre' => $request->usu_nombre,
            'usu_usucreacion' => 'RROBERTO',
        ]);

        return response()->json([
            'message' => 'Usuario registrado exitosamente',
            'user' => $user
        ], 201);
    }
}
