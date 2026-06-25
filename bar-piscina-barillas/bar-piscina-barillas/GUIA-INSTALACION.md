# 🏊 Bar Las Varillas — Guía de instalación
## Tiempo estimado: 25-30 minutos. No necesitas saber programación.

---

## PASO 1 — Crear el proyecto en Firebase (10 min)

1. Ve a **https://console.firebase.google.com**
2. Inicia sesión con tu Gmail
3. Haz clic en **"Crear un proyecto"**
4. Nombre del proyecto: `bar-piscina-barillas` → Continuar
5. Desactiva Google Analytics (no lo necesitas) → **Crear proyecto**
6. Espera que se cree (30 segundos)

### Activar la base de datos:
7. En el menú izquierdo haz clic en **"Firestore Database"**
8. Clic en **"Crear base de datos"**
9. Selecciona **"Empezar en modo de prueba"** → Siguiente
10. Elige la ubicación **"eur3 (Europe)"** → **Listo**

### Obtener tus credenciales:
11. Haz clic en el icono ⚙️ (arriba izquierda) → **"Configuración del proyecto"**
12. Baja hasta **"Tus aplicaciones"** → haz clic en el icono **</>** (web)
13. Nombre de la app: `bar-web` → **Registrar app**
14. Verás un bloque de código con `firebaseConfig = { ... }`
15. **Copia todos esos datos**, los necesitarás en el Paso 3

---

## PASO 2 — Crear cuenta en Vercel (5 min)

1. Ve a **https://vercel.com**
2. Haz clic en **"Sign Up"**
3. Selecciona **"Continue with GitHub"**
   - Si no tienes GitHub, crea cuenta gratis en **https://github.com**
4. Autoriza Vercel

---

## PASO 3 — Configurar el código (5 min)

1. Abre el archivo `src/firebase.js` de esta carpeta
2. Reemplaza cada `PEGA_AQUI_TU_xxxxx` con los datos que copiaste en el Paso 1

   Ejemplo de cómo debe quedar:
   ```
   apiKey: "AIzaSyAbc123...",
   authDomain: "bar-piscina-barillas.firebaseapp.com",
   projectId: "bar-piscina-barillas",
   ...
   ```

3. Guarda el archivo

---

## PASO 4 — Subir a Vercel (5 min)

### Opción A — Sin instalar nada (más fácil):
1. Ve a **https://vercel.com/new**
2. Haz clic en **"Import Git Repository"**
3. Sube la carpeta del proyecto a GitHub primero:
   - Ve a **https://github.com/new**
   - Nombre: `bar-piscina-barillas` → **Create repository**
   - Arrastra la carpeta del proyecto al navegador
4. En Vercel selecciona ese repositorio → **Deploy**
5. Espera 2-3 minutos

### Opción B — Con terminal (más rápido si sabes un poco):
```bash
cd bar-piscina-barillas
npm install
npx vercel --prod
```

---

## PASO 5 — Tu app está online 🎉

Vercel te dará una URL como:
**`https://bar-piscina-barillas.vercel.app`**

Comparte esa URL con tus camareros. Cada uno:
1. Abre la URL en Safari (iPhone) o Chrome (Android)
2. Pulsa **"Compartir"** → **"Añadir a pantalla de inicio"**
3. ¡Ya tienen la app instalada como si fuera nativa!

---

## PINs de acceso

| Rol       | PIN  | Acceso                          |
|-----------|------|---------------------------------|
| Admin     | 1234 | Todo (carta, caja, stock, editar)|
| Camarero  | 0000 | Solo TPV (cobrar, invitaciones)  |

> ⚠️ Para cambiar los PINs, edita las líneas `PIN_ADMIN` y `PIN_CAMARERO` en `src/App.js`

---

## ¿Algo va mal?

- **La app no carga**: Verifica que copiaste bien las credenciales de Firebase en `src/firebase.js`
- **Los datos no se sincronizan**: Comprueba que Firestore esté en "modo de prueba" en Firebase Console
- **El móvil no puede instalarla**: Asegúrate de abrir la URL en Safari (iPhone) o Chrome (Android)

---

## Estructura del proyecto

```
bar-piscina-barillas/
├── public/
│   ├── index.html       ← página base
│   └── manifest.json    ← configuración PWA (instalable)
├── src/
│   ├── App.js           ← toda la lógica de la app
│   ├── firebase.js      ← ⭐ TUS CREDENCIALES VAN AQUÍ
│   ├── useFirebase.js   ← conexión con la base de datos
│   └── index.js         ← punto de entrada
└── package.json         ← dependencias
```
