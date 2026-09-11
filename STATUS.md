# Estado del proyecto

Última actualización: 2026-09-07

## Objetivo

Construir una aplicación responsive para centralizar la operación de un taller: clientes, equipos, órdenes de servicio, diagnóstico, agenda, inventario, cobros, documentación técnica y métricas.

## Estado actual

### Completado

- Se inspeccionaron las especificaciones funcionales, el roadmap y el modelo de datos inicial.
- Se creó `electronica-tech-app` a partir de la variante Vite del template Berry.
- Se conservaron los componentes visuales, layout, tema, navegación y dashboard del template como base.
- Se adaptaron nombre, idioma, metadatos y configuración base para Electrónica Tech.
- Se dejó configurado PostgreSQL local mediante `infra/docker-compose.yml`.
- Se documentó la arquitectura inicial y el contrato de módulos backend.
- Se corrigió y fijó la compatibilidad de `framer-motion` con `motion-dom` para que el build sea reproducible.
- Se reemplazó el dashboard demostrativo por un dashboard inicial del taller con métricas, órdenes recientes y acciones rápidas.
- Se adaptó la navegación principal para usar `/dashboard` como entrada del sistema.
- Se añadieron las vistas iniciales de clientes y órdenes de servicio.
- Se añadió el formulario de recepción para crear una nueva orden con cliente, equipo, falla y prioridad.
- Se creó el backend NestJS con Prisma y endpoints iniciales para clientes y órdenes.
- Se creó y aplicó la migración inicial de PostgreSQL.
- Clientes, órdenes y nueva orden ya consumen la API mediante `src/api/client.js`.
- Se validó en PostgreSQL la creación transaccional de un cliente, equipo, orden y primer historial de estado.
- Se añadió `dev.sh` y `npm run dev:all` para levantar BBDD, migraciones, API y frontend desde un solo comando.
- El script detecta si el puerto de la API está ocupado y ajusta `PORT` y `VITE_API_URL` automáticamente.
- Se añadió el detalle de orden con historial y actualización transaccional de estados.
- Se añadió diagnóstico técnico con causa probable y checklist de pruebas del equipo.
- Se añadió asignación de técnico responsable por orden.
- Se añadió portal público de seguimiento por token para clientes.
- Se añadió cierre formal de entrega con fecha y transición auditable a `ENTREGADO`.
- El portal público permite autorizar o rechazar el presupuesto mediante el token de seguimiento.
- La decisión pública actualiza automáticamente el estado de la orden y registra la transición en el historial.
- Se añadió centro de notificaciones internas para autorizaciones de presupuesto y entregas.
- Se añadieron notas técnicas y mediciones reutilizables dentro de cada orden.
- Se añadieron búsqueda y filtros por estado y prioridad en el listado de órdenes.
- Se añadió exportación CSV de las órdenes filtradas.
- El módulo de clientes ahora permite registrar equipos desde la ficha del cliente.
- Se añadió edición de datos del cliente desde su ficha.
- La ficha de cliente preselecciona al cliente al iniciar una nueva orden.
- Se añadieron acciones de llamada, correo y WhatsApp desde la ficha de cliente.
- Se añadió exportación CSV de clientes filtrados.
- La ficha de cliente permite crear una cita con el cliente preseleccionado.
- Se añadió archivado lógico de clientes para conservar historial sin mantenerlos en el listado operativo.
- Se añadió gestión de usuarios y roles del MVP con creación protegida para administradores.
- Se añadió fecha estimada de entrega en la recepción y detalle de órdenes.
- Nueva orden puede reutilizar equipos existentes del cliente sin duplicarlos.
- Se añadió proveedores como siguiente módulo operativo del roadmap, vinculado conceptualmente al inventario.
- Inventario ahora incluye proveedor asociado en sus consultas y visualización.
- El alta de piezas permite seleccionar proveedor directamente.
- Se añadió alta y ajuste de stock desde la interfaz de inventario.
- MVP operativo completado; inventario y proveedores quedan listos para la siguiente etapa de órdenes de compra.
- Se inició la siguiente etapa con órdenes de compra a proveedores y recepción futura de piezas.
- Las órdenes de compra ahora pueden recibirse y aumentar stock mediante una transacción con movimiento de inventario.
- Las órdenes de compra ahora tienen transición explícita `DRAFT -> ORDERED -> RECEIVED`.
- Las órdenes de compra permiten múltiples líneas de piezas y cantidades.
- Las órdenes de compra permiten varias piezas y cantidades por proveedor.
- El detalle de la orden permite copiar y abrir el enlace público de seguimiento del cliente.
- Inventario ahora permite crear piezas y ajustar entradas/salidas de stock desde la interfaz.
- El flujo de recepción permite reutilizar equipos existentes del cliente.
- El formulario de nueva orden ahora permite definir fecha estimada de entrega.
- Se añadió cálculo de ganancia estimada y margen al dashboard.
- La migración `add_public_tracking` fue aplicada preservando las órdenes existentes.
- Se añadió autenticación JWT, roles iniciales y usuario administrador de desarrollo.
- La API de clientes y órdenes ahora exige `Authorization: Bearer <token>`.
- El login del frontend ya autentica contra `POST /api/auth/login` y conserva el token en la sesión del navegador.
- Las rutas principales del frontend requieren sesión y la API valida permisos por rol en operaciones sensibles.
- Se añadieron `RequireAuth`, `Roles` y `RolesGuard` para proteger navegación y operaciones por perfil.
- Se añadió el módulo de pagos con anticipos, pagos parciales/finales y métodos de cobro.
- El detalle de orden permite registrar y consultar cobros desde la interfaz.
- Se añadió desglose de presupuesto, autorización y cálculo automático del total estimado.
- La migración `add_budget` fue aplicada en PostgreSQL y frontend/backend compilan correctamente.
- Se añadió inventario con existencias, mínimos, movimientos de entrada/salida y pantalla de consulta.
- La migración `add_inventory` fue aplicada en PostgreSQL.
- Se añadió consumo de piezas por orden con descuento transaccional de inventario y registro de movimiento.
- El detalle de la orden permite seleccionar piezas disponibles y registrar cantidades utilizadas.
- La migración `add_order_parts` fue aplicada en PostgreSQL.
- Se añadió agenda con eventos de recepción, entrega, citas y trabajos programados.
- La migración `add_appointments` fue aplicada en PostgreSQL.
- Se añadió base técnica con documentos, soluciones, mediciones y búsqueda por modelo/palabra clave.
- La migración `add_technical_knowledge` fue aplicada en PostgreSQL.
- El dashboard consume métricas reales mediante `GET /api/analytics/dashboard`, con fallback visual para desarrollo.
- El dashboard calcula ganancia estimada y margen a partir de órdenes y piezas consumidas.
- Se recuperaron gráficas ApexCharts en el dashboard: actividad semanal y distribución de órdenes por estado.
- La tabla de órdenes recientes del dashboard consume ahora `/api/service-orders`.
- Se añadió el formulario de alta de clientes conectado a `POST /api/customers`.
- Se añadió la ficha de cliente con equipos registrados e historial de órdenes.
- Se añadió `GET /api/auth/me` y logout real desde el menú de usuario.
- Se añadieron DTOs con `class-validator` para validar los endpoints principales antes de persistir datos.
- Se configuró Jest con pruebas unitarias iniciales para login válido y rechazo de credenciales.
- Se añadió una prueba e2e HTTP para login y protección de recursos contra PostgreSQL local.
- La prueba e2e cubre también la persistencia integrada de cliente, orden, pieza consumida y pago.
- Se añadió CI para validar base de datos, pruebas unitarias, pruebas e2e y builds en cada cambio.
- Se corrigió el backend: faltaba `backend/tsconfig.build.json`, por lo que TypeScript compilaba `src/` y `test/` juntos y emitía a `dist/src/*.js` en vez de `dist/*.js`, dejando la API sin arrancar.
- Se añadió almacenamiento de fotografías y documentos por orden de servicio usando almacenamiento compatible con S3 (MinIO en desarrollo, vía `infra/docker-compose.yml`).
- El detalle de la orden permite subir (JPG/PNG/WEBP/PDF, hasta 10MB), previsualizar y eliminar archivos adjuntos.

