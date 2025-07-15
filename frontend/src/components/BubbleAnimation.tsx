import React, { useRef, useEffect } from "react";
import * as THREE from "three";
import styled from "styled-components";
import { PMREMGenerator } from "three";

interface BubbleAnimationProps {
  onClick: (event: React.MouseEvent<HTMLDivElement>) => void;
  onWobbleUpdate: (wobbleX: number, wobbleY: number) => void;
  children: React.ReactNode;
  bubbleRef: React.RefObject<ProductionBubble | null>;
  onLiftComplete?: () => void; // New optional prop
}

const CanvasContainer = styled.div`
  position: relative;
  width: 100%;
  height: 100%;
  cursor: pointer;
`;

// Simplified, more compatible shaders
const optimizedBubbleVertexShader = `
varying vec3 vNormal;
varying vec3 vViewPosition;
varying vec3 vWorldPosition;
varying vec2 vUv;

void main() {
  vUv = uv;
  vec4 worldPosition = modelMatrix * vec4(position, 1.0);
  vWorldPosition = worldPosition.xyz;
  
  vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
  vViewPosition = -mvPosition.xyz;
  vNormal = normalMatrix * normal;
  
  gl_Position = projectionMatrix * mvPosition;
}
`;

const optimizedBubbleFragmentShader = `
uniform float time;

varying vec3 vNormal;
varying vec3 vViewPosition;
varying vec3 vWorldPosition;
varying vec2 vUv;

// snoise function for 3D noise
vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec4 mod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec4 permute(vec4 x) { return mod289(((x*34.0)+1.0)*x); }
vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }

float snoise(vec3 v) {
  const vec2 C = vec2(1.0/6.0, 1.0/3.0);
  const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);

  vec3 i = floor(v + dot(v, C.yyy));
  vec3 x0 = v - i + dot(i, C.xxx);

  vec3 g = step(x0.yzx, x0.xyz);
  vec3 l = 1.0 - g;
  vec3 i1 = min(g.xyz, l.zxy);
  vec3 i2 = max(g.xyz, l.zxy);

  vec3 x1 = x0 - i1 + C.xxx;
  vec3 x2 = x0 - i2 + C.yyy;
  vec3 x3 = x0 - D.yyy;

  i = mod289(i);
  vec4 p = permute(permute(permute(i.z + vec4(0.0, i1.z, i2.z, 1.0)) + i.y + vec4(0.0, i1.y, i2.y, 1.0)) + i.x + vec4(0.0, i1.x, i2.x, 1.0));

  float n_ = 0.142857142857; // 1.0/7.0
  vec3 ns = p.xyz * n_ - 1.0;
  vec4 j = p - 49.0 * floor(p * n_);  // a bit faster if we use a multiply instead of a division

  vec4 x_ = floor(j * n_);
  vec4 y_ = floor(j - 7.0 * x_); // mod7

  vec4 x = x_ * 0.142857142857;
  vec4 y = y_ * 0.142857142857;
  vec4 h = 1.0 - abs(x) - abs(y);

  vec4 b0 = vec4(x.xy, y.xy);
  vec4 b1 = vec4(x.zw, y.zw);

  vec4 s0 = floor(b0*2.0)+mod(b0,2.0);
  vec4 s1 = floor(b1*2.0)+mod(b1,2.0);

  vec4 sh = -step(h, vec4(0.0));

  vec4 a0 = b0.xzyw + s0.xzyw * sh.xxyy;
  vec4 a1 = b1.xzyw + s1.xzyw * sh.zzww;

  vec3 p0 = vec3(a0.x, a0.y, h.x);
  vec3 p1 = vec3(a0.z, a0.w, h.y);
  vec3 p2 = vec3(a1.x, a1.y, h.z);
  vec3 p3 = vec3(a1.z, a1.w, h.w);

  vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2,p2), dot(p3,p3)));
  p0 *= norm.x;
  p1 *= norm.y;
  p2 *= norm.z;
  p3 *= norm.w;

  vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
  m = m * m;
  m = m * m;

  vec4 G = vec4(dot(p0,x0), dot(p1,x1), dot(p2,x2), dot(p3,x3));
  return 42.0 * dot(m, G);
}

void main() {
  vec3 normal = normalize(vNormal);
  vec3 viewDir = normalize(vViewPosition);
  float NdotV = max(dot(normal, viewDir), 0.0);
  
  // Simple thickness variation with noise
  float n = snoise(vec3(vWorldPosition.xy * 8.0, time * 0.5));
  float thickness = 0.3 + n * 0.15;
  
  // Simple iridescence effect
  float interference = sin(thickness * 25.0 + time * 0.1) * 0.5 + 0.5;
  vec3 iridescence = vec3(0.8, 0.9, 1.0) * interference * 0.6;
  
  // Fresnel effect
  float fresnel = 0.04 + 0.96 * pow(1.0 - NdotV, 2.0);
  
  // Edge glow
  float edgeGlow = pow(1.0 - NdotV, 1.5);
  
  // Final color composition
  vec3 finalColor = iridescence * 0.8 + vec3(0.7, 0.8, 1.0) * edgeGlow * 0.4;
  
  // Alpha calculation
  float alpha = 0.15 + fresnel * 0.25 + edgeGlow * 0.2;
  alpha = max(alpha, 0.1);
  
  gl_FragColor = vec4(finalColor, alpha);
}
`;

