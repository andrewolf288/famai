<?php

namespace App;

use Illuminate\Database\Eloquent\Model;

class Modulo extends Model
{
    public $timestamps = true;
    protected $table = 'tblmodulos_mol';
    protected $primaryKey = 'mol_id';

    protected $fillable = [
        'mol_descripcion',
        'mol_tipo',
        'mol_url',
        'mol_usucreacion',
        'mol_feccreacion',
        'mol_usumodificacion',
        'mol_fecmodificacion',
        'mol_activo'
    ];

    const CREATED_AT = 'mol_feccreacion';
    const UPDATED_AT = 'mol_fecmodificacion';

    public function scopeSelectFields($query)
    {
        return $query->select('mol_id', 'mol_descripcion', 'mol_tipo', 'mol_url');
    }
}
