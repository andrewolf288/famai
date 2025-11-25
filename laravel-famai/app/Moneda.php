<?php

namespace App;

use Illuminate\Database\Eloquent\Model;

class Moneda extends BaseModel
{
    public $timestamps = true;
    protected $table = 'tblmonedas_mon';
    protected $primaryKey = 'mon_codigo';
    protected $keyType = 'string';

    protected $fillable = [
        'mon_codigo',
        'mon_descripcion',
        'mon_simbolo',
        'mon_activo',
        'mon_usuacreacion',
        'mon_feccreacion',
        'mon_usumodificacion',
        'mon_fecmodificacion'
    ];

    const CREATED_AT = 'mon_feccreacion';
    const UPDATED_AT = 'mon_fecmodificacion';
}
