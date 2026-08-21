# ThunderKing — Gestión de pedidos

Base del sistema construida con React, Vite y Firebase.

## Desarrollo local

1. Instala dependencias con `npm install`.
2. Copia `.env.example` como `.env.local` y agrega la configuración real de Firebase.
3. Activa **Email/Password** en Firebase Console → Authentication → Sign-in method.
4. Crea el usuario administrador en Authentication.
5. En Firestore crea `Usuarios/{uid}` usando exactamente el UID de Authentication:

```text
Nombre: "Administrador"
Email: "correo-real@empresa.com"
Rol: "Administrador"
Activo: true
FechaCreacion: Timestamp
```

6. Publica `firestore.rules` y `storage.rules` desde Firebase CLI o Firebase Console.
7. Ejecuta `npm run dev`.

La aplicación no crea administradores desde el navegador. Esto evita exponer un flujo público de alta con privilegios.

## Comandos

- `npm run dev`: servidor local.
- `npm run lint`: análisis estático.
- `npm run build`: compilación de producción.
- `npm run preview`: vista previa del build.

## Logo

El recurso web optimizado está en `src/assets/logo/thunderking-logo-optimized.png`; la versión original también se conserva en la misma carpeta.

## Hosting

`firebase.json` incluye el rewrite necesario para React Router. Antes de desplegar, selecciona el proyecto correcto con Firebase CLI.

## Cloud Functions y PDF

Las funciones 2nd Gen usan Node.js 22 y viven en `functions/`. Para publicar la generación de notas se requiere un proyecto Firebase en plan Blaze y una cuenta con permisos de despliegue:

```text
firebase deploy --only functions,storage
```

Los PDF se guardan de forma privada en `pedidos/{pedidoId}/nota-venta-{NumeroPedido}.pdf`. El frontend recibe únicamente URLs firmadas con vigencia de 10 minutos.

El service account de ejecución de Functions debe poder escribir en el bucket y firmar URLs (`Service Account Token Creator` sobre sí mismo). No se utilizan URLs públicas permanentes.
