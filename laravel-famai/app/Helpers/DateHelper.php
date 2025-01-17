<?php

namespace App\Helpers;

use Carbon\Carbon;

class DateHelper
{
    public static function calcularFechaLimiteLogistica($fechaAprobacion, $fechaEstimadaEntrega, $formato = 'd/m/Y')
    {
        if (is_null($fechaAprobacion) || is_null($fechaEstimadaEntrega)) {
            return null;
        }

        $fechaAprobacion = Carbon::parse($fechaAprobacion);
        $fechaEstimadaEntrega = Carbon::parse($fechaEstimadaEntrega);

        $diasReparacion = $fechaEstimadaEntrega->diffInDays($fechaAprobacion);

        if ($diasReparacion >= 0 && $diasReparacion <= 3) {
            return $fechaAprobacion->format($formato);
        } elseif ($diasReparacion >= 4) {
            return $fechaEstimadaEntrega->subDays(4)->format($formato);
        }

        return null;
    }

    public static function parserFechaActual()
    {
        Carbon::setLocale('es');
        return Carbon::now()->isoFormat('D [de] MMMM [del] YYYY');
    }

    public static function parserFecha($fecha)
    {
        Carbon::setLocale('es');
        return Carbon::parse($fecha)->isoFormat('D [de] MMMM [del] YYYY');
    }
}
