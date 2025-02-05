<?php

namespace App\Http\Controllers;

use App\Almacen;
use App\AlmacenMovimiento;
use App\AlmacenMovimientoDetalle;
use App\Producto;
use App\Services\ProductoService;
use App\Trabajador;
use App\Unidad;
use Carbon\Carbon;
use Exception;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class AlmacenMovimientoController extends Controller
{
    // ingreso almacen movimiento
    public function ingresoAlmacenMovimiento(Request $request)
    {
        $user = auth()->user();
        $sed_codigo = "10";

        $trabajador = Trabajador::where('usu_codigo', $user->usu_codigo)->first();

        if ($trabajador) {
            $sed_codigo = $trabajador->sed_codigo;
        }

        // consultamos almacen de reservas
        $almacenReservas = Almacen::where('sed_codigo', $sed_codigo)
            ->where('alm_esprincipal', 0)
            ->first();

        // definimos el servicio de producto
        $productoService = new ProductoService();

        try {
            DB::beginTransaction();
            $validatedData = validator($request->all(), [
                'alm_id' => 'required|exists:tblalmacenes_alm,alm_id',
                'prv_id' => 'required|exists:tblproveedores_prv,prv_id',
                'mon_codigo' => 'required|string|exists:tblmonedas_mon,mon_codigo',
                'tdr_codigo' => 'required|exists:tbltiposdocumentoreferencia_tdr,tdr_codigo',
                'mtm_codigo' => 'required|exists:tblmotivosmovimientos_mtm,mtm_codigo',
                'amc_fechamovimiento' => 'required|date',
                'amc_documentoreferenciaserie' => 'required|string',
                'amc_documentoreferencianumero' => 'required|string',
                'amc_documentoreferenciafecha' => 'required|string',
                'amc_consumodirecto' => 'required|boolean',
                'detalle' => 'required|array|min:1',
            ])->validate();

            // debemos buscar el numero de movimiento segun la sede
            $lastAlmacenMovimiento = AlmacenMovimiento::where('sed_codigo', $sed_codigo)
                ->orderBy('amc_id', 'desc')
                ->first();
            if (!$lastAlmacenMovimiento) {
                $numero = 1;
            } else {
                $numero = intval($lastAlmacenMovimiento->amc_numero) + 1;
            }

            $movimientoIngreso = AlmacenMovimiento::create([
                'amc_numero' => $numero,
                'alm_id' => $validatedData['alm_id'],
                'sed_codigo' => $sed_codigo,
                'prv_id' => $validatedData['prv_id'],
                'mon_codigo' => $validatedData['mon_codigo'],
                'mtm_codigo' => $validatedData['mtm_codigo'],
                'tdr_codigo' => $validatedData['tdr_codigo'],
                'amc_fechamovimiento' => $validatedData['amc_fechamovimiento'],
                'amc_tipomovimiento' => "I",
                'amc_documentoreferenciaserie' => $validatedData['amc_documentoreferenciaserie'],
                'amc_documentoreferencianumero' => $validatedData['amc_documentoreferencianumero'],
                'amc_documentoreferenciafecha' => $validatedData['amc_documentoreferenciafecha'],
                'amc_consumodirecto' => $validatedData['amc_consumodirecto'],
                'amc_usucreacion' => $user->usu_codigo,
                'amc_feccreacion' => Carbon::now(),
                'amc_fecmodificacion' => null
            ]);

            foreach ($validatedData['detalle'] as $detalle) {
                if (isset($detalle['odm_id'])) {
                    // el ingreso se almacena en almacen de reservas
                    AlmacenMovimientoDetalle::create([
                        "amc_id" => $movimientoIngreso->amc_id,
                        "ocd_id" => $detalle['ocd_id'],
                        "odm_id" => $detalle['odm_id'],
                        "pro_id" => $detalle['pro_id'],
                        "amd_tipomovimiento" => "I",
                        "alm_id" => $almacenReservas->alm_id,
                        "amd_cantidad" => $detalle['amd_cantidad'],
                        "amd_ubicacion" => $detalle['amd_ubicacion'],
                        "amd_serie" => $detalle['amd_serie'],
                        "amd_preciounitario" => $detalle['amd_preciounitario'],
                        "amd_usucreacion" => $user->usu_codigo,
                        "amd_feccreacion" => Carbon::now(),
                        'amd_fecmodificacion' => null
                    ]);
                } else {
                    $pro_id = $productoService->findProductoOrCreate($detalle['pro_id'], $user);
                    // el ingreso se almacena en almacen principal
                    AlmacenMovimientoDetalle::create([
                        "amc_id" => $movimientoIngreso->amc_id,
                        "pro_id" => $pro_id,
                        "amd_tipomovimiento" => "I",
                        "alm_id" => $validatedData['alm_id'],
                        "amd_cantidad" => $detalle['amd_cantidad'],
                        "amd_ubicacion" => $detalle['amd_ubicacion'],
                        "amd_serie" => $detalle['amd_serie'],
                        "amd_preciounitario" => $detalle['amd_preciounitario'],
                        "amd_usucreacion" => $user->usu_codigo,
                        "amd_feccreacion" => Carbon::now(),
                        'amd_fecmodificacion' => null
                    ]);
                }
            }

            $consumoDirecto = $validatedData['amc_consumodirecto'];
            // si es consumo directo, debemos realizar la operación de salida correspondiente
            if ($consumoDirecto) {
                $movimientoSalida = AlmacenMovimiento::create([
                    'amc_numero' => $numero + 1,
                    'alm_id' => $validatedData['alm_id'],
                    'sed_codigo' => $sed_codigo,
                    'mtm_codigo' => $validatedData['mtm_codigo'],
                    'amc_fechamovimiento' => $validatedData['amc_fechamovimiento'],
                    'amc_tipomovimiento' => 'S',
                    'amc_usucreacion' => $user->usu_codigo,
                    'amc_feccreacion' => Carbon::now(),
                    'amc_fecmodificacion' => null
                ]);

                foreach ($validatedData['detalle'] as $detalle) {
                    // debemos verificar si existe información de odm_id
                    if (isset($detalle['odm_id'])) {
                        // estamos hablando de un producto ya creado en la base de datos el cual debe ir al almacen de reserva
                        AlmacenMovimientoDetalle::create([
                            "amc_id" => $movimientoSalida->amc_id,
                            "ocd_id" => $detalle['ocd_id'],
                            "odm_id" => $detalle['odm_id'],
                            "pro_id" => $detalle['pro_id'],
                            "amd_tipomovimiento" => "S",
                            "alm_id" => $almacenReservas->alm_id,
                            "amd_cantidad" => $detalle['amd_cantidad'],
                            "amd_usucreacion" => $user->usu_codigo,
                            "amd_feccreacion" => Carbon::now(),
                            'amd_fecmodificacion' => null
                        ]);
                    } else {
                        $findMaterial = Producto::where('pro_codigo', $detalle['pro_id'])->first();
                        AlmacenMovimientoDetalle::create([
                            "amc_id" => $movimientoSalida->amc_id,
                            "pro_id" => $findMaterial->pro_id,
                            "amd_tipomovimiento" => "S",
                            "alm_id" => $validatedData['alm_id'],
                            "amd_cantidad" => $detalle['amd_cantidad'],
                            "amd_usucreacion" => $user->usu_codigo,
                            "amd_feccreacion" => Carbon::now(),
                            'amd_fecmodificacion' => null
                        ]);
                    }
                }
            }

            DB::commit();

            return response()->json(["success" => "Orden de compra creada con exito"], 200);
        } catch (Exception $e) {
            DB::rollBack();
            return response()->json([
                "error" => $e->getMessage(),
            ], 500);
        }
    }

    // salida almacen movimiento
    public function salidaAlmacenMovimiento(Request $request) {
        
    }
}
