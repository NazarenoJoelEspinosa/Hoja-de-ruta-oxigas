let _logoCache: string | null | undefined = undefined;

async function getLogo(): Promise<string | null> {
  if (_logoCache !== undefined) return _logoCache;
  try {
    const res = await fetch(window.location.origin + "/logo.png");
    if (!res.ok) { _logoCache = null; return null; }
    const blob = await res.blob();
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => { _logoCache = reader.result as string; resolve(_logoCache!); };
      reader.onerror = () => { _logoCache = null; resolve(null); };
      reader.readAsDataURL(blob);
    });
  } catch {
    _logoCache = null;
    return null;
  }
}

export const printShift = async (
  title: string,
  dateStr: string,
  orders: any[],
  generadoPor?: string
) => {
  const logoDataUrl = await getLogo();

  const isMañana = title.toLowerCase().includes("mañana");

  const DIAS_SEMANA = ["DOM", "LUN", "MAR", "MIÉ", "JUE", "VIE", "SÁB"];
  const DIAS_FILA = ["LUN", "MAR", "MIÉ", "JUE", "VIE", "SÁB"];

  let dayOfWeek = "";
  let dd = "", mm = "", yy = "";

  const parts = dateStr.split("/");
  if (parts.length === 3) {
    dd = parts[0].padStart(2, "0");
    mm = parts[1].padStart(2, "0");
    yy = parts[2].length === 4 ? parts[2].slice(2) : parts[2];
    const fullYear = parts[2].length === 2 ? 2000 + parseInt(parts[2]) : parseInt(parts[2]);
    const date = new Date(fullYear, parseInt(mm) - 1, parseInt(dd));
    dayOfWeek = DIAS_SEMANA[date.getDay()];
  }

  const diasHtml = DIAS_FILA.map((d) =>
    d === dayOfWeek ? `<span class="marcado">${d}</span>` : d
  ).join(" / ");

  const repartidor = orders.length > 0 ? orders[0].rep : (generadoPor ?? "");

  const GAS_UNIDADES: Record<string, string> = {
    "Oxígeno": "m³",
    "Argón": "m³",
    "Mix20": "m³",
    "Mix310": "m³",
    "Nitrógeno": "m³",
    "Acetileno": "kg",
    "Gas Carbónico": "kg",
  };

  const formatItemImpresion = (i: any): string => {
    if (i.tipo === "garrafa") return `${i.cant}x ${i.prod}`;
    const unidad = GAS_UNIDADES[i.prod] ?? "";
    const base = `${i.cant}x ${i.prod}`;
    if (i.tamano === null || i.tamano === undefined || i.tamano === "") return base;
    return `${base} (${i.tamano}${unidad ? " " + unidad : ""} c/u)`;
  };

  const buildObs = (o: any): string => {
    const partes: string[] = [];
    if (o.items && o.items.length > 0) {
      partes.push(o.items.map((i: any) => formatItemImpresion(i)).join(" + "));
    }
    const extras: string[] = [];
    if (o.tienePedido) extras.push("pedido especial");
    if (o.tieneGarrafa && o.garrafaEstado === "pendiente") extras.push("cobrar");
    if (o.nota) extras.push(o.nota);

    if (partes.length === 0 && extras.length === 0)
      return '<span class="sin-pedido">Sin pedido</span>';

    const obs = partes.join(" + ");
    if (extras.length === 0) return obs;
    return (obs ? obs + " — " : "") + extras.join(" — ");
  };

  const orderRows = orders
    .map(
      (o) => `
      <tr>
        <td class="cliente">${o.nombre.toUpperCase()}</td>
        <td class="obs">${buildObs(o)}</td>
        <td>${(o.dir || "").toUpperCase()}</td>
        <td class="centro">${o.horarioCliente || ""}</td>
        <td class="blanco"></td>
        <td class="blanco"></td>
        <td class="blanco"></td>
      </tr>`
    )
    .join("");

  // Antes se dejaban 6 renglones en blanco fijos abajo de los clientes; eso
  // era lo que hacía que con muchos clientes el listado se pasara a una
  // segunda hoja. Se deja solo un par para completar a mano.
  const EMPTY_ROWS = 2;
  const emptyRows = Array(EMPTY_ROWS)
    .fill(0)
    .map(
      () => `
      <tr>
        <td class="cliente">&nbsp;</td>
        <td class="obs">&nbsp;</td>
        <td>&nbsp;</td>
        <td class="centro">&nbsp;</td>
        <td class="blanco"></td>
        <td class="blanco"></td>
        <td class="blanco"></td>
      </tr>`
    )
    .join("");

  // Con muchos clientes el listado puede pasarse de una hoja A4. Para que
  // siempre entre todo en una sola hoja, se achica letra y relleno de filas
  // a medida que hay más pedidos.
  const totalFilas = orders.length + EMPTY_ROWS;
  let bodyFontSize = 10.5;
  let rowPaddingV = 3;
  if (totalFilas > 22) {
    bodyFontSize = 8.3;
    rowPaddingV = 1.5;
  } else if (totalFilas > 16) {
    bodyFontSize = 9.3;
    rowPaddingV = 2;
  } else if (totalFilas > 12) {
    bodyFontSize = 10;
    rowPaddingV = 2.5;
  }

  const gases = [
    "OXÍGENO", "ACETILENO", "NITRÓGENO", "CO2",
    "MIX 20", "ARGÓN", "MIX 310", "R. ACINDAR 09", "R. CONARCO 09", "OTROS",
  ];
  const gasRows = gases
    .map(
      (g) => `
      <tr>
        <td class="etiqueta">${g}</td>
        <td class="blanco"></td>
        <td class="blanco"></td>
        <td class="blanco"></td>
        <td class="blanco"></td>
      </tr>`
    )
    .join("");

  const garrafaTypes = ["10 KG", "10 KG YPF", "15 KG", "15 KG CLARK", "45 KG"];
  const garrafaRows = garrafaTypes
    .map(
      (g) => `
      <tr>
        <td class="etiqueta">${g}</td>
        <td class="blanco"></td>
        <td class="blanco"></td>
        <td class="blanco"></td>
      </tr>`
    )
    .join("");

  const turnoMañanaHtml = isMañana
    ? `<span class="marcado">MAÑANA</span> / Tarde`
    : `MAÑANA / <span class="marcado">TARDE</span>`;

  const logoHtml = logoDataUrl
    ? `<img src="${logoDataUrl}" alt="OXI-GAS" style="height:52px; display:block;" />`
    : `<span style="font-size:18px;font-weight:bold;">OXI-GAS</span>`;

  const content = `
    <!DOCTYPE html>
    <html lang="es">
    <head>
      <meta charset="UTF-8">
      <title>Hoja de Ruta - ${isMañana ? "Mañana" : "Tarde"} - ${dd}/${mm}/${yy}</title>
      <style>
        @page { size: A4 landscape; margin: 8mm; }
        * { box-sizing: border-box; }
        body {
          font-family: Arial, Helvetica, sans-serif;
          font-size: ${bodyFontSize}px;
          color: #111;
          margin: 0;
        }
        .hoja { border: 1.5px solid #000; }
        table { width: 100%; border-collapse: collapse; }
        td, th { border: 1px solid #000; padding: ${rowPaddingV}px 5px; vertical-align: middle; }

        .encabezado td { border: none; padding: 6px 10px; vertical-align: middle; }
        .encabezado { border-bottom: 1.5px solid #000; }
        .encabezado .col-logo { width: 14%; border-right: 1.5px solid #000; text-align: center; padding: 6px; }
        .encabezado .col-izq { width: 50%; border-right: 1.5px solid #000; }
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
        .linea-fecha {
          display: inline-block;
          min-width: 24px;
          border-bottom: 1px solid #000;
          text-align: center;
          font-weight: bold;
        }

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

        .pie-tabla { margin-top: -1.5px; }
        .pie-tabla td.etiqueta {
          background: #e8e8e8;
          font-weight: bold;
          font-size: 9.5px;
          text-transform: uppercase;
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
            <td class="col-logo">${logoHtml}</td>
            <td class="col-izq">
              <div class="renglon"><b>DÍA:</b> ${diasHtml}</div>
              <div class="renglon"><b>TURNO:</b> ${turnoMañanaHtml}</div>
            </td>
            <td>
              <div class="renglon"><b>EMPLEADO:</b> ${repartidor}</div>
              <div class="renglon"><b>FECHA:</b>
                <span class="linea-fecha">${dd}</span> /
                <span class="linea-fecha">${mm}</span> /
                <span class="linea-fecha">${yy}</span>
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
            ${orderRows}
            ${emptyRows}
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
                ${gasRows}
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
                ${garrafaRows}
                <tr class="total-row">
                  <td class="etiqueta">TOTAL</td>
                  <td class="blanco"></td>
                  <td class="blanco"></td>
                  <td class="blanco"></td>
                </tr>
              </tbody>
            </table>
            <table class="pie-tabla">
              <tr>
                <td class="etiqueta" style="width:38%">Tubos prestados / devolución</td>
                <td class="blanco"></td>
                <td class="etiqueta" style="width:18%">Cliente</td>
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
          </div>
        </div>

        <div class="disclaimer">
          Transporte Material - Clase 2 - Clase 5 - Div. 51 — Recibí instrucciones de Seguridad Resolución S/T. 233/86
        </div>
      </div>
      ${generadoPor ? `<div class="footer-generado">Generado por: <strong>${generadoPor}</strong></div>` : ""}
      <script>
        window.onload = () => { window.print(); window.close(); }
      </script>
    </body>
    </html>
  `;

  const win = window.open("", "_blank");
  if (win) {
    win.document.write(content);
    win.document.close();
  }
};
