<?php

namespace App\Http\Controllers;

use App\AlmacenMovimiento;
use App\AlmacenMovimientoDetalle;
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

        try {
            $validatedData = validator($request->all(), [
                'alm_id' => 'required|exists:tblalmacenes_alm,alm_id',
                'amc_documentoreferenciafecha' => 'nullable|string',
                'tdr_codigo' => 'required|exists:tbltiposdocumentoreferencia_tdr,tdr_codigo',
                'mtm_codigo' => 'required|exists:tblmotivosmovimientos_mtm,mtm_codigo',
                'consumo_directo' => 'required|boolean',
                'amc_documentoreferenciaserie' => 'nullable|string',
                'amc_documentoreferencianumero' => 'nullable|string',
                'detalle' => 'required|array|min:1',
            ])->validate();

            $movimientoIngreso = AlmacenMovimiento::create([
                // 'amc_numero' => str_pad($numero, 7, '0', STR_PAD_LEFT),
                'alm_id' => $validatedData['alm_id'],
                'amc_fechamovimiento' => Carbon::now(),
                'amc_tipomovimiento' => "I",
                'amc_documentoreferenciaserie' => $validatedData['amc_documentoreferenciaserie'],
                'amc_documentoreferencianumero' => $validatedData['amc_documentoreferencianumero'],
                'amc_documentoreferenciafecha' => $validatedData['amc_documentoreferenciafecha'],
                'mtm_codigo' => $validatedData['mtm_codigo'],
                'tdr_codigo' => $validatedData['tdr_codigo'],
                'amc_usucreacion' => $user->usu_codigo,
                'amc_feccreacion' => Carbon::now(),
                'amc_fecmodificacion' => null
            ]);

            foreach ($validatedData['detalle'] as $detalle) {
                AlmacenMovimientoDetalle::create([
                    "amc_id" => $movimientoIngreso->amc_id,
                    "ocd_id" => $detalle['ocd_id'],
                    "pro_id" => $detalle['pro_id'],
                    "amd_tipomovimiento" => "I",
                    "alm_id" => $validatedData['alm_id'],
                    "pro_codigo" => $detalle['pro_codigo'],
                    "amd_cantidad" => $detalle['amd_cantidad'],
                    "amd_usucreacion" => $user->usu_codigo,
                    "amd_feccreacion" => Carbon::now(),
                    'amd_fecmodificacion' => null
                ]);
            }

            $consumoDirecto = $validatedData['consumo_directo'];
            // si es consumo directo, debemos realizar la operación de salida correspondiente
            if ($consumoDirecto) {
                $movimientoSalida = AlmacenMovimiento::create([
                    'alm_id' => $validatedData['alm_id'],
                    'amc_fechamovimiento' => Carbon::now(),
                    'amc_tipomovimiento' => 'S',
                    'mtm_codigo' => 'VNT',
                    'amc_usucreacion' => $user->usu_codigo,
                    'amc_feccreacion' => Carbon::now(),
                    'amc_fecmodificacion' => null
                ]);

                foreach ($validatedData['detalle'] as $detalle) {
                    AlmacenMovimientoDetalle::create([
                        "amc_id" => $movimientoSalida->amc_id,
                        "pro_id" => $detalle['pro_id'],
                        "pro_codigo" => $detalle['pro_codigo'],
                        "amd_tipomovimiento" => "S",
                        "alm_id" => $validatedData['alm_id'],
                        "amd_cantidad" => $detalle['amd_cantidad'],
                        "amd_usucreacion" => $user->usu_codigo,
                        "amd_feccreacion" => Carbon::now(),
                        'amd_fecmodificacion' => null
                    ]);
                }
            }

            return response()->json(["success" => "Orden de compra creada con exito"], 200);
        } catch (Exception $e) {
            return response()->json([
                "error" => $e->getMessage(),
                "code" => $e->getCode(),
                "file" => $e->getFile(),
                "line" => $e->getLine(),
                "trace" => $e->getTraceAsString(), // Para obtener la traza completa del error
            ], 500);
        }
    }

    // salida almacen movimiento
    public function salidaAlmacenMovimiento(Request $request) {}
}
