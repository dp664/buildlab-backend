const pool = require('../utils/dbConnection');

const queryDatabase = async (query, params = [], client = null) => {
  const db = client || pool;
  
  try {
    const { rows } = await db.query(query, params);
    return rows;
  } catch (error) {
    console.error('Database query error', {
      query,
      params,
      error: error.message,
      stack: error.stack,
    });
    throw error; 
  }
};

// Helper to get a single client for transaction
const getTransactionClient = async () => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    return client;
  } catch (error) {
    // If BEGIN fails, release the client
    client.release();
    throw error;
  }
};

module.exports = {
  queryDatabase,
  getTransactionClient,
};

// const pool = require('../utils/dbConnection');

// const queryDatabase = async (query, params) => {
//   try {
//     // console.log("query is", query)
//     const { rows } = await pool.query(query, params);
//     return rows;
//   } catch (error) {
//     console.error('Database query error', {
//         query,
//         params,
//         error: error.message,
//         stack: error.stack
//     });
//     throw new Error('Database query error');
//   }
// };

// module.exports = { queryDatabase };
