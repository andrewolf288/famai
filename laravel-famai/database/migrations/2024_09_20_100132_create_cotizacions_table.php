<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class CreateCotizacionsTable extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        Schema::create('tblcotizacionescab_coc', function (Blueprint $table) {
            $table->id('coc_id');
            $table->string('coc_numero', 16);
            $table->bigInteger('prv_id');
            $table->date('coc_fechaentrega');
            $table->string('mon_codigo', 3);
            $table->decimal('coc_tipocambio', 10, 2)->nullable();
            $table->string('coc_referencia');
            $table->string('coc_formapago', 250);
            $table->bigInteger('tra_solicitante')->nullable();
            $table->string('usu_autorizador', 8);
            $table->text('coc_notas')->nullable();
            $table->decimal('coc_total', 10, 2);
            $table->decimal('coc_subtotal', 10, 2);
            $table->decimal('coc_impuesto', 10, 2);
            $table->decimal('coc_adelanto', 10, 2);
            $table->text('coc_observacionpago')->nullable();
            $table->boolean('coc_activo')->default(1);
            $table->string('coc_usucreacion', 8);
            $table->dateTime('coc_feccreacion');
            $table->string('coc_usumodificacion', 8)->nullable();
            $table->dateTime('coc_fecmodificacion')->nullable();
        });
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
        Schema::dropIfExists('tblcotizacionescab_coc');
    }
}
