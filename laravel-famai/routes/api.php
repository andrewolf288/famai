<?php

use App\Http\Controllers\AreaController;
use App\Http\Controllers\AlmacenController;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\FamiliaController;
use App\Http\Controllers\GrupoInventarioController;
use App\Http\Controllers\MarcaController;
use App\Http\Controllers\OrdenInternaController;
use App\Http\Controllers\OrdenTrabajoController;
use App\Http\Controllers\ParteController;
use App\Http\Controllers\ProcesoController;
use App\Http\Controllers\ProductoController;
use App\Http\Controllers\ClienteController;
use App\Http\Controllers\CotizacionController;
use App\Http\Controllers\CotizacionDetalleArchivoController;
use App\Http\Controllers\CotizacionDetalleController;
use App\Http\Controllers\EntidadBancariaController;
use App\Http\Controllers\ModuloController;
use App\Http\Controllers\MonedaController;
use App\Http\Controllers\NotificacionController;
use App\Http\Controllers\OrdenCompraController;
use App\Http\Controllers\OrdenCompraDetalleController;
use App\Http\Controllers\OrdenInternaMaterialesController;
use App\Http\Controllers\OrdenInternaProcesosController;
use App\Http\Controllers\ReporteController;
use App\Http\Controllers\ProductoProveedorController;
use App\Http\Controllers\SubFamiliaController;
use App\Http\Controllers\TrabajadorController;
use App\Http\Controllers\UnidadController;
use App\Http\Controllers\UsuarioController;
use App\Http\Controllers\ProveedorController;
use App\Http\Controllers\ProveedorCuentaBancoController;
use App\Http\Controllers\RolController;
use App\Http\Controllers\SedeController;
use App\Http\Controllers\TipoDocumentoController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
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
Route::group(['middleware' => ['auth.jwt']], function () {
    Route::get('usuarios', [UsuarioController::class, 'index']);
    Route::get('usuariosSimple', [UsuarioController::class, 'indexSimple']);
    Route::get('usuario/{id}', [UsuarioController::class, 'show']);
    Route::put('usuario/{id}', [UsuarioController::class, 'update']);
    Route::post('usuarios', [UsuarioController::class, 'store']);
});

// rutas de roles
Route::get('findModulosByRol/{id}', [RolController::class, 'findModulosByRol']);
Route::group(['middleware' => ['auth.jwt']], function () {
    Route::get('roles', [RolController::class, 'index']);
    Route::get('rolesSimple', [RolController::class, 'indexSimple']);
    Route::post('roles', [RolController::class, 'store']);
    Route::put('rol/{id}', [RolController::class, 'update']);
});

// rutas de modulos
Route::group(['middleware' => ['auth.jwt']], function () {
    Route::get('modulosSimple', [ModuloController::class, 'indexSimple']);
});

// rutas de marcas
Route::group(['middleware' => ['auth.jwt']], function () {
    Route::get('marcas', [MarcaController::class, 'index']);
    Route::get('marcasSimple', [MarcaController::class, 'indexSimple']);
});

// rutas de unidades
Route::group(['middleware' => ['auth.jwt']], function () {
    Route::get('unidades', [UnidadController::class, 'index']);
    Route::get('unidadesSimple', [UnidadController::class, 'indexSimple']);
});

// rutas de areas
Route::group(['middleware' => ['auth.jwt']], function () {
    Route::get('areas', [AreaController::class, 'index']);
    Route::get('areasSimple', [AreaController::class, 'indexSimple']);
});

// rutas de tipos de documentos
Route::group(['middleware' => ['auth.jwt']], function () {
    Route::get('tiposdocumentos', [TipoDocumentoController::class, 'index']);
    Route::get('tiposdocumentosSimple', [TipoDocumentoController::class, 'indexSimple']);
});

// rutas de partes
Route::group(['middleware' => ['auth.jwt']], function () {
    Route::get('partes', [ParteController::class, 'index']);
    Route::get('partesSimple', [ParteController::class, 'indexSimple']);
});

