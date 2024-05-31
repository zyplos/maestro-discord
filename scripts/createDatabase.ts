import { Database } from "bun:sqlite";

const db = Database.open("db.sqlite");

db.run(`
  CREATE TABLE servers (
    id TEXT PRIMARY KEY NOT NULL,
    log_channel TEXT NOT NULL
  );
`);

db.close();
