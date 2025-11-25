<?php

namespace App;

use Illuminate\Database\Eloquent\Model;

class OrdenCompraAdjuntos extends BaseModel
{
    public $timestamps = true;
    protected $table = 'tblordencomprasadjuntos_oca';
    protected $primaryKey = 'oca_id';

    protected $fillable = [
        'oca_id',
        'occ_id',
        'oca_descripcion',
        'oca_url',
        'oca_feccreacion',
        'oca_usucreacion',
        'oca_fecmodificacion',
        'oca_usumodificacion',
    ];

    const CREATED_AT = 'oca_feccreacion';
    const UPDATED_AT = 'oca_fecmodificacion';
}
