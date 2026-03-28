/**
 * GLSL shaders for the voice-reactive aural blob.
 *
 * Vertex shader: multi-octave simplex noise displacement driven by audio frequency bands.
 * Fragment shader: gradient color based on displacement + fresnel rim glow.
 */

export const vertexShader = /* glsl */ `
  uniform float uTime;
  uniform float uBass;
  uniform float uMid;
  uniform float uTreble;
  uniform float uAmplitude;

  varying vec3 vNormal;
  varying vec3 vViewPosition;
  varying float vDisplacement;

  //
  // Simplex 3D noise (Ashima Arts / Stefan Gustavson)
  //
  vec4 permute(vec4 x) { return mod(((x * 34.0) + 1.0) * x, 289.0); }
  vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }

  float snoise(vec3 v) {
    const vec2 C = vec2(1.0 / 6.0, 1.0 / 3.0);
    const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);

    vec3 i  = floor(v + dot(v, C.yyy));
    vec3 x0 = v - i + dot(i, C.xxx);

    vec3 g = step(x0.yzx, x0.xyz);
    vec3 l = 1.0 - g;
    vec3 i1 = min(g.xyz, l.zxy);
    vec3 i2 = max(g.xyz, l.zxy);

    vec3 x1 = x0 - i1 + C.xxx;
    vec3 x2 = x0 - i2 + C.yyy;
    vec3 x3 = x0 - D.yyy;

    i = mod(i, 289.0);
    vec4 p = permute(permute(permute(
              i.z + vec4(0.0, i1.z, i2.z, 1.0))
            + i.y + vec4(0.0, i1.y, i2.y, 1.0))
            + i.x + vec4(0.0, i1.x, i2.x, 1.0));

    float n_ = 1.0 / 7.0;
    vec3 ns = n_ * D.wyz - D.xzx;

    vec4 j = p - 49.0 * floor(p * ns.z * ns.z);

    vec4 x_ = floor(j * ns.z);
    vec4 y_ = floor(j - 7.0 * x_);

    vec4 x = x_ * ns.x + ns.yyyy;
    vec4 y = y_ * ns.x + ns.yyyy;
    vec4 h = 1.0 - abs(x) - abs(y);

    vec4 b0 = vec4(x.xy, y.xy);
    vec4 b1 = vec4(x.zw, y.zw);

    vec4 s0 = floor(b0) * 2.0 + 1.0;
    vec4 s1 = floor(b1) * 2.0 + 1.0;
    vec4 sh = -step(h, vec4(0.0));

    vec4 a0 = b0.xzyw + s0.xzyw * sh.xxyy;
    vec4 a1 = b1.xzyw + s1.xzyw * sh.zzww;

    vec3 p0 = vec3(a0.xy, h.x);
    vec3 p1 = vec3(a0.zw, h.y);
    vec3 p2 = vec3(a1.xy, h.z);
    vec3 p3 = vec3(a1.zw, h.w);

    vec4 norm = taylorInvSqrt(vec4(dot(p0, p0), dot(p1, p1), dot(p2, p2), dot(p3, p3)));
    p0 *= norm.x;
    p1 *= norm.y;
    p2 *= norm.z;
    p3 *= norm.w;

    vec4 m = max(0.6 - vec4(dot(x0, x0), dot(x1, x1), dot(x2, x2), dot(x3, x3)), 0.0);
    m = m * m;
    return 42.0 * dot(m * m, vec4(dot(p0, x0), dot(p1, x1), dot(p2, x2), dot(p3, x3)));
  }

  void main() {
    vec3 pos = position;

    // Layer 1: slow organic breathing (always on)
    float noise1 = snoise(pos * 1.5 + uTime * 0.2) * 0.12;

    // Layer 2: bass-driven membrane wobble (large, slow)
    float noise2 = snoise(pos * 2.5 + uTime * 0.6) * uBass * 0.35;

    // Layer 3: mid-driven medium detail
    float noise3 = snoise(pos * 4.0 + uTime * 1.0) * uMid * 0.2;

    // Layer 4: treble-driven fine ripples
    float noise4 = snoise(pos * 7.0 + uTime * 1.8) * uTreble * 0.12;

    float displacement = noise1 + noise2 + noise3 + noise4;

    // Scale overall displacement by amplitude
    displacement *= (1.0 + uAmplitude * 0.6);

    vDisplacement = displacement;
    vNormal = normalize(normalMatrix * normal);

    vec3 newPos = pos + normal * displacement;
    vec4 mvPosition = modelViewMatrix * vec4(newPos, 1.0);
    vViewPosition = -mvPosition.xyz;

    gl_Position = projectionMatrix * mvPosition;
  }
`;

export const fragmentShader = /* glsl */ `
  uniform float uTime;
  uniform float uAmplitude;
  uniform float uBass;

  varying vec3 vNormal;
  varying vec3 vViewPosition;
  varying float vDisplacement;

  void main() {
    // Fresnel rim lighting
    vec3 viewDir = normalize(vViewPosition);
    float fresnel = 1.0 - max(dot(viewDir, vNormal), 0.0);
    fresnel = pow(fresnel, 2.5);

    // Base colors: cool indigo at rest, shifting to cyan/violet with energy
    vec3 colorRest = vec3(0.24, 0.22, 0.88);    // indigo
    vec3 colorActive = vec3(0.30, 0.75, 0.95);   // cyan
    vec3 colorHot = vec3(0.65, 0.30, 0.90);      // violet

    // Blend based on displacement and amplitude
    float energy = clamp(uAmplitude * 1.5, 0.0, 1.0);
    vec3 baseColor = mix(colorRest, colorActive, energy);
    baseColor = mix(baseColor, colorHot, clamp(vDisplacement * 2.0, 0.0, 1.0));

    // Emissive glow — boosted to compensate for no Bloom post-processing
    float emissive = 0.55 + vDisplacement * 1.0 + uBass * 0.4;

    // Combine with fresnel rim
    vec3 rimColor = vec3(0.5, 0.7, 1.0); // blue-white rim
    vec3 finalColor = baseColor * emissive + rimColor * fresnel * (0.7 + energy * 0.6);

    // Slight transparency at edges for ethereal look
    float alpha = 0.9 + fresnel * 0.1;

    gl_FragColor = vec4(finalColor, alpha);
  }
`;
