const express = require("express");
const cors = require("cors");
const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "../../.env") });

const loyverseRoutes = require("./routes/loyverseRoutes");

const app = express();
const port = Number(process.env.PORT) || 4000;
const frontendDistPath = path.resolve(__dirname, "../../frontend/dist");

app.use(
  cors({
    origin: true
  })
);
app.use(express.json({ limit: "15mb" }));

app.use("/api", loyverseRoutes);

app.get("/api/health", (_req, res) => {
  res.json({ ok: true });
});

app.use(express.static(frontendDistPath));

app.get(/^(?!\/api).*/, (req, res) => {
  res.sendFile(path.join(frontendDistPath, "index.html"), (error) => {
    if (error) {
      res.status(404).json({
        message:
          "Frontend no compilado todavia. Ejecuta el frontend en desarrollo o genera frontend/dist."
      });
    }
  });
});

if (require.main === module) {
  app.listen(port, () => {
    console.log(`Backend iniciado en puerto ${port}`);
  });
}

module.exports = app;
