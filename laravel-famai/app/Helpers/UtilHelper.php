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

    public static function compareStringsIgnoreCaseAndAccents($str1, $str2) {
        $normalize = function ($str) {
            // Convertir caracteres a minúsculas y eliminar diacríticos
            $str = mb_strtolower($str);
            return preg_replace('/\p{M}/u', '', \Normalizer::normalize($str, \Normalizer::FORM_D));
        };
        return $normalize($str1) === $normalize($str2);
    }
}