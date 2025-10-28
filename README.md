# 🍎 NutriTrace — Frontend

Aplicación web desarrollada con **React**, **Vite** y **Tailwind CSS** que permite buscar productos alimentarios, visualizar su información nutricional y gestionar favoritos e historial de búsqueda.

Este frontend consume la API del backend desarrollada con **FastAPI** y utiliza **JWT** para la autenticación de usuarios.

---

## 🚀 Tecnologías principales

- ⚛️ **React 18 + Vite** → Framework y bundler ultrarrápido  
- 💅 **Tailwind CSS** → Estilos y diseño responsive  
- 🔀 **React Router DOM** → Navegación por rutas  
- 🔐 **Context API + Reducer** → Gestión global de estado (autenticación, favoritos)  
- 🌐 **Axios** → Comunicación con la API REST  

---

## 🧩 Estructura del proyecto


```plaintext
NutritraceFrontend/
├── src/
│   ├── components/       # Componentes reutilizables
│   ├── pages/            # Vistas principales (Home, Login, Producto, etc.)
│   ├── context/          # Contextos globales (AuthContext, AppState)
│   ├── hooks/            # Custom hooks
│   ├── services/         # Llamadas HTTP a la API (axios)
│   ├── assets/           # Imágenes, iconos, fuentes
│   └── main.jsx          # Punto de entrada
├── public/
├── index.html
└── vite.config.js
```

---

## ⚙️ Instalación y ejecución

### 🔧 Requisitos previos
- Node.js ≥ 20  
- npm (o yarn)

### ▶️ Ejecución en desarrollo

```bash
npm install
npm run dev


La aplicación se abrirá automáticamente en
👉 [http://localhost:5173](http://localhost:5173)

---

## 🔑 Variables de entorno

Crea un archivo `.env` en la raíz del proyecto:

```
VITE_API_URL=http://localhost:8000
```

> Cambia esta URL según el entorno (por ejemplo, la URL del backend en producción).

---

## 🧪 Scripts disponibles

| Comando           | Descripción                      |
| ----------------- | -------------------------------- |
| `npm run dev`     | Inicia el servidor de desarrollo |
| `npm run build`   | Genera el build de producción    |
| `npm run preview` | Previsualiza el build localmente |
| `npm run lint`    | Ejecuta ESLint                   |
| `npm test`        | Ejecuta pruebas con Vitest       |

---

## 🐳 Despliegue con Docker

Para ejecutar el frontend en un contenedor Docker:

```bash
docker build -t nutritrace-frontend .
docker run -p 5173:5173 nutritrace-frontend
```

> En producción se recomienda servir el **build estático** con **Nginx**.

---

## 🧱 Integración con backend

Por defecto, el frontend consume la API disponible en
`http://localhost:8000`, correspondiente al repositorio:

🔗 [NutriTrace Backend](https://github.com/AnteroEscuder/NutriraceBackend)

---

## 🧰 Buenas prácticas implementadas

* Componentes modulares y reutilizables
* Manejo de estado centralizado (Context API)
* Hooks personalizados (`useAuth`, `useFetch`, etc.)
* Rutas privadas y públicas
* Diseño responsive con Tailwind
* Validación de formularios de login/registro

---

## 👩‍💻 Autor

* **Antero José Escuder Omenat** — Desarrollo y documentación
* **Tutor:** Jorge Agustín Barón Abad — IES Polígono Sur

---

> 📘 Proyecto desarrollado como parte del **Hito 1: Entrega de Arquitectura de Proyecto v0.1** dentro del módulo de *Tecnologías Web y Entornos de Desarrollo*.
