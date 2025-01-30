<?php

namespace App;

use Illuminate\Database\Eloquent\Model;

class AlmacenMovimiento extends Model
{
    public $timestamps = true;
    protected $table = 'tblalmacenmovimientoscab_amc';
    protected $primaryKey = 'amc_id';

    protected $fillable = [
        'alm_id',
        'amc_numero',
        'amc_fechamovimiento',
        'amc_tipomovimiento',
        'mtm_codigo',
        'tdr_codigo',
        'amc_documentoreferenciaserie',
        'amc_documentoreferencianumero',
        'amc_documentoreferenciafecha',
        'amc_documentoreferenciaentidad',
        'amc_usucreacion',
        'amc_feccreacion',
        'amc_usumodificacion',
        'amc_fecmodificacion',
        'amc_activo'
    ];

    const CREATED_AT = 'amc_feccreacion';
    const UPDATED_AT = 'amc_fecmodificacion';

    public function almacen()
    {
        return $this->belongsTo(Almacen::class, 'alm_id', 'alm_id');
    }

    public function motivoMovimiento()
    {
        return $this->belongsTo(MotivoMovimiento::class, 'mtm_codigo', 'mtm_codigo');
    }

    public function tipoDocumentoReferencia()
    {
        return $this->belongsTo(TipoDocumentoReferencia::class, 'tdr_codigo', 'tdr_codigo');
    }
}
