<?php

namespace App;

use Illuminate\Database\Eloquent\Model;

class TipoDocumento extends Model
{
    public $timestamps = true;
    protected $table = 'tbltiposdocumento_tdo';
    protected $primaryKey = 'tdo_codigo';
    protected $keyType = 'string';

    protected $fillable = [
        'tdo_codigo',
        'tdo_descripcion',
        'tdo_codigosunat',
        'tdo_activo',
        'tdo_usucreacion',
        'tdo_feccreacion',
        'tdo_usumodificacion',
        'tdo_fecmodificacion'
    ];

    const CREATED_AT = 'tdo_feccreacion';
    const UPDATED_AT = 'tdo_fecmodificacion';

    public function scopeSelectFields($query)
    {
        return $query->select('tdo_codigo', 'tdo_descripcion', 'tdo_codigosunat');
    }
}
