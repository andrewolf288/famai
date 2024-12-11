<?php

namespace App;

use Illuminate\Database\Eloquent\Model;

class Almacen extends Model
{
    public $timestamps = true;
    protected $table = 'tblalmacenes_alm';
    protected $primaryKey = 'alm_id';

    protected $fillable = [
        'alm_codigo',
        'alm_descripcion',
        'alm_tipo',
        'sed_codigo',
        'alm_usucreacion',
        'alm_feccreacion',
        'alm_usumodificacion',
        'alm_fecmodificacion'
    ];

    const CREATED_AT = 'alm_feccreacion';
    const UPDATED_AT = 'alm_fecmodificacion';

    public function sede()
    {
        return $this->belongsTo(Sede::class, 'sed_codigo');
    }
}
