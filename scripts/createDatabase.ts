import { Database } from "bun:sqlite";

const db = Database.open("db.sqlite");

db.run(`
  CREATE TABLE servers (
    id TEXT PRIMARY KEY,
    log_channel TEXT
  );
`);

db.close();
