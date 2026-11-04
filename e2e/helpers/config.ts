// Port dédié aux tests E2E (Q9) : jamais partagé avec le serveur de dev habituel
// (5173), pour qu'un `npm run dev` en cours ne soit ni capturé ni perturbé.
export const E2E_PORT = 5273;
export const E2E_ORIGIN = `http://localhost:${String(E2E_PORT)}`;
