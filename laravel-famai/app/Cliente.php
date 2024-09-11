<?php

namespace App;

use Illuminate\Database\Eloquent\Model;

class Cliente extends Model
{
    public $timestamps = true;
    protected $table = 'tblclientes_cli';
    protected $primaryKey = 'cli_id';

    protected $fillable = [
        'tdo_codigo',
        'cli_nrodocumento',
        'cli_nombre',
        'cli_activo',
        'are_usucreacion',
        'are_feccreacion',
        'are_usumodificacion',
        'are_fecmodificacion'
    ];

    const CREATED_AT = 'cli_feccreacion';
    const UPDATED_AT = 'cli_fecmodificacion';

    public function scopeSelectFields($query)
    {
        return $query->select('cli_id', 'cli_nrodocumento','cli_nombre');
    }

    // tipo documento
    public function tipoDocumento()
    {
        return $this->belongsTo(TipoDocumento::class, 'tdo_codigo');
    }
}
