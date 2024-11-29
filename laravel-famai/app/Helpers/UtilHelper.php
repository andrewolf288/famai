<?php

namespace App\Helpers;

class UtilHelper
{
    public static function limpiarNombreProducto($nombreProducto)
    {
        return preg_replace('/^\(.*?\)\s*/', '', $nombreProducto);
    }

    public static function getValueFormatExcel($relation, $default = 'N/A')
    {
        return $relation ?? $default;
    }

    public static function compareStringsIgnoreCaseAndAccents($str1, $str2)
    {
        $normalize = function ($str) {
            // Convertir caracteres a minúsculas y eliminar diacríticos
            $str = mb_strtolower($str);
            return preg_replace('/\p{M}/u', '', \Normalizer::normalize($str, \Normalizer::FORM_D));
        };
        return $normalize($str1) === $normalize($str2);
    }

    
    public static function convertirNumeroALetras($numero)
    {
        // Tablas de conversión
        $unidades = ['', 'uno', 'dos', 'tres', 'cuatro', 'cinco', 'seis', 'siete', 'ocho', 'nueve'];
        $decenas = ['', 'diez', 'veinte', 'treinta', 'cuarenta', 'cincuenta', 'sesenta', 'setenta', 'ochenta', 'noventa'];
        $centenas = ['', 'cien', 'doscientos', 'trescientos', 'cuatrocientos', 'quinientos', 'seiscientos', 'setecientos', 'ochocientos', 'novecientos'];

        // Función interna para convertir la parte entera
        $convertirEntero = function ($numero) use ($unidades, $decenas, $centenas) {
            if ($numero == 0) {
                return 'cero';
            }

            $resultado = '';

            // Si es mayor o igual a mil, convertimos la parte de los miles
            if ($numero >= 1000) {
                $miles = intval($numero / 1000);
                if ($miles == 1) {
                    $resultado .= 'mil';
                } else {
                    $resultado .= $unidades[$miles] . ' mil';
                }
                $numero %= 1000;
            }

            // Convertir la parte de las centenas
            if ($numero >= 100) {
                $resultado .= ($resultado ? ' ' : '') . $centenas[intval($numero / 100)];
                $numero %= 100;
            }

            // Convertir la parte de las decenas
            if ($numero >= 20) {
                $resultado .= ($resultado ? ' ' : '') . $decenas[intval($numero / 10)];
                $numero %= 10;
            }

            // Convertir la parte de las unidades
            if ($numero > 0) {
                $resultado .= ($resultado ? ' y ' : '') . $unidades[$numero];
            }

            return $resultado;
        };

        // Separar parte entera y decimal
        $partes = explode('.', number_format($numero, 2, '.', ''));
        $parteEntera = intval($partes[0]);
        $parteDecimal = intval($partes[1]);

        // Convertir ambas partes
        $letrasEntero = $convertirEntero($parteEntera);
        $letrasDecimal = $convertirEntero($parteDecimal);

        // Formatear el resultado
        $resultado = ucfirst($letrasEntero) . ' soles' . ' con ' . $letrasDecimal . ' centavos';
        return $resultado;
    }
}
