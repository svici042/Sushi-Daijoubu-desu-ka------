const fs = require('node:fs');
const path = require('node:path');
const sql = require('mssql/msnodesqlv8');

// Load local settings when an ignored .env file exists.
const envPath = path.join(__dirname, '.env');
if (fs.existsSync(envPath)) {
  process.loadEnvFile(envPath);
}

let poolPromise;

function getPool() {
  if (!poolPromise) {
    // ODBC can use the local named instance without a fixed port.
    const auth = process.env.DB_AUTH;
    const config = {
      server: process.env.DB_SERVER,
      database: process.env.DB_NAME,
      driver: process.env.DB_DRIVER || 'ODBC Driver 18 for SQL Server',
      options: {
        trustedConnection: auth === 'windows',
        encrypt: process.env.DB_ENCRYPT === 'true'
      }
    };

    if (!config.server || !config.database || !['windows', 'sql'].includes(auth)) {
      return Promise.reject(new Error('Database settings are incomplete.'));
    }

    // SQL authentication uses credentials from the ignored .env file.
    if (auth === 'sql') {
      if (!process.env.DB_USER || !process.env.DB_PASSWORD) {
        return Promise.reject(new Error('SQL login settings are incomplete.'));
      }

      config.user = process.env.DB_USER;
      config.password = process.env.DB_PASSWORD;
    }

    // Share one pool between requests and retry after a failed connection.
    const pool = new sql.ConnectionPool(config);
    pool.on('error', error => {
      console.error('Database pool error:', error.code || error.name);
      poolPromise = null;
    });
    poolPromise = pool.connect().catch(error => {
      poolPromise = null;
      throw error;
    });
  }

  return poolPromise;
}

module.exports = { getPool };
