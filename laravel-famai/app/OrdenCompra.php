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
        'occ_fecha',
        'occ_fechaentrega',
        'sed_codigo',
        'mon_codigo',
        'fpa_codigo',
        'occ_tipocambio',
        'occ_referencia',
        'tra_elaborado',
        'tra_solicitado',
        'tra_autorizado',
        'occ_fecautorizacion',
        'occ_notas',
        'occ_total',
        'occ_subtotal',
        'occ_impuesto',
        'occ_observacionpago',
        'occ_adelanto',
        'occ_saldo',
        'occ_estado',
        'occ_importado',
        'occ_tipo',
        'occ_esactivo',
        'occ_activo',
        'occ_usucreacion',
        'occ_feccreacion',
        'occ_usumodificacion',
        'occ_fecmodificacion',
        'occ_nrosap',
        'occ_sedesap'
    ];

    const CREATED_AT = 'occ_feccreacion';
    const UPDATED_AT = 'occ_fecmodificacion';

    public function proveedor()
    {
        return $this->belongsTo(Proveedor::class, 'prv_id', 'prv_id');
    }

    public function moneda()
    {
        return $this->belongsTo(Moneda::class, 'mon_codigo', 'mon_codigo');
    }

    public function elaborador()
    {
        return $this->belongsTo(Trabajador::class, 'tra_elaborado', 'tra_id');
    }

    public function solicitador()
    {
        return $this->belongsTo(Trabajador::class, 'tra_solicitado', 'tra_id');
    }

    public function autorizador()
    {
        return $this->belongsTo(Trabajador::class, 'tra_autorizado', 'tra_id');
    }

    public function detalleOrdenCompra()
    {
        return $this->hasMany(OrdenCompraDetalle::class, 'occ_id', 'occ_id');
    }

    public function sede()
    {
        return $this->belongsTo(Sede::class, 'sed_codigo')->selectFields();
    }

    public function formaPago()
    {
        return $this->belongsTo(FormaPago::class, 'fpa_codigo');
    }

    // Obtener el codigo sap del trabajador buscando por occ_usucreacion
    public function trabajador()
    {
        return $this->belongsTo(Trabajador::class, 'tra_elaborado', 'tra_id');
    }
}
