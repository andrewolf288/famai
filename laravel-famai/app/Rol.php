<?php

namespace App;

use Illuminate\Database\Eloquent\Model;

class Rol extends BaseModel
{
    public $timestamps = true;
    protected $table = 'tblroles_rol';
    protected $primaryKey = 'rol_id';

    protected $fillable = [
        'rol_descripcion',
        'rol_usucreacion',
        'rol_feccreacion',
        'rol_usumodificacion',
        'rol_fecmodificacion',
        'rol_activo'
    ];

    const CREATED_AT = 'rol_feccreacion';
    const UPDATED_AT = 'rol_fecmodificacion';

    public function scopeSelectFields($query)
    {
        return $query->select('rol_id', 'rol_descripcion');
    }

    public function rolModulo()
    {
        return $this->hasMany(RolModulo::class, 'rol_id', 'rol_id');
    }
}
