<?php

namespace App;

use Illuminate\Database\Eloquent\Model;

class Proveedor extends Model
{
    public $timestamps = true;
    protected $table = 'tblproveedores_prv';
    protected $primaryKey = 'prv_id';

    protected $fillable = [
        'tdo_codigo',
        'prv_nrodocumento',
        'prv_nombre',
        'prv_direccion',
        'ubi_codigo',
        'prv_telefono',
        'prv_contacto',
        'prv_correo',
        'prv_whatsapp',
        'prv_activo',
        'prv_usucreacion',
        'prv_feccreacion',
        'prv_usumodificacion',
        'prv_fecmodificacion'
    ];

    const CREATED_AT = 'prv_feccreacion';
    const UPDATED_AT = 'prv_fecmodificacion';

    public function scopeSelectFields($query)
    {
        return $query->select('prv_id','prv_nrodocumento', 'prv_nombre');
    }

    // Tipo de documento
    public function tipoDocumento()
    {
        return $this->belongsTo(TipoDocumento::class, 'tdo_codigo');
    }

    // Ubigeo
    public function ubigeo()
    {
        return $this->belongsTo(Ubigeo::class, 'ubi_codigo');
    }
}
