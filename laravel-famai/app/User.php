<?php

namespace App;

use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Tymon\JWTAuth\Contracts\JWTSubject;

class User extends Authenticatable implements JWTSubject
{
    use Notifiable;

    protected $table = 'tblusuarios_usu';
    protected $primaryKey = 'usu_codigo';
    protected $keyType = 'string';
    public $incrementing = false;
    public $timestamps = true;
    
    /**
     * Los atributos que son asignables en masa.
     *
     * @var array
     */
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

    public function rol(){
        return $this->belongsTo(Rol::class, 'rol_id')->selectFields();
    }

    /**
     * Las constantes para las columnas de timestamps personalizados.
     */
    const CREATED_AT = 'usu_feccreacion';
    const UPDATED_AT = 'usu_fecmodificacion';

    /**
     * Los atributos que deberían estar ocultos para los arrays.
     *
     * @var array
     */
    protected $hidden = [
        'usu_contrasena', 
        // 'remember_token',
    ];

    /**
     * Obtener el identificador que se almacenará en la reclamación "subject" del JWT.
     *
     * @return mixed
     */
    public function getJWTIdentifier()
    {
        return $this->getKey();
    }

    /**
     * Retornar un array clave-valor, conteniendo cualquier reclamo personalizado que se añadirá al JWT.
     *
     * @return array
     */
    public function getJWTCustomClaims()
    {
        return [];
    }

    /**
     * Definir el campo que será usado como el identificador del usuario.
     *
     * @return string
     */
    public function getAuthIdentifierName()
    {
        return 'usu_codigo';
    }

    /**
     * Obtener el identificador de autenticación.
     *
     * @return mixed
     */
    public function getAuthIdentifier()
    {
        return $this->usu_codigo;
    }

    /**
     * Obtener el password del usuario para la autenticación.
     *
     * @return string
     */
    public function getAuthPassword()
    {
        return $this->usu_contrasena;
    }
}
