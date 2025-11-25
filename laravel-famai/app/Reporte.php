<?php

namespace App;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\DB;

class Reporte extends BaseModel
{
    protected $connection = 'sqlsrv';
    
    //public function metobtenerCabecera($varOtNumero, $varOiNumero)
    public function metobtenerCabecera($varOIC)
    {   
        //if (!$varOtNumero || !$varOiNumero) {
        if (!$varOIC) {
            return false;
        }

        // Obtener la conexión PDO
        $pdo = DB::connection()->getPdo();
        
        // Definir la consulta
        // $query = "EXEC sprobtenercabecera_oca ?, ? ";
        $query = "EXEC sprobtenercabecera_oca ?";
        
        // Preparar y ejecutar la consulta
        $stmt = $pdo->prepare($query);
        //$stmt->execute([$varOtNumero, $varOiNumero]);
        $stmt->execute([$varOIC]);
        
        // Obtener los resultados
        $result = $stmt->fetchAll(\PDO::FETCH_ASSOC);
        
        return $result;
    }
    
    public function metobtenerPartes($varOIC)
    {
        if (!$varOIC) {
            return false;
        }

        // Obtener la conexión PDO
        $pdo = DB::connection()->getPdo();
        
        // Definir la consulta
        $query = "EXEC sprobtenerpartesproceso_opp ?";
        
        // Preparar y ejecutar la consulta
        $stmt = $pdo->prepare($query);
        $stmt->execute([$varOIC]);
        
        // Obtener los resultados
        $result = $stmt->fetchAll(\PDO::FETCH_ASSOC);
        
        return $result;
    }

    public function metobtenerProcesos($varOIC, $varOIPID)
    {
        if (!$varOIC || !$varOIPID) {
            return false;
        }

        // Obtener la conexión PDO
        $pdo = DB::connection()->getPdo();
        
        // Definir la consulta
        $query = "EXEC sprobtenerprocesosporpartes_opa ?, ?";
        
        // Preparar y ejecutar la consulta
        $stmt = $pdo->prepare($query);
        $stmt->execute([$varOIC, $varOIPID]);
        
        // Obtener los resultados
        $result = $stmt->fetchAll(\PDO::FETCH_ASSOC);
        
        return $result;
    }

    public function metobtenerMateriales($varOIC, $varOIPID)
    {
        if (!$varOIC || !$varOIPID) {
            return false;
        }

        // Obtener la conexión PDO
        $pdo = DB::connection()->getPdo();
        
        // Definir la consulta
        $query = "EXEC sprobtenermaterialesporpartes_omp ?, ?";
        
        // Preparar y ejecutar la consulta
        $stmt = $pdo->prepare($query);
        $stmt->execute([$varOIC, $varOIPID]);
        
        // Obtener los resultados
        $result = $stmt->fetchAll(\PDO::FETCH_ASSOC);
        
        return $result;
    }   
}
