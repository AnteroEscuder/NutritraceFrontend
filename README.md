# 🍎 NutriTrace — Frontend

Aplicación web desarrollada con **React**, **Vite** y **Tailwind CSS** que permite buscar productos alimentarios, visualizar su información nutricional y gestionar favoritos e historial de búsqueda.

Este frontend consume la API desarrollada con **FastAPI** y utiliza **JWT** para la autenticación de usuarios.

---

## 🚀 Tecnologías principales

* ⚛️ **React 18 + Vite** → Framework y bundler ultrarrápido
* 💅 **Tailwind CSS** → Diseño moderno y responsive
* 🔀 **React Router DOM** → Navegación por rutas
* 🔐 **Context API + Reducer** → Gestión global de estado
* 🌐 **Axios** → Comunicación con la API REST

---

## 🧩 Estructura del proyecto

```plaintext
NutritraceFrontend/
├── src/
│   ├── components/
│   ├── pages/
│   ├── context/
│   ├── hooks/
│   ├── services/
│   ├── assets/
│   └── main.jsx
├── public/
├── index.html
└── vite.config.js
```

---

## ⚙️ Instalación y ejecución local

### 🔧 Requisitos

* Node.js ≥ 20
* npm (o yarn)

### ▶️ Desarrollo

```bash
npm install
npm run dev
```

La aplicación estará disponible en:

👉 [http://localhost:5173](http://localhost:5173)

---

## 🔑 Variables de entorno

Crear archivo `.env`:

```bash
VITE_API_URL=http://localhost:8000
```

> Cambiar esta URL cuando el backend esté en producción.

---

## 🧪 Scripts disponibles

| Comando           | Descripción                    |
| ----------------- | ------------------------------ |
| `npm run dev`     | Servidor de desarrollo         |
| `npm run build`   | Build optimizado de producción |
| `npm run preview` | Previsualizar build            |
| `npm run lint`    | Ejecutar ESLint                |
| `npm test`        | Ejecutar pruebas               |

---

## 🐳 Despliegue básico con Docker

```bash
docker build -t nutritrace-frontend .
docker run -p 5173:5173 nutritrace-frontend
```

⚠️ En producción se recomienda servir el **build estático con Nginx**.

---

# 🚀 Despliegue en Producción

En producción el frontend debe servirse como **aplicación estática optimizada**.

---

## 1️⃣ Generar build de producción

```bash
npm run build
```

Esto generará la carpeta:

```bash
dist/
```

---

## 2️⃣ Variables de entorno de producción

Crear `.env.production`:

```bash
VITE_API_URL=https://api.tudominio.com
```

⚠️ Importante: Vite inyecta las variables en build time, por lo que debes definirlas antes de ejecutar `npm run build`.

---

## 3️⃣ Servir con Nginx (recomendado)

Ejemplo de configuración:

```nginx
server {
    listen 80;
    server_name tudominio.com;

    root /var/www/nutritrace/dist;
    index index.html;

    location / {
        try_files $uri /index.html;
    }
}
```

Esto permite:

* SPA con React Router funcionando correctamente
* URLs amigables sin error 404
* Mejor rendimiento que servidor de desarrollo

---

## 4️⃣ Despliegue con Docker + Nginx

Ejemplo de `Dockerfile` optimizado:

```dockerfile
# Build stage
FROM node:20 AS builder
WORKDIR /app
COPY . .
RUN npm install
RUN npm run build

# Production stage
FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

Construir y ejecutar:

```bash
docker build -t nutritrace-frontend-prod .
docker run -p 80:80 nutritrace-frontend-prod
```

---

## 🔐 Buenas prácticas en producción

* Usar HTTPS (Let’s Encrypt)
* Configurar correctamente `VITE_API_URL`
* No exponer tokens en almacenamiento inseguro
* Activar compresión (gzip) en Nginx
* Controlar caché para archivos estáticos

---

## 🧱 Integración con backend

Por defecto consume:

```
http://localhost:8000
```

Repositorio del backend:

🔗 [https://github.com/AnteroEscuder/NutriraceBackend](https://github.com/AnteroEscuder/NutriraceBackend)

---

## 🧰 Buenas prácticas implementadas

* Componentes reutilizables
* Estado global centralizado
* Hooks personalizados (`useAuth`, `useFetch`)
* Rutas públicas y privadas
* Diseño responsive
* Validación de formularios

---

## 👩‍💻 Autor

**Antero José Escuder Omenat**
Tutor: Jorge Agustín Barón Abad — IES Polígono Sur

---

> 📘 Proyecto desarrollado como parte del **Hito 1: Arquitectura de Proyecto v0.1** — Tecnologías Web y Entornos de Desarrollo.

---
