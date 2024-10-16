<?php

namespace App;

use Illuminate\Database\Eloquent\Model;

class ProveedorCuentaBanco extends Model
{
    public $timestamps = true;
    protected $table = 'tblproveedorctasbancos_pvc';
    protected $primaryKey = 'pvc_id';

    protected $fillable = [
        'prv_id',
        'mon_codigo',
        'eba_id',
        'pvc_numerocuenta',
        'pvc_usucreacion',
        'pvc_feccreacion',
        'pvc_usumodificacion',
        'pvc_fecmodificacion',
        'pvc_activo'
    ];

    const CREATED_AT = 'pvc_feccreacion';
    const UPDATED_AT = 'pvc_fecmodificacion';
}
