# Backend

El backend se implementa con Node.js, NestJS y Prisma como monolito modular.

## Configuración

```bash
cp .env.example .env
npm install
npm run prisma:generate
npm run prisma:migrate -- --name init
npm run prisma:seed
npm run start:dev
```

Usuario inicial de desarrollo: `admin@electronicatech.local` / `Admin123!`. Debe cambiarse antes de un despliegue real.

Para poblar la base con datos demo cercanos a la realidad (clientes, equipos, órdenes en distintos estados, inventario, proveedores, órdenes de compra recibidas y pagos, con finanzas netas en positivo):

```bash
DATABASE_URL="postgresql://electronica:electronica_dev@localhost:5433/electronica_tech?schema=public" npm run prisma:demo-seed
```

`prisma:demo-seed` **agrega** datos, no es idempotente: pensado para correrse una sola vez sobre una base de desarrollo vacía o casi vacía. Usuarios técnico/recepción demo: `ana.garcia@electronicatech.local`, `luis.martinez@electronicatech.local`, `sofia.hernandez@electronicatech.local` (contraseña `Demo123!`).

Permisos: `ADMIN` puede operar todo. `RECEPTIONIST` puede crear/editar clientes y órdenes, registrar pagos y autorizar presupuestos. `TECHNICIAN` puede editar datos de la orden, cambiar estados, diagnosticar, adjuntar fotos/documentos, cargar el desglose de costos y consumir piezas dentro de una orden — pero no puede autorizar/rechazar presupuestos, hacer ajustes manuales de stock ni ver el dashboard financiero. Detalle completo en `STATUS.md`.

La API queda disponible en `http://localhost:3001/api`.

Los endpoints de escritura validan cuerpos, enums, fechas, importes y cantidades mediante `class-validator`.

Pruebas unitarias:

```bash
npm test
```

Pruebas HTTP contra PostgreSQL local:

```bash
DATABASE_URL="postgresql://electronica:electronica_dev@localhost:5433/electronica_tech?schema=public" npm run test:e2e
```

**Atención:** las pruebas e2e escriben datos reales (clientes, órdenes, pagos con sufijos `E2E ...`) en la base indicada por `DATABASE_URL`. Correrlas contra tu base de desarrollo la deja con esos registros de prueba mezclados con los reales/demo — no se limpian solas. Usa una base separada para pruebas si quieres mantener tu base de desarrollo limpia (en CI ya corren contra un Postgres efímero propio).

La prueba e2e cubre el flujo cliente -> orden -> pieza -> pago.

Para levantar solo la API, asegúrate de que PostgreSQL esté activo y ejecuta:

```bash
DATABASE_URL="postgresql://electronica:electronica_dev@localhost:5433/electronica_tech?schema=public" npm run start:dev
```

## Endpoints iniciales

