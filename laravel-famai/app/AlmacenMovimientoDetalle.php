<?php

namespace App;

use Illuminate\Database\Eloquent\Model;

class AlmacenMovimientoDetalle extends Model
{
    public $timestamps = true;
    protected $table = 'tblalmacenmovimientosdet_amd';
    protected $primaryKey = 'amd_id';

    protected $fillable = [
        'amc_id',
        'pro_id',
        'alm_id',
        'ocd_id',
        'odm_id',
        'amd_tipomovimiento',
        'amd_cantidad',
        'amd_ubicacion',
        'amd_serie',
        'amd_preciounitario',
        'amd_usucreacion',
        'amd_feccreacion',
        'amd_usumodificacion',
        'amd_fecmodificacion',
        'amd_activo'
    ];

    const CREATED_AT = 'amd_feccreacion';
    const UPDATED_AT = 'amd_fecmodificacion';

    public function almacenMovimiento()
    {
        return $this->belongsTo(AlmacenMovimiento::class, 'amc_id');    
    }

    public function producto()
    {
        return $this->belongsTo(Producto::class, 'pro_id');
    }

    public function almacen()
    {
        return $this->belongsTo(Almacen::class, 'alm_id');
    }

    public function detalleOrdenCompra()
    {
        return $this->belongsTo(OrdenCompraDetalle::class, 'ocd_id');
    }

    public function detalleMaterial()
    {
        return $this->belongsTo(OrdenInternaMateriales::class, 'odm_id');
    }
}
