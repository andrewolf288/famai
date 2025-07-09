<?php

namespace App\Http\Controllers;

use App\CotizacionDetalle;
use App\Helpers\DateHelper;
use App\OrdenCompra;
use App\OrdenCompraDetalle;
use App\Trabajador;
use Barryvdh\DomPDF\Facade\Pdf;
use Exception;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\ValidationException;
use App\Helpers\UtilHelper;
use App\ProductoResponsable;
use App\Proveedor;
use App\ProveedorCuentaBanco;
use Carbon\Carbon;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Schema;
use App\ProductoProveedor;
use App\OrdenInterna;
use App\Parte;
use App\OrdenInternaMateriales;
use App\OrdenInternaPartes;

class OrdenCompraController extends Controller
{

    public function anular(Request $request, $id)
    {
        $user = auth()->user();
        try {
            DB::beginTransaction();
            $ordencompra = OrdenCompra::find($id);
            $ordencompra->update([
                'occ_estado' => 'ANU',
                'occ_usumodificacion' => $user->usu_codigo,
                'occ_fecmodificacion' => Carbon::now(),
                'occ_total' => 0.00,
                'occ_subtotal' => 0.00,
                'occ_impuesto' => 0.00
            ]);

            // eliminamos los detalles de la orden de compra
            OrdenCompraDetalle::where('occ_id', $id)->delete();

            DB::commit();
            return response()->json(['message' => 'Orden de compra anulada correctamente']);
        } catch (Exception $e) {
            DB::rollBack();
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }
    
    public function index(Request $request)
    {
        $user = auth()->user();
        $sed_codigo = "10";

        $trabajador = Trabajador::where('usu_codigo', $user->usu_codigo)->first();

        if ($trabajador) {
            $sed_codigo = $trabajador->sed_codigo;
        }

        // Obtener órdenes de compra sin número SAP y actualizarlas mediante un procedimiento almacenado
        try {
            DB::statement('EXEC dbo.ActualizarNumerosSAPOrdenCompra');
            $resultadoSap = 'Se actualizo correctamente';
        } catch (Exception $e) {
            $resultadoSap = $e->getMessage();
        }

        $pageSize = $request->input('page_size', 10);
        $page = $request->input('page', 1);
        $fechaDesde = $request->input('fecha_desde');
        $fechaHasta = $request->input('fecha_hasta');
        $occ_numero = $request->input('occ_numero');

        $query = OrdenCompra::with(['proveedor', 'moneda', 'autorizador', 'elaborador'])
            ->where('sed_codigo', $sed_codigo);

        $query->orderBy('occ_fecha', 'desc');
        $query->where('occ_fecha', '>=', $fechaDesde);
        $query->where('occ_fecha', '<=', $fechaHasta);
        $query->where('occ_numero', 'like', '%' . $occ_numero . '%');
        
        $cotizaciones = $query->paginate($pageSize, ['*'], 'page', $page);
        return response()->json([
            'message' => 'Se listan las ordenes de compra',
            'data' => $cotizaciones->items(),
            'count' => $cotizaciones->total(),
            'resultadoSap' => $resultadoSap
        ]);
    }

    public function findByNumero($numero) {}

    private function generarPDF($occ_id, $imprimir_disgregado = false, $user)
    {
        // consultamos la orden de compra --- aqui necesito un id para consultar la orden de compra
        $ordencomprafind = OrdenCompra::with('proveedor.cuentasBancarias.entidadBancaria', 'moneda', 'elaborador', 'solicitador', 'autorizador', 'formaPago')
            ->where('occ_id', $occ_id)->first();

        // consultamos el detalle de orden de compra
        $detalleordencomprafind = OrdenCompraDetalle::with('producto', 'detalleMaterial.usuarioCreador', 'detalleMaterial.ordenInternaParte.ordenInterna', 'detalleMaterial.cotizaciones.cotizacion')
            ->where('occ_id', $occ_id)->get();

        // cuentas bancarias
        $cuentas_bancarias = UtilHelper::obtenerCuentasBancarias($ordencomprafind->proveedor->cuentasBancarias ?? []);

        // aqui debemos hacer la logica para imprimir
        $data = array();

        if ($imprimir_disgregado) {
            $data = [
                'ordencompra' => $ordencomprafind,
                'proveedor' => $ordencomprafind->proveedor,
                'detalle_ordencompra' => $detalleordencomprafind->map(function ($detalle) {
                    return [
                        'pro_id' => $detalle->pro_id,
                        'ocd_descripcion' => $detalle->ocd_descripcion,
                        'ocd_observacion' => $detalle->detalleMaterial->odm_observacion,
                        'ocd_preciounitario' => number_format($detalle->ocd_preciounitario, 2, '.', ''),
                        'ocd_cantidad' => $detalle->ocd_cantidad,
                        'ocd_total' => number_format($detalle->ocd_total, 2, '.', ''),
                        'uni_codigo' => $detalle->producto ? $detalle->producto->uni_codigo : '',
                        'odt_numero' => $detalle->detalleMaterial->ordenInternaParte->ordenInterna->odt_numero ?? null,
                        'usu_nombre' => $detalle->detalleMaterial->usuarioCreador->usu_nombre ?? null,
                        'oic_otsap' => $detalle->detalleMaterial->ordenInternaParte->ordenInterna->oic_otsap ?? null
                    ];
                }),
                'occ_fecha_formateada' => DateHelper::parserFecha($ordencomprafind->occ_fecha),
                'usuarioImpresion' => $user->usu_codigo,
                'fechaHoraImpresion' => date('Y-m-d H:i:s'),
                'cuenta_banco_nacion' => $cuentas_bancarias['cuenta_banco_nacion'],
                'cuenta_soles' => $cuentas_bancarias['cuenta_soles'],
                'cuenta_dolares' => $cuentas_bancarias['cuenta_dolares'],
                'total_format' => UtilHelper::convertirNumeroALetras($ordencomprafind->occ_total),
                'cotizaciones_string' => "COT." . $detalleordencomprafind
                    ->pluck('detalleMaterial.cotizaciones.0.cotizacion.coc_numero')
                    ->filter()->unique()->implode(', ')
            ];

            return Pdf::loadView('orden-compra.ordencompradisgregado', $data);
        } else {
            $data = [
                'ordencompra' => $ordencomprafind,
                'proveedor' => $ordencomprafind->proveedor,
                'detalle_ordencompra' => $detalleordencomprafind->groupBy(function ($item) {
                    return $item->pro_id . '-' . $item->ocd_preciounitario;
                })->map(function ($group) {
                    return [
                        'pro_id' => $group->first()->pro_id,
                        'ocd_descripcion' => $group->first()->ocd_descripcion,
                        'ocd_observacion' => $group->first()->detalleMaterial->odm_observacion,
                        'ocd_preciounitario' => number_format($group->first()->ocd_preciounitario, 2, '.', ''),
                        'uni_codigo' => $group->first()->producto ? $group->first()->producto->uni_codigo : '',
                        'ocd_cantidad' => $group->sum('ocd_cantidad'),
                        'ocd_total' => number_format($group->sum('ocd_total'), 2, '.', ''),
                    ];
                })->values(),
                'occ_fecha_formateada' => DateHelper::parserFecha($ordencomprafind->occ_fecha),
                'usuarioImpresion' => $user->usu_codigo,
                'fechaHoraImpresion' => date('Y-m-d H:i:s'),
                'cuenta_banco_nacion' => $cuentas_bancarias['cuenta_banco_nacion'],
                'cuenta_soles' => $cuentas_bancarias['cuenta_soles'],
                'cuenta_dolares' => $cuentas_bancarias['cuenta_dolares'],
                'total_format' => UtilHelper::convertirNumeroALetras(number_format($ordencomprafind->occ_total, 2, '.', '')),
                'cotizaciones_string' => "COT." . $detalleordencomprafind
                    ->pluck('detalleMaterial.cotizaciones.0.cotizacion.coc_numero')
                    ->filter()->unique()->implode(', ')
            ];

            return Pdf::loadView('orden-compra.ordencompra', $data);
        }
    }

    public function store(Request $request)
    {
        $user = auth()->user();
        $sed_codigo = "10";
        // iniciamos una transaccion
        try {
            DB::beginTransaction();
            $proveedorRequest = $request->input('proveedor');
            
            // Validación de la orden de compra
            try {
                $validatedData = validator($request->all(), [
                    'occ_fecha' => 'required|date',
                    'occ_fechaentrega' => 'nullable|date',
                    'mon_codigo' => 'required|string|exists:tblmonedas_mon,mon_codigo',
                    'fpa_codigo' => 'required|numeric|exists:tblformaspago_fpa,fpa_codigo',
                    'occ_referencia' => 'nullable|string',
                    'tra_elaborado' => 'required|exists:tbltrabajadores_tra,tra_id',
                    'occ_notas' => 'nullable|string',
                    'occ_adelanto' => 'nullable|numeric|min:1',
                    'occ_saldo' => 'nullable|numeric|min:1',
                    'occ_observacionpago' => 'nullable|string',
                    'occ_subtotal' => 'required|numeric|min:1',
                    'occ_impuesto' => 'required|numeric|min:0',
                    'occ_total' => 'required|numeric|min:1',
                    'occ_tipo' => 'required|string',
                    'occ_esactivo' => 'required|boolean',
                    'imprimir_disgregado' => 'required|boolean',
                    'detalle_productos' => 'required|array|min:1',
                    'detalle_productos_exedentes' => 'nullable|array|min:0',
                    'oic_otsap' => 'nullable|string',
                ])->validate();
            } catch (ValidationException $e) {
                Log::error('Error de validación en orden de compra', [
                    'errores' => $e->errors(),
                    'datos_enviados' => $request->all(),
                    'usuario' => $user->usu_codigo
                ]);
                throw $e;
            }

            // Validación de proveedor
            try {
                $validatedDataProveedor = validator($proveedorRequest, [
                    'prv_id' => 'nullable|exists:tblproveedores_prv,prv_id',
                    'prv_nombre' => 'required|string',
                    'prv_nrodocumento' => 'required|string',
                    'prv_correo' => 'nullable|email',
                    'prv_direccion' => 'nullable|string',
                    'prv_contacto' => 'nullable|string',
                    'prv_whatsapp' => 'nullable|string',
                    'cuentas_bancarias' => 'required|array|min:1',
                ])->validate();
            } catch (ValidationException $e) {
                Log::error('Error de validación en datos del proveedor', [
                    'errores' => $e->errors(),
                    'datos_proveedor' => $proveedorRequest,
                    'usuario' => $user->usu_codigo
                ]);
                throw $e;
            }

            // primero validamos que no exista un registro con el mismo numero de documento de proveedor
            $proveedor = Proveedor::where('prv_nrodocumento', $validatedDataProveedor['prv_nrodocumento'])->first();
            if (!$proveedor) {
                $proveedor = Proveedor::create([
                    'prv_nombre' => $validatedDataProveedor['prv_nombre'],
                    'prv_nrodocumento' => $validatedDataProveedor['prv_nrodocumento'],
                    'prv_correo' => $validatedDataProveedor['prv_correo'],
                    'prv_direccion' => $validatedDataProveedor['prv_direccion'],
                    'prv_contacto' => $validatedDataProveedor['prv_contacto'],
                    'prv_whatsapp' => $validatedDataProveedor['prv_whatsapp'],
                ]);
            } else {
                $proveedor->update([
                    'prv_correo' => $validatedDataProveedor['prv_correo'],
                    'prv_direccion' => $validatedDataProveedor['prv_direccion'],
                    'prv_contacto' => $validatedDataProveedor['prv_contacto'],
                    'prv_whatsapp' => $validatedDataProveedor['prv_whatsapp'],
                ]);
            }

            // actualizamos las cuentas
            foreach ($validatedDataProveedor['cuentas_bancarias'] as $cuenta) {
                if (isset($cuenta['pvc_id'])) {
                    $cuentaBancaria = ProveedorCuentaBanco::findOrFail($cuenta['pvc_id']);
                    $cuentaBancaria->update([
                        'pvc_numerocuenta' => $cuenta['pvc_numerocuenta'],
                        'mon_codigo' => $cuenta['mon_codigo'],
                        'eba_id' => $cuenta['eba_id'],
                    ]);
                } else {
                    ProveedorCuentaBanco::create([
                        'prv_id' => $proveedor->prv_id,
                        'pvc_numerocuenta' => $cuenta['pvc_numerocuenta'],
                        'mon_codigo' => $cuenta['mon_codigo'],
                        'eba_id' => $cuenta['eba_id'],
                    ]);
                }
            }

            // creacion de la orden de compra
            $trabajador = Trabajador::where('usu_codigo', $user->usu_codigo)->first();
            if ($trabajador) {
                $sed_codigo = $trabajador->sed_codigo;
            }

            $lastOrdenCompra = OrdenCompra::where('sed_codigo', $sed_codigo)
                ->orderBy('occ_id', 'desc')
                ->first();
            if (!$lastOrdenCompra) {
                $numero = 1;
            } else {
                $numero = intval(substr($lastOrdenCompra->occ_numero, 1)) + 1;
            }

            $prefijo_sede = $sed_codigo == '10' ? 'A' : 'L';

            $ordencompra = OrdenCompra::create([
                'occ_numero' => $prefijo_sede . str_pad($numero, 7, '0', STR_PAD_LEFT),
                'prv_id' => $proveedor->prv_id,
                'sed_codigo' => $sed_codigo,
                'occ_fecha' => $validatedData['occ_fecha'],
                'occ_fechaentrega' => $validatedData['occ_fechaentrega'],
                'mon_codigo' => $validatedData['mon_codigo'],
                'fpa_codigo' => $validatedData['fpa_codigo'],
                'occ_referencia' => $validatedData['occ_referencia'],
                'tra_elaborado' => $validatedData['tra_elaborado'],
                'occ_notas' => $validatedData['occ_notas'],
                'occ_total' => $validatedData['occ_total'],
                'occ_subtotal' => $validatedData['occ_subtotal'],
                'occ_impuesto' => $validatedData['occ_impuesto'],
                'occ_observacionpago' => $validatedData['occ_observacionpago'],
                'occ_adelanto' => $validatedData['occ_adelanto'],
                'occ_saldo' => $validatedData['occ_saldo'],
                'occ_tipo' => $validatedData['occ_tipo'],
                'occ_esactivo' => $validatedData['occ_esactivo'],
                'occ_estado' => 'EMI',
                'occ_usucreacion' => $user->usu_codigo,
                'occ_fecmodificacion' => null
            ]);

            // actualizamos la forma de pago del proveedor
            $proveedor->update([
                "fpa_codigo" => $validatedData['fpa_codigo']
            ]);

            foreach ($validatedData['detalle_productos'] as $detalle) {
                $ordencompraDetalle = OrdenCompraDetalle::create([
                    'odm_id' => $detalle['odm_id'],
                    'occ_id' => $ordencompra->occ_id,
                    'ocd_orden' => $detalle['ocd_orden'],
                    'pro_id' => $detalle['pro_id'],
                    'ocd_descripcion' => $detalle['ocd_descripcion'],
                    'ocd_observacion' => $detalle['ocd_observacion'],
                    'ocd_porcentajedescuento' => $detalle['ocd_porcentajedescuento'],
                    'ocd_cantidad' => $detalle['ocd_cantidad'],
                    'ocd_preciounitario' => $detalle['ocd_preciounitario'],
                    'ocd_total' => $detalle['ocd_cantidad'] * $detalle['ocd_preciounitario'] * (1 - $detalle['ocd_porcentajedescuento'] / 100),
                    'imp_codigo' => $detalle['imp_codigo'],
                    'ocd_porcentajeimpuesto' => $detalle['ocd_porcentajeimpuesto'],
                    'ocd_fechaentrega' => $detalle['ocd_fechaentrega'],
                    'ocd_activo' => 1,
                    'ocd_usucreacion' => $user->usu_codigo,
                    'ocd_fecmodificacion' => null
                ]);

                // ahora debemos actualizar o crear el registro en producto responsables
                $responsable_producto = ProductoResponsable::where('pro_id', $detalle['pro_id'])
                    ->where('sed_codigo', $sed_codigo)
                    ->first();

                $trabajador_elaborador = Trabajador::find($validatedData['tra_elaborado']);

                if ($responsable_producto) {
                    $responsable_producto->update([
                        'tra_id' => $trabajador_elaborador->tra_id
                    ]);
                } else {
                    ProductoResponsable::create([
                        "pro_id" => $detalle['pro_id'],
                        "tra_id" => $trabajador_elaborador->tra_id,
                        "sed_codigo" => $trabajador_elaborador->sed_codigo ?? $sed_codigo,
                        "pre_usucreacion" => $user->usu_codigo,
                        "pre_fecmodificacion" => null
                    ]);
                }
            }

            // Logica si existe detalle de exedentes
            if (!empty($validatedData['detalle_productos_exedentes'])) {
                // Crear requerimiento adicional
                $lastRequerimientoCabecera = OrdenInterna::where('sed_codigo', $sed_codigo)
                    ->where('oic_tipo', 'REQ')
                    ->orderBy('oic_id', 'desc')
                    ->first();
                    
                $numero = !$lastRequerimientoCabecera ? 1 : intval(substr($lastRequerimientoCabecera->odt_numero, 2)) + 1;

                // Crear el requerimiento
                $requerimiento_excedente = OrdenInterna::create([
                    'odt_numero' => 'RQ' . str_pad($numero, 7, '0', STR_PAD_LEFT),
                    'oic_fecha' => now(),
                    'sed_codigo' => $sed_codigo,
                    'oic_fechaentregaestimada' => now()->addDays(7),
                    'are_codigo' => $trabajador->are_codigo,
                    'tra_idorigen' => $trabajador->tra_id,
                    'mrq_codigo' => 'STK', // Requerimiento de stock
                    'oic_equipo_descripcion' => 'Requerimiento de excedente en orden de compra',
                    'oic_tipo' => 'REQ',
                    'oic_estado' => 'ENVIADO',
                    'oic_usucreacion' => $user->usu_codigo,
                    'oic_fecmodificacion' => null,
                    'oic_otsap' => $validatedData['oic_otsap']
                ]);

                // Crear parte de requerimiento
                $parteRequerimiento = Parte::where('oip_descripcion', 'REQUERIMIENTO')->first();
                if (!$parteRequerimiento) {
                    throw new Exception('No se encontró la parte requerimiento');
                }

                $detalleParte = OrdenInternaPartes::create([
                    'oic_id' => $requerimiento_excedente->oic_id,
                    'oip_id' => $parteRequerimiento->oip_id,
                    'opd_usucreacion' => $user->usu_codigo,
                    'opd_fecmodificacion' => null
                ]);

                // Crear materiales excedentes
                foreach ($validatedData['detalle_productos_exedentes'] as $index => $material) {
                    $ordenInternaMateriales = OrdenInternaMateriales::create([
                        'opd_id' => $detalleParte->opd_id,
                        'pro_id' => $material['pro_id'],
                        'odm_item' => $index + 1,
                        'odm_descripcion' => $material['ocd_descripcion'],
                        'odm_cantidad' => $material['ocd_cantidad'],
                        'odm_cantidadpendiente' => $material['odm_cantidadpendiente'],
                        'odm_observacion' => $material['ocd_observacion'],
                        'odm_tipo' => 1,
                        'odm_usucreacion' => $user->usu_codigo,
                        'odm_fecmodificacion' => null,
                        'odm_estado' => 'REQ',
                        'odm_fecconsultareservacion' => now()
                    ]);

                    OrdenCompraDetalle::create([
                        'odm_id' => $ordenInternaMateriales->odm_id,
                        'occ_id' => $ordencompra->occ_id,
                        'ocd_orden' => $material['ocd_orden'],
                        'pro_id' => $material['pro_id'],
                        'ocd_descripcion' => $material['ocd_descripcion'],
                        'ocd_observacion' => $material['ocd_observacion'],
                        'ocd_porcentajedescuento' => $material['ocd_porcentajedescuento'],
                        'ocd_cantidad' => $material['ocd_cantidad'],
                        'ocd_preciounitario' => $material['ocd_preciounitario'],
                        'ocd_total' => $material['ocd_cantidad'] * $material['ocd_preciounitario'] * (1 - $material['ocd_porcentajedescuento'] / 100),
                        'imp_codigo' => $material['imp_codigo'],
                        'ocd_porcentajeimpuesto' => $material['ocd_porcentajeimpuesto'],
                        'ocd_fechaentrega' => $material['ocd_fechaentrega'],
                        'ocd_activo' => 1,
                        'ocd_usucreacion' => $user->usu_codigo,
                        'ocd_fecmodificacion' => null
                    ]);
                }

            }

            DB::commit();

            // exportamos el PDF de la orden de compra generada
            $pdf = $this->generarPDF($ordencompra->occ_id, $validatedData['imprimir_disgregado'], $user);
            return $pdf->download('ordencompra.pdf');
        } catch (Exception $e) {
            DB::rollBack();
            return response()->json(["error" => $e->getMessage()], 500);
        }
    }

    // funcion de actualizar
    public function update(Request $request, $id)
    {
        $user = auth()->user();

        $ordencompra = OrdenCompra::find($id);

        if (!$ordencompra) {
            return response()->json(['error' => 'Orden de compra no encontrada.'], 404);
        }

        try {
            DB::beginTransaction();
            // Valida el request
            $validatedData = validator($request->all(), [
                'prv_id' => 'required|exists:tblproveedores_prv,prv_id',
                'pvc_cuentasoles' => 'nullable|integer',
                'pvc_cuentadolares' => 'nullable|integer',
                'pvc_cuentabanconacion' => 'nullable|integer',
                'occ_fecha' => 'required|date',
                'occ_fechaentrega' => 'nullable|date',
                'mon_codigo' => 'nullable|string|exists:tblmonedas_mon,mon_codigo',
                'occ_formapago' => 'nullable|string',
                'occ_referencia' => 'nullable|string',
                'tra_elaborado' => 'nullable|exists:tbltrabajadores_tra,tra_id',
                'tra_solicitado' => 'nullable|exists:tbltrabajadores_tra,tra_id',
                'tra_autorizado' => 'nullable|exists:tbltrabajadores_tra,tra_id',
                'occ_notas' => 'nullable|string',
                'occ_total' => 'required|numeric|min:1',
                'occ_subtotal' => 'required|numeric|min:1',
                'occ_impuesto' => 'required|numeric|min:1',
                'occ_observacionpago' => 'nullable|string',
                'occ_adelanto' => 'nullable|numeric|min:1',
                'occ_saldo' => 'nullable|numeric|min:1',
                'occ_tipo' => 'required|string',
                'occ_esactivo' => 'required|boolean',
                'detalle_productos' => 'nullable|array|min:0',
            ])->validate();

            // actualizamos la orden de compra
            $ordencompra->update([
                'prv_id' => $validatedData['prv_id'],
                'pvc_cuentasoles' => $validatedData['pvc_cuentasoles'],
                'pvc_cuentadolares' => $validatedData['pvc_cuentadolares'],
                'pvc_cuentabanconacion' => $validatedData['pvc_cuentabanconacion'],
                'occ_fecha' => $validatedData['occ_fecha'],
                'occ_fechaentrega' => $validatedData['occ_fechaentrega'],
                'mon_codigo' => $validatedData['mon_codigo'],
                'occ_formapago' => $validatedData['occ_formapago'],
                'occ_referencia' => $validatedData['occ_referencia'],
                'tra_elaborado' => $validatedData['tra_elaborado'],
                'tra_solicitado' => $validatedData['tra_solicitado'],
                'tra_autorizado' => $validatedData['tra_autorizado'],
                'occ_notas' => $validatedData['occ_notas'],
                'occ_total' => $validatedData['occ_total'],
                'occ_subtotal' => $validatedData['occ_subtotal'],
                'occ_impuesto' => $validatedData['occ_impuesto'],
                'occ_observacionpago' => $validatedData['occ_observacionpago'],
                'occ_adelanto' => $validatedData['occ_adelanto'],
                'occ_saldo' => $validatedData['occ_saldo'],
                'occ_tipo' => $validatedData['occ_tipo'],
                'occ_esactivo' => $validatedData['occ_esactivo'],
                'occ_estado' => '1',
                'occ_usumodificacion' => $user->usu_codigo,
            ]);

            foreach ($validatedData['detalle_productos'] as $detalle) {
                $ordencompraDetalle = OrdenCompraDetalle::create([
                    'pro_id' => $detalle['pro_id'],
                    'occ_id' => $ordencompra->occ_id,
                    'ocd_orden' => $detalle['ocd_orden'],
                    'ocd_descripcion' => $detalle['ocd_descripcion'],
                    'ocd_cantidad' => $detalle['ocd_cantidad'],
                    'ocd_preciounitario' => $detalle['ocd_preciounitario'],
                    'ocd_total' => $detalle['ocd_total'],
                    'ocd_activo' => 1,
                    'ocd_usucreacion' => $user->usu_codigo,
                    'ocd_fecmodificacion' => null
                ]);
            }

            DB::commit();
            return response()->json($ordencompra, 200);
        } catch (Exception $e) {
            // hacemos rollback y devolvemos el error
            DB::rollBack();
            return response()->json(["error" => $e->getMessage()], 500);
        }
    }

    public function show($id)
    {
        $ordencompra = OrdenCompra::with(['proveedor', 'moneda', 'elaborador', 'solicitador', 'autorizador', 'detalleOrdenCompra.producto'])->findOrFail($id);
        return response()->json($ordencompra);
    }

    public function exportarPDF(Request $request)
    {
        $user = auth()->user();
        try {
            $occ_id = $request->input('occ_id');
            $imprimir_disgregado = $request->input('imprimir_disgregado');

            $pdf = $this->generarPDF($occ_id, $imprimir_disgregado, $user);
            return $pdf->download('ordencompra.pdf');
        } catch (Exception $e) {
            return response()->json(["error" => $e->getMessage()], 500);
        }
    }

    public function aprobarMasivo(Request $request)
    {
        $user = auth()->user();

        $validatedData = validator($request->all(), [
            'ordenesCompra' => 'required|array|min:1',
            'clave' => 'required|string',
        ])->validate();

        // validamos que la clave ingresada corresponde al usuario que realizó la petición
        if (!Hash::check($request["clave"], $user->usu_contrasena)) {
            return response()->json(['error' => 'Clave: ' . $request["clave"] . 'La clave es incorrecta: ' . $user->usu_contrasena], 400);
        }

        // buscamos el trabajador relacionado con el usuario
        $trabajador_aprobacion = Trabajador::where('usu_codigo', $user->usu_codigo)->first();
        if (!$trabajador_aprobacion) {
            return response()->json(['error' => 'No se encontro el trabajador relacionado con el usuario'], 400);
        }

        try {
            DB::beginTransaction();
            
            // recorremos la lista de ordenes de compra a aprobar
            foreach ($validatedData['ordenesCompra'] as $ordencompraId) {
                $ordencompra = OrdenCompra::findOrFail($ordencompraId);
                $ordencompra->update([
                    'tra_autorizado' => $trabajador_aprobacion->tra_id,
                    'occ_fecautorizacion' => Carbon::now(),
                    'occ_estado' => 'APR'
                ]);
                
                // Obtener los detalles de la orden de compra
                $detallesOrden = OrdenCompraDetalle::where('occ_id', $ordencompra->occ_id)->get();
                
                // Registrar cada producto en el historial de productos por proveedor
                foreach ($detallesOrden as $detalle) {
                    // Crear un nuevo registro
                    ProductoProveedor::create([
                        'pro_id' => $detalle->pro_id,
                        'prv_id' => $ordencompra->prv_id,
                        'prp_nroordencompra' => $ordencompra->occ_numero,
                        'prp_fechaultimacompra' => Carbon::now(),
                        'prp_preciounitario' => $detalle->ocd_preciounitario,
                        'prp_observaciones' => null,
                        'prp_usucreacion' => $user->usu_codigo
                    ]);
                }
            }
            
            DB::commit();
            return response()->json('Se aprobaron las ordenes de compra y se actualizó el historial de productos por proveedor', 200);
        } catch (Exception $e) {
            DB::rollBack();
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    // ordenes de compra por emitir nota de ingreso
    public function ordenesCompraPorEmitirNotaIngreso()
    {
        $user = auth()->user();
        $sed_codigo = "10";

        $trabajador = Trabajador::where('usu_codigo', $user->usu_codigo)->first();

        if ($trabajador) {
            $sed_codigo = $trabajador->sed_codigo;
        }

        // solo mostramos las ordenes de compra con items pendientes por ingresar
        $ordenesPendientes =  OrdenCompra::with(['moneda', 'proveedor', 'detalleOrdenCompra'])
            ->whereHas('detalleOrdenCompra', function ($query) {
                $query->whereColumn('ocd_cantidad', '>', 'ocd_cantidadingresada');
            })
            ->where('sed_codigo', $sed_codigo)
            ->get()
            ->map(function ($orden) {
                $orden->items_pendientes = $orden->detalleOrdenCompra
                    ->filter(function ($detalle) {
                        return $detalle->ocd_cantidad > $detalle->ocd_cantidadingresada;
                    })
                    ->count();
                return $orden;
            });

        return response()->json($ordenesPendientes);
    }

    // traemos los detalles pendientes de una orden de compra
    public function ordenCompraDetallesPendientesById($occ_id)
    {
        $ordencompra = OrdenCompra::with('moneda', 'proveedor', 'sede', 'formaPago', 'elaborador')
            ->findOrFail($occ_id);

        $detalles = OrdenCompraDetalle::with('producto', 'impuesto', 'detalleMaterial.ordenInternaParte.ordenInterna')
            ->where('occ_id', $occ_id)
            ->whereColumn('ocd_cantidad', '>', 'ocd_cantidadingresada')
            ->get();

        $data = array(
            "orden_compra" => $ordencompra,
            "detalles" => $detalles->map(function ($detalle) {
                $detalle->ocd_cantidadpendiente = $detalle->ocd_cantidad - $detalle->ocd_cantidadingresada;
                return $detalle;
            })
        );

        return response()->json($data);
    }
}