export class ProductionBubble {
  scene: THREE.Scene;
  renderer: THREE.WebGLRenderer;
  camera: THREE.PerspectiveCamera;
  time: number;
  bubbleGroup!: THREE.Group;
  filmMaterial!: THREE.MeshPhysicalMaterial;
  carrier!: THREE.Mesh;
  private lifting = false;
  private liftStart = 0;
  private liftDur = 2.5; // seconds
  private liftDist = 15; // world-units the bubble will climb
  private lastFrameTime: number;
  private onLiftCompleteCallback?: () => void;

  startLift(onLiftComplete?: () => void) {
    if (!this.lifting) {
      this.liftStart = this.time;
      this.lifting = true;
      this.onLiftCompleteCallback = onLiftComplete;
    }
  }

  animate(t: DOMHighResTimeStamp): void {
    if (this.lastFrameTime === 0) {
      this.lastFrameTime = t;
    }
    const deltaTime = (t - this.lastFrameTime) / 1000; // Convert to seconds
    this.time += deltaTime; // Update this.time based on delta
    this.lastFrameTime = t;

    if (this.lifting) {
      const elapsed = this.time - this.liftStart;
      if (elapsed < this.liftDur) {
        const progress = elapsed / this.liftDur;
        // Ease-out function: 1 - (1-x)^3
        const easedProgress = 1 - Math.pow(1 - progress, 3);

        this.bubbleGroup.position.y =
          this.bubbleGroup.userData.startY + this.liftDist * easedProgress;

        // Scale down to almost nothing (e.g., 0.1 of original size)
        const scaleProgress = easedProgress; // Use eased progress for scaling
        const currentScale = 1 - 0.9 * scaleProgress; // From 1 to 0.1
        this.bubbleGroup.scale.setScalar(currentScale);

        // Fade out materials
        const opacityProgress = easedProgress; // Use eased progress for opacity
        const currentOpacity = 1 - opacityProgress; // From 1 to 0
        (this.carrier.material as THREE.MeshBasicMaterial).opacity = Math.max(
          0,
          0.03 * currentOpacity
        );
        this.filmMaterial.opacity = Math.max(0, currentOpacity); // Ensure it doesn't go negative
      } else {
        this.lifting = false;
        // Ensure it reaches the final position and is completely invisible
        this.bubbleGroup.position.y =
          this.bubbleGroup.userData.startY + this.liftDist;
        this.bubbleGroup.scale.setScalar(0.1); // Smallest visible size if needed
        (this.carrier.material as THREE.MeshBasicMaterial).opacity = 0;
        this.filmMaterial.opacity = 0;

        if (this.onLiftCompleteCallback) {
          this.onLiftCompleteCallback();
          this.onLiftCompleteCallback = undefined; // Clear the callback after execution
        }
      }
    }

    if (this.filmMaterial.userData.shader) {
      this.filmMaterial.userData.shader.uniforms.time.value = this.time;
    }

    // idle sideways bob
    const sideBob = Math.sin(this.time * 0.4) * 0.2;
    this.bubbleGroup.position.x = sideBob;
    this.bubbleGroup.rotation.y += 0.003;
  }

