<?php

namespace App;

use Illuminate\Database\Eloquent\Model;

class Impuesto extends BaseModel
{
    public $timestamps = true;
    protected $table = 'tblimpuestos_imp';
    protected $primaryKey = 'imp_codigo';
    protected $keyType = 'string';

    protected $fillable = [
        'imp_codigo',
        'imp_descripcion',
        'imp_porcentaje',
        'imp_usucreacion',
        'imp_feccreacion',
        'imp_usumodificacion',
        'imp_fecmodificacion',
        'imp_activo'
    ];

    const CREATED_AT = 'imp_feccreacion';
    const UPDATED_AT = 'imp_fecmodificacion';
}
