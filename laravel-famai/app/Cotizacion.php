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
        'mon_codigo',
        'coc_vendedor',
        'coc_deposito',
        'coc_tipocambio',
        'coc_formapago',
        'tra_solicitante',
        'coc_notas',
        'coc_total',
        'coc_usucreacion',
        'coc_feccreacion',
        'coc_usumodificacion',
        'coc_fecmodificacion',
        'coc_estado',
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

    public function detalleCotizacion()
    {
        return $this->hasMany(CotizacionDetalle::class, 'coc_id', 'coc_id');
    }
}
