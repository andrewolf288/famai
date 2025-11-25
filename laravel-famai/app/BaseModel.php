<?php

namespace App;

use Illuminate\Database\Eloquent\Model;

class BaseModel extends Model
{
    /**
     * Formato de fecha sin milisegundos - Compatible con SQL Server 2019
     */
    public function getDateFormat()
    {
        if (env('DB_CONNECTION') === 'sqlsrv') {
            return 'Y-m-d H:i:s';  // Sin milisegundos: 2025-03-07 14:24:25
        }
        return parent::getDateFormat();
    }

    /**
     * Convertir desde DateTime para guardar en BD
     */
    public function fromDateTime($value)
    {
        if (env('DB_CONNECTION') === 'sqlsrv') {
            if (!$value instanceof \Carbon\Carbon) {
                $value = $this->asDateTime($value);
            }
            return $value->format($this->getDateFormat());
        }
        return parent::fromDateTime($value);
    }
}
