<?php

namespace App;

use Illuminate\Database\Eloquent\Model;

class ProductoProveedor extends Model
{
    public $timestamps = true;
    protected $table = 'tblproductosproveedores_prp';
    protected $primaryKey = 'prp_id';

    protected $fillable = [
        'pro_id',
        'prv_id',
        'prp_fechaultimacompra',
        'prp_preciounitario',
        'prp_observaciones',
        'prp_usucreacion',
        'prp_feccreacion',
        'prp_usumodificacion',
        'prp_fecmodificacion'
    ];

    const CREATED_AT = 'prp_feccreacion';
    const UPDATED_AT = 'prp_fecmodificacion';

    protected $casts = [
        'prp_preciounitario' => 'decimal:2',
    ];

    // producto
    public function producto()
    {
        return $this->belongsTo(Producto::class, 'pro_id')->selectFields();
    }

    // proveedor
    public function proveedor()
    {
        return $this->belongsTo(Proveedor::class, 'prv_id')->selectFields();
    }
}
