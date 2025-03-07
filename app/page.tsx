"use client"

import { useState, useEffect, lazy, Suspense } from "react"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

// 使用懒加载来延迟加载3D地球组件
const EarthScene = lazy(() => import("../earth-scene"))

// 加载中状态组件
function LoadingEarth() {
  return (
    <div className="bg-black/40 rounded-lg overflow-hidden border border-white/10 h-[500px] md:h-[600px] shadow-xl relative flex items-center justify-center">
      <div className="text-center">
        <div className="inline-block w-8 h-8 border-4 border-white/20 border-t-white rounded-full animate-spin mb-4"></div>
        <p className="text-white text-lg">加载3D地球中...</p>
        <p className="text-gray-400 text-sm mt-2">首次加载可能需要几秒钟</p>
      </div>
    </div>
  )
}

export default function EarthModelPage() {
  const [earthColor, setEarthColor] = useState("#FFFFFF")
  const [rotationSpeed, setRotationSpeed] = useState(0.5)
  const [autoRotate, setAutoRotate] = useState(true)
  const [isLoaded, setIsLoaded] = useState(false)
  const [performanceMode, setPerformanceMode] = useState(true)

  // 监听组件是否已经加载
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoaded(true);
    }, 100);
    
    return () => clearTimeout(timer);
  }, []);

  return (
    <main className="min-h-screen bg-gradient-to-b from-black to-slate-900 text-white">
      <div className="container mx-auto px-4 pt-4 pb-8">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold">Sloaner3D地球</h1>
          <p className="text-sm text-gray-300">交互式三维地球展示</p>
        </div>

        <div className="flex flex-col gap-8">
          <div className="w-full">
            <Suspense fallback={<LoadingEarth />}>
              <div className="bg-black/40 rounded-lg overflow-hidden border border-white/10 h-[500px] md:h-[600px] shadow-xl relative">
                <div className="absolute inset-0 bg-gradient-to-tr from-indigo-900/5 to-transparent opacity-30 pointer-events-none"></div>
                {isLoaded && (
                  <EarthScene 
                    color={earthColor} 
                    rotationSpeed={rotationSpeed} 
                    autoRotate={autoRotate}
                    performanceMode={performanceMode} 
                  />
                )}
              </div>
            </Suspense>
          </div>

          {/* 控制面板在底部 */}
          <div className="bg-gradient-to-b from-black/50 to-slate-900/30 backdrop-blur-sm rounded-lg p-6 border border-indigo-900/20 shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-semibold">控制面板</h2>
              <div className="text-sm text-gray-300">自定义您的3D地球</div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-1 gap-8">
              <div>
                <h3 className="text-lg font-medium mb-4">旋转设置</h3>
                <div className="mb-6">
                  <div className="flex justify-between mb-2">
                    <label className="text-sm font-medium">旋转速度</label>
                    <span>{rotationSpeed.toFixed(1)}</span>
                  </div>
                  <Slider
                    value={[rotationSpeed]}
                    min={0}
                    max={2}
                    step={0.1}
                    onValueChange={(value) => setRotationSpeed(value[0])}
                  />
                </div>

                <div>
                  <Button
                    variant={autoRotate ? "default" : "outline"}
                    className="w-full"
                    onClick={() => setAutoRotate(!autoRotate)}
                  >
                    {autoRotate ? "自动旋转: 开启" : "自动旋转: 关闭"}
                  </Button>
                </div>
                
                <div className="mt-4">
                  <Button
                    variant={performanceMode ? "default" : "outline"}
                    className="w-full"
                    onClick={() => setPerformanceMode(!performanceMode)}
                  >
                    {performanceMode ? "性能模式: 开启" : "性能模式: 关闭"}
                  </Button>
                  <p className="text-xs text-gray-400 mt-1">性能模式可提高流畅度，但会降低视觉质量</p>
                </div>
                
                <div className="mt-6">
                  <h3 className="text-lg font-medium mb-3">使用说明</h3>
                  <ul className="list-disc list-inside space-y-2 text-gray-300">
                    <li>拖动可手动旋转地球</li>
                    <li>滚轮可放大缩小视图</li>
                    <li>使用控制面板调整旋转速度</li>
                    <li>可开启/关闭自动旋转功能</li>
                    <li>如卡顿，请保持性能模式开启</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}

