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
        'odm_fecasignacionresponsable',
        'odm_item',
        'odm_descripcion',
        'odm_cantidad',
        'odm_cantidadreservada',
        'odm_cantidadordenada',
        'odm_cantidadpendiente',
        'odm_cantidadatendida',
        'odm_cantidaddespachada',
        'odm_cantidadajuste',
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

    // detalle de adjuntos
    public function detalleAdjuntos()
    {
        return $this->hasMany(OrdenInternaMaterialesAdjuntos::class, 'odm_id');
    }

    // relacion con cotizaciones
    public function cotizaciones()
    {
        // debemos relacionar las cotizaciones
        return $this->hasMany(CotizacionDetalle::class, 'odm_id');
    }

    // relacion con ordenes de compra
    public function ordenesCompra()
    {
        return $this->hasMany(OrdenCompraDetalle::class, 'odm_id');
    }

}
