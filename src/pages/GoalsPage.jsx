import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { Link } from "react-router-dom";
// cuando tenga API de goals, importar aquí: getGoals, createGoals, updateGoals

export default function GoalsPage() {
  const { user, logout } = useAuth();
  // de momento solo UI; luego conectamos con la API
  const [form, setForm] = useState({
    calories: "",
    protein: "",
    carbs: "",
    fat: "",
  });

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // aquí luego llamas a createGoals/updateGoals
    console.log("Guardar objetivos:", form);
  };

  return (
    <div className="app">
      <header className="topbar">
        <h1>NutriTrace</h1>
        <div className="user-info">
          <span>Hola, {user?.name}</span>
          <Link to="/foods" style={{ marginRight: "10px" }}>
            Mis alimentos
          </Link>
          <button onClick={logout}>Cerrar sesión</button>
        </div>
      </header>

      <main className="layout">
        <section className="card">
          <h2>Objetivos diarios</h2>
          <form onSubmit={handleSubmit} className="form">
            <div className="field-grid">
              <div className="field">
                <label>Calorías</label>
                <input
                  type="number"
                  value={form.calories}
                  onChange={(e) => handleChange("calories", e.target.value)}
                />
              </div>
              <div className="field">
                <label>Proteína (g)</label>
                <input
                  type="number"
                  value={form.protein}
                  onChange={(e) => handleChange("protein", e.target.value)}
                />
              </div>
              <div className="field">
                <label>Carbohidratos (g)</label>
                <input
                  type="number"
                  value={form.carbs}
                  onChange={(e) => handleChange("carbs", e.target.value)}
                />
              </div>
              <div className="field">
                <label>Grasa (g)</label>
                <input
                  type="number"
                  value={form.fat}
                  onChange={(e) => handleChange("fat", e.target.value)}
                />
              </div>
            </div>

            <button type="submit">Guardar objetivos (luego API)</button>
          </form>
        </section>
      </main>
    </div>
  );
}
