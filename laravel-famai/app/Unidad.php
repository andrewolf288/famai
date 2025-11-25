<?php

namespace App;

use Illuminate\Database\Eloquent\Model;

class Unidad extends BaseModel
{
    public $timestamps = true;
    protected $table = 'tblunidades_uni';
    protected $primaryKey = 'uni_codigo';
    protected $keyType = 'string';

    protected $fillable = [
        'uni_codigo',
        'uni_descripcion',
        'uni_activo',
        'uni_usucreacion',
        'uni_feccreacion',
        'uni_usumodificacion',
        'uni_fecmodificacion'
    ];

    const CREATED_AT = 'uni_feccreacion';
    const UPDATED_AT = 'uni_fecmodificacion';

    public function scopeSelectFields($query)
    {
        return $query->select('uni_codigo', 'uni_descripcion');
    }
}