  constructor(
    scene: THREE.Scene,
    renderer: THREE.WebGLRenderer,
    camera: THREE.PerspectiveCamera
  ) {
    this.scene = scene;
    this.renderer = renderer;
    this.camera = camera;
    this.time = 0;
    this.lastFrameTime = 0;
    this.setupEnvironment();
    this.createBubble();
    this.setupOptimizedLighting();
  }

  setupEnvironment(): void {
    // Generate a bright, radial-gradient cubemap
    const size = 64;
    const faces: HTMLCanvasElement[] = [];
    for (let i = 0; i < 6; i++) {
      const canvas = document.createElement("canvas");
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext("2d")!;
      // Brighter radial gradient
      const gradient = ctx.createRadialGradient(
        size / 2,
        size / 2,
        0,
        size / 2,
        size / 2,
        size / 2
      );
      const hue = i * 60;
      gradient.addColorStop(0, `hsl(${hue + 200}, 70%, 90%)`);
      gradient.addColorStop(0.7, `hsl(${hue + 220}, 60%, 80%)`);
      gradient.addColorStop(1, `hsl(${hue + 240}, 50%, 65%)`);
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, size, size);
      // Add a white highlight
      ctx.fillStyle = "rgba(255,255,255,0.18)";
      ctx.beginPath();
      ctx.arc(size / 2, size / 2, size / 3, 0, Math.PI * 2);
      ctx.fill();
      faces.push(canvas);
    }
    const cubemap = new THREE.CubeTexture(faces);
    cubemap.format = THREE.RGBAFormat;
    cubemap.type = THREE.UnsignedByteType;
    cubemap.generateMipmaps = false;
    cubemap.minFilter = THREE.LinearFilter;
    cubemap.magFilter = THREE.LinearFilter;
    cubemap.wrapS = THREE.ClampToEdgeWrapping;
    cubemap.wrapT = THREE.ClampToEdgeWrapping;
    cubemap.needsUpdate = true;
    // PMREM for proper specular
    const pmrem = new PMREMGenerator(this.renderer);
    const envMap = pmrem.fromCubemap(cubemap).texture;
    this.scene.environment = envMap;
    // Optionally: this.scene.background = envMap;
    pmrem.dispose();
  }

  createBubble(): void {
    this.bubbleGroup = new THREE.Group();
    // Main film layer
    this.filmMaterial = new THREE.MeshPhysicalMaterial({
      transmission: 1,
      roughness: 0,
      thickness: 0.0004,
      iridescence: 1,
      iridescenceIOR: 1.3,
      iridescenceThicknessRange: [50, 800],
      envMapIntensity: 1.25,
      clearcoat: 1,
      clearcoatRoughness: 0,
      side: THREE.FrontSide,
      transparent: true,
      opacity: 1,
      blending: THREE.NormalBlending,
    });
    // Add wobble via onBeforeCompile
    this.filmMaterial.onBeforeCompile = (shader) => {
      // 1. Declare the uniform at the top
      shader.uniforms.time = { value: 0 };
      shader.vertexShader = shader.vertexShader
        .replace(
          "void main() {",
          `uniform float time;\nvarying vec2 vUv;\nvoid main() {`
        )
        .replace(
          "#include <begin_vertex>",
          `#include <begin_vertex>
vUv = uv;
float amp = 0.012;
float wobble = sin(position.y * 8.0 + time * 1.6) *
               cos(position.x * 7.0 + time * 1.3);
transformed += normal * amp * wobble;`
        );
      this.filmMaterial.userData.shader = shader;
    };
    this.filmMaterial.clearcoatRoughness = 0.02; // Set clearcoatRoughness
    const filmSphere = new THREE.Mesh(
      new THREE.SphereGeometry(1.7, 192, 192),
      this.filmMaterial
    );
    this.bubbleGroup.add(filmSphere);
    // Carrier sphere for subtle depth
    this.carrier = new THREE.Mesh(
      new THREE.SphereGeometry(1.7, 192, 192),
      new THREE.MeshBasicMaterial({
        color: 0xffffff,
        opacity: 0.03,
        transparent: true,
        side: THREE.FrontSide,
        blending: THREE.NormalBlending,
      })
    );
    this.bubbleGroup.add(this.carrier);
    // 2. Anchor the group at y=0
    this.bubbleGroup.position.set(0, 0, 0);
    this.bubbleGroup.userData.startY = 0;
    this.scene.add(this.bubbleGroup);
  }

  setupOptimizedLighting(): void {
    // Brighter key light for better specular highlights
    const keyLight = new THREE.DirectionalLight(0xffffff, 1.2);
    keyLight.position.set(5, 5, 5);
    this.scene.add(keyLight);
    // Cooler fill light for contrast
    const fillLight = new THREE.DirectionalLight(0x88aaff, 0.6);
    fillLight.position.set(-3, 2, -4);
    this.scene.add(fillLight);
    // Subtle ambient for overall illumination
    const ambientLight = new THREE.AmbientLight(0x404050, 0.4);
    this.scene.add(ambientLight);
  }
}