// rutas de productos
Route::group(['middleware' => ['auth.jwt']], function () {
    Route::get('productos', [ProductoController::class, 'index']);
    Route::get('producto/{id}', [ProductoController::class, 'show']);
    Route::post('productos', [ProductoController::class, 'store']);
    Route::put('producto/{id}', [ProductoController::class, 'update']);
    Route::get('/productosByQuery2', [ProductoController::class, 'findProductoByQuery']);
    Route::get('/productosByQuery', [ProductoController::class, 'findProductoByQuery3']);
});

// rutas de almacenes
Route::group(['middleware' => ['auth.jwt']], function () {
    Route::get('almacenes', [AlmacenController::class, 'index']);
    Route::get('almacenesSimple', [AlmacenController::class, 'indexSimple']);
    Route::get('almacen/{id}', [AlmacenController::class, 'show']);
    Route::post('almacenes', [AlmacenController::class, 'store']);
    Route::put('almacen/{id}', [AlmacenController::class, 'update']);
    Route::put('almacenesByQuery', [AlmacenController::class, 'findAlmacenByQuery']);
});

// rutas de clientes
Route::group(['middleware' => ['auth.jwt']], function () {
    Route::get('clientes', [ClienteController::class, 'index']);
    Route::get('cliente/{id}', [ClienteController::class, 'show']);
    Route::post('clientes', [ClienteController::class, 'store']);
    Route::put('cliente/{id}', [ClienteController::class, 'update']);
    Route::get('/clientesByQuery', [ClienteController::class, 'findClienteByQuery']);
});

// rutas de procesos
Route::group(['middleware' => ['auth.jwt']], function () {
    Route::get('procesos', [ProcesoController::class, 'index']);
    Route::get('procesosSimple', [ProcesoController::class, 'indexSimple']);
    Route::get('procesosByParte/{parte}', [ProcesoController::class, 'findByParte']);
});

// rutas de trabajadores
Route::group(['middleware' => ['auth.jwt']], function () {
    Route::get('trabajadores', [TrabajadorController::class, 'index']);
    Route::get('trabajadoresSimple', [TrabajadorController::class, 'indexSimple']);
    Route::post('trabajadores', [TrabajadorController::class, 'store']);
    Route::put('trabajador/{id}', [TrabajadorController::class, 'update']);
    Route::get('trabajador/{id}', [TrabajadorController::class, 'show']);
    Route::get('trabajadorByUsuario/{usuario}', [TrabajadorController::class, 'findByUsuario']);
});

// rutas de compras
Route::group(['middleware' => ['auth.jwt']], function () {
    Route::post('comprasByProducto', [ProductoProveedorController::class, 'comprasByProducto']);
});

// rutas de ordenes de trabajo
Route::group(['middleware' => ['auth.jwt']], function () {
    Route::get('ordenestrabajos', [OrdenTrabajoController::class, 'index']);
    Route::get('ordenestrabajos/{id}', [OrdenTrabajoController::class, 'show']);
    // Route::get('ordenestrabajosByNumero/{numero}', [OrdenTrabajoController::class, 'findByNumero']);
    Route::get('ordenestrabajosByNumero/{numero}', [OrdenTrabajoController::class, 'findByNumero2']);
});

// rutas de ordenes internas
Route::group(['middleware' => ['auth.jwt']], function () {
    Route::get('ordenesinternas', [OrdenInternaController::class, 'index']);
    Route::get('ordeninterna/{id}', [OrdenInternaController::class, 'show']);
    Route::get('ordeninternaByNumero/{numero}', [OrdenInternaController::class, 'findByNumero']);
    Route::post('ordenesinternas', [OrdenInternaController::class, 'store']);
    Route::put('ordeninterna/guardar-procesos/{id}', [OrdenInternaController::class, 'update_proceso']);
    Route::put('ordeninterna/guardar-materiales/{id}', [OrdenInternaController::class, 'update_material']);
    Route::put('ordeninterna/{id}', [OrdenInternaController::class, 'update']);
    Route::delete('ordeninterna/{id}', [OrdenInternaController::class, 'destroy']);
});

