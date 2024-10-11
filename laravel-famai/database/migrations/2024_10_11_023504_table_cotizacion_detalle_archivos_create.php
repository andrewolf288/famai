<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class TableCotizacionDetalleArchivosCreate extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        Schema::create('tblcotizacionesdetarchivos_cda', function (Blueprint $table) {
            $table->id('cda_id');
            $table->unsignedBigInteger('coc_id');
            $table->string('cda_descripcion', 255)->nullable();
            $table->string('cda_url', 255)->nullable();
            $table->boolean('cda_activo')->default(1);
            $table->string('cda_usucreacion', 8);
            $table->dateTime('cda_feccreacion');
            $table->string('cda_usumodificacion', 8)->nullable();
            $table->dateTime('cda_fecmodificacion')->nullable();
        });
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
        Schema::dropIfExists('tblcotizacionesdetarchivos_cda');
    }
}
