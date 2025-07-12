// /home/keyberth/proyectos/mindfultask/src/lib/db.ts
import mariadb from 'mariadb';

// 1. Creamos un "pool" de conexiones.
// Esto es mucho más eficiente que crear una conexión nueva para cada consulta.
// El pool gestiona un conjunto de conexiones reutilizables.
const pool = mariadb.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT ? parseInt(process.env.DB_PORT, 10) : 3306,
  connectionLimit: 10, // Límite de conexiones simultáneas en el pool.
  allowPublicKeyRetrieval: true, // Necesario para algunas configuraciones de autenticación.
  timezone: 'UTC', // Asegura consistencia en las fechas.
});

/**
 * Función para ejecutar consultas simples.
 * Obtiene una conexión del pool, ejecuta la consulta y la libera.
 * @param sql La consulta SQL a ejecutar.
 * @param params Los parámetros para la consulta (previene inyección SQL).
 * @returns El resultado de la consulta.
 */
export async function query<T = any>(sql: string, params?: any[]): Promise<T> {
  let conn;
  try {
    conn = await pool.getConnection();
    const rows = await conn.query(sql, params);
    return rows;
  } catch (err) {
    console.error('Error en la consulta a la base de datos:', err);
    // Relanzamos el error para que el código que llama a `query` pueda manejarlo.
    throw err;
  } finally {
    // Es CRUCIAL liberar la conexión de vuelta al pool, incluso si hay un error.
    if (conn) conn.release();
  }
}

/**
 * Función para manejar transacciones de forma segura.
 * Una transacción agrupa varias consultas. O todas tienen éxito, o ninguna se aplica.
 * @param callback Una función que recibe la conexión y ejecuta las consultas de la transacción.
 * @returns El resultado de la función callback.
 */
export async function transaction<T>(callback: (conn: mariadb.Connection) => Promise<T>): Promise<T> {
  let conn;
  try {
    conn = await pool.getConnection();
    await conn.beginTransaction();
    const result = await callback(conn);
    await conn.commit();
    return result;
  } catch (error) {
    // Si algo falla, hacemos rollback para deshacer todos los cambios de la transacción.
    if (conn) await conn.rollback();
    console.error('Error en la transacción:', error);
    throw error;
  } finally {
    if (conn) conn.release();
  }
}
