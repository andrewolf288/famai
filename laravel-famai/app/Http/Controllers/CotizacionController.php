<?php

namespace App\Http\Controllers;

use App\Cotizacion;
use App\CotizacionDetalle;
use App\CotizacionDetalleArchivos;
use Exception;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class CotizacionController extends Controller
{
    public function index(Request $request)
    {
        $pageSize = $request->input('page_size', 10);
        $page = $request->input('page', 1);

        $query = Cotizacion::with(['proveedor', 'moneda']);
        $query->orderBy('coc_fechacotizacion', 'desc');

        $cotizaciones = $query->paginate($pageSize, ['*'], 'page', $page);
        return response()->json([
            'message' => 'Se listan las ordenes internas',
            'data' => $cotizaciones->items(),
            'count' => $cotizaciones->total()
        ]);
    }

    public function store(Request $request)
    {
        $user = auth()->user();
        // iniciamos una transaccion
        DB::beginTransaction();
        try {
            $request->validate([
                'cotizacion' => 'required|string',
            ]);

            $data = json_decode($request->input('cotizacion'), true);

            if (json_last_error() !== JSON_ERROR_NONE) {
                return response()->json(['error' => 'El campo data contiene un JSON inválido.'], 400);
            }

            // Valida el request
            $validatedData = validator($data, [
                'prv_id' => 'required|exists:tblproveedores_prv,prv_id',
                'coc_fechacotizacion' => 'required|date',
                'mon_codigo' => 'nullable|string|exists:tblmonedas_mon,mon_codigo',
                'coc_formapago' => 'nullable|string',
                'tra_solicitante' => 'nullable|exists:tbltrabajadores_tra,tra_id',
                'coc_notas' => 'nullable|string',
                'coc_total' => 'required|numeric|min:1',
                'detalle_productos' => 'required|array|min:1',
                'detalle_descripciones' => 'nullable|array|min:1',
            ])->validate();

            $cotizacion = Cotizacion::create([
                'prv_id' => $validatedData['prv_id'],
                'coc_fechacotizacion' => $validatedData['coc_fechacotizacion'],
                'mon_codigo' => $validatedData['mon_codigo'],
                'coc_formapago' => $validatedData['coc_formapago'],
                'tra_solicitante' => $validatedData['tra_solicitante'],
                'coc_notas' => $validatedData['coc_notas'],
                'coc_total' => $validatedData['coc_total'],
                'coc_estado' => '1',
                'coc_usucreacion' => $user->usu_codigo,
                'coc_fecmodificacion' => null
            ]);

            foreach ($validatedData['detalle_productos'] as $detalle) {
                $cotizacionDetalle = CotizacionDetalle::create([
                    'pro_id' => $detalle['pro_id'],
                    'coc_id' => $cotizacion->coc_id,
                    'cod_orden' => $detalle['cod_orden'],
                    'cod_descripcion' => $detalle['cod_descripcion'],
                    'cod_cantidad' => $detalle['cod_cantidad'],
                    'cod_preciounitario' => $detalle['cod_preciounitario'],
                    'cod_total' => $detalle['cod_total'],
                    'cod_activo' => 1,
                    'cod_usucreacion' => $user->usu_codigo,
                    'cod_fecmodificacion' => null
                ]);
            }

            $detalle_descripcion = $validatedData['detalle_descripciones'];

            if ($request->hasFile('files')) {
                // Obtenemos todos los archivos
                $files = $request->file('files');
                $countArray = 0;
                foreach ($files as $file) {
                    $path = $file->store('cotizacion-adjuntos', 'public');
                    $cotizacionDetalleArchivo = CotizacionDetalleArchivos::create([
                        'coc_id' => $cotizacion->coc_id,
                        'cda_descripcion' => $detalle_descripcion[$countArray],
                        'cda_url' => $path,
                        'cda_activo' => 1,
                        'cda_usucreacion' => $user->usu_codigo,
                        'cda_fecmodificacion' => null
                    ]);
                    $countArray++;
                }
            }

            DB::commit();
            return response()->json($cotizacion, 200);
        } catch (Exception $e) {
            // hacemos rollback y devolvemos el error
            DB::rollBack();
            return response()->json(["error" => $e->getMessage()], 500);
        }
    }

    public function show($id)
    {

    }
}
