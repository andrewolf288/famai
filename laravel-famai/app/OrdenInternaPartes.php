<?php

namespace App;

use Illuminate\Database\Eloquent\Model;

class OrdenInternaPartes extends Model
{
    public $timestamps = true;
    protected $table = 'tblordenesinternasdetpartes_opd';
    protected $primaryKey = 'opd_id';

    protected $fillables = [
        'oip_id',
        'oic_id',
        'usu_usucreacion',
        'usu_feccreacion',
        'usu_usumodificacion',
        'usu_fecmodificacion'
    ];

    const CREATED_AT = 'usu_feccreacion';
    const UPDATED_AT = 'usu_fecmodificacion';

    // orden interna
    public function ordenInterna()
    {
        return $this->belongsTo(OrdenInterna::class, 'oic_id');
    }
    
    // parte
    public function parte()
    {
        return $this->belongsTo(Parte::class, 'oip_id')->selectFields();
    }

    // relacion con materiales
    public function materiales()
    {
        return $this->hasMany(OrdenInternaMateriales::class, 'opd_id');
    }

    // relacion con procesos
    public function procesos()
    {
        return $this->hasMany(OrdenInternaProcesos::class);
    }
}
