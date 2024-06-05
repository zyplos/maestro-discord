import { Database } from "bun:sqlite";

export default class DatabaseManager {
  db: Database;

  constructor() {
    this.db = new Database("db.sqlite");
    this.db.exec("PRAGMA journal_mode = WAL;");
  }

  query(sql: string) {
    return this.db.query(sql);
  }

  close() {
    this.db.close(false);
  }

  updateServer(serverId: string, logChannel: string) {
    const insertServer = this.db.prepare(`
      INSERT INTO servers (id, log_channel)
      VALUES($id, $log_channel) 
      ON CONFLICT(id) 
      DO UPDATE SET log_channel=excluded.log_channel;
    `);

    insertServer.run(serverId, logChannel);
  }

  isServerConfigured(serverId: string) {
    const query = this.db.prepare(`
      SELECT EXISTS(SELECT 1 FROM servers WHERE id = $id) as isConfigured;
    `);

    const { isConfigured } = query.get(serverId) as { isConfigured: number };
    return isConfigured === 1;
  }

  getServerLogChannel(serverId: string) {
    const query = this.db.prepare(`
      SELECT log_channel FROM servers WHERE id = $id;
    `);

    const result = query.get(serverId) as { log_channel: string } | null;

    return result ? result.log_channel : null;
  }
}
