<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class CreateRolmodulosTable extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        Schema::create('tblrolesmodulos_rmo', function (Blueprint $table) {
            $table->id('rmo_id');
            $table->unsignedBigInteger('rol_id');
            $table->unsignedBigInteger('mol_id');
            $table->foreign('rol_id')->references('rol_id')->on('tblroles_rol');
            $table->foreign('mol_id')->references('mol_id')->on('tblmodulos_mol');
        });
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
        Schema::dropIfExists('rolmodulos');
    }
}
