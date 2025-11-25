<?php

namespace App;

use Illuminate\Database\Eloquent\Model;

class Area extends BaseModel
{
    public $timestamps = true;
    protected $table = 'tblareas_are';
    protected $primaryKey = 'are_codigo';
    protected $keyType = 'string';

    protected $fillable = [
        'are_codigo',
        'are_descripcion',
        'are_activo',
        'are_usucreacion',
        'are_feccreacion',
        'are_usumodificacion',
        'are_fecmodificacion'
    ];

    const CREATED_AT = 'are_feccreacion';
    const UPDATED_AT = 'are_fecmodificacion';

    public function scopeSelectFields($query)
    {
        return $query->select('are_codigo', 'are_descripcion');
    }
}