const BubbleAnimation: React.FC<BubbleAnimationProps> = ({
  onClick: onCanvasClick,
  onWobbleUpdate,
  children,
  bubbleRef,
  onLiftComplete,
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const currentBubbleRef = useRef<ProductionBubble | null>(null);
  const animationFrameId = useRef<number | null>(null);

  useEffect(() => {
    if (mountRef.current) {
      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(
        75,
        mountRef.current.clientWidth / mountRef.current.clientHeight,
        0.1,
        1000
      );
      camera.position.z = 7; // Pull back camera to fit bubble

      const renderer = new THREE.WebGLRenderer({
        alpha: true,
        antialias: true,
      });
      renderer.setSize(
        mountRef.current.clientWidth,
        mountRef.current.clientHeight
      );
      mountRef.current.appendChild(renderer.domElement);

      const bubble = new ProductionBubble(scene, renderer, camera);
      currentBubbleRef.current = bubble;
      if (bubbleRef) {
        bubbleRef.current = bubble;
      }

      const handleResize = () => {
        camera.aspect =
          mountRef.current!.clientWidth / mountRef.current!.clientHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(
          mountRef.current!.clientWidth,
          mountRef.current!.clientHeight
        );
      };

      window.addEventListener("resize", handleResize);

      const animateLoop = (t: DOMHighResTimeStamp) => {
        animationFrameId.current = requestAnimationFrame(animateLoop);
        const bubbleObj = currentBubbleRef.current;
        if (!bubbleObj) return;
        // Calculate wobble (for callback, not for shader)
        const wobbleX = Math.sin(t * 0.001) * 0.5; // Example wobble factor
        const wobbleY = Math.cos(t * 0.0008) * 0.5; // Example wobble factor
        onWobbleUpdate(wobbleX, wobbleY);

        bubbleObj.animate(t); // Call the ProductionBubble's animate method with t
        renderer.render(scene, camera);
      };

      animateLoop(0); // Initial call with 0

      return () => {
        window.removeEventListener("resize", handleResize);
        if (animationFrameId.current) {
          cancelAnimationFrame(animationFrameId.current);
        }
        if (mountRef.current && renderer.domElement) {
          mountRef.current.removeChild(renderer.domElement);
        }
        if (currentBubbleRef.current) {
          scene.remove(currentBubbleRef.current.bubbleGroup);
        }
        renderer.dispose();
      };
    }
  }, [onWobbleUpdate]);

  // Wrap onClick to trigger lift
  const handleClick = (event: React.MouseEvent<HTMLDivElement>) => {
    currentBubbleRef.current?.startLift(onLiftComplete); // Pass onLiftComplete directly
    (onCanvasClick as (e: React.MouseEvent<HTMLDivElement>) => void)(event); // Explicitly cast and call
  };

  return (
    <CanvasContainer ref={mountRef} onClick={handleClick}>
      {children}
    </CanvasContainer>
  );
};

export default BubbleAnimation;
