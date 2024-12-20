const express = require("express");
const Database = require("better-sqlite3");
const bodyParser = require("body-parser");
const app = express();
const port = 3000;

// Configurar middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// Conectar a la base de datos
const db = new Database("./database/database.sqlite");

// Ruta principal que muestra todas las tablas y sus datos
app.get("/", (req, res) => {
  const tablas = ["Clientes", "Vehiculos", "Alquiler", "Incidente"];

  const contenidoTablas = tablas
    .map((tabla) => {
      // Obtener los datos de la tabla
      const stmt = db.prepare(`SELECT * FROM ${tabla}`);
      const datos = stmt.all();

      // Generar las filas y cabeceras de la tabla HTML
      const filas = datos
        .map(
          (fila) =>
            `<tr>${Object.entries(fila)
              .map(([columna, valor]) => `<td>${valor}</td>`)
              .join("")}
              <td>
                <button onclick="editarFila('${tabla}', ${JSON.stringify(
              fila
            ).replace(/"/g, "&quot;")})">Editar</button>
                <button onclick="eliminarFila('${tabla}', '${
              fila.id
            }')">Eliminar</button>
              </td>
            </tr>`
        )
        .join("");

      const cabeceras = datos.length
        ? `<tr>${Object.keys(datos[0])
            .map((col) => `<th>${col}</th>`)
            .join("")}<th>Acciones</th></tr>`
        : "<tr><th>No hay datos</th></tr>";

      // Crear la tabla HTML para esta tabla específica
      return `
        <h2>${tabla}</h2>
        <table border="1">
          ${cabeceras}
          ${filas}
        </table>
        <br>
        <button onclick="insertarFila('${tabla}')">Añadir Datos</button>
        <br><br>
      `;
    })
    .join("");

  // Enviar la respuesta con todas las tablas
  res.send(`
    <html>
      <body>
        <h1>Tablas de la Base de Datos</h1>
        ${contenidoTablas}
        <script>
          function editarFila(tabla, fila) {
            const nuevosValores = prompt("Introduce nuevos valores separados por comas (formato: columna1=valor1, columna2=valor2):");
            if (nuevosValores) {
              fetch('/editar', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ tabla, fila, nuevosValores })
              })
              .then(() => location.reload())
              .catch(console.error);
            }
          }

          function eliminarFila(tabla, id) {
            if (confirm("¿Seguro que quieres eliminar este registro?")) {
              fetch('/eliminar', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ tabla, id })
              })
              .then(() => location.reload())
              .catch(console.error);
            }
          }

          function insertarFila(tabla) {
            const nuevosValores = prompt("Introduce los valores para la nueva fila separados por comas (formato: columna1=valor1, columna2=valor2):");
            if (nuevosValores) {
              fetch('/insertar', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ tabla, nuevosValores })
              })
              .then(() => location.reload())
              .catch(console.error);
            }
          }
        </script>
      </body>
    </html>
  `);
});

// Endpoint para editar un registro
app.post("/editar", (req, res) => {
  const { tabla, fila, nuevosValores } = req.body;

  // Crear la consulta UPDATE dinámicamente
  const updates = nuevosValores
    .split(",")
    .map((val) => val.trim().split("="))
    .map(([columna, valor]) => `${columna} = '${valor}'`)
    .join(", ");
  const stmt = db.prepare(`UPDATE ${tabla} SET ${updates} WHERE id = ?`);
  stmt.run(fila.id);

  res.send("Fila actualizada correctamente.");
});

// Endpoint para eliminar un registro
app.post("/eliminar", (req, res) => {
  const { tabla, id } = req.body;

  // Crear la consulta DELETE
  const stmt = db.prepare(`DELETE FROM ${tabla} WHERE id = ?`);
  stmt.run(id);

  res.send("Fila eliminada correctamente.");
});

// Endpoint para insertar un registro
app.post("/insertar", (req, res) => {
  const { tabla, nuevosValores } = req.body;

  // Crear la consulta INSERT dinámicamente
  const columnas = nuevosValores
    .split(",")
    .map((val) => val.trim().split("=")[0])
    .join(", ");
  const valores = nuevosValores
    .split(",")
    .map((val) => `'${val.trim().split("=")[1]}'`)
    .join(", ");
  const stmt = db.prepare(
    `INSERT INTO ${tabla} (${columnas}) VALUES (${valores})`
  );
  stmt.run();

  res.send("Fila insertada correctamente.");
});

// Iniciar el servidor
app.listen(port, () => {
  console.log(`Servidor corriendo en http://localhost:${port}`);
});
