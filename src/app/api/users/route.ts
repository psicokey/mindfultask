import { db } from 'app/lib/db'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const users = await db.query('SELECT user_id, name, email FROM users')
    return NextResponse.json(users)
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch users' },
      { status: 500 }
    )
  }
}