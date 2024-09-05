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
        $activo = 0;
        //si allowLogDeletedRegs esta en 0 devuelve todos los registros 
        //si allowLogDeletedRegs esta en un valor distinto a 1 devuelve solo los registros activos
        //$allowLogDeletedRegs = $request->input('allowlogicallyDeleted', null);
        //if (isset($allowLogDeletedRegs) && $allowLogDeletedRegs == 0){
        //    $activo = 0;
        //}

        $query = Cliente::with(['tipoDocumento']);

        if ($nombre !== null) {
            $query->where('cli_nombre', 'like', '%' . $nombre . '%');
        }

        if ($nroDocumento !== null) {
            $query->where('cli_nrodocumento', 'like', '%' . $nroDocumento . '%');
        }
        
        if ($activo==1) {
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
        //$allowLogDeletedRegs = $request->input('allowlogicallyDeleted', null);
    
        $activo = 1;
        //si allowLogDeletedRegs esta en 0 devuelve todos los registros 
        //si allowLogDeletedRegs esta en un valor distinto a 1 devuelve solo los registros activos
        //if (isset($allowLogDeletedRegs) && $allowLogDeletedRegs == 0){
        //    $activo = 0;
        //}
    
        $clientes = Cliente::where(function ($q) use ($query) {
                $q->where('cli_nombre', 'like', '%' . $query . '%')
                  ->orWhere('cli_nrodocumento', 'like', '%' . $query . '%');
            })
            ->when($activo == 1, function ($q) {
                $q->where('cli_activo', 1);
            })
            ->select('cli_id', 'cli_tipodocumento', 'cli_nrodocumento', 'cli_nombre')
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
            'cli_nombre' => [
                'required',
                'string',
                'max:250',
                Rule::unique('tblclientes_cli', 'cli_nombre'),
            ],   
        ]);

        if ($validator->fails()) {
            return response()->json(["error" => $validator->errors()->toJson()], 400);
        }

        $cliente = Cliente::create(array_merge(
            $validator->validated(),
            [
                "cli_usucreacion" => $user->usu_codigo,
                "cli_feccreacion" => now(),
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
            'cli_nombre' => [
                'required',
                'string',
                'max:250',
                Rule::unique('tblclientes_cli', 'cli_nombre')->ignore($id, 'cli_id'),
            ],   
            'cli_activo' => 'nullable|boolean',
        ]);

        if ($validator->fails()) {
            return response()->json(["error" => $validator->errors()->toJson()], 400);
        }

        $cliente->update(array_merge(
            $validator->validated(),
            [
                "cli_usumodificacion" => $user->usu_codigo,
                "cli_fecmodificacion" => now(),
            ]
        ));

        return response()->json([
            'message' => 'Cliente actualizado correctamente',
            'data' => $cliente
        ]);
    }
}