### En progreso

- Definir wireframes y navegación final de clientes, equipos y órdenes.
- Definir estados, roles, permisos y reglas financieras definitivas.

### Pendiente

- Ampliar la cobertura de pruebas unitarias e integración más allá de auth y el flujo principal.

## Decisiones tecnológicas

| Área | Decisión | Motivo |
| --- | --- | --- |
| Frontend | React 19 + Vite + JavaScript | Encaja con el template recibido y permite iterar rápido |
| UI | Material UI + Berry Vite | Reutiliza la base visual existente y es responsive |
| Backend | Node.js + NestJS | Modularidad, validación y crecimiento hacia API móvil |
| Persistencia | PostgreSQL | Relaciones fuertes, auditoría y consultas de negocio |
| Archivos | S3/R2; MinIO local | Mantener fotos y documentación fuera de la BBDD |
| Arquitectura | Monolito modular | Menor complejidad inicial sin cerrar la evolución futura |

## Alcance del MVP

1. Autenticación, usuarios y roles.
2. Clientes y equipos.
3. Órdenes de servicio y folios únicos.
4. Estados e historial auditable.
5. Diagnóstico y presupuesto.
6. Pagos y dashboard básico.

Inventario, agenda, notificaciones y base de conocimiento técnica quedan en fases posteriores, salvo que sean necesarios para cerrar el flujo principal.

