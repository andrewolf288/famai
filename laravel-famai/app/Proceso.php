<?php

namespace App;

use Illuminate\Database\Eloquent\Model;

class Proceso extends Model
{
    public $timestamps = true;
    protected $table = 'tblordenesinternasprocesos_opp';
    protected $primaryKey = 'opp_id';

    protected $fillable = [
        'oip_id',
        'opp_codigo',
        'opp_descripcion',
        'opp_orden',
        'opp_activo',
        'usu_usucreacion',
        'usu_feccreacion',
        'usu_usumodificacion',
        'usu_fecmodificacion'
    ];

    const CREATED_AT = 'usu_feccreacion';
    const UPDATED_AT = 'usu_fecmodificacion';

    public function scopeSelectFields($query)
    {
        return $query->select('opp_id', 'opp_codigo', 'opp_descripcion', 'opp_orden');
    }

    // parte
    public function parte()
    {
        return $this->belongsTo(Parte::class, 'oip_id')->selectFields();
    }
}
