<?php

namespace App\Http\Controllers;

use App\Cliente;
use Illuminate\Support\Facades\Validator;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class ClienteController extends Controller
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
        $nombre = $request->input('cli_nombre', null);
        $nroDocumento = $request->input('cli_nrodocumento', null);
        //remover si se quiere retornar todos los clientes
        $activo = 1;

        $query = Cliente::with(['tipoDocumento']);

        if ($nombre !== null) {
            $query->where('cli_nombre', 'like', '%' . $nombre . '%');
        }

        if ($nroDocumento !== null) {
            $query->where('cli_nrodocumento', 'like', '%' . $nroDocumento . '%');
        }
        //remover si se quiere retornar todos los clientes
        if ($activo) {
            $query->where('cli_activo', $activo);
        }

        $clientes = $query->paginate($pageSize, ['*'], 'page', $page);

        return response()->json([
            'message' => 'Se listan los clientes',
            'data' => $clientes->items(),
            'count' => $clientes->total()
        ]);
    }

    public function findClienteByQuery(Request $request)
    {
        $query = $request->input('query', null);
        $clientes = Cliente::where('cli_nombre', 'like', '%' . $query . '%')
            ->orWhere('cli_nrodocumento', 'like', '%' . $query . '%')
            ->select('cli_id', 'cli_tipodocumento','cli_nrodocumento', 'cli_nombre')
            ->get();

        return response()->json($clientes);
    }

    /**
     * Display the specified resource.
     *
     * @param  int  $id
     * @return \Illuminate\Http\Response
     */
    public function show($id)
    {
        $cliente = Cliente::find($id);

        if (!$cliente) {
            return response()->json(['error' => 'Cliente no encontrado'], 404);
        }

        return response()->json($cliente);
    }

    public function store(Request $request)
    {
        $user = auth()->user();

        $validator = Validator::make($request->all(), [
            'cli_tipodocumento' => 'required|string|max:3|exists:tbltiposdocumento_tdo,tdo_codigo',
            'cli_nrodocumento' => [
                'required',
                'string',
                'max:16',
                Rule::unique('tblclientes_cli', 'cli_nrodocumento'),
            ],            
            'cli_nombre' => 'required|string|max:250',
        ]);

        if ($validator->fails()) {
            return response()->json(["error" => $validator->errors()->toJson()], 400);
        }

        $cliente = Cliente::create(array_merge(
            $validator->validated(),
            [
                "usu_usucreacion" => $user->usu_codigo,
                "usu_feccreacion" => now(),
            ]
        ));

        return response()->json([
            'message' => 'Cliente registrado exitosamente',
            'data' => $cliente
        ], 201);
    }


    public function update(Request $request, $id)
    {
        $user = auth()->user();

        $cliente = Cliente::find($id);

        if (!$cliente) {
            return response()->json(['error' => 'Cliente no encontrado'], 404);
        }

        $validator = Validator::make($request->all(), [
            'cli_tipodocumento' => 'required|string|max:3|exists:tbltiposdocumento_tdo,tdo_codigo',
            'cli_nrodocumento' => [
                'required',
                'string',
                'max:16',
                Rule::unique('tblclientes_cli', 'cli_nrodocumento')->ignore($id, 'cli_id'),
            ],
            'cli_nombre' => 'required|string|max:250',
            'cli_activo' => 'nullable|boolean',
        ]);

        if ($validator->fails()) {
            return response()->json(["error" => $validator->errors()->toJson()], 400);
        }

        $cliente->update(array_merge(
            $validator->validated(),
            [
                "usu_usumodificacion" => $user->usu_codigo,
                "usu_fecmodificacion" => now(),
            ]
        ));

        return response()->json([
            'message' => 'Cliente actualizado correctamente',
            'data' => $cliente
        ]);
    }
}
