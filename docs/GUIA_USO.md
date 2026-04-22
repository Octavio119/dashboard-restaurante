# Guía de Uso — Dashboard Restaurante

## Flujo de trabajo típico en un turno

### 1. Abrir caja
Al iniciar el turno, ve a **Caja** → **Abrir caja** e ingresa el fondo inicial en efectivo.
El sistema registra la hora de apertura.

### 2. Recibir reservas
En la pestaña **Reservas**:
- Revisa las reservas del día y confirma las que lleguen.
- Al llegar el cliente, cambia el estado a **"asistió"**.
- Usa el botón **"Crear pedido"** para generar el pedido de la mesa directamente desde la reserva.

### 3. Tomar pedidos
En la pestaña **Pedidos** o la vista **Por Mesa**:
- Haz clic en **+ Nuevo Pedido** e ingresa la mesa y cliente.
- Agrega ítems uno a uno (desde el catálogo de productos o libre).
- El stock se reserva al confirmar, no al crear.

### 4. Gestionar pedidos en cocina
Usa los botones de estado para avanzar el pedido:
```
Pendiente → En preparación → Entregado
```
El personal de cocina puede filtrar por estado **"En preparación"** para ver solo sus pedidos activos.

### 5. Cobrar y registrar venta
Cuando el cliente pide la cuenta:
1. Abre el pedido.
2. Haz clic en **"Registrar como venta"**.
3. Elige el método de pago (Efectivo / Tarjeta / Transferencia).
4. Confirma — se genera el ticket con número correlativo y se descuenta el stock.
5. Puedes imprimir o guardar el ticket como PDF desde el modal.

### 6. Cerrar caja
Al terminar el turno, ve a **Caja** → **Cerrar caja**:
- Ingresa el monto contado en físico.
- El sistema calcula la diferencia vs. ventas en efectivo del día.

---

## Roles y permisos

| Acción | Admin | Gerente | Staff / Mozo | Chef |
|---|:---:|:---:|:---:|:---:|
| Ver pedidos y reservas | ✓ | ✓ | ✓ | ✓ |
| Crear/editar pedidos | ✓ | ✓ | ✓ | — |
| Registrar ventas | ✓ | ✓ | ✓ | — |
| Ver analytics | ✓ | ✓ | — | — |
| Gestionar productos/stock | ✓ | ✓ | — | — |
| Gestionar usuarios | ✓ | — | — | — |
| Eliminar registros | ✓ | — | — | — |
| Configuración del negocio | ✓ | ✓ | — | — |

---

## Atajos de teclado

| Tecla | Acción |
|---|---|
| `Esc` | Cerrar modal activo |
| `Ctrl + P` | Imprimir ticket (dentro del modal de venta) |

---

## Configuración inicial recomendada

Antes de usar el sistema en producción, ve a **Configuración** y completa:

1. **Nombre del negocio** — aparece en los tickets
2. **Moneda y símbolo** — ej. `CLP` / `$`
3. **IVA / Impuesto** — activa o desactiva según tu país
4. **Prefijo de ticket** — ej. `TKT`, `FAC`, `INV`
5. **Logo** — aparece en los tickets PDF
6. **Métodos de pago activos**
7. **Usuarios** — crea cuentas para cada empleado con su rol correcto

---

## Gestión de stock

El inventario se mueve automáticamente en estos eventos:

| Evento | Efecto en stock |
|---|---|
| Confirmar pedido como venta | **Descuenta** la cantidad de cada ítem con producto asociado |
| Eliminar ítem de un pedido | **Restaura** el stock del producto |
| Registrar entrada manual | **Suma** al stock |
| Ajuste de inventario | Suma o resta según el tipo |

Para ver el historial de movimientos de un producto ve a **Inventario → Movimientos**.

---

## Multi-dispositivo / Tiempo real

El sistema sincroniza cambios entre todos los dispositivos conectados via WebSocket.
Esto significa que si el mozo agrega un ítem en la tablet, cocina lo ve al instante en su pantalla, sin necesitar recargar.

Para verificar la conexión en tiempo real, abre dos ventanas del navegador y haz un cambio en una: debería reflejarse en la otra en menos de 1 segundo.

---

## Backups

Para hacer un backup manual de la base de datos PostgreSQL:

```bash
pg_dump -U postgres dashboard_restaurante > backup_$(date +%Y%m%d).sql
```

Para restaurar:

```bash
psql -U postgres dashboard_restaurante < backup_20260421.sql
```

Se recomienda automatizar esto con un cron job diario en producción.

---

## Soporte

- Documentación API: `http://tu-servidor/api/docs` (Swagger interactivo)
- FAQ completo: [docs/FAQ.md](FAQ.md)
- Reportar bugs: abre un issue en el repositorio de GitHub
- Email: farahfo4715@gmail.com
