import { useEffect, useMemo, useState } from "react";
import { listFoods, getMyAllergies } from "../api";

export default function FoodPicker({
  token,
  valueFoodId,
  onChangeFoodId,
  hideForbidden = false, // si true: oculta los prohibidos
}) {
  const [foods, setFoods] = useState([]);
  const [myAllergies, setMyAllergies] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!token) return;

    const load = async () => {
      try {
        setLoading(true);
        setError("");

        const [foodsData, allergiesData] = await Promise.all([
          listFoods(token),
          getMyAllergies(token),
        ]);

        setFoods(foodsData);
        setMyAllergies(allergiesData);
      } catch (err) {
        console.error(err);
        setError(err.message || "Error cargando alimentos/alergias");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [token]);

  const myAllergyIds = useMemo(
    () => new Set(myAllergies.map((a) => a.id)),
    [myAllergies]
  );

  const foodsWithFlags = useMemo(() => {
    return foods.map((f) => {
      const allergenList = f.allergens || []; // <-- importante
      const conflicts = allergenList.filter((a) => myAllergyIds.has(a.id));
      return {
        ...f,
        forbidden: conflicts.length > 0,
        conflicts,
      };
    });
  }, [foods, myAllergyIds]);

  const visibleFoods = useMemo(() => {
    if (!hideForbidden) return foodsWithFlags;
    return foodsWithFlags.filter((f) => !f.forbidden);
  }, [foodsWithFlags, hideForbidden]);

  if (loading) return <p>Cargando alimentos...</p>;
  if (error) return <p className="error">{error}</p>;

  return (
    <div className="field">
      <label>Selecciona un alimento</label>

      <select
        value={valueFoodId || ""}
        onChange={(e) => onChangeFoodId(e.target.value ? Number(e.target.value) : null)}
        required
      >
        <option value="">-- Elige --</option>

        {visibleFoods.map((f) => {
          const disabled = !hideForbidden && f.forbidden; // si no los ocultas, los deshabilitas
          const conflictsText = f.conflicts?.map((a) => a.name).join(", ");

          return (
            <option key={f.id} value={f.id} disabled={disabled}>
              {f.name}
              {f.forbidden ? ` (No permitido: ${conflictsText})` : ""}
            </option>
          );
        })}
      </select>

      {/* Mensaje si el usuario tiene alergias */}
      {myAllergies.length > 0 && (
        <p style={{ marginTop: "8px", opacity: 0.85 }}>
          Tus alergias: {myAllergies.map((a) => a.name).join(", ")}
        </p>
      )}
    </div>
  );
}
