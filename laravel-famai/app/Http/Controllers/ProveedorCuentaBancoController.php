<?php

namespace App\Http\Controllers;

use App\Helpers\UtilHelper;
use App\ProveedorCuentaBanco;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\Rule;

class ProveedorCuentaBancoController extends Controller
{
    public function index() {}

    public function findCuentasBancariasByProveedor($id)
    {
        // Actualizar cuentas bancarias del proveedor antes de obtenerlas
        $user = auth()->user();
        $proveedorActualizado = UtilHelper::actualizarCuentasBancariasProveedor($id, $user ? $user->usu_codigo : null);
        
        // Si el proveedor no existe, retornar error
        if (!$proveedorActualizado) {
            return response()->json(['error' => 'Proveedor no encontrado'], 404);
        }
        
        $cuentas = ProveedorCuentaBanco::with(['moneda', 'entidadBancaria'])->where('prv_id', $id)->get();
        return response()->json($cuentas);
    }

    public function show($id)
    {
        $cuentabancaria = ProveedorCuentaBanco::find($id);

        if (!$cuentabancaria) {
            return response()->json(['error' => 'Cuenta bancaria no encontrada'], 404);
        }

        return response()->json($cuentabancaria);
    }

    public function store(Request $request)
    {
        $user = auth()->user();

        $validator = Validator::make($request->all(), [
            'prv_id' => 'required|integer|exists:tblproveedores_prv,prv_id',
            'mon_codigo' => 'required|string|max:3|exists:tblmonedas_mon,mon_codigo',
            'eba_id' => 'required|integer|exists:tblentidadbancaria_eba,eba_id',
            'pvc_numerocuenta' => 'required|string|max:50|unique:tblproveedorctasbancos_pvc,pvc_numerocuenta',
        ], [
            'pvc_numerocuenta.required' => 'El número de cuenta es obligatorio.',
            'pvc_numerocuenta.unique' => 'El número de cuenta ya está registrado.',
        ]);

        // Validamos la información
        if ($validator->fails()) {
            return response()->json(["error" => $validator->errors()->toJson()], 400);
        }

        $cuentabancaria = ProveedorCuentaBanco::create([
            'prv_id' => $request->prv_id,
            'mon_codigo' => $request->mon_codigo,
            'eba_id' => $request->eba_id,
            'pvc_numerocuenta' => $request->pvc_numerocuenta,
            'pvc_usucreacion' => $user->usu_codigo,
            'pvc_fecmodificacion' => null
        ]);

        return response()->json([
            'data' => $cuentabancaria,
            'message' => 'Cuenta bancaria registrada exitosamente'
        ]);
    }

    public function update(Request $request, $id)
    {
        $user = auth()->user();

        $cuentabancaria = ProveedorCuentaBanco::find($id);

        if (!$cuentabancaria) {
            return response()->json(['error' => 'Cuenta bancaria de proveedor no encontrado'], 404);
        }

        $validator = Validator::make(
            $request->all(),
            [
                'mon_codigo' => 'required|string|max:3|exists:tblmonedas_mon,mon_codigo',
                'eba_id' => 'required|integer|exists:tblentidadbancaria_eba,eba_id',
                'pvc_numerocuenta' => [
                    'required',
                    'string',
                    'max:50',
                    Rule::unique('tblproveedorctasbancos_pvc', 'pvc_numerocuenta')->ignore($id, 'pvc_id'),
                ],
                'pvc_activo' => 'required|boolean'
            ],
            [
                'pvc_numerocuenta.required' => 'El número de cuenta es obligatorio.',
                'pvc_numerocuenta.unique' => 'El número de cuenta ya está registrado.',
            ]
        );

        // Validamos la información
        if ($validator->fails()) {
            return response()->json(["error" => $validator->errors()->toJson()], 400);
        }

        $cuentabancaria->update([
            'mon_codigo' => $request->mon_codigo,
            'eba_id' => $request->eba_id,
            'pvc_activo' => $request->pvc_activo,
            'pvc_numerocuenta' => $request->pvc_numerocuenta,
            'pvc_usumodificacion' => $user->usu_codigo,
        ]);

        return response()->json([
            'data' => $cuentabancaria,
            'message' => 'Cuenta bancaria de proveedor actualizada exitosamente'
        ]);
    }
}
