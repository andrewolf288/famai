<?php

namespace App\Http\Controllers;

use App\OrdenCompra;
use App\OrdenCompraDetalle;
use Barryvdh\DomPDF\Facade\Pdf;
use Carbon\Carbon;
use Exception;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class OrdenCompraController extends Controller
{
    public function index(Request $request)
    {
        $pageSize = $request->input('page_size', 10);
        $page = $request->input('page', 1);

        $query = OrdenCompra::with(['proveedor', 'moneda']);
        $query->orderBy('occ_fecha', 'desc');

        $cotizaciones = $query->paginate($pageSize, ['*'], 'page', $page);
        return response()->json([
            'message' => 'Se listan las ordenes de compra',
            'data' => $cotizaciones->items(),
            'count' => $cotizaciones->total()
        ]);
    }

    public function findByNumero($numero) {}

    public function store(Request $request)
    {
        $user = auth()->user();
        // iniciamos una transaccion
        DB::beginTransaction();
        try {
            // Valida el request
            $validatedData = validator($request->all(), [
                'prv_id' => 'required|exists:tblproveedores_prv,prv_id',
                'pvc_id' => 'nullable|integer',
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
                'detalle_productos' => 'required|array|min:1',
            ])->validate();

            $lastOrdenCompra = OrdenCompra::orderBy('occ_id', 'desc')->first();
            if (!$lastOrdenCompra) {
                $numero = 1;
            } else {
                $numero = intval($lastOrdenCompra->occ_numero) + 1;
            }

            $ordencompra = OrdenCompra::create([
                'occ_numero' => str_pad($numero, 7, '0', STR_PAD_LEFT),
                'prv_id' => $validatedData['prv_id'],
                'pvc_id' => $validatedData['pvc_id'],
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
                'occ_usucreacion' => $user->usu_codigo,
                'occ_fecmodificacion' => null
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
        try {
            $occ_id = $request->input('occ_id');
            $ordenCompra = OrdenCompra::with(['proveedor', 'moneda', 'elaborador', 'solicitador', 'autorizador', 'detalleOrdenCompra.producto.unidad'])->findOrFail($occ_id);
            $data = array_merge(
                $ordenCompra->toArray(),
                [
                    'occ_fecha_formateada' => Carbon::parse($ordenCompra->occ_fecha)->format('d/m/Y'),
                ]
            );
            $pdf = Pdf::loadView('orden-compra.ordencompra', $data);
            return $pdf->download('ordencompra.pdf');
        } catch (Exception $e) {
            return response()->json(["error" => $e->getMessage()], 500);
        }
    }
}
