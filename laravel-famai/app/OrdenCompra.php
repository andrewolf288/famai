<?php

namespace App;

use Illuminate\Database\Eloquent\Model;

class OrdenCompra extends Model
{
    public $timestamps = true;
    protected $table = 'tblordencompracab_occ';
    protected $primaryKey = 'occ_id';

    protected $fillable = [
        'occ_numero',
        'prv_id',
        'pvc_id',
        'occ_fecha',
        'occ_fechaentrega',
        'mon_codigo',
        'occ_tipocambio',
        'occ_referencia',
        'tra_elaborado',
        'occ_formapago',
        'occ_activo',
        'tra_solicitado',
        'tra_autorizado',
        'occ_notas',
        'occ_total',
        'occ_subtotal',
        'occ_impuesto',
        'occ_observacionpago',
        'occ_adelanto',
        'occ_saldo',
        'occ_estado',
        'occ_usucreacion',
        'occ_feccreacion',
        'occ_usumodificacion',
        'occ_fecmodificacion'
    ];

    const CREATED_AT = 'occ_feccreacion';
    const UPDATED_AT = 'occ_fecmodificacion';
}
