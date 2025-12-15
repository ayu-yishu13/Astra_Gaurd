import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { useRef } from "react";

/* ------------- Rotating Packet Ring ------------- */
function PacketRing() {
  const ring = useRef();
  const pulse = useRef();

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();

    ring.current.rotation.y = t * 0.6;

    const r = 1.5;
    pulse.current.position.x = r * Math.cos(t * 1.5);
    pulse.current.position.y = r * Math.sin(t * 1.5);
  });

  return (
    <group>
      <mesh ref={ring} rotation={[0.5, 0.4, 0]}>
        <torusGeometry args={[1.5, 0.07, 32, 100]} />
        <meshStandardMaterial
          emissive="#00e5ff"
          emissiveIntensity={1.7}
          color="#00e5ff"
        />
      </mesh>

      <mesh ref={pulse}>
        <sphereGeometry args={[0.13, 32, 32]} />
        <meshStandardMaterial emissive="#a855f7" emissiveIntensity={2} />
      </mesh>
    </group>
  );
}

/* ------------- Floating Network Nodes ------------- */
function NetworkNodes() {
  const group = useRef();

  useFrame(({ clock }) => {
    group.current.rotation.y = clock.getElapsedTime() * 0.3;
  });

  const nodes = Array.from({ length: 12 }).map(() => [
    (Math.random() - 0.5) * 2,
    (Math.random() - 0.5) * 1.5,
    (Math.random() - 0.5) * 1.2,
  ]);

  return (
    <group ref={group}>
      {nodes.map((pos, i) => (
        <mesh position={pos} key={i}>
          <sphereGeometry args={[0.1, 24, 24]} />
          <meshStandardMaterial
            emissive="#00e5ff"
            emissiveIntensity={1.3}
            color="#00e5ff"
          />
        </mesh>
      ))}
    </group>
  );
}

/* ------------- Main Scene ------------- */
export default function NIDS3D() {
  return (
    <Canvas
      style={{ width: "100%", height: "100%" }}
      camera={{ position: [2.5, 2.5, 5], fov: 30 }}
    >
      <ambientLight intensity={0.5} />
      <pointLight position={[3, 3, 3]} intensity={1} />

      <group rotation={[0.5, 0.4, 0]}>
        <PacketRing />
        <NetworkNodes />
      </group>
    </Canvas>
  );
}


