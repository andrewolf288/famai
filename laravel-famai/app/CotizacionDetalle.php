<?php

namespace App;

use Illuminate\Database\Eloquent\Model;

class CotizacionDetalle extends BaseModel
{
    public $timestamps = true;
    protected $table = 'tblcotizacionesdet_cod';
    protected $primaryKey = 'cod_id';

    protected $fillable = [
        'coc_id',
        'odm_id',
        'pro_id',
        'cod_orden',
        'cod_tiempoentrega',
        'cod_descripcion',
        'cod_observacion',
        'cod_observacionproveedor',
        'cod_cantidad',
        'cod_cantidadcotizada',
        'cod_preciounitario',
        'cod_total',
        'cod_cotizar',
        'cod_activo',
        'cod_parastock',
        'cod_estado',
        'cod_usucreacion',
        'cod_feccreacion',
        'cod_usumodificacion',
        'cod_fecmodificacion',
        'cod_fecentregaoc', // ALTER TABLE tblcotizacionesdet_cod ADD cod_fecentregaoc DATE NULL;
        'cod_descuento', // ALTER TABLE tblcotizacionesdet_cod ADD cod_descuento DECIMAL(10,2) NULL;
        'cod_impuesto', // ALTER TABLE tblcotizacionesdet_cod ADD cod_impuesto VARCHAR(10) NULL;
        'cod_precioconigv', // ALTER TABLE tblcotizacionesdet_cod ADD cod_precioconigv DECIMAL(10,4) NULL;
        'cod_preciounitariopuro', // ALTER TABLE tblcotizacionesdet_cod ADD cod_preciounitariopuro DECIMAL(10,4) NULL;
        'cod_esflete', // ALTER TABLE dbo.tblcotizacionesdet_cod ADD cod_esflete BIT DEFAULT 0 NOT NULL;
    ];

    const CREATED_AT = 'cod_feccreacion';
    const UPDATED_AT = 'cod_fecmodificacion';

    // detalle de material
    public function detalleMaterial()
    {
        return $this->belongsTo(OrdenInternaMateriales::class, 'odm_id', 'odm_id');
    }

    // detalle cotizacion
    public function cotizacion()
    {
        return $this->belongsTo(Cotizacion::class, 'coc_id', 'coc_id');
    }

    // producto
    public function producto()
    {
        return $this->belongsTo(Producto::class, 'pro_id')->selectFields();
    }
}
