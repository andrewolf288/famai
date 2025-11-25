<?php

namespace App;

use Illuminate\Database\Eloquent\Model;

class Ubigeo extends BaseModel
{
    public $timestamps = true;
    protected $table = 'tblubigeos_ubi';
    protected $primaryKey = 'ubi_codigo';
    protected $keyType = 'string';

    protected $fillable = [
        'ubi_codigo',
        'ubi_departamento',
        'ubi_provincia',
        'ubi_distrito',
        'ubi_departamentonombre',
        'ubi_provincianombre',
        'ubi_distritonombre',
        'ubi_usucreacion',
        'ubi_feccreacion',
        'ubi_usumodificacion',
        'ubi_fecmodificacion'
    ];

    const CREATED_AT = 'ubi_feccreacion';
    const UPDATED_AT = 'ubi_fecmodificacion';
}
