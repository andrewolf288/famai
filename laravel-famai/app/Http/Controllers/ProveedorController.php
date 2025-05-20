<?php

namespace App\Http\Controllers;

use App\EntidadBancaria;
use App\Proveedor;
use App\ProveedorCuentaBanco;
use Illuminate\Support\Facades\Validator;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
use PhpOffice\PhpSpreadsheet\IOFactory;

class ProveedorController extends Controller
{
    /**
     * Display a listing of the resource.
     *
     * @return \Illuminate\Http\Response
     */
    public function index(Request $request)
    {
        $pageSize = $request->input('page_size', 10);
        $page = $request->input('page', 1);
        $nombre = $request->input('prv_nombre', null);
        $numerodocumento = $request->input('prv_nrodocumento', null);

        $query = Proveedor::with(['tipoDocumento', 'ubigeo']);

        if ($nombre !== null) {
            $query->where('prv_nombre', 'like', '%' . $nombre . '%');
        }

        if ($numerodocumento !== null) {
            $query->where('prv_nrodocumento', 'like', '%' . $numerodocumento . '%');
        }

        $proveedor = $query->paginate($pageSize, ['*'], 'page', $page);

        return response()->json([
            'message' => 'Se listan los proveedores',
            'data' => $proveedor->items(),
            'count' => $proveedor->total()
        ]);
    }

    public function findProveedorByQuery(Request $request)
    {
        $query = $request->input('query', null);

        if ($query === null) {
            return response()->json(['error' => 'El parámetro de consulta es requerido'], 400);
        }
        $symbol = '+';
        $subqueries = explode($symbol, $query);
        // Realiza la búsqueda de materiales por nombre o código
        $queryBuilder = Proveedor::with(['tipoDocumento', 'ubigeo', 'cuentasBancarias.entidadBancaria', 'cuentasBancarias.moneda'])
            ->where('prv_activo', 1);

        foreach ($subqueries as $term) {
            $queryBuilder->where(function ($q) use ($term) {
                $q->where('prv_nrodocumento', 'like', '%' . $term . '%')
                    ->orWhere('prv_nombre', 'like', '%' . $term . '%');
            });
        }

        $results = $queryBuilder->get();

        // Devuelve los materiales en formato JSON
        return response()->json($results);
    }

    public function findProveedorByDocumento(Request $request)
    {
        $query = $request->input('query', null);
        $tipoDocumento = $request->input('tdo_codigo', null);
        if ($query === null) {
            return response()->json(['error' => 'El parámetro de consulta es requerido'], 400);
        }
        $queryBuilder = Proveedor::where('prv_activo', 1)
            ->where('prv_nrodocumento', $query)
            ->where('tdo_codigo', $tipoDocumento)
            ->select('prv_id', 'tdo_codigo', 'prv_nrodocumento', 'prv_nombre', 'prv_contacto', 'prv_telefono', 'prv_whatsapp');
        $results = $queryBuilder->get();
        return response()->json($results);
    }

    /**
     * Display the specified resource.
     *
     * @param  int  $id
     * @return \Illuminate\Http\Response
     */
    public function show($id)
    {
        // Busca el proveedor por su ID
        $proveedor = Proveedor::find($id);

        if (!$proveedor) {
            return response()->json(['error' => 'Proveedor no encontrado'], 404);
        }

        // Retorna una respuesta JSON con el proveedor específico
        return response()->json($proveedor);
    }

    public function store(Request $request)
    {
        $user = auth()->user();
        // Validamos los datos
        $validator = Validator::make($request->all(), [
            'prv_nrodocumento' => 'required|string|max:16|unique:tblproveedores_prv,prv_nrodocumento',
            'prv_nombre' => 'required|string|max:500',
            'tdo_codigo' => 'required|string|exists:tbltiposdocumento_tdo,tdo_codigo',
            'prv_direccion' => 'nullable|string|max:1000',
            'ubi_codigo' => 'nullable|string|exists:tblubigeos_ubi,ubi_codigo',
            'prv_telefono' => 'nullable|string|max:30',
            'prv_contacto' => 'nullable|string|max:150',
            'prv_correo' => 'nullable|string|max:250',
            'prv_whatsapp' => 'nullable|string|max:30',
        ]);

        // Validamos la información
        if ($validator->fails()) {
            return response()->json(["error" => $validator->errors()->toJson()], 400);
        }

        // Creamos el nuevo proveedor
        $proveedor = Proveedor::create(array_merge(
            $validator->validated(),
            [
                "prv_activo" => true,
                "prv_usucreacion" => $user->usu_codigo,
                "prv_fecmodificacion" => null,
            ]
        ));

        // Devolvemos la información
        return response()->json([
            'message' => 'Proveedor registrado exitosamente',
            'data' => $proveedor
        ], 201);
    }


