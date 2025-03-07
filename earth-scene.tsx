"use client"

import { useRef, useState, useEffect, Suspense, Component, ReactNode } from "react"
import { Canvas, useFrame, useLoader, useThree } from "@react-three/fiber"
import { OrbitControls, Environment, Stars, Html } from "@react-three/drei"
import { 
  TextureLoader, type Mesh, WebGLRenderer, 
  RepeatWrapping, LinearMipMapLinearFilter, DoubleSide, 
  FrontSide, BackSide, AdditiveBlending
} from "three"
import { Color } from "three"

// 扩展WebGLRenderer类型以解决TypeScript错误
declare module "three" {
  interface WebGLRenderer {
    powerPreference?: string;
    physicallyCorrectLights?: boolean;
    antialias?: boolean;
  }
}

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
    console.error('Error caught by ErrorBoundary:', error, errorInfo)
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

function Earth({ color, rotationSpeed, autoRotate, performanceMode = true }: EarthProps) {
  const { gl } = useThree()
  const meshRef = useRef<Mesh>(null)
  const cloudsRef = useRef<Mesh>(null)
  const highlightRef = useRef<Mesh>(null)
  const [textureLoaded, setTextureLoaded] = useState(false)
  const [earthTexture, setEarthTexture] = useState<any>(null)
  const [cloudsTexture, setCloudsTexture] = useState<any>(null)
  const [normalMapTexture, setNormalMapTexture] = useState<any>(null)
  const [loadingStatus, setLoadingStatus] = useState('初始化中...')
  
  // 加载地球纹理
  useEffect(() => {
    // 设置纹理过滤和包装
    const setupTexture = (texture: any) => {
      if (!texture) return texture
      
      texture.anisotropy = gl.capabilities.getMaxAnisotropy() || 16
      texture.wrapS = RepeatWrapping
      texture.wrapT = RepeatWrapping
      texture.minFilter = LinearMipMapLinearFilter
      texture.magFilter = LinearMipMapLinearFilter
      
      return texture
    }
    
    const textureLoader = new TextureLoader()
    
    // 尝试不同的地球表面纹理，优先级从高到低
    const textureUrls = [
      'https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/planets/earth_atmos_2048.jpg',
      'https://www.solarsystemscope.com/textures/download/2k_earth_daymap.jpg',
      'https://images-assets.nasa.gov/image/PIA18033/PIA18033~orig.jpg',
      'https://eoimages.gsfc.nasa.gov/images/imagerecords/74000/74218/world.200408.3x5400x2700.jpg'
    ]
    
    // 尝试加载列表中的纹理，直到成功
    const loadTextureFromList = (index = 0) => {
      if (index >= textureUrls.length) {
        console.error('所有地球纹理加载都失败了')
        setLoadingStatus('地球纹理加载失败')
        return
      }
      
      setLoadingStatus(`加载地球纹理: ${index + 1}/${textureUrls.length}`)
      
      textureLoader.load(
        textureUrls[index],
        (texture) => {
          console.log(`地球纹理加载成功! (${textureUrls[index]})`)
          setEarthTexture(setupTexture(texture))
          setTextureLoaded(true)
          setLoadingStatus('地球纹理加载成功')
        },
        (xhr) => {
          // 加载进度
          const percent = Math.round((xhr.loaded / xhr.total) * 100)
          setLoadingStatus(`地球纹理加载中: ${percent}%`)
        },
        (error) => {
          console.error(`地球纹理加载失败 (${textureUrls[index]}):`, error)
          // 尝试下一个纹理
          loadTextureFromList(index + 1)
        }
      )
    }
    
    // 开始尝试加载第一个纹理
    loadTextureFromList()
    
    // 如果不是性能模式，加载额外的纹理
    if (!performanceMode) {
      // 云层纹理 - 尝试不同来源
      const cloudTextureUrls = [
        'https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/planets/earth_clouds_1024.jpg',
        'https://www.solarsystemscope.com/textures/download/2k_earth_clouds.jpg',
        'https://images.ctfassets.net/cnu0m8re1exe/4t0Fpuiu8Uf1eANX66p53Z/c082035a93c05c086171830dd78095ec/clouds.jpg'
      ]
      
      const loadCloudsTexture = (index = 0) => {
        if (index >= cloudTextureUrls.length) return
        
        textureLoader.load(
          cloudTextureUrls[index],
          (texture) => {
            console.log(`云层纹理加载成功! (${cloudTextureUrls[index]})`)
            setCloudsTexture(setupTexture(texture))
          },
          undefined,
          (error) => {
            console.error(`云层纹理加载失败 (${cloudTextureUrls[index]}):`, error)
            loadCloudsTexture(index + 1)
          }
        )
      }
      
      loadCloudsTexture()
      
      // 法线贴图
      textureLoader.load(
        'https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/planets/earth_normal_2048.jpg',
        (texture) => {
          console.log('法线贴图加载成功!')
          setNormalMapTexture(setupTexture(texture))
        },
        undefined,
        (error) => {
          console.error('法线贴图加载失败:', error)
        }
      )
    }
    
    // 清理函数
    return () => {
      // 清理纹理对象
      if (earthTexture) earthTexture.dispose()
      if (cloudsTexture) cloudsTexture.dispose()
      if (normalMapTexture) normalMapTexture.dispose()
    }
  }, [performanceMode, gl.capabilities])
  
  // 根据性能模式优化WebGL渲染器
  useEffect(() => {
    if (gl instanceof WebGLRenderer) {
      gl.powerPreference = "high-performance"
      gl.setPixelRatio(Math.min(window.devicePixelRatio, performanceMode ? 1.5 : 2))
      gl.setSize(window.innerWidth, window.innerHeight)
      gl.shadowMap.enabled = !performanceMode
      gl.antialias = !performanceMode
    }
  }, [gl, performanceMode])
  
  // 使用纯色材质作为基础颜色 - 调亮颜色
  const colorObj = new Color(color)
  // 让颜色更亮一些
  colorObj.multiplyScalar(1.5)

  // WebGL上下文处理
  useEffect(() => {
    const handleContextLost = (event: Event) => {
      event.preventDefault()
      console.warn("WebGL context lost. Attempting to restore...")
    }

    const handleContextRestored = () => {
      console.log("WebGL context restored")
      if (gl instanceof WebGLRenderer) {
        gl.setPixelRatio(Math.min(window.devicePixelRatio, performanceMode ? 1.5 : 2))
        gl.setSize(gl.domElement.clientWidth, gl.domElement.clientHeight)
      }
    }

    const canvas = gl.domElement
    canvas.addEventListener("webglcontextlost", handleContextLost)
    canvas.addEventListener("webglcontextrestored", handleContextRestored)

    return () => {
      canvas.removeEventListener("webglcontextlost", handleContextLost)
      canvas.removeEventListener("webglcontextrestored", handleContextRestored)
    }
  }, [gl, performanceMode])

  // 旋转动画，添加高光特效
  useFrame((state, delta) => {
    if (meshRef.current && autoRotate) {
      meshRef.current.rotation.y += delta * rotationSpeed
    }
    
    // 云层旋转速度稍快
    if (cloudsRef.current && autoRotate) {
      cloudsRef.current.rotation.y += delta * (rotationSpeed * 1.1)
    }
    
    // 高光随相机移动，创造阳光照射效果
    if (highlightRef.current) {
      // 计算指向相机的方向作为"太阳方向"
      const cameraPosition = state.camera.position.clone().normalize();
      
      // 更新高光位置，使其始终位于相机和地球之间
      highlightRef.current.position.set(
        cameraPosition.x * 2, 
        cameraPosition.y * 2, 
        cameraPosition.z * 2
      );
    }
  })

  // 根据性能模式和纹理加载状态渲染地球
  return (
    <>
      {/* 加载状态信息 - 仅在加载中显示 */}
      {!textureLoaded && (
        <group position={[0, 0, 0]}>
          <mesh>
            <sphereGeometry args={[2.2, 16, 16]} />
            <meshBasicMaterial color="black" transparent opacity={0.7} />
          </mesh>
          {/* 不使用Html组件，而是用纯3D对象显示加载状态 */}
          <mesh>
            <sphereGeometry args={[1.5, 24, 24]} />
            <meshBasicMaterial color={colorObj} />
          </mesh>
        </group>
      )}
      
      {/* 地球本体 */}
      <mesh ref={meshRef}>
        <sphereGeometry args={[2, performanceMode ? 32 : 64, performanceMode ? 32 : 64]} />
        
        {/* 有纹理时使用纹理，否则使用纯色 */}
        {textureLoaded && earthTexture ? (
          performanceMode ? (
            <meshBasicMaterial 
              map={earthTexture} 
              color="white" // 使用白色不再影响纹理本身颜色
            />
          ) : (
            <meshStandardMaterial 
              map={earthTexture}
              normalMap={normalMapTexture}
              normalScale={[0.6, 0.6]} // 降低法线贴图强度以减少暗部
              color="white" // 使用白色让纹理原色更明显
              metalness={0.05} // 降低金属度
              roughness={0.7} // 保持一定粗糙度
              emissive={new Color(0x333333)} // 增加自发光
              emissiveIntensity={0.2} // 提高自发光强度
            />
          )
        ) : (
          // 纹理未加载时使用单色材质
          <meshStandardMaterial 
            color={colorObj}
            metalness={0.2}
            roughness={0.7}
            emissive={colorObj}
            emissiveIntensity={0.1}
          />
        )}
      </mesh>
      
      {/* 添加夜晚光照效果-城市灯光 */}
      {!performanceMode && textureLoaded && (
        <mesh rotation={meshRef.current ? meshRef.current.rotation : [0, 0, 0]}>
          <sphereGeometry args={[2.001, 64, 64]} />
          <meshBasicMaterial
            color={new Color(0xffcc77)}
            transparent={true}
            opacity={0.2}
            blending={AdditiveBlending} // AdditiveBlending
          />
        </mesh>
      )}
      
      {/* 添加阳光照射高光 */}
      <pointLight 
        ref={highlightRef}
        position={[5, 0, 5]} 
        intensity={1.5} 
        distance={10}
        color={new Color(0xffffee)}
      />
      
      {/* 添加地球轮廓高光 - 将蓝色改为白色减淡的颜色 */}
      <mesh scale={2.01}>
        <sphereGeometry args={[1, 32, 32]} />
        <meshBasicMaterial 
          color={new Color(0xffffff)}
          transparent={true}
          opacity={0.05} // 降低不透明度
          side={DoubleSide} // 双面渲染
        />
      </mesh>
      
      {/* 云层 - 仅在高质量模式且纹理加载成功时显示 */}
      {!performanceMode && cloudsTexture && (
        <mesh ref={cloudsRef} scale={1.02}>
          <sphereGeometry args={[2, 48, 48]} />
          <meshStandardMaterial
            map={cloudsTexture}
            transparent={true}
            opacity={0.6} // 提高云层透明度，让下方地球更容易看到
            depthWrite={false}
            color="white" // 使云层更亮
            emissive={new Color(0xffffff)} // 云层发光
            emissiveIntensity={0.1} // 发光强度
          />
        </mesh>
      )}
    </>
  )
}

