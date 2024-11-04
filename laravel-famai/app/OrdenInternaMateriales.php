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
        'tra_responsable',
        'odm_item',
        'odm_descripcion',
        'odm_cantidad',
        'odm_observacion',
        'odm_tipo',
        'odm_estado',
        'odm_notapresupuesto',
        'odm_adjuntopresupuesto',
        'odm_usucreacion',
        'odm_feccreacion',
        'odm_usumodificacion',
        'odm_fecmodificacion'
    ];

    const CREATED_AT = 'odm_feccreacion';
    const UPDATED_AT = 'odm_fecmodificacion';

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

    // resposnable
    public function responsable()
    {
        return $this->belongsTo(Trabajador::class, 'tra_responsable', 'tra_id');
    }

    // usuario creador
    public function usuarioCreador()
    {
        return $this->belongsTo(User::class, 'odm_usucreacion');
    }
}
