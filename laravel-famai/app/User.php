<?php

namespace App;

use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Tymon\JWTAuth\Contracts\JWTSubject;
use Carbon\Carbon;

class User extends Authenticatable implements JWTSubject
{
    use Notifiable;

    protected $table = 'tblusuarios_usu';
    protected $primaryKey = 'usu_codigo';
    protected $keyType = 'string';
    public $incrementing = false;
    public $timestamps = true;
    
    protected $fillable = [
        'usu_codigo',
        'rol_id',
        'usu_contrasena', 
        'usu_nombre',
        'usu_activo',
        'usu_ultimoacceso',
        'usu_usucreacion',
        'usu_feccreacion',
        'usu_usumodificacion',
        'usu_fecmodificacion'
    ];

    /**
     * AGREGAR ESTO:
     * Formato de fecha sin milisegundos - Compatible con SQL Server 2019
     */
    public function getDateFormat()
    {
        if (env('DB_CONNECTION') === 'sqlsrv') {
            return 'Y-m-d H:i:s';  // Sin milisegundos: 2025-03-07 14:24:25
        }
        return parent::getDateFormat();
    }

    /**
     * Convertir desde DateTime para guardar en BD
     */
    public function fromDateTime($value)
    {
        if (env('DB_CONNECTION') === 'sqlsrv') {
            if (!$value instanceof Carbon) {
                $value = $this->asDateTime($value);
            }
            return $value->format($this->getDateFormat());
        }
        return parent::fromDateTime($value);
    }

    public function rol(){
        return $this->belongsTo(Rol::class, 'rol_id')->selectFields();
    }

    const CREATED_AT = 'usu_feccreacion';
    const UPDATED_AT = 'usu_fecmodificacion';

    protected $hidden = [
        'usu_contrasena', 
    ];

    public function getJWTIdentifier()
    {
        return $this->getKey();
    }

    public function getJWTCustomClaims()
    {
        return [];
    }

    public function getAuthIdentifierName()
    {
        return 'usu_codigo';
    }

    public function getAuthIdentifier()
    {
        return $this->usu_codigo;
    }

    public function getAuthPassword()
    {
        return $this->usu_contrasena;
    }
}
