<?php

namespace App;

use Illuminate\Database\Eloquent\Model;

class Cliente extends Model
{
    public $timestamps = true;
    protected $table = 'tblclientes_cli';
    protected $primaryKey = 'cli_id';

    protected $fillable = [
        'cli_tipodocumento',
        'cli_nrodocumento',
        'cli_nombre',
        'cli_activo',
        'usu_usucreacion',
        'usu_feccreacion',
        'usu_usumodificacion',
        'usu_fecmodificacion'
    ];

    const CREATED_AT = 'usu_feccreacion';
    const UPDATED_AT = 'usu_fecmodificacion';

    public function scopeSelectFields($query)
    {
        return $query->select('cli_nrodocumento','cli_nombre');
    }

    // tipo documento
    public function tipoDocumento()
    {
        return $this->belongsTo(TipoDocumento::class, 'cli_tipodocumento');
    }
}
