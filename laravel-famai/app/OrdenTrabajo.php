<?php

namespace App;

use Illuminate\Database\Eloquent\Model;

class OrdenTrabajo extends Model
{
    public $timestamps = true;
    protected $table = 'tblordenesdetrabajo_odt';
    protected $primaryKey = 'odt_numero';

    protected $fillable = [
        'odt_numero',
        'odt_fecha',
        'cli_id',
        'odt_equipo',
        'odt_trabajo',
        'odt_estado',
        'odt_usucreacion',
        'odt_feccreacion',
        'odt_usumodificacion',
        'odt_fecmodificacion'
    ];

    const CREATED_AT = 'odt_feccreacion';
    const UPDATED_AT = 'odt_fecmodificacion';

    // Cliente
    public function cliente()
    {
        return $this->belongsTo(Cliente::class, 'cli_id')->selectFields();
    }
}
