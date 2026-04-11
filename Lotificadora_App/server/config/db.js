import dotenv from "dotenv";
import mssql from "mssql";

dotenv.config();

const dbConfig = {
  user: process.env.DB_USER ?? "sa",
  password: process.env.DB_PASSWORD ?? "",
  server: process.env.DB_HOST ?? "localhost",
  database: process.env.DB_NAME ?? "Lotificadora",
  port: Number(process.env.DB_PORT ?? 1433),
  options: {
    encrypt: process.env.DB_ENCRYPT === "true",
    trustServerCertificate: process.env.DB_TRUST_CERT === "true",
  },
};

const pool = new mssql.ConnectionPool(dbConfig);
const poolConnect = pool.connect();

poolConnect
  .then(() => console.log("Database connected"))
  .catch((err) => console.error("DB connection failed:", err));

export { pool, poolConnect };