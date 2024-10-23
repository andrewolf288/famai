<!DOCTYPE html PUBLIC "-//W3C//DTD HTML 4.01//EN" "http://www.w3.org/TR/html4/strict.dtd">
<html>

<head>
  <meta http-equiv="Content-Type" content="text/html; charset=utf-8">
</head>
<style>

  .maintable {
    width: 100%;
    font-family: serif;
    border-collapse: collapse;
  }

  .maintable tr {
    padding: 0px;
  }

  .maintable td {
    border: 0.5mm solid #888888;

    text-align: center;
    font-size: 14pt;
    padding: 0px;
    margin: 0px;
  }

  .maintable th {
    border: 0.5mm solid #888888;
    text-align: center;
    font-size: 14pt;
    padding: 0px;
    margin: 0px;
  }

  .maintable .lefty-align {
    text-align: left;
  }

  .generaltable {
    width: 100%;
    font-family: serif;
    border-collapse: collapse;
  }

  .generaltable tr {
    padding: 0px;
  }

  .generaltable td {
    border: 0.5mm solid #888888;
    text-align: center;
    font-size: 8pt;
    padding-left: 2px;
    margin: 0px;
  }

  .generaltable th {
    border: 0.5mm solid #888888;
    text-align: center;
    font-size: 8pt;
    padding: 0px;
    margin: 0px;
  }

  .generaltable .lefty-align {
    text-align: left;
  }

  .secondarytable {
    width: 100%;
    font-family: serif;
    border-collapse: collapse;
  }

  .secondarytable tr {
    padding: 0px;
  }

  .secondarytable td {
    border: 0.5mm solid #888888;
    font-size: 8pt;
    padding: 0px;
    margin: 0px;
  }

  .secondarytable th {
    border: 0.5mm solid #888888;
    text-align: center;
    font-size: 8pt;
    padding: 0px;
    margin: 0px;
  }

  .secondarytable .sub-header {
    text-align: center;
    font-weight: bold;
  }

  .secondarytable .sub-header-numeric {
    text-align: center;
  }

  .generaltable tr td>table {
    height: 100%;
  }
</style>

<body>
  <table class="maintable">
    <tbody>
      <tr>
        <td width="30%"><img src="{varLogo}" alt="Famai" style="max-width: 61mm; max-height: 34mm;"></td>
        <td width="50%"><strong>ORDEN INTERNA</strong></td>
        <td width="20%">
          <table class="secondarytable">
            <thead>
              <tr>
                <th>PR-F-04</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td class="lefty-align">Versión : 02</td>
              </tr>
              <tr>
                <td class="lefty-align">Fecha : 27/09/2024</td>
              </tr>
              <tr>
                <td class="lefty-align">Revisado: JPR</td>
              </tr>
              <tr>
                <td class="lefty-align">Aprobado: GG</td>
              </tr>
            </tbody>
          </table>
        </td>
      </tr>
      <tr>
        <td colspan="3">

        </td>

      </tr>
      <tr>

      </tr>
    </tbody>
  </table>
  <table class="generaltable" style="margin-top:10px;">
    <tr>
      <td class="lefty-align" width="20%"><strong>CLIENTE:</strong></td>
      <td class="lefty-align" width="45%">{varClientenombre}</td>
      <td class="lefty-align" width="25%"><strong>FECHA DE EVALUACIÓN:</strong></td>
      <td class="lefty-align" width="10%">{varFecha}</td>
    </tr>
    <tr>
      <td class="lefty-align" width="20%"><strong>EQUIPO:</strong></td>
      <td class="lefty-align" width="45%">{varEquipoDescripcion}</td>
      <td class="lefty-align" width="25%"><strong>FECHA DE APROBACIÓN:</strong></td>
      <td class="lefty-align" width="10%">{varFechaAprobacion}</td>
    </tr>
    <tr>
      <td class="lefty-align" width="20%"><strong>COMPONENTE</strong></td>
      <td class="lefty-align" width="45%">{varComponente}</td>
      <td class="lefty-align" width="25%"><strong>FECHA DE ENTREGA LOGÍSTICA:</strong></td>
      <td class="lefty-align" width="10%">{varFechaEntregaEstimada}</td>
    </tr>
    <tr>
      <td class="lefty-align" width="20%"><strong>OT:</strong></td>
      <td class="lefty-align" width="45%">{varOrdenTrabajo}</td>
      <td class="lefty-align" width="25%"> <strong>FECHA DE ENTREGA PRODUCCIÓN:</strong></td>
      <td class="lefty-align" width="10%">{varFechaEntregaProduccion}</td>
    </tr>
  </table>
  <table class="generaltable" style="margin-top:10px;">
    <tr>
      <th colspan="6">{varArea}</th>
    </tr>
    <tr>
      <td width="10%"><strong>Respon. ORIGEN</strong></td>
      <td width="23%">{varTraNombreOrigen}</td>
      <td width="10%"><strong>Respon. MAES</strong></td>
      <td width="23%">{varTraNombreMaestro}</td>
      <td width="10%"><strong>Respon. ALMA</strong></td>
      <td>{varTraNombreAlmacen}</td>
    </tr>
  </table>
  <table class="secondarytable" style="margin-top:10px;">
    <tr>
      <th rowspan="2" width="6%"></th>
      <th colspan="3">ACTIVIDADES A REALIZAR</th>
      <th colspan="4">PEDIDO DE MATERIALES</th>
    </tr>
    <tr>
      <td width="4%" class="sub-header">COD.</td>
      <td width="15%" class="sub-header">DESCRIPCIÓN</td>
      <td width="20%" class="sub-header">OBSERVACIONES</td>
      <td width="8%" class="sub-header">COD.</td>
      <td width="25%" class="sub-header">DESCRIPCION</td>
      <td width="5%" class="sub-header">CANT.</td>
      <td class="sub-header">OBSERVACION</td>
    </tr>