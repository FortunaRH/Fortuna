import * as THREE from "three";

export type CrtTv = {
  group: THREE.Group;
  screen: THREE.Mesh;
  screenMaterial: THREE.MeshBasicMaterial;
  glow: THREE.Mesh;
  glowMaterial: THREE.MeshBasicMaterial;
  light: THREE.PointLight;
};

/** Procedural CRT television built from primitives (no external asset). */
export function createCrtTv(): CrtTv {
  const group = new THREE.Group();

  // Body — sharp-edged, almost black (self-illuminated so it reads in the dark)
  const body = new THREE.Mesh(
    new THREE.BoxGeometry(2.3, 1.55, 1.75),
    new THREE.MeshStandardMaterial({
      color: 0x2e2e34,
      roughness: 0.55,
      metalness: 0.2,
    }),
  );
  body.position.z = -0.1;
  group.add(body);

  // Screen — curved CRT glass (content is drawn here)
  const screenMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff });
  const screen = new THREE.Mesh(createCurvedScreenGeometry(1.72, 1.28, 0.16, 48, 36), screenMaterial);
  screen.position.z = 0.79;
  screen.name = "Screen";
  group.add(screen);

  // Glow plane (additive radial gradient, fades in when lit)
  const glowMaterial = new THREE.MeshBasicMaterial({
    color: 0xffffff,
    transparent: true,
    opacity: 0,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    depthTest: false,
  });
  const glow = new THREE.Mesh(new THREE.PlaneGeometry(2.15, 1.65), glowMaterial);
  glow.position.z = 0.84;
  glow.renderOrder = 10;
  group.add(glow);

  // Feet
  const footMat = new THREE.MeshStandardMaterial({
    color: 0x1e1e22,
    roughness: 0.5,
    metalness: 0.3,
  });
  const footGeo = new THREE.BoxGeometry(0.3, 0.1, 0.42);
  const foot1 = new THREE.Mesh(footGeo, footMat);
  foot1.position.set(-0.62, -0.82, -0.25);
  group.add(foot1);
  const foot2 = foot1.clone();
  foot2.position.x = 0.62;
  group.add(foot2);

  // Point light that "turns on" when hovered
  const light = new THREE.PointLight(0xffffff, 0, 3.5, 2);
  light.position.set(0, 0.15, 1.6);
  group.add(light);

  return { group, screen, screenMaterial, glow, glowMaterial, light };
}

/** A flat plane gently bulged outward (dome) for the curved CRT glass. */
export function createCurvedScreenGeometry(
  width: number,
  height: number,
  curvature: number,
  wSeg: number,
  hSeg: number,
): THREE.PlaneGeometry {
  const geo = new THREE.PlaneGeometry(width, height, wSeg, hSeg);
  const pos = geo.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    const y = pos.getY(i);
    const nx = x / (width / 2);
    const ny = y / (height / 2);
    const r2 = nx * nx + ny * ny;
    pos.setZ(i, curvature * Math.max(0, 1 - r2));
  }
  geo.computeVertexNormals();
  return geo;
}

/**
 * Build a CRT TV from a loaded `crt.glb` scene (real PBR body + a "screen" quad).
 *
 * The glb is exported with the TV's tube pointing toward +Z (the camera) and the
 * "screen" quad lying on the far side, so we flip the whole model 180° around Y and
 * swap the screen for a clean, camera-facing plane we can draw the live canvas into.
 */
export function createTvFromGltf(gltfScene: THREE.Object3D): CrtTv {
  const outer = new THREE.Group();
  const model = gltfScene.clone(true);
  model.rotation.y = Math.PI;
  outer.add(model);

  // Sit the model's base on the floor (y = -0.85) by shifting the outer group down.
  // Computed before adding glow/light so their (invisible) geometry can't affect it.
  outer.updateMatrixWorld(true);
  const bbox = new THREE.Box3().setFromObject(model);
  outer.position.y = -0.85 - bbox.min.y;

  const screen = model.getObjectByName("screen") as THREE.Mesh | undefined;
  if (!screen) throw new Error("crt.glb is missing a node named 'screen'");

  // Measure the original screen quad (it lies in the XZ plane in local space).
  screen.geometry.computeBoundingBox();
  const bb = screen.geometry.boundingBox!;
  const width = bb.max.x - bb.min.x;
  const height = bb.max.z - bb.min.z;

  // Replace the horizontal quad with a clean +Z-facing plane. Spinning it 180° around
  // Y cancels the model's 180° flip, so the final normal points back at the camera
  // with no horizontal mirroring (text stays readable).
  screen.geometry = new THREE.PlaneGeometry(width, height);
  screen.rotation.set(0, Math.PI, 0);
  screen.scale.set(1, 1, 1);

  const screenMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff });
  screen.material = screenMaterial;

  // Phosphor glow plane + point light, both slightly in front of the screen.
  const glowMaterial = new THREE.MeshBasicMaterial({
    color: 0xffffff,
    transparent: true,
    opacity: 0,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    depthTest: false,
  });
  const glow = new THREE.Mesh(new THREE.PlaneGeometry(width * 1.15, height * 1.15), glowMaterial);
  glow.rotation.y = Math.PI;
  glow.position.set(screen.position.x, screen.position.y, screen.position.z - 0.03);
  glow.renderOrder = 10;
  model.add(glow);

  const light = new THREE.PointLight(0xffffff, 0, 3.5, 2);
  light.position.set(screen.position.x, screen.position.y, screen.position.z - 0.9);
  model.add(light);

  return { group: outer, screen, screenMaterial, glow, glowMaterial, light };
}

/** Soft white radial gradient used as an additive "phosphor glow" texture. */
export function createGlowTexture(): THREE.CanvasTexture {
  const size = 256;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d")!;
  const g = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  g.addColorStop(0, "rgba(255,255,255,0.9)");
  g.addColorStop(0.4, "rgba(255,255,255,0.35)");
  g.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, size, size);
  return new THREE.CanvasTexture(canvas);
}