## Entidades iniciales

`User`, `Customer`, `Device`, `ServiceOrder`, `StatusHistory`, `Payment`, `InventoryItem`, `InventoryMovement`, `OrderPart`, `TechnicalDocument` y `TechnicalNote`.

## Roles y permisos

| Acción | Admin | Recepción | Técnico |
| --- | --- | --- | --- |
| Crear/editar clientes, equipos, órdenes | ✅ | ✅ | — |
| Editar datos de una orden (falla, prioridad, equipo, entrega estimada) | ✅ | ✅ | ✅ |
| Cambiar estado de una orden | ✅ | ✅ | ✅ |
| Diagnóstico, notas técnicas, fotos/documentos | ✅ | fotos/documentos | ✅ |
| Cargar desglose de presupuesto (piezas/mano de obra) | ✅ | ✅ | ✅ |
| **Autorizar o rechazar un presupuesto** | ✅ | ✅ | ❌ |
| Consumir piezas dentro de una orden (descuenta stock) | ✅ | ✅ | ✅ |
| **Ajuste manual de stock** (entrada/salida fuera de una orden) | ✅ | ✅ | ❌ |
| Registrar pagos | ✅ | ✅ | — |
| **Ver dashboard financiero** (ganancia, margen, cobros) | ✅ | ✅ | ❌ |
| Gestionar usuarios y roles | ✅ | — | — |
| Archivar clientes | ✅ | — | — |

El técnico, al iniciar sesión, va directo a "Órdenes de servicio" en lugar del dashboard, y no ve la opción de Dashboard en el menú.

## Decisiones pendientes

- ¿La primera instalación será para un único taller o debe soportar multiempresa desde el inicio?
- ¿Qué moneda, zona horaria e impuestos se utilizarán?
- ¿Se almacenará algún dato sensible del dispositivo o solo se marcará como entregado al técnico?
- ¿Qué proveedor de correo, WhatsApp y almacenamiento se usará en producción?

## Registro de sesiones

### 2026-09-07

- Análisis inicial de documentación y template.
- Selección de React/Vite para frontend y propuesta Node/NestJS + PostgreSQL para backend.
- Creación del proyecto base y configuración inicial.
- Verificación exitosa de `npm run build` y `docker compose ... config`.
- Primera iteración visual del dashboard operativo, todavía con datos locales de demostración.
- Primera iteración del flujo `Clientes -> Nueva orden -> Órdenes de servicio`.
- Backend compilado y migración `init` aplicada sobre PostgreSQL local en el puerto `5433`.
- Se reservó el puerto `5433` para PostgreSQL porque `5432` ya estaba ocupado por otro proyecto del entorno.

### 2026-09-10

