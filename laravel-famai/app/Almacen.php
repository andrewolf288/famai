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
        'usu_usucreacion',
        'usu_feccreacion',
        'usu_usumodificacion',
        'usu_fecmodificacion'
    ];

    const CREATED_AT = 'usu_feccreacion';
    const UPDATED_AT = 'usu_fecmodificacion';
}
