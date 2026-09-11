# FixTrack

Aplicación web para gestionar talleres de electrónica y reparación de celulares.

## Stack inicial

- Frontend: React 19 + Vite + JavaScript.
- UI: Material UI.
- Backend previsto: Node.js + NestJS, organizado como monolito modular.
- Base de datos: PostgreSQL.
- Archivos: almacenamiento compatible con S3; MinIO en desarrollo.

## Desarrollo del frontend

```bash
npm install
npm run start
```

La aplicación se sirve en `http://localhost:3000`.

## Levantar todo el entorno

Con Docker y Node.js instalados, desde la raíz del proyecto:

```bash
npm install
cd backend && npm install && cd ..
npm run dev:all
```

El script inicia PostgreSQL en `localhost:5433`, MinIO (almacenamiento S3-compatible) en `localhost:9000`, aplica las migraciones, levanta la API en `localhost:3001` y el frontend en `localhost:3000`. Si `3001` está ocupado, usa automáticamente el siguiente puerto disponible para la API. Para detener todo, pulsa `Ctrl+C`.

## Base de datos y almacenamiento local

Requiere Docker. Para iniciar PostgreSQL y MinIO:

```bash
docker compose -f infra/docker-compose.yml up -d postgres minio minio-init
```

PostgreSQL queda disponible en el puerto local `5433` para evitar conflictos con otros proyectos. MinIO expone la API en `9000` y la consola web en `9001` (usuario `electronica` / clave `electronica_dev_minio` en desarrollo); `minio-init` crea automáticamente el bucket `electronica-tech-attachments` usado para fotos y documentos de las órdenes.

El avance, las decisiones y las especificaciones pendientes se mantienen en [`STATUS.md`](STATUS.md).

## Integración continua

El workflow `.github/workflows/ci.yml` valida automáticamente migraciones, pruebas unitarias, pruebas e2e y builds en cada push a `main`/`master` y en cada pull request.
