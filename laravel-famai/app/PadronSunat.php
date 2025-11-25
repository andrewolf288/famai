<?php

namespace App;

use Illuminate\Database\Eloquent\Model;

class PadronSunat extends Model
{
    protected $table = 'tblPadronSunat_XPS';

    protected $fillable = [
        'xps_nrodocumento',
        'xps_nombre',
        'xps_estado',
        'xps_condicion',
        'xps_ubigeo',
        'xps_tipovia',
        'xps_nombrevia',
        'xps_codigozona',
        'xps_tipozona',
        'xps_numero',
        'xps_interior',
        'xps_lote',
        'xps_departamento',
        'xps_manzana',
        'xps_kilometro',
        'xps'
    ];

}
