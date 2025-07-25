<?php

use App\Http\Controllers\AreaController;
use App\Http\Controllers\AlmacenController;
use App\Http\Controllers\AlmacenMovimientoController;
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
use App\Http\Controllers\FormaPagoController;
use App\Http\Controllers\ImpuestoController;
use App\Http\Controllers\ModuloController;
use App\Http\Controllers\MonedaController;
use App\Http\Controllers\MotivoMovimientoController;
use App\Http\Controllers\MotivoRequerimientoController;
use App\Http\Controllers\NotificacionController;
use App\Http\Controllers\OrdenCompraController;
use App\Http\Controllers\OrdenCompraDetalleController;
use App\Http\Controllers\OrdenCompraExportController;
use App\Http\Controllers\OrdenInternaMaterialesAdjuntosController;
use App\Http\Controllers\OrdenInternaMaterialesController;
use App\Http\Controllers\OrdenInternaProcesosController;
use App\Http\Controllers\PadronSunatController;
use App\Http\Controllers\ProductoProveedorController;
use App\Http\Controllers\ProductoResponsableController;
use App\Http\Controllers\SubFamiliaController;
use App\Http\Controllers\TrabajadorController;
use App\Http\Controllers\UnidadController;
use App\Http\Controllers\UsuarioController;
use App\Http\Controllers\ProveedorController;
use App\Http\Controllers\ProveedorCuentaBancoController;
use App\Http\Controllers\RequerimientoController;
use App\Http\Controllers\RolController;
use App\Http\Controllers\SedeController;
use App\Http\Controllers\TipoDocumentoController;
use App\Http\Controllers\TipoDocumentoReferenciaController;
use App\MotivoRequerimiento;
use App\OrdenInternaMateriales;
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
Route::group(['middleware' => ['auth.jwt']], function () {
    Route::get('usuarios', [UsuarioController::class, 'index']);
    Route::get('usuariosSimple', [UsuarioController::class, 'indexSimple']);
    Route::get('usuario/{id}', [UsuarioController::class, 'show']);
    Route::put('usuario/{id}', [UsuarioController::class, 'update']);
    Route::post('usuarios', [UsuarioController::class, 'store']);
    Route::put('usuarios/reset-password/{codigo}', [UsuarioController::class, 'resetPassword']);
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
    // Route::get('partes', [ParteController::class, 'index']);
    Route::get('partesSimple', [ParteController::class, 'indexSimple']);
});

