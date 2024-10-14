<?php

namespace App;

use Illuminate\Database\Eloquent\Model;

class CotizacionDetalle extends Model
{
    public $timestamps = true;
    protected $table = 'tblcotizacionesdet_cod';
    protected $primaryKey = 'cod_id';

    protected $fillable = [
        'coc_id',
        'odm_id',
        'pro_id',
        'cod_orden',
        'cod_descripcion',
        'cod_cantidad',
        'cod_preciounitario',
        'cod_total',
        'cod_activo',
        'cod_usucreacion',
        'cod_feccreacion',
        'cod_usumodificacion',
        'cod_fecmodificacion',
    ];

    const CREATED_AT = 'cod_feccreacion';
    const UPDATED_AT = 'cod_fecmodificacion';
}
