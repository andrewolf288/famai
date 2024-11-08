<?php

namespace App\Http\Controllers;

use App\OrdenInterna;
use App\OrdenInternaMaterialesAdjuntos;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class OrdenInternaMaterialesAdjuntosController extends Controller
{
    
    // buscar detalle de adjuntos por detalle de material
    public function findByDetalleMaterial($id)
    {
        $adjuntos = OrdenInternaMaterialesAdjuntos::where('odm_id', $id)->get();
        return response()->json($adjuntos);
    }

    // agregar detalle de adjuntos masivo
    public function store(Request $request)
    {
        $user = auth()->user();
        $odm_id = $request->input('odm_id');

        if ($request->hasFile('file')) {
            $file = $request->file('file');
            // obtenemos la extension
            $extension = $file->getClientOriginalExtension();

            // Generamos un nombre único para el archivo, conservando la extensión original
            $fileName = uniqid() . '.' . $extension;

            $description = $request->input("descripcion");

            // Guardamos el archivo con la extensión correcta
            $path = $file->storeAs('detalle-materiales-adjuntos', $fileName, 'public');

            // Guardar en la base de datos
            $adjunto = OrdenInternaMaterialesAdjuntos::create([
                'odm_id' => $odm_id,
                'oma_descripcion' => $description,
                'oma_url' => $path,
                'oma_usucreacion' => $user->usu_codigo,
                'oma_fecmodificacion' => null
            ]);

            return response()->json($adjunto, 200);
        } else {
            return response()->json(['error' => 'Archivo no encontrado'], 404);
        }
    }

    // eliminar archivo adjunto
    public function destroy($id)
    {
        $adjunto = OrdenInternaMaterialesAdjuntos::find($id);

        if (!$adjunto) {
            return response()->json(['error' => 'Adjunto no encontrado'], 404);
        }

        $urlArchivo = $adjunto->oma_url;
        // Eliminar archivo físico del disco
        Storage::disk('public')->delete($urlArchivo);
        // Eliminar el registro de detalleCotizacionArchivos
        $adjunto->delete();

        return response()->json(['success' => 'Cotización y sus detalles eliminados correctamente.'], 200);
    }
}