- Diagnóstico y corrección del backend: faltaba `backend/tsconfig.build.json`, lo que rompía `node dist/main` al mezclar `src/` y `test/` en el build. Se agregó el archivo y se validó login extremo a extremo.
- Se añadió el módulo de almacenamiento (`StorageService`, S3-compatible) y MinIO local (`infra/docker-compose.yml`, servicios `minio` y `minio-init` con bucket de descarga pública).
- Se añadió el modelo `OrderAttachment` y la migración `add_order_attachments`.
- Se añadieron endpoints `POST/DELETE /api/service-orders/:folio/attachments` con validación de tipo (JPG/PNG/WEBP/PDF) y tamaño (10MB máx).
- El detalle de orden ahora permite subir, previsualizar y eliminar fotos y documentos.
- Se corrigió un bug existente en `detail.jsx`: se leía `order.payments` antes de comprobar que `order` no fuera `null`, lo que podía romper el render inicial.
- Se probó el flujo completo (subida, URL pública, listado, borrado, rechazo de tipos no permitidos) contra la base de datos real.

### 2026-09-11

- Se creó el repositorio en GitHub (`MrKrypthon/repair`) con el commit inicial y se enlazó como `origin`.
- Se corrigió el CI tras el primer push: `bitnami/minio:latest` ya no existe en Docker Hub; se reemplazó por un contenedor MinIO levantado manualmente (`docker run`) más creación de bucket con `minio/mc`, verificado localmente antes de subir el fix.
- Se añadió edición de orden desde la interfaz (`PATCH /api/service-orders/:folio`): falla reportada, prioridad, fecha estimada de entrega y datos del equipo (categoría, marca, modelo, color, número de serie, IMEI).
- Se detectó y corrigió un gap real en las pruebas e2e: el `ValidationPipe` global de `main.ts` nunca se aplicaba a la app de pruebas, por lo que la validación de DTOs no se ejercitaba de verdad.
- Se definieron y aplicaron los roles y permisos: solo Admin/Recepción pueden autorizar o rechazar presupuestos, ver el dashboard financiero y hacer ajustes manuales de inventario; Técnico conserva la carga de costos, el cambio de estado y el consumo de piezas dentro de una orden. Ver tabla completa en la sección "Roles y permisos".
- Se ocultó el Dashboard del menú y la redirección de login para el rol Técnico, que ahora entra directo a Órdenes de servicio.
- Se resolvieron las 16 vulnerabilidades altas marcadas por `npm audit` (7 backend, 9 frontend). Backend: se fijaron `multer` y `deepmerge-ts` a versiones no vulnerables vía `overrides` (evitando el downgrade a NestJS 7 y Prisma 6.12 que sugería `--force`). Frontend: se actualizaron `lodash-es`, `react-router`, `react-router-dom` y `vite`, y se eliminó `prettier-eslint-cli` (dependencia de desarrollo sin uso real que arrastraba un `minimatch` vulnerable). `npm audit` queda en 0 vulnerabilidades en ambos proyectos.
- Se corrigió el manejo de sesión expirada: el cliente API ahora detecta un 401 (JWT vencido a las 8h), limpia la sesión guardada y redirige a `/pages/login` en vez de mostrar el mensaje genérico de "no se pudo conectar con la API" en cada vista.
- Se rediseñó el inventario con estilo de tienda: cada pieza tiene foto (subida a MinIO/S3, `POST/DELETE /api/inventory/:id/image`), la vista pasó de tabla a una grilla de tarjetas con imagen, y se añadió búsqueda real contra el backend (`GET /api/inventory?q=...`) con filtro por categoría en el cliente. Solo Admin/Recepción pueden subir, reemplazar o borrar la foto de un producto.
- Se rediseñó la página pública de seguimiento (`/tracking/:token`): ahora muestra una línea de tiempo visual (stepper) con la etapa actual de la reparación, las fotos del equipo subidas durante el proceso (con vista ampliada al hacer clic), y se actualiza sola cada 25s sin recargar. Los estados terminales (Cancelado, Sin reparación) muestran un aviso en vez del stepper. El endpoint público solo expone fotos, nunca documentos internos.
- Queda pendiente, y explícitamente fuera de esta iteración, enviar notificaciones reales (correo/WhatsApp/SMS) al cliente cuando cambia el estado; requiere elegir un proveedor (decisión ya listada en STATUS.md).
- Se llevó el mismo stepper visual al detalle interno de la orden (arriba de todo, antes del contenido), para que el equipo del taller vea de un vistazo en qué etapa está el equipo, igual que lo ve el cliente. La lógica del stepper se compartió entre ambas vistas vía `src/utils/serviceOrderJourney.js`.
