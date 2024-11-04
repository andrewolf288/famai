<?php

namespace App\Http\Controllers;

use App\Notificaciones;
use Carbon\Carbon;
use Illuminate\Http\Request;

class NotificacionController extends Controller
{
    public function index()
    {
        $notificaciones = Notificaciones::with('area', 'usuario')
                            ->orderBy('ntf_fecha', 'desc')
                            ->get();
        return response()->json($notificaciones);
    }

    public function findByUsuarioNoVisto(Request $request)
    {
        $usuario = $request->input('usu_codigo');
        $notificaciones = Notificaciones::with('area', 'usuario')
                            ->where('usu_codigo', $usuario)
                            ->where('ntf_visto', null)
                            ->orderBy('ntf_fecha', 'desc')
                            ->get();
        return response()->json($notificaciones);
    }

    public function findByUsuarioTodos(Request $request)
    {
        $usuario = $request->input('usu_codigo');
        $notificaciones = Notificaciones::with('area', 'usuario')
                            ->where('usu_codigo', $usuario)
                            ->orderBy('ntf_fecha', 'desc')
                            ->get();
        return response()->json($notificaciones);
    }

    public function findByUsuario(Request $request)
    {
        $usuario = $request->input('usu_codigo');
        $notificaciones = Notificaciones::with('area', 'usuario')
                            ->where('usu_codigo', $usuario)
                            ->orderBy('ntf_fecha', 'desc')
                            ->get();
        return response()->json($notificaciones);
    }

    public function update($id)
    {
        $notificacion = Notificaciones::findOrFail($id);
        $notificacion->ntf_visto = Carbon::now();
        $notificacion->save();
        return response()->json($notificacion);
    }
}
