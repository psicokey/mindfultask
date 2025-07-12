'use client'

import { useState, useEffect } from 'react'
import { Card, Button, Progress } from '../ui'
import { useSession } from 'next-auth/react'

const WORK_DURATION = 25 * 60 // 25 minutos en segundos
const SHORT_BREAK_DURATION = 5 * 60 // 5 minutos en segundos
const LONG_BREAK_DURATION = 15 * 60 // 15 minutos en segundos
const CYCLES_BEFORE_LONG_BREAK = 4

export default function PomodoroSection() {
  const { data: session } = useSession()
  const [timeLeft, setTimeLeft] = useState(WORK_DURATION)
  const [isActive, setIsActive] = useState(false)
  const [mode, setMode] = useState<'work' | 'break'>('work')
  const [cycles, setCycles] = useState(0)
  const [completedSessions, setCompletedSessions] = useState(0)

  // Formatear el tiempo como MM:SS
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  // Calcular el progreso como porcentaje
  const calculateProgress = () => {
    const totalDuration = mode === 'work' ? WORK_DURATION : 
                         cycles % CYCLES_BEFORE_LONG_BREAK === 0 ? LONG_BREAK_DURATION : SHORT_BREAK_DURATION
    return ((totalDuration - timeLeft) / totalDuration) * 100
  }

  // Guardar la sesión en la base de datos
  const saveSession = async () => {
    if (!session?.user?.id) return

    try {
      const response = await fetch('/api/pomodoro', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: session.user.id,
          duration: WORK_DURATION - timeLeft,
          completedAt: new Date().toISOString(),
          cyclesCompleted: 1
        })
      })

      if (response.ok) {
        setCompletedSessions(prev => prev + 1)
      }
    } catch (error) {
      console.error('Error saving pomodoro session:', error)
    }
  }

  // Efecto para el temporizador
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null

    if (isActive && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft(prev => prev - 1)
      }, 1000)
    } else if (isActive && timeLeft === 0) {
      // Cambiar de modo cuando el tiempo llega a cero
      if (mode === 'work') {
        saveSession()
        const isLongBreak = (cycles + 1) % CYCLES_BEFORE_LONG_BREAK === 0
        setMode('break')
        setTimeLeft(isLongBreak ? LONG_BREAK_DURATION : SHORT_BREAK_DURATION)
        setCycles(prev => prev + 1)
      } else {
        setMode('work')
        setTimeLeft(WORK_DURATION)
      }
    }

    return () => {
      if (interval) clearInterval(interval)
    }
  }, [isActive, timeLeft, mode, cycles])

  // Controladores de botones
  const toggleTimer = () => {
    setIsActive(!isActive)
  }

  const resetTimer = () => {
    setIsActive(false)
    setTimeLeft(mode === 'work' ? WORK_DURATION : 
               cycles % CYCLES_BEFORE_LONG_BREAK === 0 ? LONG_BREAK_DURATION : SHORT_BREAK_DURATION)
  }

  // Estilos basados en el modo
  const modeStyles = {
    work: {
      bg: 'bg-red-50',
      text: 'text-red-600',
      border: 'border-red-200'
    },
    break: {
      bg: 'bg-green-50',
      text: 'text-green-600',
      border: 'border-green-200'
    }
  }

  return (
    <Card className={`p-4 ${modeStyles[mode].bg} ${modeStyles[mode].border}`}>
      <div className="flex justify-between items-center mb-3">
        <h3 className={`font-semibold ${modeStyles[mode].text}`}>
          {mode === 'work' ? 'Tiempo de trabajo' : 'Tiempo de descanso'}
        </h3>
        <span className="text-sm text-gray-500">
          Ciclo: {cycles + 1}/{CYCLES_BEFORE_LONG_BREAK}
        </span>
      </div>
      
      <div className="text-center mb-4">
        <div className={`text-3xl font-bold mb-2 ${modeStyles[mode].text}`}>
          {formatTime(timeLeft)}
        </div>
        <Progress value={calculateProgress()} className="h-2" />
      </div>
      
      <div className="flex justify-center space-x-2">
        <Button 
          onClick={toggleTimer}
          size="sm"
          variant={isActive ? 'secondary' : 'default'}
        >
          {isActive ? 'Pausar' : 'Comenzar'}
        </Button>
        <Button 
          onClick={resetTimer}
          size="sm" 
          variant="outline"
        >
          Reiniciar
        </Button>
      </div>
      
      <div className="mt-3 text-center text-xs text-gray-500">
        Sesiones completadas hoy: {completedSessions}
      </div>
    </Card>
  )
}