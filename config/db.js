const { Client } = require("pg");

const roomStmt = `
CREATE TABLE IF NOT EXISTS rooms
  (
     id   SERIAL PRIMARY KEY, 
     name TEXT UNIQUE
  );
`;

const userStmt = `
CREATE TABLE IF NOT EXISTS users
  (
     id   SERIAL PRIMARY KEY,
     name TEXT UNIQUE
  );
`;

const messageStmt = `
CREATE TABLE IF NOT EXISTS messages
  (
     date      TEXT PRIMARY KEY,
     message   TEXT NOT NULL,
     user_id   TEXT,
     room_id   TEXT
  ) 
`;

const db = new Client({
  ssl: {
    rejectUnauthorized: false
		// Bör aldrig sättas till rejectUnauthorized i en riktig applikation
		// https://stackoverflow.com/questions/63863591/is-it-ok-to-be-setting-rejectunauthorized-to-false-in-production-postgresql-conn
  },
  connectionString:
  process.env.DATABASE_URL
});

db.connect(); // Ansluter till Databasen med hjälp av connectionString'en

// Istället för db.run i sqlite
db.query(roomStmt, (error) => {
	if (error) {
			console.error(error.message);
			throw error;
	}
}); 
db.query(userStmt, (error) => {
	if (error) {
			console.error(error.message);
			throw error;
	}
});
db.query(messageStmt, (error) => {
	if (error) {
			console.error(error.message);
			throw error;
	}
});

module.exports = db;