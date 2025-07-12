import { NextResponse } from 'next/server'
import { db }   from 'app/lib/db'
import { auth } from 'app/lib/auth'

export async function GET(request: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    // Obtener sesiones de hoy
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const sessions = await db.pomodoroSession.findMany({
      where: {
        userId: session.user.id,
        completedAt: {
          gte: today
        }
      },
      orderBy: {
        completedAt: 'desc'
      }
    })

    // Estadísticas resumidas
    const totalSessions = sessions.length
    const totalDuration = sessions.reduce((sum, session) => sum + session.duration, 0)
    const totalCycles = sessions.reduce((sum, session) => sum + session.cyclesCompleted, 0)

    return NextResponse.json({
      sessions,
      stats: {
        totalSessions,
        totalMinutes: Math.floor(totalDuration / 60),
        totalCycles
      }
    })
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch pomodoro sessions' },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await request.json()
    
    const newSession = await db.pomodoroSession.create({
      data: {
        userId: session.user.id,
        duration: body.duration,
        cyclesCompleted: body.cyclesCompleted || 1,
        completedAt: new Date(body.completedAt)
      }
    })

    return NextResponse.json(newSession)
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to save pomodoro session' },
      { status: 500 }
    )
  }
}