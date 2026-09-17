import * as THREE from "three";

/**
 * A Reflector shader that applies a box blur to the reflection,
 * so the floor reads as a soft / out-of-focus mirror rather than a
 * pixelated low-res one. Pass this as the `shader` option to Reflector,
 * then set `blur` (radius in texels) and `texelSize` (1/resolution) uniforms.
 */
export const BlurReflectorShader = {
  name: "BlurReflectorShader",

  uniforms: {
    color: { value: null },
    tDiffuse: { value: null },
    textureMatrix: { value: null },
    blur: { value: 8.0 },
    texelSize: { value: new THREE.Vector2(1 / 512, 1 / 512) },
  },

  vertexShader: /* glsl */ `
    uniform mat4 textureMatrix;
    varying vec4 vUv;

    #include <common>
    #include <logdepthbuf_pars_vertex>

    void main() {
      vUv = textureMatrix * vec4( position, 1.0 );
      gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
      #include <logdepthbuf_vertex>
    }
  `,

  fragmentShader: /* glsl */ `
    uniform vec3 color;
    uniform sampler2D tDiffuse;
    uniform float blur;
    uniform vec2 texelSize;
    varying vec4 vUv;

    #include <logdepthbuf_pars_fragment>

    float blendOverlay( float base, float blend ) {
      return ( base < 0.5 ? ( 2.0 * base * blend ) : ( 1.0 - 2.0 * ( 1.0 - base ) * ( 1.0 - blend ) ) );
    }

    vec3 blendOverlay( vec3 base, vec3 blend ) {
      return vec3(
        blendOverlay( base.r, blend.r ),
        blendOverlay( base.g, blend.g ),
        blendOverlay( base.b, blend.b )
      );
    }

    void main() {
      #include <logdepthbuf_fragment>

      vec2 uv = vUv.xy / vUv.w;
      vec3 acc = vec3( 0.0 );
      float wsum = 0.0;

      // 5x5 box blur (25 samples)
      for ( int x = -2; x <= 2; x++ ) {
        for ( int y = -2; y <= 2; y++ ) {
          vec2 off = vec2( float( x ), float( y ) ) * texelSize * blur;
          acc += texture2D( tDiffuse, uv + off ).rgb;
          wsum += 1.0;
        }
      }

      vec3 base = acc / wsum;
      gl_FragColor = vec4( blendOverlay( base, color ), 1.0 );

      #include <tonemapping_fragment>
      #include <colorspace_fragment>
    }
  `,
};
