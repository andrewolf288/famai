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
use App\Helpers\UtilHelper;
use App\Proveedor;
use App\ProveedorCuentaBanco;
use Carbon\Carbon;
use Illuminate\Support\Facades\Hash;

class OrdenCompraController extends Controller
{
    public function index(Request $request)
    {
        $user = auth()->user();
        $sed_codigo = "10";

        $trabajador = Trabajador::where('usu_codigo', $user->usu_codigo)->first();

        if ($trabajador) {
            $sed_codigo = $trabajador->sed_codigo;
        }

        $pageSize = $request->input('page_size', 10);
        $page = $request->input('page', 1);

        $query = OrdenCompra::with(['proveedor', 'moneda', 'autorizador', 'elaborador'])
            ->where('sed_codigo', $sed_codigo);

        $query->orderBy('occ_fecha', 'desc');

        $cotizaciones = $query->paginate($pageSize, ['*'], 'page', $page);
        return response()->json([
            'message' => 'Se listan las ordenes de compra',
            'data' => $cotizaciones->items(),
            'count' => $cotizaciones->total()
        ]);
    }

    public function findByNumero($numero) {}

    private function generarPDF($occ_id, $imprimir_disgregado = false, $user)
    {
        // consultamos la orden de compra --- aqui necesito un id para consultar la orden de compra
        $ordencomprafind = OrdenCompra::with('proveedor.cuentasBancarias.entidadBancaria', 'moneda', 'elaborador', 'solicitador', 'autorizador')
            ->where('occ_id', $occ_id)->first();

        // consultamos el detalle de orden de compra
        $detalleordencomprafind = OrdenCompraDetalle::with('producto', 'detalleMaterial.usuarioCreador', 'detalleMaterial.ordenInternaParte.ordenInterna')
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
                        'ocd_preciounitario' => $detalle->ocd_preciounitario,
                        'ocd_cantidad' => $detalle->ocd_cantidad,
                        'ocd_total' => $detalle->ocd_total,
                        'uni_codigo' => $detalle->producto ? $detalle->producto->uni_codigo : '',
                        'odt_numero' => $detalle->detalleMaterial->ordenInternaParte->ordenInterna->odt_numero ?? null,
                        'usu_nombre' => $detalle->detalleMaterial->usuarioCreador->usu_nombre ?? null
                    ];
                }),
                'occ_fecha_formateada' => DateHelper::parserFecha($ordencomprafind->occ_fecha),
                'usuarioImpresion' => $user->usu_codigo,
                'fechaHoraImpresion' => date('Y-m-d H:i:s'),
                'cuenta_banco_nacion' => $cuentas_bancarias['cuenta_banco_nacion'],
                'cuenta_soles' => $cuentas_bancarias['cuenta_soles'],
                'cuenta_dolares' => $cuentas_bancarias['cuenta_dolares'],
                'total_format' => UtilHelper::convertirNumeroALetras($ordencomprafind->occ_total),
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
                        'ocd_preciounitario' => $group->first()->ocd_preciounitario,
                        'uni_codigo' => $group->first()->producto ? $group->first()->producto->uni_codigo : '',
                        'ocd_cantidad' => $group->sum('ocd_cantidad'),
                        'ocd_total' => $group->sum('ocd_total'),
                    ];
                })->values(),
                'occ_fecha_formateada' => DateHelper::parserFecha($ordencomprafind->occ_fecha),
                'usuarioImpresion' => $user->usu_codigo,
                'fechaHoraImpresion' => date('Y-m-d H:i:s'),
                'cuenta_banco_nacion' => $cuentas_bancarias['cuenta_banco_nacion'],
                'cuenta_soles' => $cuentas_bancarias['cuenta_soles'],
                'cuenta_dolares' => $cuentas_bancarias['cuenta_dolares'],
                'total_format' => UtilHelper::convertirNumeroALetras($ordencomprafind->occ_total),
            ];

            return Pdf::loadView('orden-compra.ordencompra', $data);
        }
    }

    public function store(Request $request)
    {
        $user = auth()->user();
        $sed_codigo = "10";

        $trabajador = Trabajador::where('usu_codigo', $user->usu_codigo)->first();

        if ($trabajador) {
            $sed_codigo = $trabajador->sed_codigo;
        }
        // iniciamos una transaccion
        try {
            DB::beginTransaction();
            $proveedorRequest = $request->input('proveedor');
            // Valida de la orden de compra
            $validatedData = validator($request->all(), [
                'occ_fecha' => 'required|date',
                'occ_fechaentrega' => 'nullable|date',
                'mon_codigo' => 'required|string|exists:tblmonedas_mon,mon_codigo',
                'fpa_codigo' => 'required|numeric|exists:tblformaspago_fpa,fpa_codigo',
                'occ_referencia' => 'nullable|string',
                'tra_elaborado' => 'nullable|exists:tbltrabajadores_tra,tra_id',
                'occ_notas' => 'nullable|string',
                'occ_adelanto' => 'nullable|numeric|min:1',
                'occ_saldo' => 'nullable|numeric|min:1',
                'occ_observacionpago' => 'nullable|string',
                'occ_subtotal' => 'required|numeric|min:1',
                'occ_impuesto' => 'required|numeric|min:1',
                'occ_total' => 'required|numeric|min:1',
                'imprimir_disgregado' => 'required|boolean',
                'detalle_productos' => 'required|array|min:1',
            ])->validate();

            // validacion de proveedor
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
            $lastOrdenCompra = OrdenCompra::orderBy('occ_id', 'desc')->first();
            if (!$lastOrdenCompra) {
                $numero = 1;
            } else {
                $numero = intval($lastOrdenCompra->occ_numero) + 1;
            }

            $ordencompra = OrdenCompra::create([
                'occ_numero' => str_pad($numero, 7, '0', STR_PAD_LEFT),
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
                'occ_estado' => 'SOL',
                'occ_usucreacion' => $user->usu_codigo,
                'occ_fecmodificacion' => null
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
                    'ocd_total' => $detalle['ocd_total'],
                    'imp_codigo' => $detalle['imp_codigo'],
                    'ocd_porcentajeimpuesto' => $detalle['ocd_porcentajeimpuesto'],
                    'ocd_activo' => 1,
                    'ocd_usucreacion' => $user->usu_codigo,
                    'ocd_fecmodificacion' => null
                ]);
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

        // recorremos la lista de ordenes de compra a aprobar
        foreach ($validatedData['ordenesCompra'] as $ordencompra) {
            $ordencompra = OrdenCompra::findOrFail($ordencompra);
            $ordencompra->update([
                'tra_autorizado' => $trabajador_aprobacion->tra_id,
                'occ_fecautorizacion' => Carbon::now(),
                'occ_estado' => 'APR'
            ]);
        }

        return response()->json('Se aprobaron las ordenes de compra', 200);
    }
}
