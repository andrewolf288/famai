<?php

namespace App;

use Illuminate\Database\Eloquent\Model;

class CotizacionDetalleArchivos extends Model
{
    public $timestamps = true;
    protected $table = 'tblcotizacionesdetarchivos_cda';
    protected $primaryKey = 'cda_id';

    protected $fillable = [
        'coc_id',
        'cda_descripcion',
        'cda_url',
        'cda_usucreacion',
        'cda_feccreacion',
        'cda_usumodificacion',
        'cda_fecmodificacion',
        'cda_activo'
    ];

    const CREATED_AT = 'cda_feccreacion';
    const UPDATED_AT = 'cda_fecmodificacion';
}
