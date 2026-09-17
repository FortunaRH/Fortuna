"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import * as THREE from "three";
import { Reflector } from "three/examples/jsm/objects/Reflector.js";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/examples/jsm/postprocessing/UnrealBloomPass.js";
import { ShaderPass } from "three/examples/jsm/postprocessing/ShaderPass.js";
import { FilmPass } from "three/examples/jsm/postprocessing/FilmPass.js";
import { VignetteShader } from "three/examples/jsm/shaders/VignetteShader.js";
import { BlurReflectorShader } from "@/lib/blurReflector";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { createTvFromGltf, createGlowTexture, type CrtTv } from "@/lib/crtTv";
import { getDestination, startLoading } from "@/lib/loadingStore";
import { TOKEN_URL } from "@/lib/contracts";

const SCRAMBLE = "$!%#@^&*()<>?:";
const W = 512;
const H = 384;

type Screen = {
  ctx: CanvasRenderingContext2D;
  texture: THREE.CanvasTexture;
  word: string;
  status: "idle" | "glitch" | "on";
  glitchAt: number;
  reveal: number;
};

type Entry = { tv: CrtTv; screen: Screen; id: number };

export default function Landing3D() {
  const containerRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const [gltfScene, setGltfScene] = useState<THREE.Object3D | null>(null);

  useEffect(() => {
    let cancelled = false;
    const loader = new GLTFLoader();
    loader
      .loadAsync("/crt.glb")
      .then((gltf) => {
        if (!cancelled) setGltfScene(gltf.scene);
      })
      .catch((err) => console.error("Failed to load crt.glb:", err));
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!gltfScene) return;
    const container = containerRef.current;
    if (!container) return;

    // --- renderer ---
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(container!.clientWidth, container!.clientHeight);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.0;
    container!.appendChild(renderer.domElement);

    // --- scene + camera ---
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x000000);

    const camera = new THREE.PerspectiveCamera(
      46,
      container!.clientWidth / container!.clientHeight,
      0.1,
      50,
    );
    camera.position.set(0, 0.35, 8.2);

    // Cinematic post-processing: bloom + vignette + film grain.
    const composer = new EffectComposer(renderer);
    composer.addPass(new RenderPass(scene, camera));
    const bloom = new UnrealBloomPass(
      new THREE.Vector2(container!.clientWidth, container!.clientHeight),
      0.3,
      0.35,
      0.9,
    );
    composer.addPass(bloom);
    const vignette = new ShaderPass(VignetteShader);
    vignette.uniforms.offset.value = 0.95;
    vignette.uniforms.darkness.value = 1.5;
    composer.addPass(vignette);
    const grain = new FilmPass(0.25, false);
    composer.addPass(grain);

    // Rim lights behind the CRTs to outline their silhouettes against the dark.
    const rimL = new THREE.DirectionalLight(0x9ab0d0, 2.0);
    rimL.position.set(-4, 3, -4);
    scene.add(rimL);
    const rimR = new THREE.DirectionalLight(0x9ab0d0, 2.0);
    rimR.position.set(4, 3, -4);
    scene.add(rimR);

    // Front light (from the viewer's POV) to reveal the TV fronts.
    const front = new THREE.DirectionalLight(0xffffff, 3.0);
    front.position.set(0, 1.5, 6);
    scene.add(front);

    // --- floor ---
    // Reflective floor with a soft (blurred) mirror for a realistic sheen.
    const TEX_W = 2048;
    const TEX_H = 2048;
    const floor = new Reflector(new THREE.PlaneGeometry(60, 60), {
      clipBias: 0.003,
      textureWidth: TEX_W,
      textureHeight: TEX_H,
      color: 0x999999,
      shader: BlurReflectorShader,
    });
    const floorMat = floor.material as THREE.ShaderMaterial;
    floorMat.uniforms.blur.value = 6.0;
    floorMat.uniforms.texelSize.value.set(1 / TEX_W, 1 / TEX_H);
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = -0.85;
    scene.add(floor);

    // --- TVs + screens ---
    const glowTex = createGlowTexture();
    const entries: Entry[] = [];

    function setupScreen(tv: CrtTv, word: string, id: number) {
      const canvas = document.createElement("canvas");
      canvas.width = W;
      canvas.height = H;
      const ctx = canvas.getContext("2d")!;
      const texture = new THREE.CanvasTexture(canvas);
      texture.colorSpace = THREE.SRGBColorSpace;
      tv.screenMaterial.map = texture;
      tv.glowMaterial.map = glowTex;
      const screen: Screen = { ctx, texture, word, status: "idle", glitchAt: 0, reveal: 0 };
      entries.push({ tv, screen, id });
    }

    const tv1 = createTvFromGltf(gltfScene);
    tv1.group.position.x = -3.3;
    tv1.group.rotation.y = 0.16;
    tv1.group.userData.tvId = 1;
    scene.add(tv1.group);
    setupScreen(tv1, "HOME", 1);

    const tv3 = createTvFromGltf(gltfScene);
    tv3.group.position.x = -1.1;
    tv3.group.rotation.y = 0.06;
    tv3.group.userData.tvId = 3;
    scene.add(tv3.group);
    setupScreen(tv3, "NFTS", 3);

    const tv2 = createTvFromGltf(gltfScene);
    tv2.group.position.x = 1.1;
    tv2.group.rotation.y = -0.06;
    tv2.group.userData.tvId = 2;
    scene.add(tv2.group);
    setupScreen(tv2, "DOCS", 2);

    const tv4 = createTvFromGltf(gltfScene);
    tv4.group.position.x = 3.3;
    tv4.group.rotation.y = -0.16;
    tv4.group.userData.tvId = 4;
    scene.add(tv4.group);
    setupScreen(tv4, "TOKEN", 4);

    // --- canvas drawing ---
    function drawScanlines(ctx: CanvasRenderingContext2D) {
      ctx.fillStyle = "rgba(0,0,0,0.12)";
      for (let y = 0; y < H; y += 4) ctx.fillRect(0, y, W, 1);
    }

    function drawScreen(s: Screen) {
      const { ctx, word, status, reveal } = s;
      ctx.clearRect(0, 0, W, H);

      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      if (status === "idle") {
        // dark screen, white letters
        const g = ctx.createLinearGradient(0, 0, 0, H);
        g.addColorStop(0, "#0b0b0e");
        g.addColorStop(0.5, "#050506");
        g.addColorStop(1, "#08080a");
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, W, H);
        ctx.font = "140px 'VT323', monospace";
        ctx.fillStyle = "#f2f2ef";
        ctx.fillText(word, W / 2, H / 2);
      } else {
        // white background, black letters (glitching or settled)
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, W, H);
        const chars = word.split("");
        const revealed = status === "on" ? chars.length : Math.floor(reveal * chars.length);
        const text = chars
          .map((c, i) =>
            i < revealed ? c : SCRAMBLE[Math.floor(Math.random() * SCRAMBLE.length)],
          )
          .join("");
        ctx.font = "140px 'VT323', monospace";
        ctx.fillStyle = "#000000";
        ctx.fillText(text, W / 2, H / 2);
      }
      drawScanlines(ctx);
      s.texture.needsUpdate = true;
    }

    // --- interaction (raycasting) ---
    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();
    let hoveredId: number | null = null;
    let mouseNdc = { x: 0, y: 0 };

    function findTvId(obj: THREE.Object3D): number | null {
      let o: THREE.Object3D | null = obj;
      while (o) {
        if (o.userData.tvId) return o.userData.tvId as number;
        o = o.parent;
      }
      return null;
    }

    function raycastAt(clientX: number, clientY: number): number | null {
      const rect = container!.getBoundingClientRect();
      pointer.x = ((clientX - rect.left) / rect.width) * 2 - 1;
      pointer.y = -((clientY - rect.top) / rect.height) * 2 + 1;
      mouseNdc = { x: pointer.x, y: pointer.y };
      raycaster.setFromCamera(pointer, camera);
      const hits = raycaster.intersectObjects([tv1.group, tv3.group, tv2.group, tv4.group], true);
      return hits.length ? findTvId(hits[0].object) : null;
    }

    function onPointerMove(e: PointerEvent) {
      const id = raycastAt(e.clientX, e.clientY);
      if (id !== hoveredId) {
        hoveredId = id;
        // Reset bloom on every hover transition so moving straight from one TV
        // to another doesn't leave the bloom stuck at its faded-down value.
        bloom.strength = 0.3;
        entries.forEach((entry) => {
          if (entry.id === id && entry.screen.status === "idle") {
            entry.screen.status = "glitch";
            entry.screen.glitchAt = performance.now();
            entry.screen.reveal = 0;
          } else if (entry.id !== id && entry.screen.status !== "idle") {
            entry.screen.status = "idle";
            entry.screen.reveal = 0;
          }
        });
      }
      container!.style.cursor = id ? "pointer" : "default";
    }

    function onPointerDown(e: PointerEvent) {
      if (getDestination()) return; // a load is already in progress
      const id = raycastAt(e.clientX, e.clientY);
      if (id === 1) {
        startLoading("/home");
        router.push("/home");
      } else if (id === 2) {
        startLoading("/docs");
        router.push("/docs");
      } else if (id === 3) {
        startLoading("/nfts");
        router.push("/nfts");
      } else if (id === 4) {
        window.open(TOKEN_URL, "_blank", "noopener,noreferrer");
      }
    }

    container!.addEventListener("pointermove", onPointerMove);
    container!.addEventListener("pointerdown", onPointerDown);

    function onResize() {
      camera.aspect = container!.clientWidth / container!.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(container!.clientWidth, container!.clientHeight);
      composer.setSize(container!.clientWidth, container!.clientHeight);
    }
    window.addEventListener("resize", onResize);

    // --- render loop ---
    let raf = 0;
    function animate(time: number) {
      raf = requestAnimationFrame(animate);
      const now = performance.now();
      const t = time * 0.001;

      const targetX = Math.sin(t * 0.25) * 0.35 + mouseNdc.x * 0.5;
      const targetY = 0.35 + Math.cos(t * 0.2) * 0.12 - mouseNdc.y * 0.3;
      camera.position.x += (targetX - camera.position.x) * 0.05;
      camera.position.y += (targetY - camera.position.y) * 0.05;
      camera.lookAt(0, 0, 0);

      entries.forEach((entry) => {
        const s = entry.screen;
        if (s.status === "glitch") {
          const p = Math.min(1, (now - s.glitchAt) / 1000);
          s.reveal = Math.pow(p, 1 / 3); // cube root → fast start, slow end
          if (p >= 1) s.status = "on";
        }
        drawScreen(s);

        const targetLight = entry.id === hoveredId ? 2.6 : 0.3;
        const targetGlow = entry.id === hoveredId ? 0.55 : 0.12;
        entry.tv.light.intensity += (targetLight - entry.tv.light.intensity) * 0.1;
        entry.tv.glowMaterial.opacity += (targetGlow - entry.tv.glowMaterial.opacity) * 0.1;
      });

      // Fade bloom down while a screen is lit; reset it immediately on hover-off.
      const anyLit = entries.some((e) => e.screen.status !== "idle");
      if (anyLit) {
        bloom.strength += (0.04 - bloom.strength) * 0.08;
      } else {
        bloom.strength = 0.3;
      }

      composer.render();
    }
    raf = requestAnimationFrame(animate);

    // --- cleanup ---
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", onResize);
      container!.removeEventListener("pointermove", onPointerMove);
      container!.removeEventListener("pointerdown", onPointerDown);
      entries.forEach((entry) => {
        entry.tv.group.traverse((o) => {
          const mesh = o as THREE.Mesh;
          if (mesh.isMesh) {
            mesh.geometry.dispose();
            const m = mesh.material as THREE.Material | THREE.Material[];
            if (Array.isArray(m)) m.forEach((mm) => mm.dispose());
            else m.dispose();
          }
        });
        entry.screen.texture.dispose();
      });
      glowTex.dispose();
      gltfScene.traverse((o) => {
        const mesh = o as THREE.Mesh;
        if (mesh.isMesh) {
          mesh.geometry.dispose();
          const m = mesh.material as THREE.Material | THREE.Material[] | undefined;
          if (Array.isArray(m)) m.forEach((mm) => mm.dispose());
          else if (m) m.dispose();
        }
      });
      const rt = (floor as unknown as { getRenderTarget?: () => THREE.WebGLRenderTarget }).getRenderTarget?.();
      if (rt) rt.dispose();
      floor.dispose();
      composer.dispose();
      renderer.dispose();
      container!.removeChild(renderer.domElement);
    };
  }, [gltfScene, router]);

  return (
    <div className="relative h-[100dvh] w-full overflow-hidden bg-black">
      <div ref={containerRef} className="absolute inset-0" />
      <div className="pointer-events-none absolute inset-x-0 bottom-6 text-center text-lg text-white/40">
        hover a CRT - click to enter
      </div>
    </div>
  );
}
