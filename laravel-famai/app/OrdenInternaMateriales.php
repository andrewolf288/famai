<?php

namespace App;

use Illuminate\Database\Eloquent\Model;

class OrdenInternaMateriales extends Model
{
    public $timestamps = true;
    protected $table = 'tblordenesinternasdetmateriales_odm';
    protected $primaryKey = 'odm_id';

    protected $fillable = [
        'opd_id',
        'pro_id',
        'odm_item',
        'odm_descripcion',
        'odm_cantidad',
        'odm_observacion',
        'odm_tipo',
        'odm_estado',
        'usu_usucreacion',
        'usu_feccreacion',
        'usu_usumodificacion',
        'usu_fecmodificacion'
    ];

    const CREATED_AT = 'usu_feccreacion';
    const UPDATED_AT = 'usu_fecmodificacion';

    // orden interna parte
    public function ordenInternaParte()
    {
        return $this->belongsTo(OrdenInternaPartes::class, 'opd_id');
    }

    // producto
    public function producto()
    {
        return $this->belongsTo(Producto::class, 'pro_id')->selectFields();
    }

    // parte
    public function parte()
    {
        return $this->belongsTo(OrdenInternaPartes::class, 'opd_id');
    }
}
