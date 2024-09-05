<?php

namespace App;

use Illuminate\Database\Eloquent\Model;

class OrdenInternaProcesos extends Model
{
    public $timestamps = true;
    protected $table = 'tblordenesinternasdetprocesos_odp';
    protected $primaryKey = 'odp_id';

    protected $fillable = [
        'opd_id',
        'opp_id',
        'odp_observacion',
        'odp_estado',
        'odp_usucreacion',
        'odp_feccreacion',
        'odp_usumodificacion',
        'odp_fecmodificacion'
    ];

    const CREATED_AT = 'odp_feccreacion';
    const UPDATED_AT = 'odp_fecmodificacion';

    // orden interna parte
    public function ordenInternaParte()
    {
        return $this->belongsTo(OrdenInternaPartes::class, 'opd_id');
    }

    // proceso
    public function proceso()
    {
        return $this->belongsTo(Proceso::class, 'opp_id')->selectFields();
    }

    // partes
    public function parte()
    {
        return $this->belongsTo(OrdenInternaPartes::class, 'opd_id');
    }
}
