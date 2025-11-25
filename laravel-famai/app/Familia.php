<?php

namespace App;

use Illuminate\Database\Eloquent\Model;

class Familia extends Model
{
    public $timestamps = true;
    protected $table = 'tblproductosfamilias_pfa';
    protected $primaryKey = 'pfa_codigo';
    protected $keyType = 'string';

    protected $fillable = [
        'pfa_codigo',
        'pfa_descripcion',
        'pfa_activo',
        'pfa_usucreacion',
        'pfa_feccreacion',
        'pfa_usumodificacion',
        'pfa_fecmodificacion'
    ];

    const CREATED_AT = 'pfa_feccreacion';
    const UPDATED_AT = 'pfa_fecmodificacion';

    public function scopeSelectFields($query)
    {
        return $query->select('pfa_codigo','pfa_descripcion');
    }
}
