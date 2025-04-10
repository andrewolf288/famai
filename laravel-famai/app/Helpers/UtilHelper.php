<?php

namespace App\Helpers;

use NumberToWords\NumberToWords;

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

    public static function normalizeString($input)
    {
        $input = mb_strtolower($input, 'UTF-8');
        $replacements = [
            'á' => 'a',
            'é' => 'e',
            'í' => 'i',
            'ó' => 'o',
            'ú' => 'u',
            'Á' => 'a',
            'É' => 'e',
            'Í' => 'i',
            'Ó' => 'o',
            'Ú' => 'u'
        ];

        return strtr($input, $replacements);
    }

    public static function compareStringsIgnoreCaseAndAccents($str1, $str2)
    {
        return UtilHelper::normalizeString($str1) == UtilHelper::normalizeString($str2);
    }

    public static function obtenerCuentasBancarias($cuentas_bancarias)
    {
        $cuenta_banco_nacion = collect($cuentas_bancarias)->first(function ($cuenta) {
            return $cuenta->pvc_activo == 1 && $cuenta->entidadBancaria->eba_codigo == 'BN';
        });

        $cuenta_soles = collect($cuentas_bancarias)->first(function ($cuenta) use ($cuenta_banco_nacion) {
            if ($cuenta_banco_nacion) {
                return $cuenta->pvc_activo == 1 && $cuenta->mon_codigo === 'SOL' && $cuenta->pvc_numerocuenta !== $cuenta_banco_nacion->pvc_numerocuenta;
            } else {
                return $cuenta->pvc_activo == 1 && $cuenta->mon_codigo === 'SOL';
            }
        });

        $cuenta_dolares = collect($cuentas_bancarias)->first(function ($cuenta) use ($cuenta_banco_nacion) {
            if ($cuenta_banco_nacion) {
                return $cuenta->pvc_activo == 1 && $cuenta->mon_codigo === 'USD' && $cuenta->pvc_numerocuenta !== $cuenta_banco_nacion->pvc_numerocuenta;
            } else {
                return $cuenta->pvc_activo == 1 && $cuenta->mon_codigo === 'USD';
            }
        });

        return array(
            "cuenta_banco_nacion" => $cuenta_banco_nacion,
            "cuenta_soles" => $cuenta_soles,
            "cuenta_dolares" => $cuenta_dolares
        );
    }


    public static function convertirNumeroALetras($numero)
    {
        $numeroFormat = str_replace('.', '', strval($numero));
        $numberToWords = new NumberToWords();
        $currencyTransformer = $numberToWords->getCurrencyTransformer('es');
        $formatString = $currencyTransformer->toWords($numeroFormat, 'PEN');
        return strtoupper($formatString);
    }

    public static function formatDateExportSAP($date)
    {
        return str_replace('-', '', $date);
    }

    public static function cleanForCSV($string)
    {
        if (is_null($string)) {
            return ''; // Manejo seguro de valores nulos
        }

        // Convertimos a UTF-8 para evitar problemas de codificación
        // $string = mb_convert_encoding($string, 'UTF-8', 'auto');

        // Reemplazar caracteres problemáticos
        $string = str_replace(["\r\n", "\r", "\n"], ' ', $string); // Evitar saltos de línea
        $string = str_replace(["\"", "'"], '', $string); // Evitar comillas problemáticas
        $string = str_replace([',', ';'], '', $string);

        // Eliminar espacios en blanco al inicio y al final
        $string = trim($string);

        return $string;
    }
}
