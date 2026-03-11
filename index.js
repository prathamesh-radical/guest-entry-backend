import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import serveStatic from "serve-static";
import db from "./db/db.js";
import AuthAdminRoute from "./routes/AdminAuth.js";
import GetRoutes from "./routes/GetRoute.js";
import VisitorsRoute from "./routes/VisitorsRoute.js";

const STATIC_PATH =
    process.env.NODE_ENV === "production"
        ? `${process.cwd()}/frontend/dist`
        : `${process.cwd()}/frontend/`;

dotenv.config();

const app = express();
const PORT = parseInt(process.env.BACKEND_PORT || process.env.PORT || "3000", 10);

app.use(cors());
app.use(express.json());

db.getConnection((err) => {
    if (err) {
        console.error('Error connecting to MySQL:', err);
        return;
    }
    console.log('Connected to the MySQL database!');
});

app.get("/", (req, res) => {
    res.send("Hello Guest Entry");
});

app.use("/api/auth", AuthAdminRoute);
app.use("/api", VisitorsRoute);
app.use("/api", GetRoutes);

app.use(serveStatic(STATIC_PATH, { index: false }));

app.listen(PORT, () => {
    console.log(`Native app listening on port ${PORT}`);
});