<?php

namespace App;

use Illuminate\Database\Eloquent\Model;

class RolModulo extends BaseModel
{
    public $timestamps = false;
    protected $table = 'tblrolesmodulos_rmo';
    protected $primaryKey = 'rmo_id';

    protected $fillable = [
        'rol_id',
        'mol_id'
    ];

    public function modulo()
    {
        return $this->belongsTo(Modulo::class, 'mol_id', 'mol_id')->selectFields();
    }
}
