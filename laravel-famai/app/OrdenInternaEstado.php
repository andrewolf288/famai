<?php

namespace App;

use Illuminate\Database\Eloquent\Model;

class OrdenInternaEstado extends Model
{
    public $timestamps = true;
    protected $table = 'tblordenesinternasestados_oie';
    protected $primaryKey = 'oie_codigo';
    protected $keyType = 'string';

    protected $fillable = [
        'oie_codigo',
        'oie_descripcion',
    ];
}
