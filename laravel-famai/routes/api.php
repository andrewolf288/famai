<?php

use App\Http\Controllers\AuthController;
use App\Http\Controllers\FamiliaController;
use App\Http\Controllers\GrupoInventarioController;
use App\Http\Controllers\MarcaController;
use App\Http\Controllers\ProductoController;
use App\Http\Controllers\ReporteController;
use App\Http\Controllers\ProductoProveedorController;
use App\Http\Controllers\SubFamiliaController;
use App\Http\Controllers\TrabajadorController;
use App\Http\Controllers\UnidadController;
use App\Http\Controllers\UsuarioController;
use App\Http\Controllers\ProveedorController;
use App\ProductoProveedor;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
|
| Here is where you can register API routes for your application. These
| routes are loaded by the RouteServiceProvider within a group which
| is assigned the "api" middleware group. Enjoy building your API!
|
*/

Route::middleware('auth:api')->get('/user', function (Request $request) {
    return $request->user();
});

// rutas de autenticacion
Route::group([
    'middleware' => 'api',
    'prefix' => 'auth'
], function ($router) {
    Route::post('login', [AuthController::class, 'login']);
    Route::post('logout', [AuthController::class, 'logout']);
    Route::post('refresh', [AuthController::class, 'refresh']);
    Route::post('me', [AuthController::class, 'me']);
    Route::post('register', [AuthController::class, 'register']);

});

// rutas de usuarios
Route::group(['middleware' => ['auth.jwt']], function() {
   Route::get('usuarios', [UsuarioController::class, 'index']);
   Route::get('usuario/{id}', [UsuarioController::class, 'show']);
   Route::put('usuario/{id}', [UsuarioController::class, 'update']);
   Route::post('usuarios', [UsuarioController::class, 'store']);
});


//Route::apiResource('productos', 'ProductoController');

Route::get('/generarReporteOrdenTrabajo', [ReporteController::class, 'generarReporteOrdenTrabajo']);


// rutas de productos
Route::group(['middleware' => ['auth.jwt']], function() {
    Route::get('productos', [ProductoController::class, 'index']);
    Route::get('producto/{id}', [ProductoController::class, 'show']);
    Route::post('productos', [ProductoController::class, 'store']);
    Route::put('producto/{id}', [ProductoController::class, 'update']);
});

// rutas de trabajadores
Route::group(['middleware' => ['auth.jwt']], function() {
    Route::get('trabajadores', [TrabajadorController::class, 'index']);
});

// rutas de compras
Route::group(['middleware' => ['auth.jwt']], function() {
    Route::post('comprasByProducto', [ProductoProveedorController::class, 'comprasByProducto']);
});

// rutas de familias
Route::group(['middleware' => ['auth.jwt']], function() {
    Route::get('familias', [FamiliaController::class, 'index']);
    Route::get('familiasSimple', [FamiliaController::class, 'indexSimple']);
});

// rutas de subfamilias
Route::group(['middleware' => ['auth.jwt']], function() {
    Route::get('subfamilias', [SubFamiliaController::class, 'index']);
    Route::get('subfamiliasSimple', [SubFamiliaController::class, 'indexSimple']);
});

// rutas de marcas
Route::group(['middleware' => ['auth.jwt']], function() {
    Route::get('marcas', [MarcaController::class, 'index']);
    Route::get('marcasSimple', [MarcaController::class, 'indexSimple']);
});

// rutas de unidades
Route::group(['middleware' => ['auth.jwt']], function() {
    Route::get('unidades', [UnidadController::class, 'index']);
    Route::get('unidadesSimple', [UnidadController::class, 'indexSimple']);
});

// rutas de grupos de inventarios
Route::group(['middleware' => ['auth.jwt']], function() {
    Route::get('gruposinventarios', [GrupoInventarioController::class, 'index']);
    Route::get('gruposinventariosSimple', [GrupoInventarioController::class, 'indexSimple']);
});

// rutas de proveedores
Route::group(['middleware' => ['auth.jwt']], function() {
    Route::get('proveedores', [ProveedorController::class, 'index']);
    Route::get('proveedor/{id}', [ProveedorController::class, 'show']);
    Route::post('proveedores', [ProveedorController::class, 'store']);
    Route::put('proveedor/{id}', [ProveedorController::class, 'update']);
});
