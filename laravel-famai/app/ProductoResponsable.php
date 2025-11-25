<?php

namespace App;

use Illuminate\Database\Eloquent\Model;

class ProductoResponsable extends Model
{
    public $timestamps = true;
    protected $table = 'tblproductosresponsable_pre';
    protected $primaryKey = 'pre_id';

    protected $fillable = [
        'pro_id',
        'tra_id',
        'sed_codigo',
        'pre_usucreacion',
        'pre_feccreacion',
        'pre_usumodificacion',
        'pre_fecmodificacion',
        'pre_activo'
    ];

    const CREATED_AT = 'pre_feccreacion';
    const UPDATED_AT = 'pre_fecmodificacion';

    // producto
    public function producto()
    {
        return $this->belongsTo(Producto::class, 'pro_id')->selectFields();
    }

    // trabajador
    public function responsable()
    {
        return $this->belongsTo(Trabajador::class, 'tra_id');
    }
}
