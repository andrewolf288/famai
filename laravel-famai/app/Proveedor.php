<?php

namespace App;

use Illuminate\Database\Eloquent\Model;

class Proveedor extends Model
{
    public $timestamps = true;
    protected $table = 'tblproveedores_prv';
    protected $primaryKey = 'prv_id';

    protected $fillable = [
        'prv_codigo',
        'tdo_codigo',
        'prv_nrodocumento',
        'fpa_codigo',
        'prv_nombre',
        'prv_direccion',
        'ubi_codigo',
        'prv_telefono',
        'prv_contacto',
        'prv_correo',
        'prv_whatsapp',
        'prv_activo',
        'prv_pais',
        'prv_departamento',
        'prv_provincia',
        'prv_distrito',
        'prv_rubro',
        'prv_web',
        'prv_cargo',
        'prv_anexo',
        'prv_retenedor',
        'prv_receptor',
        'prv_buencontribuyente',
        'prv_contacto2',
        'prv_telefono2',
        'prv_anexo2',
        'prv_whatsapp2',
        'prv_correo2',
        'prv_rubro2',
        'prv_contacto3',
        'prv_telefono3',
        'prv_anexo3',
        'prv_whatsapp3',
        'prv_correo3',
        'prv_rubro3',
        'prv_extranjero',
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
        return $this->belongsTo(TipoDocumento::class, 'tdo_codigo')->selectFields();
    }

    // Ubigeo
    public function ubigeo()
    {
        return $this->belongsTo(Ubigeo::class, 'ubi_codigo');
    }

    // cuentas de bancos
    public function cuentasBancarias()
    {
        return $this->hasMany(ProveedorCuentaBanco::class, 'prv_id', 'prv_id');
    }

    // forma de pago
    public function formaPago()
    {
        return $this->belongsTo(FormaPago::class, 'fpa_codigo');
    }
}
