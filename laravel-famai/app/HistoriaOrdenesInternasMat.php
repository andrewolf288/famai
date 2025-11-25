<?php

namespace App;

use Illuminate\Database\Eloquent\Model;

class HistoriaOrdenesInternasMat extends Model
{
    public $timestamps = true;
    protected $table = 'tblhistorialordenesinternasmateriales_him';
    protected $primaryKey = 'him_id';

    protected $fillable = [
        'him_id',
        'odm_id',
        'opd_id',
        'pro_id',
        'odm_item',
        'odm_descripcion',
        'odm_cantidad',
        'odm_observacion',
        'odm_tipo',
        'odm_estado',
        'tra_responsable',
        'odm_notapresupuesto',
        'odm_adjuntopresupuesto',
        'odm_fecasignacionresponsable',
        'odm_cantidadreservada',
        'odm_cantidadordenada',
        'odm_cantidadpendiente',
        'odm_cantidadatendida',
        'odm_cantidadajuste',
        'odm_cantidaddespachada',
        'odm_fecconsultareservacion',
        'him_usucreacion',
        'him_feccreacion',
        'him_usumodificacion',
        'him_fecmodificacion',
	
    ];

    const CREATED_AT = 'him_feccreacion';
    const UPDATED_AT = 'him_fecmodificacion';

    public function ordenInternaMaterial()
    {
        return $this->belongsTo(OrdenInternaMateriales::class, 'odm_id');
    }

    public function ordenInternaParte()
    {
        return $this->belongsTo(OrdenInternaPartes::class, 'opd_id');
    }

    public function responsable()
    {
        return $this->belongsTo(Trabajador::class, 'tra_responsable', 'tra_id');
    }

    public function usuario()
    {
        return $this->belongsTo(User::class, 'him_usucreacion');
    }

    public function usuarioModificacion()
    {
        return $this->belongsTo(User::class, 'him_usumodificacion');
    }
}
