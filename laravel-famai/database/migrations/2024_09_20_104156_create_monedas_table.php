<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class CreateMonedasTable extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        Schema::create('tblmonedas_mon', function (Blueprint $table) {
            $table->string('mon_codigo', 3);
            $table->string('mon_descripcion', 100);
            $table->boolean('mon_activo')->default(1);
            $table->string('mon_usuacreacion', 8);
            $table->dateTime('mon_feccreacion');
            $table->string('mon_usumodificacion', 8)->nullable();
            $table->dateTime('mon_fecmodificacion')->nullable();
        });
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
        Schema::dropIfExists('tblmonedas_mon');
    }
}
