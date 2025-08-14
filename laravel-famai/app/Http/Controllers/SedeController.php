<?php

namespace App\Http\Controllers;

use App\Almacen;
use App\Sede;
use App\Trabajador;
use Illuminate\Http\Request;

class SedeController extends Controller
{
    
    public function index()
    {
        $sedes = Sede::get();
        return response()->json($sedes);
    }

    public function indexSimple()
    {
        $sedes = Sede::where('sed_activo', 1)->select('sed_codigo', 'sed_nombre')->get();
        return response()->json($sedes);
    }

    public function sedeActualTrabajador()
    {
        $user = auth()->user();
        $sede = Trabajador::with('sede')->where('usu_codigo', $user->usu_codigo)->first();

        $almacen = Almacen::where('sed_codigo', $sede->sed_codigo)->where('alm_esprincipal', 1)->first();
        return response()->json([
            'sed_codigo' => $sede->sed_codigo,
            'sed_nombre' => $sede->sede->sed_nombre,
            'alm_codigo' => $almacen->alm_codigo
        ]);
    }

    public function cambiarSedeActualTrabajador(Request $request)
    {
        $user = auth()->user();
        $trabajador = Trabajador::where('usu_codigo', $user->usu_codigo)->first();
        $trabajador->sed_codigo = $request->sede_codigo;
        $trabajador->tra_usumodificacion = $user->usu_codigo;
        $trabajador->save();
        $sede = Sede::where('sed_codigo', $request->sede_codigo)->first();
        return response()->json($sede);
    }
}
