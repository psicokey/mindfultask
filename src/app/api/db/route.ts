import { NextResponse } from 'next/server'
import { query } from 'app/lib/server/db'

export async function POST(req: Request) {
  try {
    const { sql, params } = await req.json()
    
    // Validación de seguridad básica
    if (typeof sql !== 'string' || !Array.isArray(params)) {
      return NextResponse.json(
        { error: 'Formato de solicitud inválido' },
        { status: 400 }
      )
    }

    // Bloquear consultas peligrosas
    const lowerSql = sql.toLowerCase()
    if (lowerSql.includes('drop ') || lowerSql.includes('delete from')) {
      return NextResponse.json(
        { error: 'Consulta no permitida' },
        { status: 403 }
      )
    }

    const result = await query(sql, params)
    return NextResponse.json(result)
  } catch (error) {
    console.error('Database API error:', error)
    return NextResponse.json(
      { error: 'Error en la base de datos' },
      { status: 500 }
    )
  }
}