<?php

namespace App;

use Illuminate\Database\Eloquent\Model;

class Sede extends Model
{
    public $timestamps = true;
    protected $table = 'tblsedes_sed';
    protected $primaryKey = 'sed_codigo';
    protected $keyType = 'string';

    protected $fillable = [
        'sed_codigo',
        'sed_nombre',
        'sed_activo',
        'sed_usucreacion',
        'sed_feccreacion',
        'sed_usumodificacion',
        'sed_fecmodificacion'
    ];

    const CREATED_AT = 'sed_feccreacion';
    const UPDATED_AT = 'sed_fecmodificacion';

    public function scopeSelectFields($query)
    {
        return $query->select('sed_codigo', 'sed_nombre');
    }

    public function almacenPrincipal()
    {
        return $this->hasOne(Almacen::class, 'sed_codigo', 'sed_codigo')->where('alm_esprincipal', 1);
    }
}
