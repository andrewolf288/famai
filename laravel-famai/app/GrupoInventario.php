<?php

namespace App;

use Illuminate\Database\Eloquent\Model;

class GrupoInventario extends BaseModel
{
    public $timestamps = true;
    protected $table = 'tblproductosgruposinventario_pgi';
    protected $primaryKey = 'pgi_codigo';
    protected $keyType = 'string';

    protected $fillable = [
        'pgi_codigo',
        'pgi_descripcion',
        'pgi_activo',
        'pgi_usucreacion',
        'pgi_feccreacion',
        'pgi_usumodificacion',
        'pgi_fecmodificacion'
    ];

    const CREATED_AT = 'pgi_feccreacion';
    const UPDATED_AT = 'pgi_fecmodificacion';

    public function scopeSelectFields($query)
    {
        return $query->select('pgi_codigo','pgi_descripcion');
    }
}
