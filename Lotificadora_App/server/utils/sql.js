import { poolConnect, pool } from "../config/db.js";

const sanitizeSqlName = (name) => {
  if (typeof name !== "string" || !/^[A-Za-z0-9_]+$/.test(name)) {
    throw new Error("Invalid SQL identifier");
  }
  return name;
};

export const executeProcedure = async (procedureName, params = {}) => {
  await poolConnect;
  const request = pool.request();

  Object.entries(params).forEach(([name, value]) => {
    if (value !== undefined) request.input(name, value);
  });

  return request.execute(sanitizeSqlName(procedureName));
};

export const querySql = async (sql, params = {}) => {
  await poolConnect;
  const request = pool.request();

  Object.entries(params).forEach(([name, value]) => {
    if (value !== undefined) request.input(name, value);
  });

  return request.query(sql);
};

export const buildViewQuery = (viewName, filters = {}) => {
  const safeView = sanitizeSqlName(viewName);
  const filterKeys = Object.keys(filters).filter((key) => /^[A-Za-z0-9_]+$/.test(key));
  let sql = `SELECT * FROM ${safeView}`;

  if (filterKeys.length) {
    const conditions = filterKeys.map((key) => `[${key}] = @${key}`).join(" AND ");
    sql += ` WHERE ${conditions}`;
  }

  return { sql, params: Object.fromEntries(filterKeys.map((key) => [key, filters[key]])) };
};