- `GET /api/customers`: lista clientes con sus equipos y cantidad de órdenes.
- `POST /api/customers`: crea un cliente.
- `PATCH /api/customers/:id`: actualiza los datos de un cliente.
- `PATCH /api/customers/:id/archive`: archiva o reactiva un cliente sin borrar su historial.
- `GET /api/service-orders`: lista órdenes con cliente, equipo e historial.
- `POST /api/service-orders`: crea equipo, orden y primer evento de estado dentro de una transacción.
- `GET /api/service-orders/:folio`: consulta el detalle de una orden.
- `PATCH /api/service-orders/:folio`: edita falla reportada, prioridad, fecha estimada de entrega y datos del equipo.
- `PATCH /api/service-orders/:folio/status`: cambia el estado y registra la transición.
- `POST /api/auth/login`: autentica al usuario y devuelve un JWT.
- `GET /api/auth/me`: devuelve el usuario autenticado, incluyendo `avatarUrl` si tiene foto de perfil.
- `PATCH /api/auth/me`: actualiza el nombre del usuario autenticado.
- `PATCH /api/auth/me/password`: cambia la contraseña del usuario autenticado (requiere la contraseña actual).
- `POST /api/auth/me/avatar`: sube o reemplaza la foto de perfil (`multipart/form-data`, campo `file`; JPG/PNG/WEBP, máx. 5MB).
- `DELETE /api/auth/me/avatar`: elimina la foto de perfil.
- `GET /api/auth/technicians`: lista técnicos activos.
- `PATCH /api/service-orders/:folio/technician`: asigna o desasigna un técnico.
- `GET /api/public/tracking/:token`: consulta pública y segura del estado de una orden.
- `PATCH /api/public/tracking/:token/budget`: autoriza o rechaza el presupuesto desde el portal público.
- `POST /api/service-orders/:folio/deliver`: cierra la orden, registra la entrega y, si se indica `warrantyDays`, calcula la fecha de vencimiento de garantía.
- `POST /api/service-orders/:folio/warranty-claim`: abre una nueva orden (folio `GA-...`) vinculada a la original, reutilizando cliente y equipo. Solo si la orden original está entregada y su garantía sigue vigente.
- `POST /api/service-orders/:folio/notes`: añade una nota técnica o medición a la orden.
- `GET /api/service-orders/:folio/payments`: consulta los pagos de una orden.
- `POST /api/service-orders/:folio/payments`: registra un pago para una orden.
- `PATCH /api/service-orders/:folio/budget`: calcula y guarda el presupuesto de una orden.
- `GET /api/inventory`: consulta piezas y existencias.
- `GET /api/inventory?q=...`: busca piezas por nombre, SKU o categoría.
- `POST /api/inventory`: crea una pieza o consumible.
- `PATCH /api/inventory/:id`: edita nombre, categoría, costo, precio, stock mínimo o proveedor. Si cambia el costo o el precio, registra el cambio en el historial.
- `GET /api/inventory/:id/price-history`: historial de cambios de costo/precio de una pieza (edición manual o recepción de orden de compra).
- `PATCH /api/inventory/:id/stock`: registra entrada, salida o ajuste de stock. Si el stock cruza el mínimo configurado, crea una notificación interna de tipo `WARNING`.
- `POST /api/inventory/:id/image`: sube o reemplaza la foto del producto (JPG/PNG/WEBP, máx. 5MB).
- `DELETE /api/inventory/:id/image`: elimina la foto del producto.
- `POST /api/service-orders/:folio/parts`: consume una pieza y descuenta el stock de forma transaccional.
- `PATCH /api/service-orders/:folio/diagnosis`: guarda diagnóstico, causa probable y checklist técnico.
- `GET /api/appointments`: consulta la agenda ordenada por fecha.
- `POST /api/appointments`: crea una cita o evento de agenda.
- `PATCH /api/appointments/:id/status`: marca un evento como completado o cancelado.
- `GET /api/technical-knowledge?q=...`: busca documentación técnica.
- `POST /api/technical-knowledge`: crea una solución o documento técnico.
- `GET /api/analytics/dashboard`: devuelve métricas operativas del taller, incluyendo la tendencia de recepción/entrega de los últimos 7 días (`weeklyVolume`), el desglose de órdenes activas por estado (`statusBreakdown`) y los equipos recibidos hoy por categoría (`todayReception`).
- `GET /api/analytics/technicians?from=&to=`: por cada técnico, órdenes cerradas, órdenes activas, tiempo promedio de reparación e ingresos/ganancia generados; solo administradores.
- `GET /api/search?q=...`: búsqueda global (mín. 2 caracteres) en clientes, órdenes de servicio e inventario, hasta 5 resultados por categoría.
- `GET /api/finance/summary?from=&to=`: ingresos (pagos), gastos (órdenes de compra recibidas), ganancia neta, tendencia mensual y movimientos; solo administradores.
- `GET /api/notifications`: consulta avisos del usuario autenticado.
- `PATCH /api/notifications/:id/read`: marca un aviso como leído.
- `GET /api/users`: lista usuarios; solo administradores.
- `POST /api/users`: crea un usuario; solo administradores.
- `GET /api/suppliers`: lista proveedores activos.
- `POST /api/suppliers`: crea un proveedor.
- `GET /api/service-catalog?q=&includeInactive=`: lista el catálogo de precios de mano de obra/servicios (activos por defecto; búsqueda opcional por nombre).
- `POST /api/service-catalog`: crea un servicio con costo y precio; solo Admin/Recepción.
- `PATCH /api/service-catalog/:id`: edita nombre, descripción, costo o precio; solo Admin/Recepción.
- `PATCH /api/service-catalog/:id/archive`: activa o desactiva un servicio sin borrar su historial de uso en cotizaciones anteriores; solo Admin/Recepción.
- `GET /api/purchase-orders`: lista órdenes de compra.
- `POST /api/purchase-orders`: crea una orden de compra.
- `PATCH /api/purchase-orders/:id/receive`: recibe la compra y aumenta el stock.
- `PATCH /api/purchase-orders/:id/cancel`: cancela una compra no recibida.
- `POST /api/service-orders/:folio/attachments`: sube una foto o documento (`multipart/form-data`, campo `file`; JPG/PNG/WEBP/PDF, máx. 10MB) al almacenamiento S3-compatible.
- `DELETE /api/service-orders/:folio/attachments/:attachmentId`: elimina un archivo adjunto de la orden.
- `GET /api/quotations?status=...`: lista cotizaciones, opcionalmente filtradas por estado.
- `GET /api/quotations/:folio`: consulta el detalle de una cotización (cliente, equipo, conceptos, orden generada si aplica).
- `POST /api/quotations`: crea una cotización con sus conceptos (cliente + equipo existente o nuevo); solo Admin/Recepción.
- `PATCH /api/quotations/:folio`: edita falla, notas, vigencia o conceptos; solo si sigue en borrador.
- `PATCH /api/quotations/:folio/status`: marca como enviada, aprobada o rechazada; una vez aprobada/rechazada ya no admite más cambios de estado.
- `POST /api/quotations/:folio/convert`: convierte una cotización aprobada en una orden de servicio nueva (folio `OS-...`), reutilizando cliente, equipo y el total como costo estimado.

## Módulos previstos

- `auth`
- `users`
- `customers`
- `devices`
- `service-orders`
- `payments`
- `inventory`
- `technical-knowledge`
- `analytics`
- `notifications`

La API deberá conservar el historial de estados, pagos, diagnósticos y piezas de cada orden. Las credenciales y datos sensibles nunca deben exponerse al frontend ni almacenarse en texto plano.
