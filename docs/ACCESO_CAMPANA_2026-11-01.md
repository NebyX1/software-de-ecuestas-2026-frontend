# Entrada automática de campaña — 2026-11-01

## Problema y corrección

La versión anterior mostraba la bienvenida en la URL base y emitía el token después de pulsar «Comenzar encuesta». No cumplía la secuencia solicitada.

Ahora `/` y `/participar` son puntos de entrada: la aplicación consulta la configuración de seguridad, solicita la invitación mediante POST y usa `replace` para pasar a `/s/<token>`. El formulario, incluido el consentimiento, permanece oculto hasta que el backend valida la propiedad y el estado del token. El consentimiento continúa explícito y sin seleccionar.

La solicitud inicial se comparte en React StrictMode; no se repite por foco, reconexión o remontaje. Un fallo muestra un error sin formulario y permite un reintento explícito. Si Turnstile está habilitado en el backend, su validación se completa antes de emitir la invitación. No se agregaron variables de entorno.

Una invitación vigente de la misma pestaña se reanuda al regresar a la entrada. Si la invitación guardada ya venció, una nueva visita a la entrada permite solicitar otra; abrir directamente un token vencido, inválido, utilizado o ajeno no genera reemplazos. Los bloqueos persistentes del backend se conservan. El borrador de una invitación vencida se descarta al renovar.

## Alcance del control

La transición de entrada y validación permanece completamente en blanco: sin mensajes, paneles, indicadores, logo ni pie. Solo se monta la interfaz de encuesta después de validar la sesión. Los rechazos visibles son neutros y no explican el mecanismo que los produjo. Se conserva el consentimiento y la información sobre el tratamiento de los datos dentro de la encuesta. La creación reutiliza el CSRF ya obtenido en la consulta inicial; no se añade una espera artificial.

El servidor sigue vinculando el token a cookie HttpOnly firmada y UUID del navegador. Una URL copiada a otro navegador no permite responder; al consumirse, no admite otra respuesta. La recuperación idempotente del comprobante por el navegador original no guarda una segunda respuesta.

La URL pública de campaña puede escribirse o compartirse. `fbclid`, UTM, Referer y User-Agent no acreditan que Meta autorizó una visita; no se usan como autenticación. La redirección automática cumple la secuencia de entrada, sin prometer exclusividad del origen publicitario ni identificación infalible de una persona.

## Verificación

- Frontend: 124 pruebas de unidad/integración aprobadas; lint y compilación aprobados.
- Chromium sobre el frontend compilado: 8 pruebas aprobadas. Comprueban puertas de entrada, solicitud única, ausencia de formulario durante las solicitudes demoradas de creación y validación, reintento explícito, enlaces inválidos/ajenos/usados y controles visibles de selección en escritorio/móvil y simulación.
- Auditoría del backend existente: 57 pruebas aprobadas y, en una corrida separada contra MariaDB real, 7 pruebas de concurrencia aprobadas. No se cambió la lógica del servidor ni el esquema de datos para esta corrección.
- Entorno integrado local con MariaDB y Redis: 38 recorridos HTTP aprobados, incluyendo las ramas residenciales y municipales, acceso automático, enlace copiado antes y después del consumo, envío, simulación, gráficos, filtros y CSV.
- Proxy HTTPS local con frontend y API en orígenes distintos: 6 pruebas aprobadas, incluyendo las dos entradas, token inválido, enlace copiado, envío, validación CORS/CSRF, móvil y administración/CSV.

Estas pruebas utilizan datos y credenciales de prueba en un entorno local aislado. La comprobación posterior del dominio público se limita a entrar, reanudar el enlace y comprobar su bloqueo en otro contexto; no envía respuestas de encuesta. Las pruebas locales no equivalen a probar anuncios reales en aplicaciones móviles de Meta.

## Verificación del ajuste de interfaz en blanco

Tras retirar la interfaz intermedia se aprobaron 126 pruebas del frontend, lint, compilación y 9 pruebas de Chromium sobre esa compilación. Las solicitudes demoradas de creación y validación, incluyendo recargas con borrador, confirman texto vacío, fondo blanco y ausencia de logo, pie, paneles, formularios, indicadores y botones. Los rechazos no revelan el motivo técnico.

También se aprobaron 7 pruebas integradas HTTP (entrada, envío, simulación/CSV, móvil y administración) y 3 pruebas de entrada por HTTPS con frontend y API separados. La reutilización del CSRF evita una consulta redundante conservando el envío del encabezado obligatorio. Los controles del backend permanecen sin cambios.