export default function EarthScene({ color, rotationSpeed, autoRotate, performanceMode = true }: EarthProps) {
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
  }, [])

  if (!isClient) {
    return <div className="w-full h-full bg-slate-900 flex items-center justify-center">加载3D地球中...</div>
  }

  return (
    <div className="relative w-full h-full">
      <ErrorBoundary fallback={<div className="text-white">3D场景加载失败，请刷新页面。</div>}>
        <Canvas
          camera={{ position: [0, 0, 6], fov: 45 }}
          dpr={performanceMode ? [1, 1.5] : [1, 2]} // 根据性能模式调整分辨率
          performance={{ min: performanceMode ? 0.5 : 0.8 }} // 根据性能模式调整最低性能
          gl={{
            antialias: !performanceMode, // 性能模式下关闭抗锯齿
            alpha: false,
            depth: true,
            stencil: false,
            powerPreference: 'high-performance'
          }}
          onCreated={({ gl }) => {
            gl.setClearColor(0x000015, 1) // 稍微调亮背景色
            
            // 优化渲染尺寸，使用容器大小而不是窗口大小
            const resizeObserver = new ResizeObserver((entries) => {
              for (const entry of entries) {
                const { width, height } = entry.contentRect;
                gl.setSize(width, height);
              }
            });
            
            // 观察Canvas的父元素
            const container = gl.domElement.parentElement;
            if (container) {
              resizeObserver.observe(container);
            }
            
            return () => {
              if (container) {
                resizeObserver.unobserve(container);
              }
            };
          }}
        >
          <Suspense fallback={null}>
            {/* 增加场景整体环境光 */}
            <ambientLight intensity={1.0} />
            
            {/* 主光源 - 模拟太阳光 */}
            <directionalLight position={[5, 3, 5]} intensity={2.0} color="#ffffff" />
            
            {/* 添加背光源，增强地球轮廓可见度 */}
            <directionalLight position={[-5, -2, -3]} intensity={0.3} color="#4080ff" />
            
            {/* 添加顶光源，增强北半球亮度 */}
            <pointLight position={[0, 5, 0]} intensity={0.5} color="#ffffff" distance={10} />
            
            {/* 地球本体与性能模式参数 */}
            <Earth 
              color={color} 
              rotationSpeed={rotationSpeed} 
              autoRotate={autoRotate} 
              performanceMode={performanceMode}
            />
            
            <color attach="background" args={["#000015"]} />
            
            {/* 根据性能模式调整星星数量 */}
            {performanceMode ? (
              <Stars radius={100} depth={50} count={2000} factor={4} saturation={0.5} fade speed={0.5} />
            ) : (
              <Stars radius={100} depth={50} count={5000} factor={5} saturation={0.5} fade speed={0.5} />
            )}
            
            <OrbitControls 
              enableZoom={true} 
              enablePan={false} 
              autoRotate={false} 
              minDistance={3} 
              maxDistance={10}
              enableDamping={!performanceMode} // 性能模式下关闭阻尼效果
            />
          </Suspense>
        </Canvas>
      </ErrorBoundary>
    </div>
  )
}

