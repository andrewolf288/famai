<?php

namespace App;

use Illuminate\Database\Eloquent\Model;

class OrdenInterna extends Model
{
    public $timestamps = true;
    protected $table = 'tblordenesinternascab_oic';
    protected $primaryKey = 'oic_id';

    protected $fillable = [
        'oic_fecha',
        'odt_numero',
        'cli_id',
        'are_codigo',
        'sed_codigo',
        'oic_equipo_descripcion',
        'oic_componente',
        'oic_estado',
        'oic_tipo',
        'tra_idorigen',
        'tra_idmaestro',
        'tra_idalmacen',
        'mrq_codigo',
        'oic_fechaaprobacion',
        'oic_fechaentregaestimada',
        'oic_fechaevaluacion',
        'oic_activo',
        'oic_usucreacion',
        'oic_feccreacion',
        'oic_usumodificacion',
        'oic_fecmodificacion',
        'oic_otsap' // ALTER TABLE tblordenesinternascab_oic ADD oic_otsap varchar(20) COLLATE SQL_Latin1_General_CP1_CI_AS NULL
    ];

    const CREATED_AT = 'oic_feccreacion';
    const UPDATED_AT = 'oic_fecmodificacion';

    // Cliente
    public function cliente()
    {
        return $this->belongsTo(Cliente::class, 'cli_id')->selectFields();
    }

    // Area
    public function area()
    {
        return $this->belongsTo(Area::class, 'are_codigo')->selectFields();
    }

    // Trabajador Origen
    public function trabajadorOrigen()
    {
        return $this->belongsTo(Trabajador::class, 'tra_idorigen')->selectFields();
    }

    // Trabajador Maestro
    public function trabajadorMaestro()
    {
        return $this->belongsTo(Trabajador::class, 'tra_idmaestro')->selectFields();
    }

    // Trabajador Almacen
    public function trabajadorAlmacen()
    {
        return $this->belongsTo(Trabajador::class, 'tra_idalmacen')->selectFields();
    }

    // orden interna partes
    public function partes()
    {
        return $this->hasMany(OrdenInternaPartes::class, 'oic_id');
    }

    // metodo para contar el total de materiales
    public function totalMateriales()
    {
        return $this->partes()->withCount('materiales')->get()->sum('materiales_count');
    }

    // metodo para mostrar la sede
    public function sede()
    {
        return $this->belongsTo(Sede::class, 'sed_codigo')->selectFields();
    }

    // motivo requerimiento
    public function motivoRequerimiento()
    {
        return $this->belongsTo(MotivoRequerimiento::class, 'mrq_codigo')->selectFields();
    }

    // almacen
    public function almacen()
    {
        return $this->belongsTo(Almacen::class, 'sed_codigo', 'sed_codigo')
            ->where('alm_esprincipal', 1);
    }
}
