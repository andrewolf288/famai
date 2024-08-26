<?php

namespace App\Http\Controllers;

use App\Trabajador;
use Illuminate\Http\Request;

class TrabajadorController extends Controller
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
        $nombre = $request->input('tra_nombre', null);

        $query = Trabajador::query();

        if($nombre !== null){
            $query->where('tra_nombre', 'like', '%'.$nombre.'%');
        }

        $trabajadores = $query->paginate($pageSize, ['*'], 'page', $page);

        return response()->json([
            'message' => 'Se listan los trabajadores',
            'data' => $trabajadores->items(),
            'count' => $trabajadores->total()
        ]);

    }

    public function indexSimple()
    {
        $trabajadores = Trabajador::select('tra_id', 'tra_nombre')->get();
        return response()->json($trabajadores);
    }
}
