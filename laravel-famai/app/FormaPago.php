<?php

namespace App;

use Illuminate\Database\Eloquent\Model;

class FormaPago extends Model
{
    public $timestamps = true;
    protected $table = 'tblformaspago_fpa';
    protected $primaryKey = 'fpa_codigo';

    protected $fillable = [
        'fpa_codigo',
        'fpa_descripcion',
        'fpa_usucreacion',
        'fpa_feccreacion',
        'fpa_usumodificacion',
        'fpa_fecmodificacion',
        'fpa_activo'
    ];

    const CREATED_AT = 'fpa_feccreacion';
    const UPDATED_AT = 'fpa_fecmodificacion';
}
