<?php

namespace App;

use Illuminate\Database\Eloquent\Model;

class OrdenInternaMaterialesAdjuntos extends Model
{
    public $timestamps = true;
    protected $table = 'tblordenesinternasdetmaterialesadjuntos_oma';
    protected $primaryKey = 'oma_id';

    protected $fillable = [
        'oma_id',
        'odm_id',
        'oma_descripcion',
        'oma_url',
        'oma_activo',
        'oma_usucreacion',
        'oma_feccreacion',
        'oma_usumodificacion',
        'oma_fecmodificacion',
    ];

    const CREATED_AT = 'oma_feccreacion';
    const UPDATED_AT = 'oma_fecmodificacion';
}
