<?php

use App\Http\Controllers\AreaController;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\FamiliaController;
use App\Http\Controllers\GrupoInventarioController;
use App\Http\Controllers\MarcaController;
use App\Http\Controllers\OrdenInternaController;
use App\Http\Controllers\OrdenTrabajoController;
use App\Http\Controllers\ParteController;
use App\Http\Controllers\ProcesoController;
use App\Http\Controllers\ProductoController;
use App\Http\Controllers\ReporteController;
use App\Http\Controllers\ProductoProveedorController;
use App\Http\Controllers\SubFamiliaController;
use App\Http\Controllers\TrabajadorController;
use App\Http\Controllers\UnidadController;
use App\Http\Controllers\UsuarioController;
use App\Http\Controllers\ProveedorController;
use App\Http\Controllers\TipoDocumentoController;
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

// rutas de areas
Route::group(['middleware' => ['auth.jwt']], function() {
    Route::get('areas', [AreaController::class, 'index']);
    Route::get('areasSimple', [AreaController::class, 'indexSimple']);
});

// rutas de tipos de documentos
Route::group(['middleware' => ['auth.jwt']], function() {
    Route::get('tiposdocumentos', [TipoDocumentoController::class, 'index']);
    Route::get('tiposdocumentosSimple', [TipoDocumentoController::class, 'indexSimple']);
});

// rutas de partes
Route::group(['middleware' => ['auth.jwt']], function() {
    Route::get('partes', [ParteController::class, 'index']);
    Route::get('partesSimple', [ParteController::class, 'indexSimple']);
});

// rutas de productos
Route::group(['middleware' => ['auth.jwt']], function() {
    Route::get('productos', [ProductoController::class, 'index']);
    Route::get('producto/{id}', [ProductoController::class, 'show']);
    Route::post('productos', [ProductoController::class, 'store']);
    Route::put('producto/{id}', [ProductoController::class, 'update']);
    Route::get('/productosByQuery', [ProductoController::class, 'findProductoByQuery']);
});

// rutas de procesos
Route::group(['middleware' => ['auth.jwt']], function() {
    Route::get('procesos', [ProcesoController::class, 'index']);
    Route::get('procesosSimple', [ProcesoController::class, 'indexSimple']);
    Route::get('procesosByParte/{parte}', [ProcesoController::class, 'findByParte']);
});

// rutas de trabajadores
Route::group(['middleware' => ['auth.jwt']], function() {
    Route::get('trabajadores', [TrabajadorController::class, 'index']);
    Route::get('trabajadoresSimple', [TrabajadorController::class, 'indexSimple']);
});

// rutas de compras
Route::group(['middleware' => ['auth.jwt']], function() {
    Route::post('comprasByProducto', [ProductoProveedorController::class, 'comprasByProducto']);
});

// rutas de ordenes de trabajo
Route::group(['middleware' => ['auth.jwt']], function() {
    Route::get('ordenestrabajos', [OrdenTrabajoController::class, 'index']);
    Route::get('ordenestrabajos/{id}', [OrdenTrabajoController::class, 'show']);
    Route::get('ordenestrabajosByNumero/{numero}', [OrdenTrabajoController::class, 'findByNumero']);
});

// rutas de ordenes internas
Route::group(['middleware' => ['auth.jwt']], function() {
    Route::get('ordenesinternas', [OrdenInternaController::class, 'index']);
    Route::post('ordenesinternas', [OrdenInternaController::class, 'store']);
    Route::post('editarordenesinternas', [OrdenInternaController::class, 'editarProductoMateriales']);
});

// rutas de reportes
Route::group(['middleware' => ['auth.jwt']], function() {
    Route::get('/generarReporteOrdenTrabajo', [ReporteController::class, 'generarReporteOrdenTrabajo']);
});

// rutas de proveedores
Route::group(['middleware' => ['auth.jwt']], function() {
    Route::get('proveedores', [ProveedorController::class, 'index']);
    Route::get('proveedor/{id}', [ProveedorController::class, 'show']);
    Route::post('proveedores', [ProveedorController::class, 'store']);
    Route::put('proveedor/{id}', [ProveedorController::class, 'update']);
});