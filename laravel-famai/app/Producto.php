<?php

namespace App;

use Illuminate\Database\Eloquent\Model;

class Producto extends Model
{
    public $timestamps = true;
    protected $table = 'tblproductos_pro';
    protected $primaryKey = 'pro_id';

    protected $fillable = [
        'pro_codigo',
        'pro_descripcion',
        'uni_codigo',
        'pgi_codigo',
        'pfa_codigo',
        'psf_codigo',
        'pma_codigo',
        'pro_codigosap',
        'uni_codigomayor',
        'pro_factorunidadmayor',
        'pro_stockminimo',
        'pro_generastock',
        'pro_codigosunat',
        'pro_activo',
        'pro_usucreacion',
        'pro_feccreacion',
        'pro_usumodificacion',
        'pro_fecmodificacion',
    ];

    const CREATED_AT = 'pro_feccreacion';
    const UPDATED_AT = 'pro_fecmodificacion';

    protected $casts = [
        'pro_stockminimo' => 'decimal:2',
        'pro_factorunidadmayor' => 'decimal:2'
    ];

    public function scopeSelectFields($query)
    {
        return $query->select('pro_id', 'pro_codigo', 'pro_descripcion');
    }

    // relacion de unidad
    public function unidad()
    {
        return $this->belongsTo(Unidad::class, 'uni_codigo')->selectFields();
    }

    // relacion de grupo inventario
    public function grupoInventario()
    {
        return $this->belongsTo(GrupoInventario::class, 'pgi_codigo')->selectFields();
    }

    // relacion de familia
    public function familia()
    {
        return $this->belongsTo(Familia::class, 'pfa_codigo')->selectFields();
    }

    // relacion de subfamilia
    public function subfamilia()
    {
        return $this->belongsTo(Subfamilia::class, 'psf_codigo')->selectFields();
    }

    // relacion de marca
    public function marca()
    {
        return $this->belongsTo(Marca::class, 'pma_codigo')->selectFields();
    }

    // relacion de unidad mayor
    public function unidadMayor()
    {
        return $this->belongsTo(Unidad::class, 'uni_codigomayor')->selectFields();
    }

    // ultima compra
    public function ultimaCompra()
    {
        return $this->hasOne(ProductoProveedor::class, 'pro_id')->latest('prp_fechaultimacompra');
    }
}
