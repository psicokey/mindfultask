import mariadb from 'mariadb'

interface DBPoolConfig {
  host: string
  user: string
  password: string
  database: string
  port: number
  connectionLimit: number
}

const dbConfig: DBPoolConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'mindfultask_db',
  port: process.env.DB_PORT ? parseInt(process.env.DB_PORT) : 3306,
  connectionLimit: 10
}

const pool = mariadb.createPool(dbConfig)

export async function query<T = unknown>(sql: string, params?: any[]): Promise<T> {
  let conn
  try {
    conn = await pool.getConnection()
    const result = await conn.query(sql, params)
    return result as T
  } finally {
    if (conn) conn.release()
  }
}

export interface User {
  user_id: number
  name: string
  email: string
  created_at: Date
}

export const db = {
  user: {
    async findByEmail(email: string): Promise<User | null> {
      const result = await query<User[]>(
        'SELECT user_id, name, email, created_at FROM users WHERE email = ? LIMIT 1',
        [email]
      )
      return result[0] || null
    }
  }
}