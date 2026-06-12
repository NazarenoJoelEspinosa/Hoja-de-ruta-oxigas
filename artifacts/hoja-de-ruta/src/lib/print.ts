export const printShift = (
  title: string,
  dateStr: string,
  orders: any[],
  generadoPor?: string
) => {
  const content = `
<!DOCTYPE html>
    <html lang="es">
    <head>
      <meta charset="UTF-8">
      <title>Hoja de Ruta - ☀ Mañana - 12/06/26</title>
      <style>
        @page { size: A4 landscape; margin: 8mm; }
        * { box-sizing: border-box; }
        body {
          font-family: Arial, Helvetica, sans-serif;
          font-size: 10.5px;
          color: #111;
          margin: 0;
        }
        .hoja { border: 1.5px solid #000; }
        table { width: 100%; border-collapse: collapse; }
        td, th { border: 1px solid #000; padding: 3px 5px; vertical-align: middle; }

        /* Encabezado */
        .encabezado td { border: none; padding: 6px 10px; vertical-align: top; }
        .encabezado { border-bottom: 1.5px solid #000; }
        .encabezado .col-izq { width: 60%; border-right: 1.5px solid #000; }
        .renglon { margin-top: 6px; font-size: 12px; }
        .renglon:first-child { margin-top: 0; }
        .renglon b { font-weight: bold; }
        .marcado {
          display: inline-block;
          font-weight: bold;
          text-decoration: underline;
          padding: 0 3px;
          border: 1.5px solid #000;
          border-radius: 3px;
        }
        .linea-fecha { display: inline-block; min-width: 24px; border-bottom: 1px solid #000; text-align: center; font-weight: bold; }

        /* Tabla principal de clientes */
        .tabla-clientes th {
          background: #e8e8e8;
          font-size: 10px;
          text-transform: uppercase;
          text-align: center;
          font-weight: bold;
        }
        .tabla-clientes td.cliente { font-weight: bold; width: 16%; }
        .tabla-clientes td.obs { width: 30%; }
        .tabla-clientes td.centro { text-align: center; width: 8%; }
        .tabla-clientes td.blanco { width: 7%; }
        .sin-pedido { color: #888; font-style: italic; }
        .fijo { color: #b45309; }

        /* Tablas de control */
        .controles { display: flex; }
        .controles .bloque { flex: 1; }
        .controles .bloque:first-child { border-right: 1.5px solid #000; }
        .controles table { table-layout: fixed; }
        .controles th, .controles td.etiqueta {
          background: #e8e8e8;
          font-weight: bold;
          font-size: 9.5px;
          text-transform: uppercase;
        }
        .controles td.etiqueta { text-align: left; }
        .controles th { text-align: center; }
        .controles td.blanco { height: 16px; }
        .controles td.etiqueta { width: 34%; }

        .total-row td { font-weight: bold; background: #f3f3f3; }

        /* Tubos prestados / otros / totales */
        .pie-tabla td.etiqueta {
          background: #e8e8e8;
          font-weight: bold;
          font-size: 9.5px;
          text-transform: uppercase;
          width: 20%;
        }
        .pie-tabla td.blanco { height: 18px; }

        .disclaimer {
          font-size: 8px;
          text-align: center;
          padding: 4px 6px;
          border-top: 1.5px solid #000;
          color: #333;
        }

        .footer-generado {
          font-size: 9px;
          text-align: right;
          padding: 3px 8px 0;
          color: #555;
        }

        @media print {
          body { padding: 0; }
        }
      </style>
    </head>
    <body>
      <div class="hoja">
        <table class="encabezado">
          <tr>
            <td class="col-izq">
              <div class="renglon"><b>DÍA:</b> LUN / MAR / MIÉ / JUE / <span class="marcado">VIE</span> / SÁB</div>
              <div class="renglon"><b>TURNO:</b> <span class="marcado">MAÑANA</span> / Tarde</div>
            </td>
            <td>
              <div class="renglon"><b>EMPLEADO:</b> José</div>
              <div class="renglon"><b>FECHA:</b>
                <span class="linea-fecha">12</span> /
                <span class="linea-fecha">06</span> /
                <span class="linea-fecha">26</span>
              </div>
            </td>
          </tr>
        </table>

        <table class="tabla-clientes">
          <thead>
            <tr>
              <th>Cliente</th>
              <th>Observación</th>
              <th>Domicilio</th>
              <th>Horario</th>
              <th>Cta. Cte.</th>
              <th>Efectivo</th>
              <th>Cheque</th>
            </tr>
          </thead>
          <tbody>
            
        <tr>
          <td class="cliente">MISSIO MARIANO</td>
          <td class="obs">2x Argón — pedido especial</td>
          <td>ESPORA 922 ITUZAINGO</td>
          <td class="centro">9 a 12hs</td>
          <td class="blanco"></td>
          <td class="blanco"></td>
          <td class="blanco"></td>
        </tr>
        <tr>
          <td class="cliente">CENTURION WALTER</td>
          <td class="obs">2x Argón + 1x Garrafa 15 kg — cobrar</td>
          <td>QUINTANA 3468 ITUZAINGO</td>
          <td class="centro"></td>
          <td class="blanco"></td>
          <td class="blanco"></td>
          <td class="blanco"></td>
        </tr>
        <tr>
          <td class="cliente"><span class="fijo" title="Cliente del recorrido fijo">★</span> FAB Y COM. DE HERRAJES</td>
          <td class="obs"><span class="sin-pedido">Sin pedido</span></td>
          <td>PANAMA 5945 M CORONADO</td>
          <td class="centro"></td>
          <td class="blanco"></td>
          <td class="blanco"></td>
          <td class="blanco"></td>
        </tr>
        <tr>
          <td class="cliente"><span class="fijo" title="Cliente del recorrido fijo">★</span> FIGUEREDO</td>
          <td class="obs">3x Garrafa 45 kg</td>
          <td>BETHARRAN 1210 V. BOSCH</td>
          <td class="centro"></td>
          <td class="blanco"></td>
          <td class="blanco"></td>
          <td class="blanco"></td>
        </tr>
            
        <tr>
          <td class="cliente">&nbsp;</td>
          <td class="obs">&nbsp;</td>
          <td>&nbsp;</td>
          <td class="centro">&nbsp;</td>
          <td class="blanco"></td>
          <td class="blanco"></td>
          <td class="blanco"></td>
        </tr>
        <tr>
          <td class="cliente">&nbsp;</td>
          <td class="obs">&nbsp;</td>
          <td>&nbsp;</td>
          <td class="centro">&nbsp;</td>
          <td class="blanco"></td>
          <td class="blanco"></td>
          <td class="blanco"></td>
        </tr>
        <tr>
          <td class="cliente">&nbsp;</td>
          <td class="obs">&nbsp;</td>
          <td>&nbsp;</td>
          <td class="centro">&nbsp;</td>
          <td class="blanco"></td>
          <td class="blanco"></td>
          <td class="blanco"></td>
        </tr>
        <tr>
          <td class="cliente">&nbsp;</td>
          <td class="obs">&nbsp;</td>
          <td>&nbsp;</td>
          <td class="centro">&nbsp;</td>
          <td class="blanco"></td>
          <td class="blanco"></td>
          <td class="blanco"></td>
        </tr>
          </tbody>
        </table>

        <div class="controles">
          <div class="bloque">
            <table>
              <thead>
                <tr>
                  <th rowspan="2" style="width:34%">Gases</th>
                  <th colspan="2">Salida</th>
                  <th colspan="2">Regreso</th>
                </tr>
                <tr>
                  <th>Vacíos</th>
                  <th>Llenos</th>
                  <th>Vacíos</th>
                  <th>Llenos</th>
                </tr>
              </thead>
              <tbody>
                
      <tr>
        <td class="etiqueta">OXÍGENO</td>
        <td class="blanco"></td>
        <td class="blanco"></td>
        <td class="blanco"></td>
        <td class="blanco"></td>
      </tr>
      <tr>
        <td class="etiqueta">ACETILENO</td>
        <td class="blanco"></td>
        <td class="blanco"></td>
        <td class="blanco"></td>
        <td class="blanco"></td>
      </tr>
      <tr>
        <td class="etiqueta">NITRÓGENO</td>
        <td class="blanco"></td>
        <td class="blanco"></td>
        <td class="blanco"></td>
        <td class="blanco"></td>
      </tr>
      <tr>
        <td class="etiqueta">CO2</td>
        <td class="blanco"></td>
        <td class="blanco"></td>
        <td class="blanco"></td>
        <td class="blanco"></td>
      </tr>
      <tr>
        <td class="etiqueta">MIX 20</td>
        <td class="blanco"></td>
        <td class="blanco"></td>
        <td class="blanco"></td>
        <td class="blanco"></td>
      </tr>
      <tr>
        <td class="etiqueta">ARGÓN</td>
        <td class="blanco"></td>
        <td class="blanco"></td>
        <td class="blanco"></td>
        <td class="blanco"></td>
      </tr>
      <tr>
        <td class="etiqueta">MIX 310</td>
        <td class="blanco"></td>
        <td class="blanco"></td>
        <td class="blanco"></td>
        <td class="blanco"></td>
      </tr>
      <tr>
        <td class="etiqueta">R. ACINDAR 09</td>
        <td class="blanco"></td>
        <td class="blanco"></td>
        <td class="blanco"></td>
        <td class="blanco"></td>
      </tr>
      <tr>
        <td class="etiqueta">R. CONARCO 09</td>
        <td class="blanco"></td>
        <td class="blanco"></td>
        <td class="blanco"></td>
        <td class="blanco"></td>
      </tr>
      <tr>
        <td class="etiqueta">OTROS</td>
        <td class="blanco"></td>
        <td class="blanco"></td>
        <td class="blanco"></td>
        <td class="blanco"></td>
      </tr>
                <tr class="total-row">
                  <td class="etiqueta">TOTALES</td>
                  <td class="blanco"></td>
                  <td class="blanco"></td>
                  <td class="blanco"></td>
                  <td class="blanco"></td>
                </tr>
              </tbody>
            </table>
          </div>
          <div class="bloque">
            <table>
              <thead>
                <tr>
                  <th style="width:34%">Garrafas</th>
                  <th>Llenas</th>
                  <th>Vacías</th>
                  <th>Dev. Llenas</th>
                </tr>
              </thead>
              <tbody>
                
      <tr>
        <td class="etiqueta">10 KG</td>
        <td class="blanco"></td>
        <td class="blanco"></td>
        <td class="blanco"></td>
      </tr>
      <tr>
        <td class="etiqueta">10 KG YPF</td>
        <td class="blanco"></td>
        <td class="blanco"></td>
        <td class="blanco"></td>
      </tr>
      <tr>
        <td class="etiqueta">15 KG</td>
        <td class="blanco"></td>
        <td class="blanco"></td>
        <td class="blanco"></td>
      </tr>
      <tr>
        <td class="etiqueta">15 KG CLARK</td>
        <td class="blanco"></td>
        <td class="blanco"></td>
        <td class="blanco"></td>
      </tr>
      <tr>
        <td class="etiqueta">45 KG</td>
        <td class="blanco"></td>
        <td class="blanco"></td>
        <td class="blanco"></td>
      </tr>
                <tr class="total-row">
                  <td class="etiqueta">TOTAL</td>
                  <td class="blanco"></td>
                  <td class="blanco"></td>
                  <td class="blanco"></td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <table class="pie-tabla">
          <tr>
            <td class="etiqueta">Tubos prestados / devolución</td>
            <td class="blanco"></td>
            <td class="etiqueta" style="width:12%">Cliente</td>
            <td class="blanco"></td>
          </tr>
          <tr>
            <td class="etiqueta">Otros</td>
            <td class="blanco" colspan="3"></td>
          </tr>
          <tr>
            <td class="etiqueta">Totales</td>
            <td class="blanco" colspan="3"></td>
          </tr>
        </table>

        <div class="disclaimer">
          Transporte Material - Clase 2 - Clase 5 - Div. 51 — Recibí instrucciones de Seguridad Resolución S/T. 233/86
        </div>
      </div>
      <div class="footer-generado">Generado por: <strong>José</strong></div>
      <script>
        window.onload = () => { window.print(); window.close(); }
      </script>
    </body>
    </html>
  `;
  const win = window.open('', '_blank');
  if (win) {
    win.document.write(content);
    win.document.close();
  }
};
