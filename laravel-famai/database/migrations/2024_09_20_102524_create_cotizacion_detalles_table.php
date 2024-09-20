<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class CreateCotizacionDetallesTable extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        Schema::create('tblcotizacionesdet_cod', function (Blueprint $table) {
            $table->id('cod_id');
            $table->unsignedBigInteger('coc_id');
            $table->unsignedBigInteger('odm_id')->nullable();
            $table->unsignedSmallInteger('cod_orden');
            $table->string('cod_descripcion', 250);
            $table->decimal('cod_cantidad', 10, 2);
            $table->decimal('cod_preciounitario', 10, 2);
            $table->decimal('cod_total', 10, 2);
            $table->boolean('cod_activo')->default(1);
            $table->string('cod_usucreacion', 8);
            $table->dateTime('cod_feccreacion');
            $table->string('cod_usumodificacion', 8)->nullable();
            $table->dateTime('cod_fecmodificacion')->nullable();
        });
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
        Schema::dropIfExists('tblcotizacionesdet_cod');
    }
}
