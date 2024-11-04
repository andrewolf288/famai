<?php

namespace App\Helpers;

class UtilHelper
{
    public static function limpiarNombreProducto($nombreProducto) {
        return preg_replace('/^\(.*?\)\s*/', '', $nombreProducto);
    }

    public static function getValueFormatExcel($relation, $default = 'N/A')
    {
        return $relation ?? $default;
    }
}