// rutas detalle materiales orden interna
Route::group(['middleware' => ['auth.jwt']], function () {
    // Route::get('materialesByOrdenInterna/{id}', [OrdenInternaMaterialesController::class, 'findByOrdenInterna']);
    Route::get('detalleMaterialesOrdenInterna', [OrdenInternaMaterialesController::class, 'index']);
    Route::put('ordeninternamateriales/{id}', [OrdenInternaMaterialesController::class, 'update']);
    Route::put('ordeninternamateriales/tipo/{id}', [OrdenInternaMaterialesController::class, 'updateTipoMaterial']);
    Route::put('ordeninternamateriales/responsable/{id}', [OrdenInternaMaterialesController::class, 'updateResponsableMaterial']);
    Route::post('ordeninternamateriales/presupuesto/{id}', [OrdenInternaMaterialesController::class, 'updatePresupuesto']);
    Route::delete('ordeninternamateriales/{id}', [OrdenInternaMaterialesController::class, 'destroy']);
    Route::get('ordeninternamateriales/export-excel', [OrdenInternaMaterialesController::class, 'exportExcel']);
    Route::get('ordeninternamateriales/export-excel-presupuesto', [OrdenInternaMaterialesController::class, 'exportExcelPresupuesto']);
    Route::get('ordeninternamateriales/export-excel-almacen', [OrdenInternaMaterialesController::class, 'exportExcelAlmacen']);
    Route::post('ordeninternamateriales/export-cotizacion', [OrdenInternaMaterialesController::class, 'exportPDFCotizacion']);
    Route::post('ordeninternamateriales/export-cotizacion-text', [OrdenInternaMaterialesController::class, 'exportTXTCotizacion']);
    Route::get('detalleMaterialesByNumero', [OrdenInternaMaterialesController::class, 'findByNumeroOrdenInterna']);
    Route::get('ordeninternamateriales/cotizacion/{id}', [OrdenInternaMaterialesController::class, 'findCotizacionByMaterial']);
    Route::get('detalleMaterialesOrdenInterna/validacion', [OrdenInternaMaterialesController::class, 'indexValidacionCodigo']);
});

// rutas detalle procesos orden interna
Route::group(['middleware' => ['auth.jwt']], function () {
    Route::put('ordeninternaprocesos/{id}', [OrdenInternaProcesosController::class, 'update']);
    Route::delete('ordeninternaprocesos/{id}', [OrdenInternaProcesosController::class, 'destroy']);
});

// rutas de reportes
Route::group(['middleware' => ['auth.jwt']], function () {
    Route::get('/generarReporteOrdenTrabajo', [OrdenInternaController::class, 'exportOrdenInternaPDF']);
    Route::post('/previsualizarReporteOrdenTrabajo', [OrdenInternaController::class, 'previsualizarOrdenInternaPDF']);
});

// rutas de proveedores
Route::group(['middleware' => ['auth.jwt']], function () {
    Route::get('proveedores', [ProveedorController::class, 'index']);
    Route::get('proveedor/{id}', [ProveedorController::class, 'show']);
    Route::post('proveedores', [ProveedorController::class, 'store']);
    Route::put('proveedor/{id}', [ProveedorController::class, 'update']);
    Route::get('/proveedoresByQuery', [ProveedorController::class, 'findProveedorByQuery']);
    Route::get('/proveedoresByDocumento', [ProveedorController::class, 'findProveedorByDocumento']);
});

// rutas de subfamilias
Route::group(['middleware' => ['auth.jwt']], function () {
    Route::get('subfamilias', [SubFamiliaController::class, 'index']);
    Route::get('subfamiliasSimple', [SubFamiliaController::class, 'indexSimple']);
    Route::get('subfamilia/{id}', [SubFamiliaController::class, 'show']);
    Route::post('subfamilias', [SubFamiliaController::class, 'store']);
    Route::put('subfamilia/{id}', [SubFamiliaController::class, 'update']);
    Route::get('/subfamiliasByQuery', [SubFamiliaController::class, 'findSubFamiliaByQuery']);
});

