<?php

namespace App\Helpers;

use App\EntidadBancaria;
use App\Proveedor;
use App\ProveedorCuentaBanco;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
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
        $soloFecha = substr($date, 0, 10);
        return str_replace('-', '', $soloFecha);
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

    public static function getSerieValue(array $series, string $sed_codigo, string $occ_tipo): ?int
    {
        foreach ($series as $item) {
            if ($item['sed_codigo'] == $sed_codigo && $item['occ_tipo'] == $occ_tipo) {
                return $item['value'];
            }
        }

        // Puedes retornar null o lanzar una excepción si no se encuentra
        return null;
    }

    /**
     * Actualiza las cuentas bancarias del proveedor desde el stored procedure FAM_LOG_Proveedores
     * 
     * @param Proveedor|int $proveedor Proveedor o ID del proveedor
     * @param string|null $usu_codigo Código del usuario que realiza la actualización
     * @return Proveedor|null Proveedor actualizado o null si no se encontró
     */
    public static function actualizarCuentasBancariasProveedor($proveedor, $usu_codigo = null)
    {
        try {
            $proveedorId = null;
            
            // Si es un ID, buscar el proveedor
            if (is_int($proveedor) || is_string($proveedor)) {
                $proveedorId = $proveedor;
                $proveedor = Proveedor::find($proveedor);
            } elseif ($proveedor instanceof Proveedor) {
                $proveedorId = $proveedor->prv_id;
            }

            // Si no se encuentra el proveedor, intentar limpiar cuentas bancarias huérfanas
            if (!$proveedor) {
                Log::warning('Proveedor no encontrado al intentar actualizar cuentas bancarias', [
                    'proveedor_id' => $proveedorId
                ]);
                
                // Limpiar cuentas bancarias huérfanas si existe el ID
                if ($proveedorId) {
                    $cuentasHuérfanas = ProveedorCuentaBanco::where('prv_id', $proveedorId)->count();
                    if ($cuentasHuérfanas > 0) {
                        Log::info("Eliminando {$cuentasHuérfanas} cuentas bancarias huérfanas del proveedor eliminado", [
                            'prv_id' => $proveedorId
                        ]);
                        ProveedorCuentaBanco::where('prv_id', $proveedorId)->delete();
                    }
                }
                
                return null;
            }

            // Verificar que el proveedor tenga prv_codigo
            if (empty($proveedor->prv_codigo)) {
                Log::warning('Proveedor sin prv_codigo al intentar actualizar cuentas bancarias', [
                    'prv_id' => $proveedor->prv_id
                ]);
                return $proveedor;
            }

            // Obtener usuario si no se proporciona
            if (!$usu_codigo) {
                $user = auth()->user();
                $usu_codigo = $user ? $user->usu_codigo : 'ADMIN';
            }

            // Llamar al stored procedure
            $bancos = DB::select("EXEC dbo.FAM_LOG_Proveedores @parCardCode = ?", [$proveedor->prv_codigo]);
            
            if (count($bancos) > 1) {
                Log::warning("El RUC {$proveedor->prv_nrodocumento} es ambiguo. Se encontraron " . count($bancos) . " registros.", [
                    'prv_id' => $proveedor->prv_id,
                    'prv_codigo' => $proveedor->prv_codigo
                ]);
                return $proveedor;
            } elseif (count($bancos) === 1) {
                // Eliminar cuentas bancarias existentes
                ProveedorCuentaBanco::where('prv_id', $proveedor->prv_id)->delete();
                
                Log::info("Actualizando cuentas bancarias del proveedor {$proveedor->prv_codigo}: " . json_encode($bancos));

                $bancoInfo = $bancos[0];
                $bancosDisponibles = EntidadBancaria::where('eba_activo', 1)->get();
                
                // Procesar cuenta en soles
                if (!empty($bancoInfo->account_sol) && !empty($bancoInfo->banco_sol)) {
                    self::procesarCuentaBancaria(
                        $proveedor->prv_id,
                        $bancoInfo->account_sol,
                        $bancoInfo->banco_sol,
                        'SOL',
                        $bancosDisponibles,
                        $usu_codigo
                    );
                }
                
                // Procesar cuenta en dólares
                if (!empty($bancoInfo->account_usd) && !empty($bancoInfo->banco_usd)) {
                    self::procesarCuentaBancaria(
                        $proveedor->prv_id,
                        $bancoInfo->account_usd,
                        $bancoInfo->banco_usd,
                        'USD',
                        $bancosDisponibles,
                        $usu_codigo,
                        $bancoInfo->BIC_SWIFT ?? null,
                        $bancoInfo->DirBanco ?? null
                    );
                }

                // Refrescar el proveedor con las relaciones
                $proveedor->refresh();
                $proveedor->load(['cuentasBancarias.entidadBancaria', 'cuentasBancarias.moneda']);
            }

            return $proveedor;
        } catch (\Exception $e) {
            $proveedorId = null;
            if ($proveedor instanceof Proveedor) {
                $proveedorId = $proveedor->prv_id;
            } elseif (is_int($proveedor) || is_string($proveedor)) {
                $proveedorId = $proveedor;
            }
            
            Log::error('Error al actualizar cuentas bancarias del proveedor', [
                'prv_id' => $proveedorId,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            // Retornar el proveedor sin actualizar en caso de error
            return ($proveedor instanceof Proveedor) ? $proveedor : null;
        }
    }

    /**
     * Procesa y crea una cuenta bancaria para el proveedor
     */
    private static function procesarCuentaBancaria($prv_id, $numeroCuenta, $nombreBanco, $moneda, $bancosDisponibles, $usu_codigo, $bicSwift = null, $dirBanco = null)
    {
        $nombreBancoNormalizado = self::normalizarTextoBanco($nombreBanco);
        
        // Buscar el banco en la lista de bancos disponibles
        $bancoEncontrado = $bancosDisponibles->first(function ($banco) use ($nombreBancoNormalizado) {
            $descripcionNormalizada = self::normalizarTextoBanco($banco->eba_descripcion);
            return stripos($descripcionNormalizada, $nombreBancoNormalizado) !== false || 
                   stripos($nombreBancoNormalizado, $descripcionNormalizada) !== false;
        });
        
        if (!$bancoEncontrado) {
            $bancoEncontrado = EntidadBancaria::create([
                'eba_descripcion' => $nombreBanco,
                'eba_usucreacion' => $usu_codigo,
                'eba_activo' => 1
            ]);
        }
        
        ProveedorCuentaBanco::create([
            'prv_id' => $prv_id,
            'mon_codigo' => $moneda,
            'eba_id' => $bancoEncontrado->eba_id,
            'pvc_numerocuenta' => $numeroCuenta,
            'pvc_BIC_SWIFT' => $bicSwift,
            'pvc_DirBanco' => $dirBanco,
            'pvc_activo' => 1,
            'pvc_usucreacion' => $usu_codigo,
            'pvc_tipocuenta' => 'Corriente',
        ]);
    }

    /**
     * Normaliza texto para comparación de nombres de bancos
     */
    private static function normalizarTextoBanco($texto)
    {
        $texto = mb_strtolower($texto, 'UTF-8');
        
        $texto = str_replace(
            ['á', 'é', 'í', 'ó', 'ú', 'ñ', 'ü', 'à', 'è', 'ì', 'ò', 'ù'],
            ['a', 'e', 'i', 'o', 'u', 'n', 'u', 'a', 'e', 'i', 'o', 'u'],
            $texto
        );
        
        $texto = str_replace(
            ['Á', 'É', 'Í', 'Ó', 'Ú', 'Ñ', 'Ü', 'À', 'È', 'Ì', 'Ò', 'Ù'],
            ['a', 'e', 'i', 'o', 'u', 'n', 'u', 'a', 'e', 'i', 'o', 'u'],
            $texto
        );
        
        return $texto;
    }
}