    public function update(Request $request, $id)
    {
        $user = auth()->user();

        $proveedor = Proveedor::find($id);

        if (!$proveedor) {
            return response()->json(['error' => 'Proveedor no encontrado'], 404);
        }

        // Validamos los datos
        $validator = Validator::make($request->all(), [
            'prv_nrodocumento' => [
                'required',
                'string',
                'max:16',
                Rule::unique('tblproveedores_prv', 'prv_nrodocumento')->ignore($id, 'prv_id'),
            ],
            'prv_nombre' => [
                'required',
                'string',
                'max:500',
            ],
            'tdo_codigo' => 'required|string|exists:tbltiposdocumento_tdo,tdo_codigo',
            'prv_direccion' => 'nullable|string|max:1000',
            'ubi_codigo' => 'nullable|string|exists:tblubigeos_ubi,ubi_codigo',
            'prv_telefono' => 'required|string|max:30',
            'prv_contacto' => 'nullable|string|max:150',
            'prv_correo' => 'nullable|string|max:250',
            'prv_whatsapp' => 'nullable|string|max:30',
            'prv_activo' => 'required|boolean',
        ]);

        // Validamos la información
        if ($validator->fails()) {
            return response()->json(["error" => $validator->errors()->toJson()], 400);
        }

        $proveedor->update(array_merge(
            $validator->validated(),
            [
                "prv_usumodificacion" => $user->usu_codigo,
            ]
        ));

        return response()->json([
            'message' => 'Proveedor actualizado correctamente',
            'data' => $proveedor
        ]);
    }

