<?php

namespace App;

use Illuminate\Database\Eloquent\Model;

class Trabajador extends Model
{
    public $timestamps = true;
    protected $table = 'tbltrabajadores_tra';
    protected $primaryKey = 'tra_id';

    protected $fillable = [
        'tra_nombre',
        'tra_codigosap',
        'tra_activo',
        'tra_usucreacion',
        'tra_feccreacion',
        'tra_usumodificacion',
        'tra_fecmodificacion'
    ];

    const CREATED_AT = 'tra_feccreacion';
    const UPDATED_AT = 'tra_fecmodificacion';

    public function scopeSelectFields($query)
    {
        return $query->select('tra_id', 'tra_nombre', 'tra_codigosap');
    }
}
