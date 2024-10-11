<?php

namespace App;

use Illuminate\Database\Eloquent\Model;

class Cotizacion extends Model
{
    public $timestamps = true;
    protected $table = 'tblcotizacionescab_coc';
    protected $primaryKey = 'coc_id';

    protected $fillable = [
        'coc_numero',
        'prv_id',
        'coc_fechacotizacion',
        'coc_fechaentrega',
        'mon_codigo',
        'coc_tipocambio',
        'coc_referencia',
        'coc_formapago',
        'tra_solicitante',
        'usu_autorizador',
        'coc_notas',
        'coc_total',
        'coc_subtotal',
        'coc_impuesto',
        'coc_adelanto',
        'coc_observacionpago',
        'coc_activo',
        'coc_usucreacion',
        'coc_feccreacion',
        'coc_usumodificacion',
        'coc_fecmodificacion'
    ];

    const CREATED_AT = 'coc_feccreacion';
    const UPDATED_AT = 'coc_fecmodificacion';

    public function proveedor()
    {
        return $this->belongsTo(Proveedor::class, 'prv_id', 'prv_id');
    }

    public function moneda()
    {
        return $this->belongsTo(Moneda::class, 'mon_codigo', 'mon_codigo');
    }
}
