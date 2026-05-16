import { useEffect, useMemo, useState } from "react";
import { listFoods, getMyAllergies } from "../api";
import { useI18n } from "../i18n/I18nContext";

export default function FoodPicker({
  token,
  valueFoodId,
  onChangeFoodId,
  hideForbidden = false,
}) {
  const { t } = useI18n();

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
          listFoods({ token }),
          getMyAllergies(token),
        ]);

        setFoods(Array.isArray(foodsData) ? foodsData : []);
        setMyAllergies(Array.isArray(allergiesData) ? allergiesData : []);
      } catch (err) {
        console.error(err);
        setError(err.message || t("Error cargando alimentos/alergias"));
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [token, t]);

  const myAllergyIds = useMemo(
    () => new Set(myAllergies.map((a) => a.id)),
    [myAllergies]
  );

  const foodsWithFlags = useMemo(() => {
    return foods.map((f) => {
      const allergenList = f.allergens || [];

      const conflicts = allergenList.filter((a) =>
        myAllergyIds.has(a.id)
      );

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

  if (loading) return <p>{t("Cargando alimentos...")}</p>;

  if (error) {
    return <p className="error">{String(error)}</p>;
  }

  return (
    <div className="field">
      <label>{t("Selecciona un alimento")}</label>

      <select
        value={valueFoodId || ""}
        onChange={(e) =>
          onChangeFoodId(
            e.target.value ? Number(e.target.value) : null
          )
        }
        required
      >
        <option value="">
          {t("-- Elige --")}
        </option>

        {visibleFoods.map((f) => {
          const disabled =
            !hideForbidden && f.forbidden;

          const conflictsText = f.conflicts
            ?.map((a) => t(a.name))
            .join(", ");

          return (
            <option
              key={f.id}
              value={f.id}
              disabled={disabled}
            >
              {f.name}
              {f.is_system ? ` (${t("App")})` : ""}
              {f.forbidden
                ? ` (${t("No permitido")}: ${conflictsText})`
                : ""}
            </option>
          );
        })}
      </select>

      {myAllergies.length > 0 && (
        <p style={{ marginTop: "8px", opacity: 0.85 }}>
          {t("Tus alergias")}:{" "}
          {myAllergies
            .map((a) => t(a.name))
            .join(", ")}
        </p>
      )}
    </div>
  );
}
