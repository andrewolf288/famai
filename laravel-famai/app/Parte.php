<?php

namespace App;

use Illuminate\Database\Eloquent\Model;

class Parte extends Model
{
    public $timestamps = true;
    protected $table = 'tblordenesinternaspartes_oip';
    protected $primaryKey = 'oip_id';

    protected $fillable = [
        'oip_descripcion',
        'oip_orden',
        'oip_activo',
        'usu_usucreacion',
        'usu_feccreacion',
        'usu_feccreacion',
        'usu_fecmodificacion'
    ];

    const CREATED_AT = 'usu_feccreacion';
    const UPDATED_AT = 'usu_fecmodificacion';

    public function scopeSelectFields($query)
    {
        return $query->select('oip_id', 'oip_descripcion', 'oip_orden');
    }    
}
