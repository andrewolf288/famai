<?php

namespace App;

use Illuminate\Database\Eloquent\Model;

class Area extends Model
{
    public $timestamps = true;
    protected $table = 'tblareas_are';
    protected $primaryKey = 'are_codigo';
    protected $keyType = 'string';

    protected $fillable = [
        'are_codigo',
        'are_descripcion',
        'are_activo',
        'usu_usucreacion',
        'usu_feccreacion',
        'usu_usumodificacion',
        'usu_fecmodificacion'
    ];

    const CREATED_AT = 'usu_feccreacion';
    const UPDATED_AT = 'usu_fecmodificacion';

    public function scopeSelectFields($query)
    {
        return $query->select('are_codigo', 'are_descripcion');
    }
}
