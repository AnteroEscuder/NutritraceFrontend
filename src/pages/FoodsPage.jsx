import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { listFoods, createFood, deleteFood, updateFood } from "../api";
import { Link } from "react-router-dom";

export default function FoodsPage() {
  const { token, user, logout } = useAuth();
  const [foods, setFoods] = useState([]);
  const [foodForm, setFoodForm] = useState({
    name: "",
    calories: "",
    protein: "",
    carbs: "",
    fat: "",
  });
  const [editingFoodId, setEditingFoodId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const loadFoods = async () => {
    if (!token) return;
    try {
      setLoading(true);
      const foodsFromApi = await listFoods(token);
      setFoods(foodsFromApi);
    } catch (err) {
      console.error(err);
      setError("Error al cargar los alimentos");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFoods();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const handleFoodChange = (field, value) => {
    setFoodForm((prev) => ({ ...prev, [field]: value }));
  };

  const resetForm = () => {
    setFoodForm({
      name: "",
      calories: "",
      protein: "",
      carbs: "",
      fat: "",
    });
    setEditingFoodId(null);
  };

  const handleSubmitFood = async (e) => {
    e.preventDefault();
    if (!token) return;
    setError("");
    setMessage("");
    try {
      setLoading(true);
      const payload = {
        name: foodForm.name,
        calories: parseFloat(foodForm.calories || 0),
        protein: parseFloat(foodForm.protein || 0),
        carbs: parseFloat(foodForm.carbs || 0),
        fat: parseFloat(foodForm.fat || 0),
      };

      if (editingFoodId) {
        const updated = await updateFood(editingFoodId, payload, token);
        setFoods((prev) => prev.map((f) => (f.id === editingFoodId ? updated : f)));
        setMessage("Alimento actualizado correctamente.");
      } else {
        const created = await createFood(payload, token);
        setFoods((prev) => [...prev, created]);
        setMessage("Alimento creado correctamente.");
      }

      resetForm();
    } catch (err) {
      console.error(err);
      setError(err.message || "Error al guardar alimento");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteFood = async (id) => {
    if (!token) return;
    if (!window.confirm("¿Seguro que quieres borrar este alimento?")) return;
    setError("");
    setMessage("");
    try {
      setLoading(true);
      await deleteFood(id, token);
      setFoods((prev) => prev.filter((f) => f.id !== id));
      setMessage("Alimento borrado.");
    } catch (err) {
      console.error(err);
      setError(err.message || "Error al borrar alimento");
    } finally {
      setLoading(false);
    }
  };

  const handleEditFood = (food) => {
    setEditingFoodId(food.id);
    setFoodForm({
      name: food.name,
      calories: String(food.calories),
      protein: String(food.protein),
      carbs: String(food.carbs),
      fat: String(food.fat),
    });
  };

  return (
    <div className="app">
      <header className="topbar">
        <h1>NutriTrace</h1>
        <div className="user-info">
          <span>Hola, {user?.name}</span>
          <Link to="/goals" style={{ marginRight: "10px" }}>
            Mis objetivos
          </Link>
          <button onClick={logout}>Cerrar sesión</button>
        </div>
      </header>

      <main className="layout">
        <section className="card">
          <h2>{editingFoodId ? "Editar alimento" : "Nuevo alimento"}</h2>
          <form onSubmit={handleSubmitFood} className="form">
            <div className="field">
              <label>Nombre</label>
              <input
                type="text"
                value={foodForm.name}
                onChange={(e) => handleFoodChange("name", e.target.value)}
                required
              />
            </div>
            <div className="field-grid">
              <div className="field">
                <label>Calorías</label>
                <input
                  type="number"
                  step="0.01"
                  value={foodForm.calories}
                  onChange={(e) => handleFoodChange("calories", e.target.value)}
                  required
                />
              </div>
              <div className="field">
                <label>Proteína (g)</label>
                <input
                  type="number"
                  step="0.01"
                  value={foodForm.protein}
                  onChange={(e) => handleFoodChange("protein", e.target.value)}
                  required
                />
              </div>
              <div className="field">
                <label>Carbohidratos (g)</label>
                <input
                  type="number"
                  step="0.01"
                  value={foodForm.carbs}
                  onChange={(e) => handleFoodChange("carbs", e.target.value)}
                  required
                />
              </div>
              <div className="field">
                <label>Grasa (g)</label>
                <input
                  type="number"
                  step="0.01"
                  value={foodForm.fat}
                  onChange={(e) => handleFoodChange("fat", e.target.value)}
                  required
                />
              </div>
            </div>

            <button type="submit" disabled={loading}>
              {loading
                ? "Guardando..."
                : editingFoodId
                ? "Actualizar alimento"
                : "Guardar alimento"}
            </button>
            {editingFoodId && (
              <button
                type="button"
                onClick={resetForm}
                disabled={loading}
                style={{ marginLeft: "8px" }}
              >
                Cancelar edición
              </button>
            )}
          </form>
        </section>

        <section className="card">
          <h2>Listado de alimentos</h2>
          {loading && !foods.length ? (
            <p>Cargando...</p>
          ) : foods.length === 0 ? (
            <p>Todavía no hay alimentos.</p>
          ) : (
            <table className="table">
              <thead>
                <tr>
                  <th>Nombre</th>
                  <th>kcal</th>
                  <th>Prot</th>
                  <th>HC</th>
                  <th>Grasa</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {foods.map((f) => (
                  <tr key={f.id}>
                    <td>{f.name}</td>
                    <td>{f.calories}</td>
                    <td>{f.protein}</td>
                    <td>{f.carbs}</td>
                    <td>{f.fat}</td>
                    <td>
                      <button type="button" onClick={() => handleEditFood(f)}>
                        Editar
                      </button>
                      <button
                        className="danger"
                        type="button"
                        onClick={() => handleDeleteFood(f.id)}
                      >
                        Borrar
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          {error && <p className="error">{error}</p>}
          {message && <p className="ok">{message}</p>}
        </section>
      </main>
    </div>
  );
}
