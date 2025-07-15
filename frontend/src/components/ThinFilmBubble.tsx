import { useEffect, useRef } from "react";
import * as THREE from "three";
import { PMREMGenerator } from "three";

interface Props {
  diameter?: number; // default 16px
  children?: React.ReactNode;
}

export default function ThinFilmBubble({ diameter = 80, children }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    // --- Scene boiler-plate (miniature) -------------------------
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 20);
    camera.position.z = 4;

    const renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: true,
      canvas: canvasRef.current!,
    });
    renderer.setSize(diameter, diameter); // 1:1 pixel texel ratio
    renderer.setPixelRatio(window.devicePixelRatio);

    // --- Thin-film material (same as main bubble) ---
    const mat = new THREE.MeshPhysicalMaterial({
      transmission: 1,
      roughness: 0,
      thickness: 0.0004,
      iridescence: 1,
      iridescenceIOR: 1.3,
      iridescenceThicknessRange: [50, 800],
      envMapIntensity: 1.25,
      clearcoat: 1,
      clearcoatRoughness: 0.02, // Set clearcoatRoughness
      side: THREE.FrontSide,
      transparent: true,
      opacity: 1,
      blending: THREE.NormalBlending,
    });
    mat.onBeforeCompile = (s) => {
      s.uniforms.time = { value: 0 };
      // Add snoise function and modify thickness in fragment shader
      s.fragmentShader = `
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
      s.vertexShader = s.vertexShader
        .replace(
          "void main() {",
          `uniform float time;\nvarying vec2 vUv;\nvoid main() {`
        )
        .replace(
          "#include <begin_vertex>",
          `#include <begin_vertex>
vUv = uv;
float amp=0.01;
float wobble = sin(position.y*8.0+time*1.6)*cos(position.x*7.0+time*1.3);
transformed += normal*amp*wobble;`
        );
      (mat as any).userData.shader = s;
    };
    const sphere = new THREE.Mesh(new THREE.SphereGeometry(1, 192, 192), mat); // Increased resolution
    scene.add(sphere);

    // ------------- idle loop ------------------------------------
    let t = 0;
    let frameId: number;
    const loop = () => {
      t += 0.016;
      if (mat.userData.shader) {
        mat.userData.shader.uniforms.time.value = t;
      }
      sphere.rotation.y += 0.002;
      renderer.render(scene, camera);
      frameId = requestAnimationFrame(loop);
    };
    loop();

    return () => {
      renderer.dispose();
      cancelAnimationFrame(frameId);
    };
  }, [diameter]);

  return (
    <div
      style={{
        width: diameter,
        height: diameter,
        position: "relative",
        display: "inline-block",
      }}
    >
      <canvas
        ref={canvasRef}
        width={diameter}
        height={diameter}
        style={{ width: diameter, height: diameter, display: "block" }}
      />
      {children && (
        <span
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            width: "100%",
            height: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontWeight: 600,
            fontSize: diameter * 0.38,
            color: "#333",
            pointerEvents: "none",
            userSelect: "none",
            textShadow: "0 1px 1px rgba(255,255,255,0.7)",
          }}
        >
          {children}
        </span>
      )}
    </div>
  );
}
