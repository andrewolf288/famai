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
        'usu_codigo',
        'are_codigo',
        'sed_codigo',
        'tra_urlfirma',
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

    // usuario
    public function usuario()
    {
        return $this->belongsTo(User::class, 'usu_codigo')->select('usu_codigo', 'usu_nombre');
    }
    // area
    public function area()
    {
        return $this->belongsTo(Area::class, 'are_codigo')->selectFields();
    }
    // sede
    public function sede()
    {
        return $this->belongsTo(Sede::class, 'sed_codigo')->selectFields();
    }
}
