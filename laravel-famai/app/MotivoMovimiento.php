<?php

namespace App;

use Illuminate\Database\Eloquent\Model;

class MotivoMovimiento extends Model
{
    public $timestamps = true;
    protected $table = 'tblmotivosmovimientos_mtm';
    protected $primaryKey = 'mtm_codigo';
    protected $keyType = 'string';

    protected $fillable = [
        'mtm_codigo',
        'mtm_descripcion',
        'mtm_activo',
        'mtm_usucreacion',
        'mtm_feccreacion',
        'mtm_usumodificacion',
        'mtm_fecmodificacion'
    ];

    const CREATED_AT = 'mtm_feccreacion';
    const UPDATED_AT = 'mtm_fecmodificacion';

    public function scopeSelectFields($query)
    {
        return $query->select('mtm_codigo','mtm_descripcion');
    }
}
