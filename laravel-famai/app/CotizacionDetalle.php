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
        'cod_orden',
        'cod_tiempoentrega',
        'cod_descripcion',
        'cod_observacion',
        'cod_cantidad',
        'cod_preciounitario',
        'cod_total',
        'cod_cotizar',
        'cod_marcas',
        'cod_activo',
        'cod_usucreacion',
        'cod_feccreacion',
        'cod_usumodificacion',
        'cod_fecmodificacion',
    ];

    const CREATED_AT = 'cod_feccreacion';
    const UPDATED_AT = 'cod_fecmodificacion';

    // detalle de material
    public function detalleMaterial() 
    {
        return $this->belongsTo(OrdenInternaMateriales::class, 'odm_id', 'odm_id');
    }

    // detalle cotizacion
    public function cotizacion()
    {
        return $this->belongsTo(Cotizacion::class, 'coc_id', 'coc_id');
    }

}
