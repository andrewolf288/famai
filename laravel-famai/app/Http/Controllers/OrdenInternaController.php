<?php

namespace App\Http\Controllers;

use App\OrdenInterna;
use App\OrdenInternaPartes;
use App\OrdenInternaMateriales;
use App\OrdenInternaProcesos;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class OrdenInternaController extends Controller
{
    /**
     * Display a listing of the resource.
     *
     * @return \Illuminate\Http\Response
     */
    public function index(Request $request)
    {
        $pageSize = $request->input('page_size', 10);
        $page = $request->input('page', 1);
        $otNumero = $request->input('ot_numero', null);
        $oiNumero = $request->input('oi_numero', null);
        $equipo = $request->input('oic_equipo_descripcion', null);

        $query = OrdenInterna::with(['cliente', 'area', 'trabajadorOrigen', 'trabajadorMaestro', 'trabajadorAlmacen']);

        $ordenesInternas = $query->paginate($pageSize, ['*'], 'page', $page);

        // Agregar el total de materiales
        $ordenesInternas->getCollection()->transform(function ($ordenInterna) {
            $ordenInterna->total_materiales = $ordenInterna->totalMateriales();
            return $ordenInterna;
        });

        return response()->json([
            'message' => 'Se listan las ordenes internas',
            'data' => $ordenesInternas->items(),
            'count' => $ordenesInternas->total()
        ]);
    }

    private function editar_producto_materiales($varDatosEntrada, $oip)
    {
        $user = auth()->user();

        $OrdenInternaPartes = OrdenInternaPartes::find($oip);

        if (!$OrdenInternaPartes) {
            return false;
        }

        $detalle_partes = json_decode($varDatosEntrada, true);
        $detalle_materiales = $detalle_partes['detalle_materiales'] ?? [];
        $detalle_procesos = $detalle_partes['detalle_procesos'] ?? [];

        foreach ($detalle_materiales as $material) {
            $data = [
                'pro_id' => $material['pro_id'] ?? null,
                'odm_item' => $material['odm_item'] ?? null,
                'odm_descripcion' => $material['odm_descripcion'] ?? null,
                'odm_cantidad' => $material['odm_cantidad'] ?? null,
                'odm_observacion' => $material['odm_observacion'] ?? null,
                'odm_tipo' => $material['odm_tipo'] ?? 1,
                'odm_estado' => $material['odm_estado'] ?? 1,
            ];

            $odm_id = $material['odm_id'];
            if (!$this->update_material($data, $odm_id)) {
                return false;
            }
        }

        foreach ($detalle_procesos as $proceso) {
            $data = [
                'opp_id' => $proceso['opp_id'] ?? null,
                'odp_observacion' => $proceso['odp_observacion'] ?? null,
                'odp_estado' => $proceso['odp_estado'] ?? null,
            ];

            $odp_id = $proceso['odp_id'];
            if (!$this->update_proceso($data, $odp_id)) {
                return false;
            }
        }

        return true;
    }

    private function update_material(array $data, $id)
    {
        $user = auth()->user();

        $OrdenInternaMateriales = OrdenInternaMateriales::find($id);

        if (!$OrdenInternaMateriales) {
            return false;
        }

        // Validamos los datos
        $validator = Validator::make($data, [
            'pro_id' => 'nullable|integer|exists:tblproductos_pro,pro_id',
            'odm_item' => 'nullable|integer',
            'odm_descripcion' => 'nullable|string|max:250',
            'odm_cantidad' => 'nullable|numeric|min:0',
            'odm_observacion' => 'nullable|string|max:250',
            'odm_tipo' => 'nullable|integer',
            'odm_estado' => 'required|boolean',
        ]);

        if ($validator->fails()) {
            return false;
        }

        $OrdenInternaMateriales->update(array_merge(
            $validator->validated(),
            [
                "usu_usumodificacion" => $user->usu_codigo,
            ]
        ));

        return true;
    }

    private function update_proceso(array $data, $id)
    {
        $user = auth()->user();

        $OrdenInternaProcesos = OrdenInternaProcesos::find($id);

        if (!$OrdenInternaProcesos) {
            return false;
        }

        // Validamos los datos
        $validator = Validator::make($data, [
            'opp_id' => 'required|integer|exists:tblordenesinternasprocesos_opp,opp_id',
            'odp_observacion' => 'nullable|string|max:250',
            'odp_estado' => 'nullable|boolean',
        ]);

        if ($validator->fails()) {
            return false;
        }

        $OrdenInternaProcesos->update(array_merge(
            $validator->validated(),
            [
                "usu_usumodificacion" => $user->usu_codigo,
            ]
        ));

        return true;
    }
}
