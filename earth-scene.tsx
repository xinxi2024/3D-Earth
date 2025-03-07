/// <reference types="react/next" />
/// <reference types="react-dom/next" />

"use client"

import { useRef, useState, useEffect, Suspense, Component, ReactNode } from "react"
import { Canvas } from "@react-three/fiber/dist/react-three-fiber.esm"
import { OrbitControls, Stars } from "@react-three/drei"
import { Mesh, MeshStandardMaterial, MeshBasicMaterial, SphereGeometry, Color, DoubleSide, BackSide, Object3D, Group, Texture, LoadingManager, TextureLoader, CanvasTexture } from "three"
import * as THREE from "three"
import { Html } from "@react-three/drei"

// 在文件顶部添加全局类型声明
declare global {
  namespace JSX {
    interface IntrinsicElements {
      [elemName: string]: any;
    }
  }
}

// ErrorBoundary组件用于捕获渲染错误
interface ErrorBoundaryProps {
  children: ReactNode
  fallback: ReactNode
}

interface ErrorBoundaryState {
  hasError: boolean
}

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(_: Error): ErrorBoundaryState {
    return { hasError: true }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    console.error('3D渲染错误:', error, errorInfo)
  }

  render(): ReactNode {
    if (this.state.hasError) {
      return this.props.fallback
    }
    return this.props.children
  }
}

interface EarthProps {
  color: string
  rotationSpeed: number
  autoRotate: boolean
  performanceMode?: boolean
}

