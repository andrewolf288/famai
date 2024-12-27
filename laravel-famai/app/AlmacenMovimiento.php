<?php

namespace App;

use Illuminate\Database\Eloquent\Model;

class AlmacenMovimiento extends Model
{
    public $timestamps = true;
    protected $table = 'tblalmacenmovimientoscab_amc';
    protected $primaryKey = 'amc_id';

    protected $fillable = [
        'alm_id',
        'amc_numero',
        'amc_fechamovimiento',
        'amc_tipomovimiento',
        'amc_documentoreferenciatipo',
        'amc_documentoreferencianumero',
        'amc_documentoreferenciafecha',
        'amc_documentoreferenciaentidad',
        'amc_usucreacion',
        'amc_feccreacion',
        'amc_usumodificacion',
        'amc_fecmodificacion',
        'amc_activo'
    ];

    const CREATED_AT = 'amc_feccreacion';
    const UPDATED_AT = 'amc_fecmodificacion';

    public function almacen()
    {
        return $this->belongsTo(Almacen::class, 'alm_id', 'alm_id');
    }
}
