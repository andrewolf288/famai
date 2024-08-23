<?php

namespace App;

use Illuminate\Database\Eloquent\Model;

class Subfamilia extends Model
{
    public $timestamps = true;
    protected $table = 'tblproductossubfamilias_psf';
    protected $primaryKey = 'psf_codigo';
    protected $keyType = 'string';

    protected $fillable = [
        'psf_codigo',
        'pfa_codigo',
        'psf_descripcion',
        'psf_activo',
        'psf_usucreacion',
        'psf_feccreacion',
        'psf_usumodificacion',
        'psf_fecmodificacion'
    ];

    const CREATED_AT = 'psf_feccreacion';
    const UPDATED_AT = 'psf_fecmodificacion';

    public function scopeSelectFields($query)
    {
        return $query->select('psf_codigo', 'pfa_codigo', 'psf_descripcion');
    }

    public function familia()
    {
        return $this->belongsTo(Familia::class, 'pfa_codigo')->selectFields();
    }
}
