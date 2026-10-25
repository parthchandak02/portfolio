// The swarm's shared state. The strip (Spectrograph) flies the pills in screen pixels and decides when each
// lands; the 3D scene (SwarmLight) draws them as light. `ready` turns true once the scene is drawing, so the
// strip can hold the swarm until there is somewhere to show it.
export const swarmLight = {
  pills: [],
  ready: false
};

if (import.meta.env?.DEV && typeof window !== 'undefined') window.__swarmLight = swarmLight;