// rutas de productos
Route::group(['middleware' => ['auth.jwt']], function () {
    Route::get('productos', [ProductoController::class, 'index']);
    Route::get('producto/{id}', [ProductoController::class, 'show']);
    Route::post('productos', [ProductoController::class, 'store']);
    Route::put('producto/{id}', [ProductoController::class, 'update']);
    Route::get('/productosByQuery', [ProductoController::class, 'findProductoByQuery']);
    Route::get('/productosByQuery2', [ProductoController::class, 'findProductoByQuery2']);
    Route::get('/productoByCodigo', [ProductoController::class, 'findProductoByCodigo']);
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

// rutas de ordenes de trabajo
Route::group(['middleware' => ['auth.jwt']], function () {
    Route::get('ordenestrabajos', [OrdenTrabajoController::class, 'index']);
    Route::get('ordenestrabajos/{id}', [OrdenTrabajoController::class, 'show']);
    // Route::get('ordenestrabajosByNumero/{numero}', [OrdenTrabajoController::class, 'findByNumero']);
    Route::get('ordenestrabajosByNumero/{numero}', [OrdenTrabajoController::class, 'findByNumero2']);
    Route::get('ordenestrabajosByNumeroRequerimiento/{numero}', [OrdenTrabajoController::class, 'findByNumeroRequerimiento']);
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
    Route::get('informacion-creacion-orden-interna', [OrdenInternaController::class, 'informacionCreacionOrdenInterna']);
    Route::get('historial-materiales-orden-interna/{id}', [OrdenInternaController::class, 'historialMaterialesOrdenInterna']);
});

// rutas detalle materiales orden interna
Route::group(['middleware' => ['auth.jwt']], function () {
    Route::get('detalleMaterialesOrdenInterna', [OrdenInternaMaterialesController::class, 'index']);
    Route::get('detalleMaterialesOrdenInterna-resumido', [OrdenInternaMaterialesController::class, 'indexResumido']);
    Route::get('detalleMaterialOrdenInterna/{id}', [OrdenInternaMaterialesController::class, 'show']);
    Route::put('ordeninternamateriales/{id}', [OrdenInternaMaterialesController::class, 'update']);
    Route::put('ordeninternamateriales/tipo/{id}', [OrdenInternaMaterialesController::class, 'updateTipoMaterial']);
    Route::put('ordeninternamateriales/responsable/{id}', [OrdenInternaMaterialesController::class, 'updateResponsableMaterial']);
    Route::post('ordeninternamateriales/responsable-masivo', [OrdenInternaMaterialesController::class, 'updateResponsableMaterialMasivo']);
    // Route::post('ordeninternamateriales/presupuesto/{id}', [OrdenInternaMaterialesController::class, 'updatePresupuesto']);
    Route::delete('ordeninternamateriales/{id}', [OrdenInternaMaterialesController::class, 'destroy']);
    Route::get('ordeninternamateriales/export-excel', [OrdenInternaMaterialesController::class, 'exportExcel']);
    Route::get('ordeninternamateriales/export-excel-presupuesto', [OrdenInternaMaterialesController::class, 'exportExcelPresupuesto']);
    Route::get('ordeninternamateriales/export-excel-almacen', [OrdenInternaMaterialesController::class, 'exportExcelAlmacen']);
    Route::post('ordeninternamateriales/export-cotizacion', [OrdenInternaMaterialesController::class, 'exportPDFCotizacion']);
    Route::get('detalleMaterialesByNumero', [OrdenInternaMaterialesController::class, 'findByNumeroOrdenInterna']);
    Route::get('ordeninternamateriales/cotizacion', [OrdenInternaMaterialesController::class, 'findCotizacionByMaterial']);
    Route::get('ordeninternamateriales/ordencompra', [OrdenInternaMaterialesController::class, 'findOrdenCompraByMaterial']);
    Route::get('detalleMaterialesOrdenInterna/validacion', [OrdenInternaMaterialesController::class, 'indexValidacionCodigo']);
    Route::post('ordeninternamateriales/validar-codigo', [OrdenInternaMaterialesController::class, 'asignarCodigoProducto']);
    Route::post('detalleMaterialesOrdenInterna/materiales-cotizar', [OrdenInternaMaterialesController::class, 'informacionMaterialesCotizar']);
    Route::post('detalleMaterialesOrdenInterna/findByNumeroOrdenTrabajo', [OrdenInternaMaterialesController::class, 'findByNumeroOrdenTrabajo']);
    Route::post('detalleMaterialesOrdenInterna/verificar-materiales', [OrdenInternaMaterialesController::class, 'validarMaterialesMasivo']);
    Route::get('detalleMaterialesOrdenInterna-resumido-ordencompra', [OrdenInternaMaterialesController::class, 'indexOrdenCompraResumido']);
    Route::post('detalleMaterialesOrdenInterna-pendientes-by-orden-interna', [OrdenInternaMaterialesController::class, 'findMaterialesPendientesByOT']);
    Route::get('detalleMaterialesOrdenInterna-pendientes-entregar', [OrdenInternaMaterialesController::class, 'detalleMaterialesPorEmitirNotaSalida']);
    Route::post('detalleMaterialesOrdenInterna-pendientes-entregar', [OrdenInternaMaterialesController::class, 'detalleMaterialesPorEmitirNotaSaliadByIds']);
    Route::get('detalleMaterialesOrdenInterna-logistica-excel', [OrdenInternaMaterialesController::class, 'exportLogisticaRequerimientos']);
    Route::put('ordeninternamateriales/asignar-responsable-en-bloque/{idResponsable}', [OrdenInternaMaterialesController::class, 'asignarResponsableEnBloque']);
});

// rutas detalle de adjuntos detalle materiales
Route::group(['middleware' => ['auth.jwt']], function () {
    Route::post('ordeninternamaterialesadjuntos', [OrdenInternaMaterialesAdjuntosController::class, 'store']);
    Route::get('ordeninternamaterialesadjuntos/{id}', [OrdenInternaMaterialesAdjuntosController::class, 'findByDetalleMaterial']);
    Route::delete('ordeninternamaterialesadjuntos/{id}', [OrdenInternaMaterialesAdjuntosController::class, 'destroy']);
});

// rutas detalle procesos orden interna
Route::group(['middleware' => ['auth.jwt']], function () {
    Route::put('ordeninternaprocesos/{id}', [OrdenInternaProcesosController::class, 'update']);
    Route::delete('ordeninternaprocesos/{id}', [OrdenInternaProcesosController::class, 'destroy']);
});

// rutas de requermientos
Route::group(['middleware' => ['auth.jwt']], function () {
    Route::get('requerimientos', [RequerimientoController::class, 'index']);
    Route::post('requerimientos', [RequerimientoController::class, 'store']);
    Route::get('requerimiento/exportarPDF', [RequerimientoController::class, 'exportarPDF']);
    Route::delete('requerimiento/{id}', [RequerimientoController::class, 'destroy']);
});

// rutas de requerimientos detalles
Route::group(['middleware' => ['auth.jwt']], function () {
    Route::get('requerimientosdetalles', [RequerimientoController::class, 'showDetalleRequerimientos']);
});

// rutas de reportes
Route::group(['middleware' => ['auth.jwt']], function () {
    Route::get('/generarReporteOrdenTrabajo', [OrdenInternaController::class, 'exportOrdenInternaPDF']);
    Route::post('/previsualizarReporteOrdenTrabajo', [OrdenInternaController::class, 'previsualizarOrdenInternaPDF']);
});

// rutas padron SUNAT
Route::group(['middleware' => ['auth.jwt']], function () {
    Route::get('/padronSunat', [PadronSunatController::class, 'showByQuery']);
});

// rutas de proveedores
Route::group(['middleware' => ['auth.jwt']], function () {
    Route::get('proveedores', [ProveedorController::class, 'index']);
    Route::get('proveedor/{id}', [ProveedorController::class, 'show']);
    Route::post('proveedores', [ProveedorController::class, 'store']);
    Route::put('proveedor/{id}', [ProveedorController::class, 'update']);
    Route::get('/proveedoresByQuery', [ProveedorController::class, 'findProveedorByQuery']);
    Route::get('/proveedoresByQuerySAP', [ProveedorController::class, 'findProveedorByQuerySAP']);
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
    Route::get('sede-actual-trabajador', [SedeController::class, 'sedeActualTrabajador']);
    Route::post('cambiar-sede-actual-trabajador', [SedeController::class, 'cambiarSedeActualTrabajador']);
});

// rutas de monedas
Route::group(['middleware' => ['auth.jwt']], function () {
    Route::get('monedas', [MonedaController::class, 'index']);
    Route::get('monedasSimple', [MonedaController::class, 'indexSimple']);
});

// rutas de formas de pago
Route::group(['middleware' => ['auth.jwt']], function () {
    Route::get('formaspago', [FormaPagoController::class, 'index']);
    Route::get('formaspagoSimple', [FormaPagoController::class, 'indexSimple']);
});

// rutas de impuestos
Route::group(['middleware' => ['auth.jwt']], function () {
    Route::get('impuestos', [ImpuestoController::class, 'index']);
    Route::get('impuestosSimple', [ImpuestoController::class, 'indexSimple']);
});

// rutas de motivos de movimiento
Route::group(['middleware' => ['auth.jwt']], function () {
    Route::get('motivosmovimiento', [MotivoMovimientoController::class, 'index']);
    Route::get('motivosmovimientoSimple', [MotivoMovimientoController::class, 'indexSimple']);
});

// rutas de tipos de documentos referencia
Route::group(['middleware' => ['auth.jwt']], function () {
    Route::get('tiposdocumentosreferencia', [TipoDocumentoReferenciaController::class, 'index']);
    Route::get('tiposdocumentosreferenciaSimple', [TipoDocumentoReferenciaController::class, 'indexSimple']);
});

// rutas de motivos de requerimientos
Route::group(['middleware' => ['auth.jwt']], function () {
    Route::get('motivosrequerimiento', [MotivoRequerimientoController::class, 'index']);
    Route::get('motivosrequerimientoSimple', [MotivoRequerimientoController::class, 'indexSimple']);
});

// rutas almacenamiento
Route::group(['middleware' => ['auth.jwt']], function () {
    Route::get('almacenes', [AlmacenController::class, 'index']);
});

// rutas de cotizaciones
Route::group(['middleware' => ['auth.jwt']], function () {
    Route::get('cotizaciones', [CotizacionController::class, 'index']);
    Route::post('cotizaciones', [CotizacionController::class, 'store']);
    Route::post('cotizacionesByDespliegue', [CotizacionController::class, 'storeDespliegueMateriales']);
    Route::get('cotizacionByNumero', [CotizacionController::class, 'findByNumero']);
    Route::get('cotizaciones/exportarPDF', [CotizacionController::class, 'exportarPDF']);
    Route::get('cotizacion/exportarTXT/{id}', [CotizacionController::class, 'exportTXTCotizacion']);
    Route::get('cotizacion/exportarExcel/{id}', [CotizacionController::class, 'exportExcelCotizacion']);
    Route::get('cotizacion/{id}', [CotizacionController::class, 'show']);
    Route::post('cotizacion/{id}', [CotizacionController::class, 'updateCotizacion']);
    Route::delete('cotizacion/{id}', [CotizacionController::class, 'destroy']);
    Route::patch('cotizacion/update-estado/{id}', [CotizacionController::class, 'updateEstadoCotizacion']);
    Route::get('cotizacion-proveedores', [CotizacionController::class, 'obtenerProveedoresCotizaciones']);
    Route::post('cotizacion-proveedores-detalles', [CotizacionController::class, 'obtenerDetallesProveedoresCotizaciones']);
    Route::get('cotizacion-solicitantes', [CotizacionController::class, 'obtenerSolicitantes']);
});

// rutas de detalle de cotizacion
Route::group(['middleware' => ['auth.jwt']], function () {
    Route::get('cotizacion-detalle-view/{id}', [CotizacionDetalleController::class, 'show']);
    Route::get('cotizacion-detalle/{id}', [CotizacionDetalleController::class, 'findDetalleByCotizacion']);
    Route::delete('cotizacion-detalle/{id}', [CotizacionDetalleController::class, 'destroy']);
    Route::put('cotizacion-detalle/{id}', [CotizacionDetalleController::class, 'update']);
    Route::get('cotizacion-detalle-pendiente', [CotizacionDetalleController::class, 'findDetalleByEstadoPendiente']);
    Route::post('cotizacion-detalle-masivo', [CotizacionDetalleController::class, 'informacionMaterialesMasivo']);
    Route::get('cotizacion-detalle-findByProducto', [CotizacionDetalleController::class, 'findCotizacionByProducto']);
    Route::put('cotizacion-detalle/seleccionar/{id}', [CotizacionDetalleController::class, 'seleccionarCotizacionDetalle']);
    Route::post('cotizacion-detalle/copiar/{id}', [CotizacionDetalleController::class, 'copiarCotizacionDetalle']);
});

// rutas de detalle de archivo de cotizacion
Route::group(['middleware' => ['auth.jwt']], function () {
    Route::delete('cotizacion-archivo/{id}', [CotizacionDetalleArchivoController::class, 'destroy']);
});

// rutas para producto responsable
Route::group(['middleware' => ['auth.jwt']], function () {
    Route::get('producto-responsable/responsables', [ProductoResponsableController::class, 'obtenerResponsables']);
});

// rutas de ordenes de compra
Route::group(['middleware' => ['auth.jwt']], function () {
    Route::get('ordenescompra', [OrdenCompraController::class, 'index']);
    Route::post('ordenescompra', [OrdenCompraController::class, 'store']);
    Route::get('ordenescompra/exportarPDF', [OrdenCompraController::class, 'exportarPDF']);
    Route::get('ordencompra/{id}', [OrdenCompraController::class, 'show']);
    Route::put('ordencompra/{id}', [OrdenCompraController::class, 'update']);
    Route::post('ordencompra/aprobar-masivo', [OrdenCompraController::class, 'aprobarMasivo']);
    Route::get('ordencompra-pendientes-ingresar', [OrdenCompraController::class, 'ordenesCompraPorEmitirNotaIngreso']);
    Route::get('ordencompra-pendientes-entregar/{id}', [OrdenCompraController::class, 'ordenCompraDetallesPendientesById']);
    Route::post('ordencompra/anular/{id}', [OrdenCompraController::class, 'anular']);
});

// rutas de ordendes de compra detalle
Route::group(['middleware' => ['auth.jwt']], function () {
    Route::get('ordencompra-detalle-view/{id}', [OrdenCompraDetalleController::class, 'show']);
    Route::get('ordencompra-detalle/{id}', [OrdenCompraDetalleController::class, 'findDetalleByOrdenCompra']);
    Route::get('ordencompra-cotizacion/{id}', [OrdenCompraDetalleController::class, 'findCotizacionByOrdenCompraDetalle']);
    Route::delete('ordencompra-detalle/{id}', [OrdenCompraDetalleController::class, 'destroy']);
    Route::put('ordencompra-detalle/{id}', [OrdenCompraDetalleController::class, 'update']);
    Route::get('ordencompra-detalle-findByProducto', [OrdenCompraDetalleController::class, 'findOrdenCompraByProducto']);
    Route::post('ordencompra-detalle/ultimo-proveedor', [OrdenCompraDetalleController::class, 'findUltimoProveedorByProducto']);
});

// rutas orde de compras productos proveedores
Route::group(['middleware' => ['auth.jwt']], function () {
    Route::post('comprasByProducto', [ProductoProveedorController::class, 'comprasByProducto']);
    Route::post('ultimas-compras/producto', [ProductoProveedorController::class, 'findByProductoUltimaCompra']);
    Route::get('comprasByProductoProveedor', [ProductoProveedorController::class, 'findOrdenCompraByProveedorProducto']);
    Route::get('comprasByProducto', [ProductoProveedorController::class, 'findOrdenCompraByProducto']);
    Route::get('cotizacionesByProducto', [ProductoProveedorController::class, 'findCotizacionesByProducto']);
});

// rutas de movimientos de almacen
Route::group(['middleware' => ['auth.jwt']], function () {
    Route::post('almacen-movimiento/ingreso', [AlmacenMovimientoController::class, 'ingresoAlmacenMovimiento']);
    Route::post('almacen-movimiento/salida', [AlmacenMovimientoController::class, 'salidaAlmacenMovimiento']);
});

// rutas de notificaciones
Route::group(['middleware' => ['auth.jwt']], function () {
    Route::get('notificaciones', [NotificacionController::class, 'index']);
    Route::get('notificacionesByUsuarioNoVisto', [NotificacionController::class, 'findByUsuarioNoVisto']);
    Route::get('notificacionesByUsuarioTodos', [NotificacionController::class, 'findByUsuarioTodos']);
    Route::get('notificacionesByUsuario', [NotificacionController::class, 'findByUsuario']);
    Route::put('notificacion/{id}', [NotificacionController::class, 'update']);
});

// rutas publicas sin autenticación
Route::get('pop', function () {
    return response('OK SERVER', 200);
});
Route::get('cotizacion-proveedor/{id}', [CotizacionController::class, 'showCotizacionProveedor']);
Route::put('cotizacion-proveedor/{id}', [CotizacionController::class, 'updateCotizacionProveedor']);
Route::get('formaspagoSimpleProveedor', [FormaPagoController::class, 'indexSimple']);

// Route::get('script-update', function () {
//     $number = 142.67;
//     return UtilHelper::convertirNumeroALetras($number);
// });
// Route::get('import-data', [ProductoResponsableController::class, 'importarData']);
Route::get('exportar-SAP-orden-compra', [OrdenCompraExportController::class, 'export']);
Route::get('test', function () {
    $materiales = OrdenInternaMateriales::where('odm_cantidadpendiente', '>', 0)
        ->whereNotIn('odm_tipo', [3, 4, 5])
        ->whereNotNull('odm_estado')
        ->whereDate('odm_feccreacion', '>=', '2024-12-01')
        ->whereDate('odm_feccreacion', '<=', '2025-03-31')
        ->get();
    return response()->json($materiales);
});
