<?php

namespace App;

use Illuminate\Database\Eloquent\Model;

class MotivoRequerimiento extends BaseModel
{
    public $timestamps = true;
    protected $table = 'tblmotivorequerimiento_mrq';
    protected $primaryKey = 'mrq_codigo';
    protected $keyType = 'string';

    protected $fillable = [
        'mrq_codigo',
        'mrq_descripcion',
        'mrq_activo',
        'mrq_usucreacion',
        'mrq_feccreacion',
        'mrq_usumodificacion',
        'mrq_fecmodificacion'
    ];

    const CREATED_AT = 'mrq_feccreacion';
    const UPDATED_AT = 'mrq_fecmodificacion';

    public function scopeSelectFields($query)
    {
        return $query->select('mrq_codigo','mrq_descripcion');
    }
}