// 使用真实纹理贴图的地球组件
function Earth({ color, rotationSpeed, autoRotate, performanceMode = true }: EarthProps) {
  const earthGroup = useRef<Group>(null!)
  const [isInitialized, setIsInitialized] = useState(false)
  const [textureLoaded, setTextureLoaded] = useState(false)
  const [loadingError, setLoadingError] = useState(false)
  
  // 初始化地球
  useEffect(() => {
    if (earthGroup.current && !isInitialized) {
      console.log("创建3D地球模型...")
      
      // 创建地球基本结构
      createEarthModel()
      
      setIsInitialized(true)
    }
  }, [isInitialized, performanceMode])
  
  // 创建地球模型
  const createEarthModel = () => {
    if (!earthGroup.current) return
    
    // 清空现有内容
    while (earthGroup.current.children.length > 0) {
      earthGroup.current.remove(earthGroup.current.children[0])
    }
    
    // 纹理加载管理器
    const loadingManager = new LoadingManager()
    loadingManager.onError = (url: string) => {
      console.error('纹理加载失败:', url)
      setLoadingError(true)
      createFallbackEarth() // 创建备用地球
    }
    
    // 尝试多个可能的地球纹理URL
    const textureLoader = new TextureLoader(loadingManager)
    
    // 创建加载状态指示器
    createLoadingIndicator()
    
    // 更新纹理URL列表，优先使用本地文件
    const textureURLs = [
      '/assets/3d/texture_earth.jpg', // 本地主纹理
      '/assets/3d/earth_texture.jpg', // 本地备用纹理
      '/earth_texture.jpg',          // 根目录备用
      'https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/planets/earth_atmos_2048.jpg'
    ]
    
    function tryLoadTexture(index: number) {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => {
        controller.abort()
        console.log(`纹理加载超时: ${textureURLs[index]}`)
        tryLoadTexture(index + 1)
      }, 5000) // 5秒超时

      textureLoader.load(
        textureURLs[index],
        (texture) => {
          clearTimeout(timeoutId)
          // 纹理加载成功
          console.log('纹理加载成功!')
          setTextureLoaded(true)
          createTexturedEarth(texture)
        },
        undefined,
        () => {
          clearTimeout(timeoutId)
          // 此URL失败，尝试下一个
          console.log(`纹理 ${textureURLs[index]} 加载失败，尝试下一个...`)
          tryLoadTexture(index + 1)
        }
      )
    }
    
    // 开始尝试加载第一个URL
    tryLoadTexture(0)
  }
  
  // 创建加载指示器
  const createLoadingIndicator = () => {
    if (!earthGroup.current) return
    
    // 添加一个简单的球体作为加载指示器
    const geometry = new SphereGeometry(1, 32, 32)
    const material = new MeshStandardMaterial({ 
      color: 0x444444, 
      wireframe: true 
    })
    const loadingSphere = new Mesh(geometry, material)
    loadingSphere.name = 'loading-indicator'
    earthGroup.current.add(loadingSphere)
  }
  
  // 使用纹理创建地球
  const createTexturedEarth = (texture: Texture) => {
    try {
      // 在设置纹理属性前添加渲染器检查
      if (!THREE.WebGLRenderer) {
        console.error('WebGLRenderer not available')
        throw new Error('WebGL not supported')
      }
      // 替换过时的sRGBEncoding设置
      texture.colorSpace = THREE.SRGBColorSpace;
      // 设置各向异性过滤前需要先确保渲染器已初始化
      if ('anisotropy' in texture && texture.anisotropy !== undefined) {
        texture.anisotropy = 4;
      }
      
      if (!earthGroup.current) return
      
      // 移除加载指示器
      const loadingIndicator = earthGroup.current.getObjectByName('loading-indicator')
      if (loadingIndicator) {
        earthGroup.current.remove(loadingIndicator)
      }
      
      // 创建地球
      const geometry = new SphereGeometry(1, performanceMode ? 32 : 64, performanceMode ? 32 : 64)
      const material = new MeshStandardMaterial({
        map: texture,
        roughness: 0.8,
        metalness: 0.1,
      })
      
      const earth = new Mesh(geometry, material)
      earth.name = 'earth'
      earthGroup.current.add(earth)
      
      // 添加云层（如果不是性能模式）
      if (!performanceMode) {
        addCloudsLayer()
        addAtmosphereEffect()
      }
    } catch (error) {
      console.error('纹理处理失败:', error)
      setLoadingError(true)
      createFallbackEarth()
    }
  }
  
  // 添加云层
  const addCloudsLayer = () => {
    if (!earthGroup.current) return
    
    // 创建云层（半透明白色球体）
    const cloudsGeometry = new SphereGeometry(1.02, 32, 32)
    const cloudsMaterial = new MeshStandardMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.2,
      alphaMap: createCloudTexture(),
      side: DoubleSide
    })
    
    const clouds = new Mesh(cloudsGeometry, cloudsMaterial)
    clouds.name = 'clouds'
    earthGroup.current.add(clouds)
  }
  
  // 添加大气层效果
  const addAtmosphereEffect = () => {
    if (!earthGroup.current) return
    
    // 创建大气层效果（略大的半透明球体）
    const atmosphereGeometry = new SphereGeometry(1.03, 32, 32)
    const atmosphereMaterial = new MeshBasicMaterial({
      color: 0x5588ff,
      transparent: true,
      opacity: 0.1,
      side: BackSide
    })
    
    const atmosphere = new Mesh(atmosphereGeometry, atmosphereMaterial)
    atmosphere.name = 'atmosphere'
    earthGroup.current.add(atmosphere)
  }
  
  // 创建云纹理
  const createCloudTexture = () => {
    const canvas = document.createElement('canvas')
    canvas.width = 512
    canvas.height = 256
    const context = canvas.getContext('2d')
    
    if (context) {
      // 填充透明背景
      context.fillStyle = 'rgba(255, 255, 255, 0)'
      context.fillRect(0, 0, canvas.width, canvas.height)
      
      // 生成随机云朵
      for (let i = 0; i < 50; i++) {
        const x = Math.random() * canvas.width
        const y = Math.random() * canvas.height
        const r = 20 + Math.random() * 40
        
        const gradient = context.createRadialGradient(x, y, 0, x, y, r)
        gradient.addColorStop(0, 'rgba(255, 255, 255, 0.6)')
        gradient.addColorStop(1, 'rgba(255, 255, 255, 0)')
        
        context.beginPath()
        context.fillStyle = gradient
        context.arc(x, y, r, 0, Math.PI * 2)
        context.fill()
      }
    }
    
    const texture = new CanvasTexture(canvas)
    return texture
  }
  
  // 创建备用地球（当纹理加载失败时）
  const createFallbackEarth = () => {
    if (!earthGroup.current) return
    
    // 移除加载指示器
    const loadingIndicator = earthGroup.current.getObjectByName('loading-indicator')
    if (loadingIndicator) {
      earthGroup.current.remove(loadingIndicator)
    }
    
    console.log('创建备用地球模型...')
    const texture = createFallbackEarthTexture()
    
    const geometry = new SphereGeometry(1, 32, 32)
    const material = new MeshStandardMaterial({
      map: texture,
      roughness: 0.8,
      metalness: 0.1
    })
    
    const earth = new Mesh(geometry, material)
    earth.name = 'earth'
    earthGroup.current.add(earth)
  }
  
  // 创建备用地球纹理
  const createFallbackEarthTexture = () => {
    const width = 2048; // 更高分辨率
    const height = 1024;
    
    const canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = height
    const context = canvas.getContext('2d')
    
    if (context) {
      // 填充海洋蓝色背景 - 更真实的深蓝色
      const oceanGradient = context.createLinearGradient(0, 0, 0, height)
      oceanGradient.addColorStop(0, '#0a2c4e') // 深北冰洋
      oceanGradient.addColorStop(0.2, '#0f3c67') // 北大西洋/太平洋
      oceanGradient.addColorStop(0.5, '#1a5b91') // 赤道
      oceanGradient.addColorStop(0.8, '#0f3c67') // 南大西洋/太平洋
      oceanGradient.addColorStop(1, '#0a2c4e') // 南冰洋
      
      context.fillStyle = oceanGradient
      context.fillRect(0, 0, width, height)
      
      // 添加更精确的大陆轮廓
      
      // 亚洲（更详细的形状）
      context.fillStyle = '#5a7247' // 更自然的绿色
      context.beginPath()
      context.moveTo(width * 0.65, height * 0.15)
      context.bezierCurveTo(
        width * 0.75, height * 0.15,
        width * 0.85, height * 0.25,
        width * 0.86, height * 0.35
      )
      context.bezierCurveTo(
        width * 0.87, height * 0.38,
        width * 0.9, height * 0.4,
        width * 0.9, height * 0.43
      )
      context.bezierCurveTo(
        width * 0.82, height * 0.48,
        width * 0.75, height * 0.5,
        width * 0.7, height * 0.48
      )
      context.bezierCurveTo(
        width * 0.65, height * 0.45,
        width * 0.63, height * 0.4,
        width * 0.6, height * 0.35
      )
      context.bezierCurveTo(
        width * 0.6, height * 0.3,
        width * 0.58, height * 0.25,
        width * 0.65, height * 0.15
      )
      context.fill()
      
      // 中国区域（精确突出）
      context.fillStyle = '#6b8e23' // 橄榄绿
      context.beginPath()
      context.moveTo(width * 0.7, height * 0.25)
      context.bezierCurveTo(
        width * 0.76, height * 0.26,
        width * 0.8, height * 0.3,
        width * 0.78, height * 0.35
      )
      context.bezierCurveTo(
        width * 0.76, height * 0.38,
        width * 0.73, height * 0.4,
        width * 0.7, height * 0.38
      )
      context.bezierCurveTo(
        width * 0.68, height * 0.35,
        width * 0.67, height * 0.3,
        width * 0.7, height * 0.25
      )
      context.fill()
      
      // 西藏高原（较深色）
      context.fillStyle = '#7d6b5d' // 山地棕色
      context.beginPath()
      context.moveTo(width * 0.67, height * 0.32)
      context.bezierCurveTo(
        width * 0.7, height * 0.33,
        width * 0.71, height * 0.35,
        width * 0.69, height * 0.37
      )
      context.bezierCurveTo(
        width * 0.67, height * 0.36,
        width * 0.65, height * 0.34,
        width * 0.67, height * 0.32
      )
      context.fill()
      
      // 中国主要城市 - 用小光点表示
      const drawCity = (x: number, y: number, size: number, name?: string) => {
        // 城市外发光效果
        context.beginPath()
        const gradient = context.createRadialGradient(
          width * x, height * y, 0,
          width * x, height * y, size * 3
        )
        gradient.addColorStop(0, 'rgba(255, 255, 180, 0.8)')
        gradient.addColorStop(1, 'rgba(255, 255, 100, 0)')
        context.fillStyle = gradient
        context.arc(width * x, height * y, size * 3, 0, Math.PI * 2)
        context.fill()
        
        // 城市中心点
        context.fillStyle = '#ffcc00' // 金色
        context.beginPath()
        context.arc(width * x, height * y, size, 0, Math.PI * 2)
        context.fill()
        
        if (name && size > 3) {
          context.fillStyle = '#ffffff'
          context.font = '14px Arial'
          context.textAlign = 'center'
          context.fillText(name, width * x, height * y + 15)
        }
      }
      
      // 添加中国主要城市
      drawCity(0.735, 0.295, 4, '北京')
      drawCity(0.755, 0.33, 4, '上海')
      drawCity(0.73, 0.35, 3, '广州')
      drawCity(0.75, 0.34, 3, '香港')
      drawCity(0.72, 0.28, 3, '哈尔滨')
      drawCity(0.71, 0.3, 2)
      drawCity(0.76, 0.31, 2)
      
      // 北美洲
      context.fillStyle = '#7d6741' // 大陆褐色
      context.beginPath()
      context.moveTo(width * 0.15, height * 0.15)
      context.bezierCurveTo(
        width * 0.25, height * 0.15,
        width * 0.28, height * 0.28,
        width * 0.25, height * 0.4
      )
      context.bezierCurveTo(
        width * 0.22, height * 0.45,
        width * 0.18, height * 0.48,
        width * 0.15, height * 0.45
      )
      context.bezierCurveTo(
        width * 0.12, height * 0.4,
        width * 0.1, height * 0.3,
        width * 0.15, height * 0.15
      )
      context.fill()
      
      // 南美洲
      context.fillStyle = '#567d46' // 雨林绿
      context.beginPath()
      context.moveTo(width * 0.25, height * 0.55)
      context.bezierCurveTo(
        width * 0.29, height * 0.6,
        width * 0.28, height * 0.75,
        width * 0.24, height * 0.85
      )
      context.bezierCurveTo(
        width * 0.2, height * 0.8,
        width * 0.18, height * 0.7,
        width * 0.21, height * 0.6
      )
      context.bezierCurveTo(
        width * 0.22, height * 0.58,
        width * 0.24, height * 0.56,
        width * 0.25, height * 0.55
      )
      context.fill()
      
      // 欧洲
      context.fillStyle = '#8e7d52' // 欧洲褐黄色
      context.beginPath()
      context.moveTo(width * 0.5, height * 0.22)
      context.bezierCurveTo(
        width * 0.54, height * 0.19,
        width * 0.58, height * 0.20,
        width * 0.58, height * 0.25
      )
      context.bezierCurveTo(
        width * 0.56, height * 0.28,
        width * 0.54, height * 0.3,
        width * 0.51, height * 0.28
      )
      context.bezierCurveTo(
        width * 0.49, height * 0.26,
        width * 0.48, height * 0.24,
        width * 0.5, height * 0.22
      )
      context.fill()
      
      // 非洲
      context.fillStyle = '#bf8f4e' // 沙漠棕黄色
      context.beginPath()
      context.moveTo(width * 0.5, height * 0.35)
      context.bezierCurveTo(
        width * 0.56, height * 0.33,
        width * 0.6, height * 0.4,
        width * 0.58, height * 0.55
      )
      context.bezierCurveTo(
        width * 0.55, height * 0.65,
        width * 0.52, height * 0.68,
        width * 0.48, height * 0.62
      )
      context.bezierCurveTo(
        width * 0.45, height * 0.55,
        width * 0.46, height * 0.45,
        width * 0.48, height * 0.4
      )
      context.bezierCurveTo(
        width * 0.49, height * 0.38,
        width * 0.5, height * 0.36,
        width * 0.5, height * 0.35
      )
      context.fill()
      
      // 澳大利亚
      context.fillStyle = '#a06a44' // 澳洲红土色
      context.beginPath()
      context.moveTo(width * 0.82, height * 0.66)
      context.bezierCurveTo(
        width * 0.88, height * 0.62,
        width * 0.92, height * 0.68,
        width * 0.9, height * 0.76
      )
      context.bezierCurveTo(
        width * 0.85, height * 0.81,
        width * 0.8, height * 0.79,
        width * 0.78, height * 0.73
      )
      context.bezierCurveTo(
        width * 0.78, height * 0.7,
        width * 0.8, height * 0.68,
        width * 0.82, height * 0.66
      )
      context.fill()
      
      // 南极洲
      context.fillStyle = '#e8e8f0' // 雪白色
      context.beginPath()
      context.arc(width * 0.5, height * 0.97, width * 0.35, 0, Math.PI, true)
      context.fill()
      
      // 添加云层 - 随机云团
      context.globalAlpha = 0.3 // 半透明
      context.fillStyle = '#ffffff'
      
      for (let i = 0; i < 20; i++) {
        const cloudX = Math.random() * width
        const cloudY = Math.random() * height * 0.7 + height * 0.1 // 避开南极
        const cloudRadius = 30 + Math.random() * 50
        
        // 创建不规则云形
        context.beginPath()
        for (let j = 0; j < 8; j++) {
          const angle = j * Math.PI / 4
          const xOffset = cloudRadius * (0.8 + Math.random() * 0.4) * Math.cos(angle)
          const yOffset = cloudRadius * (0.8 + Math.random() * 0.4) * Math.sin(angle)
          
          if (j === 0) {
            context.moveTo(cloudX + xOffset, cloudY + yOffset)
          } else {
            context.lineTo(cloudX + xOffset, cloudY + yOffset)
          }
        }
        context.closePath()
        context.fill()
      }
      
      context.globalAlpha = 1.0 // 重置透明度
      
      // 添加经纬线网格
      context.strokeStyle = 'rgba(255, 255, 255, 0.15)'
      context.lineWidth = 1
      
      // 经线
      for (let i = 0; i <= 24; i++) {
        const x = width * (i / 24)
        context.beginPath()
        context.moveTo(x, 0)
        context.lineTo(x, height)
        context.stroke()
      }
      
      // 纬线
      for (let i = 0; i <= 12; i++) {
        const y = height * (i / 12)
        context.beginPath()
        context.moveTo(0, y)
        context.lineTo(width, y)
        context.stroke()
      }
      
      // 添加赤道特殊标记
      context.strokeStyle = 'rgba(255, 255, 0, 0.3)'
      context.lineWidth = 2
      context.beginPath()
      context.moveTo(0, height * 0.5)
      context.lineTo(width, height * 0.5)
      context.stroke()
      
      // 在context绘制代码中添加：
      context.fillStyle = '#ff0000'
      context.font = '40px Arial'
      context.textAlign = 'center'
      context.fillText('纹理加载失败', width/2, height/2)
      context.fillText('请检查控制台', width/2, height/2 + 50)
    }
    
    const texture = new CanvasTexture(canvas)
    return texture
  }
  
  // 动画更新
  useEffect(() => {
    if (!earthGroup.current || !isInitialized) return
    
    const earth = earthGroup.current.getObjectByName('earth')
    const clouds = earthGroup.current.getObjectByName('clouds')
    
    if (!earth) return
    
    // 自动旋转
    if (autoRotate) {
      const speed = rotationSpeed * 0.001
      const animate = () => {
        earth.rotation.y += speed
        
        if (clouds) {
          clouds.rotation.y += speed * 1.1 // 云层稍快旋转
        }
        
        requestAnimationFrame(animate)
      }
      
      const animationId = requestAnimationFrame(animate)
      return () => cancelAnimationFrame(animationId)
    }
  }, [autoRotate, rotationSpeed, isInitialized])
  
  useEffect(() => {
    console.log('测试本地纹理路径:',
      `${window.location.origin}/assets/3d/texture_earth.jpg`
    )
  }, [])
  
  return (
    <group ref={earthGroup}>
      {loadingError && !textureLoaded && (
        <Html position={[0, 1.5, 0]}>
          <div style={{ color: 'white', background: 'rgba(0,0,0,0.7)', padding: '10px', borderRadius: '5px' }}>
            纹理加载失败，使用备用地球...
          </div>
        </Html>
      )}
    </group>
  )
}

