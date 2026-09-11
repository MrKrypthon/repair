# Arquitectura inicial

```text
React/Vite + MUI
       |
       | HTTP/JSON
       v
NestJS modular
       |
       +--> PostgreSQL
       +--> Object Storage (S3/R2/MinIO)
```

La orden de servicio es la entidad central. Clientes y equipos se relacionan con ella; diagnóstico, presupuesto, estados, pagos, piezas y notas técnicas deben conservar trazabilidad.

## Reglas técnicas

- Validar permisos en backend, no solo en la interfaz.
- Usar migraciones versionadas para PostgreSQL.
- Aplicar soft delete solo donde la recuperación sea relevante.
- Guardar archivos en object storage, no como blobs de la base de datos.
- Añadir `created_at`, `updated_at` y usuario actor a las entidades auditables.
- Diseñar la API para que posteriormente pueda consumirla una aplicación móvil.
