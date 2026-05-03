import { useEffect, useState } from "react";

export function useLeaderboard(endpoint) {
  const [leaderboard, setLeaderboard] = useState([]);
  const [leaderboardError, setLeaderboardError] = useState("");
  const [leaderboardLoading, setLeaderboardLoading] = useState(false);

  useEffect(() => {
    let abortado = false;

    async function cargarLeaderboard() {
      try {
        setLeaderboardLoading(true);
        const resp = await fetch(endpoint);
        const datos = await resp.json();
        if (abortado) return;

        const top = datos.slice(0, 6).map((entry, index) => ({
          id: entry.id ?? index,
          nombre: entry.name ?? entry.username ?? `Dev ${index + 1}`,
          stack: entry.company?.bs || "React",
          puntos: 220 - index * 15,
          precision: 85 - index * 5
        }));

        setLeaderboard(top);
        setLeaderboardError("");
      } catch (error) {
        console.warn("Leaderboard remoto no disponible", error);
        setLeaderboardError("No se pudo cargar el leaderboard remoto");
      } finally {
        if (!abortado) setLeaderboardLoading(false);
      }
    }

    cargarLeaderboard();
    return () => {
      abortado = true;
    };
  }, [endpoint]);

  return { leaderboard, leaderboardError, leaderboardLoading };
}
