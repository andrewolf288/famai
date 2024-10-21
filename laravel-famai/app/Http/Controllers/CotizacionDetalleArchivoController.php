<?php

namespace App\Http\Controllers;

use App\CotizacionDetalleArchivos;
use Illuminate\Support\Facades\Storage;

class CotizacionDetalleArchivoController extends Controller
{
    // eliminamos detalle de archivo
    public function destroy($id)
    {
        $cotizacionArchivo = CotizacionDetalleArchivos::find($id);

        if(!$cotizacionArchivo){
            return response()->json(['error' => 'Archivo no encontrado.'], 404);
        }

        $urlArchivo = $cotizacionArchivo->cda_url;
        // Eliminar archivo físico del disco
        Storage::disk('public')->delete($urlArchivo);
        // Eliminar el registro de detalleCotizacionArchivos
        $cotizacionArchivo->delete();

        return response()->json(['success' => 'Cotización y sus detalles eliminados correctamente.'], 200);
    }
}
