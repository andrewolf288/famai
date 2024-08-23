<?php

namespace App\Http\Controllers;

use App\Reporte;
use Illuminate\Http\Request;
use mPDF;

class ReporteController extends Controller
{
    private $varRuta = "views/reporte/PlanOrdenTrabajo.php";
    private $varRutaStringPrincipal = "views/reporte/StringPrincipal.php";
    private $varRutaStringSecundario = "views/reporte/StringSecundario.php";
    private $varRutaStringSecundarioSoloMateriales = "views/reporte/StringSecundarioSoloMateriales.php";
    private $varRutaStringSecundarioSoloProcesos = "views/reporte/StringSecundarioSoloProcesos.php";
    private $varRutaStringFinal = "views/reporte/StringFinal.php";
    
    private $varProcCampos = ["{varNumFil}", "{varProcesoParte}", "{varCodigo}", "{varDescripcion}", "{varProObservacion}"];
    private $varMatCampos = ["{varItem}", "{varDescripcionMat}", "{varCantidad}", "{varMatObservacion}"];

    private $varTab = "&nbsp;";
    private $fechaHoraActual ;
    private $storagepath = 'app/mpdf_tmp';
    
    public function generarReporteOrdenTrabajo(Request $request)
    {
        $this->varRuta = resource_path($this->varRuta);
        $this->varRutaStringPrincipal = resource_path($this->varRutaStringPrincipal);
        $this->varRutaStringSecundario = resource_path($this->varRutaStringSecundario);
        $this->varRutaStringSecundarioSoloMateriales = resource_path($this->varRutaStringSecundarioSoloMateriales);
        $this->varRutaStringSecundarioSoloProcesos = resource_path($this->varRutaStringSecundarioSoloProcesos);
        $this->varRutaStringFinal = resource_path($this->varRutaStringFinal);

		$this->fechaHoraActual = date('Y-m-d H:i:s');
		$varTempDir = storage_path($this->storagepath);
		
		if (!is_dir($varTempDir)) {
            mkdir($varTempDir, 0777, true);
        }
		 
        // Validar los parámetros de entrada
        $validated = $request->validate([
            'ot_numero' => 'required|string',
            'oi_numero' => 'required|string',
        ]);

        // Obtener los campos
        $varOtNumero = $validated['ot_numero'];
        $varOiNumero = $validated['oi_numero'];

        $reporte = new Reporte();
        $varData = file_get_contents($this-> varRuta);
		$htmlStringPrincipal = file_get_contents($this->varRutaStringPrincipal);
		$htmlStringSecundario = file_get_contents($this->varRutaStringSecundario);
		$htmlStringSecundarioSoloMateriales = file_get_contents($this->varRutaStringSecundarioSoloMateriales);
		$htmlStringSecundarioSoloProcesos = file_get_contents($this->varRutaStringSecundarioSoloProcesos);
		$finalHtmlString = file_get_contents($this->varRutaStringFinal);
    
        $result = $reporte->metobtenerCabecera($varOtNumero,$varOiNumero);
		$varOIC =0;
		if ($result && is_array($result)) {
			foreach ($result as $dato) {
				$varClienteNombre = isset($dato['nombre_del_cliente']) ? $dato['nombre_del_cliente'] : $this->varTab;
				$varDescripcionEquipo = isset($dato['descripcion_equipo']) ? $dato['descripcion_equipo'] : $this->varTab;
				$varFecha = isset($dato['oic_fecha']) ? $dato['oic_fecha'] : $this->varTab;
				$varOT = isset($dato['odt_numero']) ? $dato['odt_numero'] : $this->varTab;
				$varOIC = isset($dato['oic_id']) ? $dato['oic_id'] : $this->varTab;

				$varTraNombreOrigen = isset($dato['tra_nombreorigen']) ? $dato['tra_nombreorigen'] : $this->varTab;
				$varTraNombreMaestro = isset($dato['tra_nombremaestro']) ? $dato['tra_nombremaestro'] : $this->varTab;
				$varTraNombreAlmacen = isset($dato['tra_nombrealmacen']) ? $dato['tra_nombrealmacen'] : $this->varTab;

				$varUsuCreacion = isset($dato['usu_usucreacion']) ? $dato['usu_usucreacion'] : $this->varTab;
				$varFecCreacion = isset($dato['usu_feccreacion']) ? $dato['usu_feccreacion'] : $this->varTab;
				$varUsuModificacion = isset($dato['usu_usumodificacion']) ? $dato['usu_usumodificacion'] : $this->varTab;
				$varFecModificacion = isset($dato['usu_fecmodificacion']) ? $dato['usu_fecmodificacion']  : $this->varTab;
			}

			if ($varFecha instanceof DateTime) {
				$varFecha = $varFecha->format('Y-m-d');
			}

			$varPartes = $reporte->metobtenerPartes($varOIC);
			$htmlFilasTotal = "";

			if (is_array($varPartes)) {
				foreach ($varPartes as $varParte) {
					$htmlFilas = "";
					$varParteNombre = isset($varParte['oip_descripcion']) ? $varParte['oip_descripcion'] : $this->varTab;
					$varParteID = isset($varParte['oip_id']) ? $varParte['oip_id'] : $this->varTab;
					$varResultProcesos = $reporte->metobtenerProcesos($varOIC, $varParteID);
					$varResultMateriales = $reporte->metobtenerMateriales($varOIC, $varParteID);
					$varNumProcesos = count($varResultProcesos);
					$varNumMateriales = count($varResultMateriales);
					$varFilasAnadir = max(0, $varNumMateriales - $varNumProcesos);
					$varFilasTotales = max($varNumProcesos, $varNumMateriales);
					$varfilasRestantes = abs($varNumMateriales - $varNumProcesos);
					$varFilasComunes = $varFilasTotales - $varfilasRestantes;

					$ultimoElemento = end($varResultProcesos);
					$nuevoindice = 0;
					for ($i=0; $i < $varFilasComunes; $i++) {
						$varProcesoParte = isset($varResultProcesos[$i]['oip_descripcion']) ? $varResultProcesos[$i]['oip_descripcion'] : $this->varTab;
						$varCodigoProceso = isset($varResultProcesos[$i]['opp_codigo']) ? $varResultProcesos[$i]['opp_codigo'] : $this->varTab;
						$varDescripcionProceso = isset($varResultProcesos[$i]['opp_descripcion']) ? $varResultProcesos[$i]['opp_descripcion'] : $this->varTab;
						$varObservacionProceso = isset($varResultProcesos[$i]['odp_observacion']) ? $varResultProcesos[$i]['odp_observacion'] : $this->varTab;
						$varItem = isset($varResultMateriales[$i]['odm_item']) ? $varResultMateriales[$i]['odm_item'] : $this->varTab;
						$varProDescripcion = isset($varResultMateriales[$i]['pro_descripcion']) ? $varResultMateriales[$i]['pro_descripcion'] : $this->varTab;
						$varCantidad = isset($varResultMateriales[$i]['odm_cantidad']) ? $varResultMateriales[$i]['odm_cantidad'] : $this->varTab;
						$varProObservaciones = isset($varResultMateriales[$i]['odm_observacion']) ? $varResultMateriales[$i]['odm_observacion'] : $this->varTab;
						$htmlFila = "";

						if ($i == 0) {
							$htmlFila = str_replace(
								['{varNumFil}', '{varProcesoParte}', '{varCodigo}', '{varDescripcion}', '{varProObservacion}',
								'{varItem}','{varDescripcionMat}','{varCantidad}','{varMatObservacion}'],
								[$varNumProcesos + $varFilasAnadir, $varProcesoParte, sprintf("%04d", $varCodigoProceso), $varDescripcionProceso, $varObservacionProceso,
								$varItem,$varProDescripcion,$varCantidad,$varProObservaciones],
								$htmlStringPrincipal
							);
						} else {
							$htmlFila = str_replace(
								['{varProcesoParte}', '{varCodigo}', '{varDescripcion}', '{varProObservacion}',
								'{varItem}','{varDescripcionMat}','{varCantidad}','{varMatObservacion}'],
								[$varProcesoParte, sprintf("%04d", $varCodigoProceso), $varDescripcionProceso, $varObservacionProceso,
								$varItem,$varProDescripcion,$varCantidad,$varProObservaciones],
								$htmlStringSecundario
							);
						}
						if ($i == ($varFilasComunes - 1) ){
							if ($varNumProcesos > $varNumMateriales) {
								$htmlFila = str_replace(
									['{rowSpanItm}', '{rowSpanDmt}', '{rowSpanCan}', '{rowSpanObm}'],
									['rowspan='. ($varfilasRestantes + 1) , 'rowspan='. ($varfilasRestantes + 1), 'rowspan='. ($varfilasRestantes + 1), 'rowspan='. ($varfilasRestantes + 1)],
									$htmlFila
								);
							} elseif ($varNumProcesos < $varNumMateriales) {
								$htmlFila = str_replace(
									['{rowSpanCod}', '{rowSpanDes}', '{rowSpanObs}' ],
									['rowspan='. ($varFilasAnadir + 1) , 'rowspan='. ($varFilasAnadir + 1), 'rowspan='. ($varFilasAnadir + 1)],
									$htmlFila
								);
							} 
						}
						$htmlFilas .= $htmlFila;
						$nuevoindice = $i;
					}

					for ($i=0; $i < $varfilasRestantes; $i++) {
						if ($varNumProcesos > $varNumMateriales) {
							$varProcesoParte = isset($varResultProcesos[$i+$nuevoindice]['oip_descripcion']) ? $varResultProcesos[$i+$nuevoindice]['oip_descripcion'] : $this->varTab;
							$varCodigoProceso = isset($varResultProcesos[$i+$nuevoindice]['opp_codigo']) ? $varResultProcesos[$i+$nuevoindice]['opp_codigo'] : $this->varTab;
							$varDescripcionProceso = isset($varResultProcesos[$i+$nuevoindice]['opp_descripcion']) ? $varResultProcesos[$i+$nuevoindice]['opp_descripcion'] : $this->varTab;
							$varObservacionProceso = isset($varResultProcesos[$i+$nuevoindice]['odp_observacion']) ? $varResultProcesos[$i+$nuevoindice]['odp_observacion'] : $this->varTab;
							$htmlFila = "";
							$htmlFila = str_replace(
								['{varProcesoParte}', '{varCodigo}', '{varDescripcion}', '{varProObservacion}'],
								[$varProcesoParte, sprintf("%04d", $varCodigoProceso), $varDescripcionProceso, $varObservacionProceso],
								$htmlStringSecundarioSoloProcesos
							);

						} elseif ($varNumProcesos < $varNumMateriales) {
							$varItem = isset($varResultMateriales[$i+$nuevoindice]['odm_item']) ? $varResultMateriales[$i+$nuevoindice]['odm_item'] : $this->varTab;
							$varProDescripcion = isset($varResultMateriales[$i+$nuevoindice]['pro_descripcion']) ? $varResultMateriales[$i+$nuevoindice]['pro_descripcion'] : $this->varTab;
							$varCantidad = isset($varResultMateriales[$i+$nuevoindice]['odm_cantidad']) ? $varResultMateriales[$i+$nuevoindice]['odm_cantidad'] : $this->varTab;
							$varProObservaciones = isset($varResultMateriales[$i+$nuevoindice]['odm_observacion']) ? $varResultMateriales[$i+$nuevoindice]['odm_observacion'] : $this->varTab;
							$htmlFila = "";
							$htmlFila = str_replace(
								['{varItem}','{varDescripcionMat}','{varCantidad}','{varMatObservacion}'],
								[$varItem,$varProDescripcion,$varCantidad,$varProObservaciones],
								$htmlStringSecundarioSoloMateriales
							);
						}
						$htmlFilas .= $htmlFila;
					}
					$htmlFilas = str_replace(
						['{rowSpanCod}', '{rowSpanDes}', '{rowSpanObs}',
						 '{rowSpanItm}', '{rowSpanDmt}', '{rowSpanCan}', '{rowSpanObm}' ],
						[' ', ' ', ' ', ' ', ' ', ' ', ' '],
						$htmlFilas
					);
					$htmlFilasTotal .= $htmlFilas;
				}

				$varData = str_replace("{varClientenombre}", $varClienteNombre, $varData);
				$varData = str_replace("{varEquipoDescripcion}", $varDescripcionEquipo, $varData);
				$varData = str_replace("{varFecha}", $varFecha, $varData);
				$varData = str_replace("{varOrdenTrabajo}", $varOT, $varData);
				$varData = str_replace("{varTraNombreOrigen}", $varTraNombreOrigen, $varData);
				$varData = str_replace("{varTraNombreMaestro}", $varTraNombreMaestro, $varData);
				$varData = str_replace("{varTraNombreAlmacen}", $varTraNombreAlmacen, $varData);
				$varData .= $htmlFilasTotal . $finalHtmlString;
				$varData = str_replace($this->varProcCampos, $this->varTab, $varData);
				$varData = str_replace($this->varMatCampos, $this->varTab, $varData);
				$varMpdf = new \Mpdf\Mpdf(['orientation' => 'L','tempDir' => $varTempDir]);
				$varMpdf->SetDisplayMode('fullpage');
				$varMpdf->SetHeader($this->fechaHoraActual);
				$varMpdf->WriteHTML($varData);
				$varMpdf->SetFooter('Usuario Creacion: ' . $varUsuCreacion . ' Fecha: ' . $varFecCreacion . ' <br> Usuario Modifica: '. $varUsuModificacion . ' Fecha: '. $varFecModificacion.' | | Pag. {PAGENO}/{nbpg}');
				$varMpdf->Output();
			} else {
				header('Content-Type: application/json');
				http_response_code(500); 
				echo json_encode(['Error' => 'Error al obtener el array de partes']);
			}
		} else {
			header('Content-Type: application/json');
			http_response_code(500); 
			echo json_encode(['Error' => 'Error al obtener el array de cabecera']);
		}
	}
}