// rutas de grupos de inventarios
Route::group(['middleware' => ['auth.jwt']], function () {
    Route::get('gruposinventarios', [GrupoInventarioController::class, 'index']);
    Route::get('gruposinventariosSimple', [GrupoInventarioController::class, 'indexSimple']);
    Route::get('grupoinventario/{id}', [GrupoInventarioController::class, 'show']);
    Route::post('gruposinventarios', [GrupoInventarioController::class, 'store']);
    Route::put('grupoinventario/{id}', [GrupoInventarioController::class, 'update']);
    Route::get('/gruposinventariosByQuery', [GrupoInventarioController::class, 'findGrupoInventarioByQuery']);
});

// rutas de familias
Route::group(['middleware' => ['auth.jwt']], function () {
    Route::get('familias', [FamiliaController::class, 'index']);
    Route::get('familiasSimple', [FamiliaController::class, 'indexSimple']);
    Route::get('familia/{id}', [FamiliaController::class, 'show']);
    Route::post('familias', [FamiliaController::class, 'store']);
    Route::put('familia/{id}', [FamiliaController::class, 'update']);
    Route::get('/familiasByQuery', [FamiliaController::class, 'findFamiliaByQuery']);
});

// rutas de entidades bancarias
Route::group(['middleware' => ['auth.jwt']], function () {
    Route::get('entidadesbancarias', [EntidadBancariaController::class, 'index']);
    Route::get('entidadesbancariasSimple', [EntidadBancariaController::class, 'indexSimple']);
    Route::get('entidadbancaria/{id}', [EntidadBancariaController::class, 'show']);
    Route::post('entidadesbancarias', [EntidadBancariaController::class, 'store']);
    Route::put('entidadbancaria/{id}', [EntidadBancariaController::class, 'update']);
});

// rutas cuentas bancarias proveedores
Route::group(['middleware' => ['auth.jwt']], function () {
    Route::get('cuentasbancariasproveedor', [ProveedorCuentaBancoController::class, 'index']);
    Route::get('findCuentaBancoByProveedor/{id}', [ProveedorCuentaBancoController::class, 'findCuentasBancariasByProveedor']);
    Route::get('cuentabancariaproveedor/{id}', [ProveedorCuentaBancoController::class, 'show']);
    Route::post('cuentasbancariasproveedor', [ProveedorCuentaBancoController::class, 'store']);
    Route::put('cuentabancariaproveedor/{id}', [ProveedorCuentaBancoController::class, 'update']);
});

// rutas de sedes
Route::group(['middleware' => ['auth.jwt']], function () {
    Route::get('sedes', [SedeController::class, 'index']);
    Route::get('sedesSimple', [SedeController::class, 'indexSimple']);
});

// rutas de monedas
Route::group(['middleware' => ['auth.jwt']], function () {
    Route::get('monedas', [MonedaController::class, 'index']);
    Route::get('monedasSimple', [MonedaController::class, 'indexSimple']);
});

// rutas de cotizaciones
Route::group(['middleware' => ['auth.jwt']], function () {
    Route::get('cotizaciones', [CotizacionController::class, 'index']);
    Route::post('cotizaciones', [CotizacionController::class, 'store']);
    Route::post('cotizacionesByDespliegue', [CotizacionController::class, 'storeDespliegueMateriales']);
    Route::get('cotizacionByNumero', [CotizacionController::class, 'findByNumero']);
    Route::get('cotizaciones/exportarPDF', [CotizacionController::class, 'exportarPDF']);
    Route::get('cotizacion/{id}', [CotizacionController::class, 'show']);
    Route::post('cotizacion/{id}', [CotizacionController::class, 'updateCotizacion']);
    Route::delete('cotizacion/{id}', [CotizacionController::class, 'destroy']);
    Route::get('cotizacion-detalle/{id}', [CotizacionDetalleController::class, 'findDetalleByCotizacion']);
});

