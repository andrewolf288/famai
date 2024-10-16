<?php

namespace App;

use Illuminate\Database\Eloquent\Model;

class EntidadBancaria extends Model
{
    public $timestamps = true;
    protected $table = 'tblentidadbancaria_eba';
    protected $primaryKey = 'eba_id';

    protected $fillable = [
        'eba_descripcion',
        'eba_usucreacion',
        'eba_feccreacion',
        'eba_usumodificacion',
        'eba_fecmodificacion',
        'eba_activo'
    ];

    const CREATED_AT = 'eba_feccreacion';
    const UPDATED_AT = 'eba_fecmodificacion';
}
