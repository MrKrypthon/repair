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

Permisos iniciales: `ADMIN` puede operar todo; `RECEPTIONIST` puede crear clientes y órdenes; `TECHNICIAN` puede consultar órdenes y actualizar sus estados.

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
- `GET /api/auth/me`: devuelve el usuario autenticado.
- `GET /api/auth/technicians`: lista técnicos activos.
- `PATCH /api/service-orders/:folio/technician`: asigna o desasigna un técnico.
- `GET /api/public/tracking/:token`: consulta pública y segura del estado de una orden.
- `PATCH /api/public/tracking/:token/budget`: autoriza o rechaza el presupuesto desde el portal público.
- `POST /api/service-orders/:folio/deliver`: cierra la orden y registra la entrega.
- `POST /api/service-orders/:folio/notes`: añade una nota técnica o medición a la orden.
- `GET /api/service-orders/:folio/payments`: consulta los pagos de una orden.
- `POST /api/service-orders/:folio/payments`: registra un pago para una orden.
- `PATCH /api/service-orders/:folio/budget`: calcula y guarda el presupuesto de una orden.
- `GET /api/inventory`: consulta piezas y existencias.
- `POST /api/inventory`: crea una pieza o consumible.
- `PATCH /api/inventory/:id/stock`: registra entrada, salida o ajuste de stock.
- `POST /api/service-orders/:folio/parts`: consume una pieza y descuenta el stock de forma transaccional.
- `PATCH /api/service-orders/:folio/diagnosis`: guarda diagnóstico, causa probable y checklist técnico.
- `GET /api/appointments`: consulta la agenda ordenada por fecha.
- `POST /api/appointments`: crea una cita o evento de agenda.
- `GET /api/technical-knowledge?q=...`: busca documentación técnica.
- `POST /api/technical-knowledge`: crea una solución o documento técnico.
- `GET /api/analytics/dashboard`: devuelve métricas operativas del taller.
- `GET /api/notifications`: consulta avisos del usuario autenticado.
- `PATCH /api/notifications/:id/read`: marca un aviso como leído.
- `GET /api/users`: lista usuarios; solo administradores.
- `POST /api/users`: crea un usuario; solo administradores.
- `GET /api/suppliers`: lista proveedores activos.
- `POST /api/suppliers`: crea un proveedor.
- `GET /api/purchase-orders`: lista órdenes de compra.
- `POST /api/purchase-orders`: crea una orden de compra.
- `PATCH /api/purchase-orders/:id/receive`: recibe la compra y aumenta el stock.
- `PATCH /api/purchase-orders/:id/cancel`: cancela una compra no recibida.
- `POST /api/service-orders/:folio/attachments`: sube una foto o documento (`multipart/form-data`, campo `file`; JPG/PNG/WEBP/PDF, máx. 10MB) al almacenamiento S3-compatible.
- `DELETE /api/service-orders/:folio/attachments/:attachmentId`: elimina un archivo adjunto de la orden.

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