// rutas de detalle de cotizacion
Route::group(['middleware' => ['auth.jwt']], function () {
    Route::delete('cotizacion-detalle/{id}', [CotizacionDetalleController::class, 'destroy']);
    Route::put('cotizacion-detalle/{id}', [CotizacionDetalleController::class, 'update']);
});

// rutas de detalle de archivo de cotizacion
Route::group(['middleware' => ['auth.jwt']], function () {
    Route::delete('cotizacion-archivo/{id}', [CotizacionDetalleArchivoController::class, 'destroy']);
});

// rutas de ordenes de compra
Route::group(['middleware' => ['auth.jwt']], function () {
    Route::get('ordenescompra', [OrdenCompraController::class, 'index']);
    Route::post('ordenescompra', [OrdenCompraController::class, 'store']);
    Route::get('ordenescompra/exportarPDF', [OrdenCompraController::class, 'exportarPDF']);
    Route::get('ordencompra/{id}', [OrdenCompraController::class, 'show']);
    Route::put('ordencompra/{id}', [OrdenCompraController::class, 'update']);
    Route::post('ordencompra/aprobar-masivo', [OrdenCompraController::class, 'aprobarMasivo']);
});

// rutas de ordendes de compra detalle
Route::group(['middleware' => ['auth.jwt']], function () {
    Route::get('ordencompra-detalle/{id}', [OrdenCompraDetalleController::class, 'findDetalleByOrdenCompra']);
    Route::get('ordencompra-cotizacion/{id}', [OrdenCompraDetalleController::class, 'findCotizacionByOrdenCompraDetalle']);
    Route::delete('ordencompra-detalle/{id}', [OrdenCompraDetalleController::class, 'destroy']);
    Route::put('ordencompra-detalle/{id}', [OrdenCompraDetalleController::class, 'update']);
});

Route::group(['middleware' => ['auth.jwt']], function () {
    Route::get('notificaciones', [NotificacionController::class, 'index']);
    Route::get('notificacionesByUsuarioNoVisto', [NotificacionController::class, 'findByUsuarioNoVisto']);
    Route::get('notificacionesByUsuarioTodos', [NotificacionController::class, 'findByUsuarioTodos']);
    Route::get('notificacionesByUsuario', [NotificacionController::class, 'findByUsuario']);
    Route::put('notificacion/{id}', [NotificacionController::class, 'update']);
});

// RUTAS ABIERTAS
Route::get('cotizacion-proveedor/{id}', [CotizacionController::class, 'showCotizacionProveedor']);
Route::put('cotizacion-proveedor/{id}', [CotizacionController::class, 'updateCotizacionProveedor']);
// Route::get('test-orden-interna', [OrdenInternaController::class, 'exportPDF']);

Route::get('script-update', function () {

    // $ordenes = OrdenInterna::all();

    // foreach ($ordenes as $orden) {
    //     $numero = $orden->oic_numero;

    //     $queryBuilder = DB::connection('sqlsrv_andromeda')
    //         ->table('OT_OrdenTrabajo as T1')
    //         ->select('T1.FecAprobacion as oic_fechaaprobacion',
    //         'T1.FecEntrega as oic_fechaentregaestimada',
    //         'T1.FecEvaluacion as oic_fechaevaluacion')
    //         ->where(DB::raw('T1.NumOTSAP COLLATE SQL_Latin1_General_CP1_CI_AS'), $numero)
    //         ->first();

    //     if ($queryBuilder) {
    //         $orden->oic_fechaaprobacion = $queryBuilder->oic_fechaaprobacion;
    //         $orden->oic_fechaentregaestimada = $queryBuilder->oic_fechaentregaestimada;
    //         $orden->oic_fechaevaluacion = $queryBuilder->oic_fechaevaluacion;
    //         $orden->save();
    //     }
    // }
});
