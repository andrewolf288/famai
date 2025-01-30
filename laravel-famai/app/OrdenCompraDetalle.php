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
        'odm_id',
        'pro_id',
        'ocd_orden',
        'ocd_descripcion',
        'ocd_observacion',
        'ocd_observaciondetalle',
        'ocd_cantidad',
        'ocd_cantidadingresada',
        'ocd_preciounitario',
        'ocd_total',
        'ocd_porcentajedescuento',
        'imp_codigo',
        'ocd_porcentajeimpuesto',
        'ocd_fechaentrega',
        'ocd_activo',
        'ocd_usucreacion',
        'ocd_feccreacion',
        'ocd_usumodificacion',
        'ocd_fecmodificacion'
    ];

    const CREATED_AT = 'ocd_feccreacion';
    const UPDATED_AT = 'ocd_fecmodificacion';

    // detalle de material
    public function detalleMaterial()
    {
        return $this->belongsTo(OrdenInternaMateriales::class, 'odm_id', 'odm_id');
    }

    // detalle orden de compra
    public function ordenCompra()
    {
        return $this->belongsTo(OrdenCompra::class, 'occ_id', 'occ_id');
    }

    // detalle de producto
    public function producto()
    {
        return $this->belongsTo(Producto::class, 'pro_id');
    }

    // impuesto 
    public function impuesto()
    {
        return $this->belongsTo(Impuesto::class, 'imp_codigo');
    }
}
