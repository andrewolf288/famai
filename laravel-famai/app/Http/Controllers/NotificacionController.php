<?php

namespace App\Http\Controllers;

use App\Notificaciones;
use Illuminate\Http\Request;

class NotificacionController extends Controller
{
    public function index()
    {
        $notificaciones = Notificaciones::with('area', 'usuario')->get();
        return response()->json($notificaciones);
    }
}
