<?php

namespace App;

use Illuminate\Database\Eloquent\Model;

class OrdenCompraDetalle extends Model
{
    public $timestamps = true;
    protected $table = 'tblordencompradet_ocd';
    protected $primaryKey = 'ocd_id';

    protected $fillable = [
        'occ_id',
        'pro_id',
        'ocd_orden',
        'ocd_descripcion',
        'ocd_cantidad',
        'ocd_preciounitario',
        'ocd_total',
        'ocd_activo',
        'ocd_usucreacion',
        'ocd_feccreacion',
        'ocd_usumodificacion',
        'ocd_fecmodificacion'
    ];

    const CREATED_AT = 'ocd_feccreacion';
    const UPDATED_AT = 'ocd_fecmodificacion';

    // relacion con producto
    public function producto()
    {
        return $this->belongsTo(Producto::class, 'pro_id', 'pro_id');
    }
}
