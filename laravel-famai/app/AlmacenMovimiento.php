<?php

namespace App;

use Illuminate\Database\Eloquent\Model;

class AlmacenMovimiento extends Model
{
    public $timestamps = true;
    protected $table = 'tblalmacenmovimientoscab_amc';
    protected $primaryKey = 'amc_id';

    protected $fillable = [
        'amc_numero',
        'amc_fecha',
        'amc_tipo',
        'amc_documentoreferenciatipo',
        'amc_documentoreferencianumero',
        'amc_documentoreferenciafecha',
        'amc_documentoreferenciaentidad',
        'amc_usucreacion',
        'amc_feccreacion',
        'amc_usumodificacion',
        'amc_fecmodificacion',
        'amc_activo'
    ];

    const CREATED_AT = 'amc_feccreacion';
    const UPDATED_AT = 'amc_fecmodificacion';
}