    public function importData()
    {
        try {
            DB::beginTransaction();
            $filePath = storage_path('app/temp/FICHA_DE_PROVEEDOR.xlsx');

            if (!file_exists($filePath)) {
                return response('No se encontro el archivo');
            }

            $reader = IOFactory::createReader('Xlsx');
            $reader->setReadDataOnly(true);

            $spreadsheet = $reader->load($filePath);
            $worksheet = $spreadsheet->getActiveSheet();

            $bancos = EntidadBancaria::pluck('eba_id', 'eba_codigo')->toArray();
            $creados = 0;
            $actualizados = 0;
            
            foreach ($worksheet->getRowIterator() as $rowIndex => $row) {
                $cellIterator = $row->getCellIterator('A', 'BF');
                $cellIterator->setIterateOnlyExistingCells(false);

                $ruc = null;
                $razon_social = null;
                $direccion = null;
                $pais = null;
                $departamento = null;
                $provincia = null;
                $distrito = null;
                $rubro = null;
                $web = null;
                $contacto = null;
                $cargo = null;
                $telefono = null;
                $anexo = null;
                $whatsapp = null;
                $correo = null;
                $retenedor = null;
                $receptor = null;
                $contribuyente = null;
                $contacto2 = null;
                $telefono2 = null;
                $anexo2 = null;
                $whatsapp2 = null;
                $correo2 = null;
                $rubro2 = null;
                $contacto3 = null;
                $telefono3 = null;
                $anexo3 = null;
                $whatsapp3 = null;
                $correo3 = null;
                $rubro3 = null;
                $extranjero = null;

                // primera cuenta
                $banco1 = null;
                $moneda1 = null;
                $tipocuenta1 = null;
                $numerocuenta1 = null;
                $numerocuentainterbancaria1 = null;

                // segunda cuenta
                $banco2 = null;
                $moneda2 = null;
                $tipocuenta2 = null;
                $numerocuenta2 = null;
                $numerocuentainterbancaria2 = null;

                // tercera cuenta
                $banco3 = null;
                $moneda3 = null;
                $tipocuenta3 = null;
                $numerocuenta3 = null;
                $numerocuentainterbancaria3 = null;

                // cuarta cuenta
                $banco4 = null;
                $moneda4 = null;
                $tipocuenta4 = null;
                $numerocuenta4 = null;
                $numerocuentainterbancaria4 = null;

                // quinta cuenta
                $banco5 = null;
                $moneda5 = null;
                $tipocuenta5 = null;
                $numerocuenta5 = null;
                $numerocuentainterbancaria5 = null;

                // cuenta de retencion
                $numerocuentaretencion = null;

                if ($rowIndex != 1) {
                    foreach ($cellIterator as $colIndex => $cell) {
                        if ($colIndex == 'B') {
                            $ruc = $cell->getFormattedValue();
                        }
                        if ($colIndex == 'C') {
                            $razon_social = $cell->getFormattedValue();
                        }
                        if ($colIndex == 'D') {
                            $direccion = $cell->getFormattedValue();
                        }
                        if ($colIndex == 'E') {
                            $pais = $cell->getFormattedValue();
                        }
                        if ($colIndex == 'F') {
                            $departamento = $cell->getFormattedValue();
                        }
                        if ($colIndex == 'G') {
                            $provincia = $cell->getFormattedValue();
                        }
                        if ($colIndex == 'H') {
                            $distrito = $cell->getFormattedValue();
                        }
                        if ($colIndex == 'I') {
                            $rubro = $cell->getFormattedValue();
                        }
                        if ($colIndex == 'J') {
                            $web = $cell->getFormattedValue();
                        }
                        if ($colIndex == 'K') {
                            $contacto = $cell->getFormattedValue();
                        }
                        if ($colIndex == 'L') {
                            $cargo = $cell->getFormattedValue();
                        }
                        if ($colIndex == 'M') {
                            $telefono = $cell->getFormattedValue();
                        }
                        if ($colIndex == 'N') {
                            $anexo = $cell->getFormattedValue();
                        }
                        if ($colIndex == 'O') {
                            $whatsapp = $cell->getFormattedValue();
                        }
                        if ($colIndex == 'P') {
                            $correo = $cell->getFormattedValue();
                        }
                        if ($colIndex == 'Q') {
                            $retenedor = $cell->getFormattedValue() == 'Si' ? 1 : 0;
                        }
                        if ($colIndex == 'R') {
                            $receptor = $cell->getFormattedValue() == 'Si' ? 1 : 0;
                        }
                        if ($colIndex == 'S') {
                            $contribuyente = $cell->getFormattedValue() == 'Si' ? 1 : 0;
                        }
                        if ($colIndex == 'T') {
                            $contacto2 = $cell->getFormattedValue();
                        }
                        if ($colIndex == 'U') {
                            $telefono2 = $cell->getFormattedValue();
                        }
                        if ($colIndex == 'V') {
                            $anexo2 = $cell->getFormattedValue();
                        }
                        if ($colIndex == 'W') {
                            $whatsapp2 = $cell->getFormattedValue();
                        }
                        if ($colIndex == 'X') {
                            $correo2 = $cell->getFormattedValue();
                        }
                        if ($colIndex == 'Y') {
                            $rubro2 = $cell->getFormattedValue();
                        }
                        if ($colIndex == 'Z') {
                            $contacto3 = $cell->getFormattedValue();
                        }
                        if ($colIndex == 'AA') {
                            $telefono3 = $cell->getFormattedValue();
                        }
                        if ($colIndex == 'AB') {
                            $anexo3 = $cell->getFormattedValue();
                        }
                        if ($colIndex == 'AC') {
                            $whatsapp3 = $cell->getFormattedValue();
                        }
                        if ($colIndex == 'AD') {
                            $correo3 = $cell->getFormattedValue();
                        }
                        if ($colIndex == 'AE') {
                            $rubro3 = $cell->getFormattedValue();
                        }
                        if ($colIndex == 'BF') {
                            $extranjero = $cell->getFormattedValue() == 'Si' ? 1 : 0;
                        }

                        // primera cuenta
                        if ($colIndex == 'AF') {
                            $banco1 = $cell->getFormattedValue();
                        }
                        if ($colIndex == 'AG') {
                            $moneda1 = $cell->getFormattedValue();
                        }
                        if ($colIndex == 'AH') {
                            $tipocuenta1 = $cell->getFormattedValue();
                        }
                        if ($colIndex == 'AI') {
                            $numerocuenta1 = $cell->getFormattedValue();
                        }
                        if ($colIndex == 'AJ') {
                            $numerocuentainterbancaria1 = $cell->getFormattedValue();
                        }

                        // segunda cuenta
                        if ($colIndex == 'AK') {
                            $banco2 = $cell->getFormattedValue();
                        }
                        if ($colIndex == 'AL') {
                            $moneda2 = $cell->getFormattedValue();
                        }
                        if ($colIndex == 'AM') {
                            $tipocuenta2 = $cell->getFormattedValue();
                        }
                        if ($colIndex == 'AN') {
                            $numerocuenta2 = $cell->getFormattedValue();
                        }
                        if ($colIndex == 'AO') {
                            $numerocuentainterbancaria2 = $cell->getFormattedValue();
                        }

                        // tercera cuenta
                        if ($colIndex == 'AP') {
                            $banco3 = $cell->getFormattedValue();
                        }
                        if ($colIndex == 'AQ') {
                            $moneda3 = $cell->getFormattedValue();
                        }
                        if ($colIndex == 'AR') {
                            $tipocuenta3 = $cell->getFormattedValue();
                        }
                        if ($colIndex == 'AS') {
                            $numerocuenta3 = $cell->getFormattedValue();
                        }
                        if ($colIndex == 'AT') {
                            $numerocuentainterbancaria3 = $cell->getFormattedValue();
                        }

                        // cuarta cuenta
                        if ($colIndex == 'AU') {
                            $banco4 = $cell->getFormattedValue();
                        }
                        if ($colIndex == 'AV') {
                            $moneda4 = $cell->getFormattedValue();
                        }
                        if ($colIndex == 'AW') {
                            $tipocuenta4 = $cell->getFormattedValue();
                        }
                        if ($colIndex == 'AX') {
                            $numerocuenta4 = $cell->getFormattedValue();
                        }
                        if ($colIndex == 'AY') {
                            $numerocuentainterbancaria4 = $cell->getFormattedValue();
                        }

                        // quinta cuenta
                        if ($colIndex == 'AZ') {
                            $banco5 = $cell->getFormattedValue();
                        }
                        if ($colIndex == 'BA') {
                            $moneda5 = $cell->getFormattedValue();
                        }
                        if ($colIndex == 'BB') {
                            $tipocuenta5 = $cell->getFormattedValue();
                        }
                        if ($colIndex == 'BC') {
                            $numerocuenta5 = $cell->getFormattedValue();
                        }
                        if ($colIndex == 'BD') {
                            $numerocuentainterbancaria5 = $cell->getFormattedValue();
                        }

                        // cuenta de retencion
                        if ($colIndex == 'BE') {
                            $numerocuentainterbancaria5 = $cell->getFormattedValue();
                        }
                    }

                    $proveedor = Proveedor::where('prv_nrodocumento', strval($ruc))
                        ->first();

                    if ($proveedor) {
                        $proveedor->update([
                            'prv_nombre' => $razon_social,
                            'prv_direccion' => $direccion,
                            'prv_pais' => $pais,
                            'prv_departamento' => $departamento,
                            'prv_provincia' => $provincia,
                            'prv_distrito' => $distrito,
                            'prv_rubro' => $rubro,
                            'prv_web' => $web,
                            'prv_cargo' => $cargo,
                            'prv_anexo' => $anexo,
                            'prv_retenedor' => $retenedor,
                            'prv_receptor' => $receptor,
                            'prv_buencontribuyente' => $contribuyente,
                            'prv_contacto' => $contacto,
                            'prv_correo' => $correo,
                            'prv_whatsapp' => $whatsapp,
                            'prv_telefono' => $telefono,
                            'prv_contacto2' => $contacto2,
                            'prv_telefono2' => $telefono2,
                            'prv_anexo2' => $anexo2,
                            'prv_whatsapp2' => $whatsapp2,
                            'prv_correo2' => $correo2,
                            'prv_rubro2' => $rubro2,
                            'prv_contacto3' => $contacto3,
                            'prv_telefono3' => $telefono3,
                            'prv_anexo3' => $anexo3,
                            'prv_whatsapp3' => $whatsapp3,
                            'prv_correo3' => $correo3,
                            'prv_rubro3' => $rubro3,
                            'prv_extranjero' => $extranjero,
                            'prv_usumodificacion' => 'ANDREWJA',
                            'prv_fecmodificacion' => '2025-03-07'
                        ]);
                        $actualizados++;
                    } else {
                        $proveedor = Proveedor::create([
                            'prv_nrodocumento' => $ruc,
                            'tdo_codigo' => 'RUC',
                            'prv_nombre' => $razon_social,
                            'prv_direccion' => $direccion,
                            'prv_pais' => $pais,
                            'prv_departamento' => $departamento,
                            'prv_provincia' => $provincia,
                            'prv_distrito' => $distrito,
                            'prv_rubro' => $rubro,
                            'prv_web' => $web,
                            'prv_cargo' => $cargo,
                            'prv_anexo' => $anexo,
                            'prv_retenedor' => $retenedor,
                            'prv_receptor' => $receptor,
                            'prv_buencontribuyente' => $contribuyente,
                            'prv_contacto' => $contacto,
                            'prv_correo' => $correo,
                            'prv_whatsapp' => $whatsapp,
                            'prv_telefono' => $telefono,
                            'prv_contacto2' => $contacto2,
                            'prv_telefono2' => $telefono2,
                            'prv_anexo2' => $anexo2,
                            'prv_whatsapp2' => $whatsapp2,
                            'prv_correo2' => $correo2,
                            'prv_rubro2' => $rubro2,
                            'prv_contacto3' => $contacto3,
                            'prv_telefono3' => $telefono3,
                            'prv_anexo3' => $anexo3,
                            'prv_whatsapp3' => $whatsapp3,
                            'prv_correo3' => $correo3,
                            'prv_rubro3' => $rubro3,
                            'prv_extranjero' => $extranjero,
                            'prv_usucreacion' => 'ANDREWJA',
                            'prv_feccreacion' => '2025-03-07'
                        ]);
                        $creados++;
                    }

                    // primera cuenta
                    if(!empty($banco1)){
                        ProveedorCuentaBanco::create([
                            'prv_id' => $proveedor->prv_id,
                            'mon_codigo' => $moneda1,
                            'eba_id' => $bancos[$banco1],
                            'pvc_tipocuenta' => $tipocuenta1,
                            'pvc_numerocuenta' => $numerocuenta1,
                            'prv_numerocuentainterbancaria' => $numerocuentainterbancaria1
                        ]);
                    }

                    // segunda cuenta
                    if(!empty($banco2)){
                        ProveedorCuentaBanco::create([
                            'prv_id' => $proveedor->prv_id,
                            'mon_codigo' => $moneda2,
                            'eba_id' => $bancos[$banco2],
                            'pvc_tipocuenta' => $tipocuenta2,
                            'pvc_numerocuenta' => $numerocuenta2,
                            'prv_numerocuentainterbancaria' => $numerocuentainterbancaria2
                        ]);
                    }

                    // tercera cuenta
                    if(!empty($banco3)){
                        ProveedorCuentaBanco::create([
                            'prv_id' => $proveedor->prv_id,
                            'mon_codigo' => $moneda3,
                            'eba_id' => $bancos[$banco3],
                            'pvc_tipocuenta' => $tipocuenta3,
                            'pvc_numerocuenta' => $numerocuenta3,
                            'prv_numerocuentainterbancaria' => $numerocuentainterbancaria3
                        ]);
                    }

                    // cuarta cuenta
                    if(!empty($banco4)){
                        ProveedorCuentaBanco::create([
                            'prv_id' => $proveedor->prv_id,
                            'mon_codigo' => $moneda4,
                            'eba_id' => $bancos[$banco4],
                            'pvc_tipocuenta' => $tipocuenta4,
                            'pvc_numerocuenta' => $numerocuenta4,
                            'prv_numerocuentainterbancaria' => $numerocuentainterbancaria4
                        ]);
                    }

                    // quinta cuenta
                    if(!empty($banco5)){
                        ProveedorCuentaBanco::create([
                            'prv_id' => $proveedor->prv_id,
                            'mon_codigo' => $moneda5,
                            'eba_id' => $bancos[$banco5],
                            'pvc_tipocuenta' => $tipocuenta5,
                            'pvc_numerocuenta' => $numerocuenta5,
                            'prv_numerocuentainterbancaria' => $numerocuentainterbancaria5
                        ]);
                    }

                    // cuenta de retencion
                    if(!empty($numerocuentaretencion)){
                        ProveedorCuentaBanco::create([
                            'prv_id' => $proveedor->prv_id,
                            'mon_codigo' => 'SOL',
                            'eba_id' => 'BN',
                            'pvc_numerocuenta' => $numerocuentaretencion,
                        ]);
                    }
                }
            }
            DB::commit();

            return response(["cantidad_actualizados" => $actualizados, "cantidad_creados" => $creados]);
        } catch (\Exception $e) {
            DB::rollBack();
            print($e);
        }
    }
}
