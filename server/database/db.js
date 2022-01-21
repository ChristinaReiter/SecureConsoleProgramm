import { Low, JSONFile } from 'lowdb'

// LowDB
const adapter = new JSONFile('database/db.json');
const db = new Low(adapter);
await db.read();
db.data.users ||= [];
export default db;