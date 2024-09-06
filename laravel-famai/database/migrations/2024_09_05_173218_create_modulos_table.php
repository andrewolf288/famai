<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class CreateModulosTable extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        Schema::create('tblmodulos_mol', function (Blueprint $table) {
            $table->id('mol_id');
            $table->string('mol_descripcion', 150);
            $table->string('mol_url', 255);
            $table->string('mol_usucreacion', 8);
            $table->dateTime('mol_feccreacion');
            $table->string('mol_usumodificacion', 8)->nullable();
            $table->dateTime('mol_fecmodificacion')->nullable();
            $table->boolean('mol_activo')->default(1);
        });
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
        Schema::dropIfExists('modulos');
    }
}
