import { useState, useRef, useEffect, useCallback } from 'react'
import { Camera, Square, RotateCcw, Volume2, VolumeX } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import './App.css'

interface AnalysisData {
  type: string
  pose_detected: boolean
  elbow_angle?: number
  rep_count?: number
  phase?: string
  feedback?: string[]
  landmarks?: Array<{
    x: number
    y: number
    z: number
    visibility: number
  }>
}

function App() {
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const wsRef = useRef<WebSocket | null>(null)
  
  const [isRecording, setIsRecording] = useState(false)
  const [isConnected, setIsConnected] = useState(false)
  const [analysisData, setAnalysisData] = useState<AnalysisData | null>(null)
  const [voiceEnabled, setVoiceEnabled] = useState(true)
  const [lastFeedback, setLastFeedback] = useState<string>('')

  const backendUrl = import.meta.env.VITE_BACKEND_URL || 'ws://localhost:8000'

  const speak = useCallback((text: string) => {
    if (!voiceEnabled || !('speechSynthesis' in window)) return
    
    window.speechSynthesis.cancel()
    
    const utterance = new SpeechSynthesisUtterance(text)
    utterance.rate = 0.9
    utterance.pitch = 1
    utterance.volume = 0.8
    window.speechSynthesis.speak(utterance)
  }, [voiceEnabled])

  const connectWebSocket = useCallback(() => {
    const wsUrl = backendUrl.replace('http', 'ws') + '/ws/analyze'
    wsRef.current = new WebSocket(wsUrl)
    
    wsRef.current.onopen = () => {
      setIsConnected(true)
      console.log('WebSocket connected')
    }
    
    wsRef.current.onmessage = (event) => {
      const data: AnalysisData = JSON.parse(event.data)
      setAnalysisData(data)
      
      if (data.feedback && data.feedback.length > 0) {
        const newFeedback = data.feedback[data.feedback.length - 1]
        if (newFeedback !== lastFeedback) {
          speak(newFeedback)
          setLastFeedback(newFeedback)
        }
      }
    }
    
    wsRef.current.onclose = () => {
      setIsConnected(false)
      console.log('WebSocket disconnected')
    }
    
    wsRef.current.onerror = (error) => {
      console.error('WebSocket error:', error)
      setIsConnected(false)
    }
  }, [backendUrl, speak, lastFeedback])

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480, facingMode: 'user' }
      })
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        videoRef.current.play()
      }
      
      setIsRecording(true)
      connectWebSocket()
      
      setTimeout(() => {
        sendFrames()
      }, 1000)
      
    } catch (error) {
      console.error('Error accessing camera:', error)
      alert('Could not access camera. Please ensure you have granted camera permissions.')
    }
  }

  const stopCamera = () => {
    if (videoRef.current?.srcObject) {
      const tracks = (videoRef.current.srcObject as MediaStream).getTracks()
      tracks.forEach(track => track.stop())
      videoRef.current.srcObject = null
    }
    
    if (wsRef.current) {
      wsRef.current.close()
    }
    
    setIsRecording(false)
    setIsConnected(false)
    setAnalysisData(null)
  }

  const sendFrames = () => {
    if (!isRecording || !wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
      return
    }
    
    const video = videoRef.current
    const canvas = canvasRef.current
    
    if (video && canvas) {
      const ctx = canvas.getContext('2d')
      if (ctx) {
        canvas.width = video.videoWidth
        canvas.height = video.videoHeight
        ctx.drawImage(video, 0, 0)
        
        const dataURL = canvas.toDataURL('image/jpeg', 0.8)
        
        wsRef.current.send(JSON.stringify({
          type: 'frame',
          data: dataURL
        }))
      }
    }
    
    setTimeout(() => sendFrames(), 100)
  }

  const resetAnalyzer = async () => {
    try {
      await fetch(`${backendUrl.replace('ws', 'http')}/reset`, {
        method: 'POST'
      })
      setAnalysisData(null)
      setLastFeedback('')
      speak('Form analyzer has been reset')
    } catch (error) {
      console.error('Error resetting analyzer:', error)
    }
  }

  useEffect(() => {
    return () => {
      stopCamera()
    }
  }, [])

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Dumbbell Curl Form Analyzer
          </h1>
          <p className="text-lg text-gray-600">
            Get real-time feedback on your dumbbell curling technique
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Video Feed */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Camera className="w-5 h-5" />
                  Live Video Feed
                  {isConnected && (
                    <Badge variant="secondary" className="bg-green-100 text-green-800">
                      Connected
                    </Badge>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="relative bg-black rounded-lg overflow-hidden">
                  <video
                    ref={videoRef}
                    className="w-full h-auto"
                    autoPlay
                    muted
                    playsInline
                  />
                  <canvas
                    ref={canvasRef}
                    className="hidden"
                  />
                  
                  {!isRecording && (
                    <div className="absolute inset-0 flex items-center justify-center bg-gray-900 bg-opacity-75">
                      <div className="text-center text-white">
                        <Camera className="w-16 h-16 mx-auto mb-4 opacity-50" />
                        <p className="text-lg">Click "Start Analysis" to begin</p>
                      </div>
                    </div>
                  )}
                </div>
                
                <div className="flex gap-4 mt-4">
                  {!isRecording ? (
                    <Button onClick={startCamera} className="flex-1">
                      <Camera className="w-4 h-4 mr-2" />
                      Start Analysis
                    </Button>
                  ) : (
                    <Button onClick={stopCamera} variant="destructive" className="flex-1">
                      <Square className="w-4 h-4 mr-2" />
                      Stop Analysis
                    </Button>
                  )}
                  
                  <Button onClick={resetAnalyzer} variant="outline">
                    <RotateCcw className="w-4 h-4 mr-2" />
                    Reset
                  </Button>
                  
                  <Button
                    onClick={() => setVoiceEnabled(!voiceEnabled)}
                    variant="outline"
                    className={voiceEnabled ? 'bg-green-50' : 'bg-red-50'}
                  >
                    {voiceEnabled ? (
                      <Volume2 className="w-4 h-4" />
                    ) : (
                      <VolumeX className="w-4 h-4" />
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Analysis Panel */}
          <div className="space-y-6">
            {/* Stats */}
            <Card>
              <CardHeader>
                <CardTitle>Workout Stats</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Reps Completed:</span>
                    <Badge variant="secondary" className="text-lg px-3 py-1">
                      {analysisData?.rep_count || 0}
                    </Badge>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Current Phase:</span>
                    <Badge 
                      variant={analysisData?.phase === 'up' ? 'default' : 'secondary'}
                      className="capitalize"
                    >
                      {analysisData?.phase || 'Ready'}
                    </Badge>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Elbow Angle:</span>
                    <span className="text-lg font-bold">
                      {analysisData?.elbow_angle ? `${Math.round(analysisData.elbow_angle)}°` : '--'}
                    </span>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Pose Detected:</span>
                    <Badge 
                      variant={analysisData?.pose_detected ? 'default' : 'secondary'}
                      className={analysisData?.pose_detected ? 'bg-green-100 text-green-800' : ''}
                    >
                      {analysisData?.pose_detected ? 'Yes' : 'No'}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Feedback */}
            <Card>
              <CardHeader>
                <CardTitle>Real-time Feedback</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {analysisData?.feedback && analysisData.feedback.length > 0 ? (
                    analysisData.feedback.map((feedback, index) => (
                      <div
                        key={index}
                        className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm"
                      >
                        {feedback}
                      </div>
                    ))
                  ) : (
                    <div className="text-center text-gray-500 py-8">
                      <p>Start your workout to receive feedback</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Instructions */}
            <Card>
              <CardHeader>
                <CardTitle>Instructions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm text-gray-600">
                  <p>• Position yourself so your full upper body is visible</p>
                  <p>• Hold a dumbbell in one or both hands</p>
                  <p>• Perform slow, controlled curls</p>
                  <p>• Listen for voice feedback on your form</p>
                  <p>• Keep your core tight and elbows stable</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}

export default App
