<?php

namespace App;

use Illuminate\Database\Eloquent\Model;

class AlmacenProducto extends Model
{
    public $timestamps = true;
    protected $table = 'tblalmacenesproductos_alp';
    protected $primaryKey = 'alp_id';

    protected $fillable = [
        'alm_id',
        'alm_codigo',
        'alm_tipo',
        'pro_id',
        'alp_stock',
        'alp_ubicacion',
        'alp_usucreacion',
        'alp_feccreacion',
        'alp_usumodificacion',
        'alp_fecmodificacion',
        'alp_activo',
    ];

    const CREATED_AT = 'alp_feccreacion';
    const UPDATED_AT = 'alp_fecmodificacion';

    protected $casts = [
        'alp_stock' => 'decimal:2',
    ];

    // almacen
    public function almacen()
    {
        return $this->belongsTo(Almacen::class, 'alm_id')->selectFields();
    }

    // producto
    public function producto()
    {
        return $this->belongsTo(Producto::class, 'pro_id')->selectFields();
    }

    
}