// 主要的3D场景组件
export default function EarthScene({ color, rotationSpeed, autoRotate, performanceMode = true }: EarthProps) {
  const [isClient, setIsClient] = useState(false)
  
  // 客户端渲染检测
  useEffect(() => {
    setIsClient(true)
    
    // 网页加载后显示诊断信息
    console.log("3D地球场景初始化, WebGL支持状态:", !!window.WebGLRenderingContext)
    console.log("性能模式:", performanceMode ? "开启" : "关闭")
    console.log("颜色值:", color)
  }, [performanceMode, color])
  
  // 在服务器端显示加载状态
  if (!isClient) {
    return (
      <div className="w-full h-full bg-slate-900 flex items-center justify-center">
        <div className="text-center text-white">
          <div className="mb-4 text-xl">加载3D地球中...</div>
        </div>
      </div>
    )
  }
  
  return (
    <div className="relative w-full h-full">
      <ErrorBoundary fallback={
        <div className="w-full h-full bg-slate-900 flex items-center justify-center text-white">
          3D场景加载失败。请刷新页面或尝试使用其他浏览器。
        </div>
      }>
        <Canvas
          camera={{ position: [0, 0, 7], fov: 45 }}
          gl={{ 
            antialias: true,
            powerPreference: 'default',
          }}
          style={{ background: '#000520' }}
        >
          <Suspense fallback={null}>
            {/* 场景光照 */}
            <ambientLight intensity={0.7} />
            <directionalLight position={[10, 5, 5]} intensity={1.5} color="#ffffff" />
            <directionalLight position={[-5, -2, -2]} intensity={0.7} color="#4477ff" />
            <pointLight position={[0, 0, 10]} intensity={0.5} color="#ffffff" />
            
            {/* 地球 */}
            <Earth 
              color={color} 
              rotationSpeed={rotationSpeed} 
              autoRotate={autoRotate} 
              performanceMode={performanceMode} 
            />
            
            {/* 星星背景 */}
            <Stars 
              radius={100} 
              depth={50} 
              count={performanceMode ? 1000 : 2000} 
              factor={4} 
              saturation={0.5} 
              fade
            />
            
            <OrbitControls
              enableZoom={true}
              enablePan={false}
              minDistance={3}
              maxDistance={10}
              enableDamping={false}
            />
          </Suspense>
        </Canvas>
      </ErrorBoundary>
    </div>
  )
}

