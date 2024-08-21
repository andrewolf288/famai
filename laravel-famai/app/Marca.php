<?php

namespace App;

use Illuminate\Database\Eloquent\Model;

class Marca extends Model
{
    public $timestamps = true;
    protected $table = 'tblproductosmarcas_pma';
    protected $primaryKey = 'pma_codigo';
    protected $keyType = 'string';

    protected $fillable = [
        'pma_codigo',
        'pma_descripcion',
        'pma_activo',
        'pma_usucreacion',
        'pma_feccreacion',
        'pma_usumodificacion',
        'pma_fecmodificacion'
    ];

    const CREATED_AT = 'pma_feccreacion';
    const UPDATED_AT = 'pma_fecmodificacion';

    public function scopeSelectFields($query)
    {
        return $query->select('pma_codigo', 'pma_descripcion');
    }
}
