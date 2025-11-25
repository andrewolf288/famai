<?php

namespace App;

use Illuminate\Database\Eloquent\Model;

class TipoDocumentoReferencia extends BaseModel
{
    public $timestamps = true;
    protected $table = 'tbltiposdocumentoreferencia_tdr';
    protected $primaryKey = 'tdr_codigo';
    protected $keyType = 'string';

    protected $fillable = [
        'tdr_codigo',
        'tdr_descripcion',
        'tdr_activo',
        'tdr_usucreacion',
        'tdr_feccreacion',
        'tdr_usumodificacion',
        'tdr_fecmodificacion'
    ];

    const CREATED_AT = 'tdr_feccreacion';
    const UPDATED_AT = 'tdr_fecmodificacion';

    public function scopeSelectFields($query)
    {
        return $query->select('tdr_codigo','tdr_descripcion');
    }
}
