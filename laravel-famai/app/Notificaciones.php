<?php

namespace App;

use Illuminate\Database\Eloquent\Model;

class Notificaciones extends Model
{
    public $timestamps = false;
    protected $table = 'tblnotificaciones_ntf';
    protected $primaryKey = 'ntf_id';

    protected $fillable = [
        'ntf_fecha',
        'are_codigo',
        'usu_codigo',
        'ntf_proceso',
        'ntf_descripcion',
        'ntf_visto'
    ];

    // informacion del área
    public function area()
    {
        return $this->belongsTo(Area::class, 'are_codigo');
    }

    // informacion del usuario
    public function usuario()
    {
        return $this->belongsTo(User::class, 'usu_codigo');
    }
}
