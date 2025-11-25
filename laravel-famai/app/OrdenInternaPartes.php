<?php

namespace App;

use Illuminate\Database\Eloquent\Model;

class OrdenInternaPartes extends BaseModel
{
    public $timestamps = true;
    protected $table = 'tblordenesinternasdetpartes_opd';
    protected $primaryKey = 'opd_id';

    protected $fillable = [
        'oip_id',
        'oic_id',
        'opd_usucreacion',
        'opd_feccreacion',
        'opd_usumodificacion',
        'opd_fecmodificacion'
    ];

    const CREATED_AT = 'opd_feccreacion';
    const UPDATED_AT = 'opd_fecmodificacion';

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
        return $this->hasMany(OrdenInternaProcesos::class, 'opd_id');
    }

    // relacion con historial
    public function historial()
    {
        return $this->hasMany(HistoriaOrdenesInternasMat::class, 'opd_id');
    }
}
