# Frontend de encuestas

Aplicación independiente con React 19, TypeScript estricto, Vite, Tailwind 4/DaisyUI, React Hook Form, Zod, Zustand, Axios y React Query. Sigue la separación `features/<dominio>/{components,hooks,schema}` y `lib/{axios,query-client}` del frontend Buzón Ciudadano. Conserva las preguntas, opciones y saltos condicionales de la encuesta Lavalleja 2026.

## Desarrollo y validación

Requiere Node.js 22.13+ (22 LTS) o 24 LTS.

```sh
npm ci
npm run dev
npm run lint
npm test
npm run build
```

La conexión sigue el frontend de Buzón Ciudadano: Axios toma la URL del backend de `VITE_API_URL` y usa `withCredentials: true`. Para desarrollo local funciona por defecto con `http://localhost:5000`. Si usás otra URL, crear `.env.local` con esa única variable.

## Coolify

Crear una aplicación Dockerfile desde este repositorio, con puerto interno **8080**, dominio **`https://uypolls.online`** y healthcheck `/health`.

La plantilla pública `.env.example` deja el valor vacío. Los archivos reales `.env` y `.env.coolify` permanecen fuera de Git. La URL de la API es pública y todas las variables `VITE_*` son visibles en el navegador: nunca deben contener contraseñas ni claves secretas.

La única variable del frontend, que se configura en Coolify, es:

```dotenv
VITE_API_URL=https://mapi.uypolls.online
```

En Coolify habilitar **Build time** para esa variable y reconstruir la imagen si cambia. El Dockerfile ya declara su argumento de build. No se requieren variables de runtime ni configurar una red privada entre frontend y backend. Nginx sirve únicamente los archivos compilados y adapta la política CSP a esa misma URL.

El backend se publica en **`https://mapi.uypolls.online`** y configura `FRONTEND_URL=https://uypolls.online` y `CORS_ORIGINS=https://uypolls.online`. Ambos dominios deben usar HTTPS. Las cookies se mantienen en el host del backend con `Secure`, `HttpOnly` y `SameSite=Lax`; no se necesita compartirlas con el frontend. La API exige el token CSRF y admite únicamente los orígenes configurados. El panel administrativo mantiene CSRF del mismo origen.

La campaña usa `https://uypolls.online/participar`. Las invitaciones se abren en `https://uypolls.online/s/<token>` y el panel en `https://mapi.uypolls.online/admin/login`. La prueba de conexión es `https://mapi.uypolls.online/api/csrf`. La simulación se abre en `https://uypolls.online/simular`.

El verificador numérico propio sigue habilitado sin proveedores externos. Si se activa Turnstile opcional, sus claves se configuran únicamente en el backend, que entrega la clave pública al frontend. No requiere otra variable ni reconstruir este frontend.

La imagen ejecuta Nginx sin root. Los recursos compilados se cachean por hash y el HTML no se cachea. Los logs omiten rutas y consultas para proteger los enlaces personales.

## Encuesta y seguridad

El aviso de participación 2026-03 informa que la IP pública de envío se registra junto con cada respuesta, con acceso limitado al panel y CSV administrativos. El CSV de simulación también incluye la IP de la conexión al finalizar, sin guardar la simulación en la base de datos.

La navegación exige los requisitos de cada pantalla y vuelve a validarlos al restaurar borradores. Minas no muestra preguntas municipales. Las seis localidades municipales solo evalúan su municipio; las zonas «otra» preguntan pertenencia y omiten el bloque cuando no se declara un municipio. Cambiar localidad/pertenencia elimina opiniones municipales anteriores; confirmar la misma conserva las vigentes. Se limpian partido y texto Otro cuando cambia su condición. Ver `docs/LOGICA_ENCUESTA.md` en los paquetes exportados.

Al enviar se incluyen datos técnicos opcionales del navegador: idioma, zona horaria, pantalla, ventana, densidad y capacidad táctil. Client Hints agrega sistema y modelo cuando están disponibles, con espera máxima de 500 ms; su ausencia no bloquea la encuesta. El backend combina esos datos con la detección del User-Agent. El aviso de privacidad informa esta captura. No se guardan estos metadatos en el borrador ni se obtiene un identificador de hardware. Los datos son descriptivos y pueden ser aproximados; ver `docs/DISPOSITIVOS.md` en los paquetes exportados.

Al abrir `/` o `/participar`, el navegador crea automáticamente una invitación mediante POST y reemplaza la URL por `/s/<token>` antes de mostrar el formulario. No hay un botón previo para generar el enlace. El consentimiento se solicita dentro de esa ruta, después de validar el token y su navegador; generar el enlace no acepta la participación ni registra una respuesta. Al recargar o regresar a la entrada en la misma pestaña se recupera la invitación y el borrador vigentes. Descargar únicamente el HTML no crea ni consume invitaciones; un navegador que ejecuta la aplicación sí puede crearlas. Si se configura Turnstile, su validación debe completarse antes de emitir el token.

Durante la entrada y validación la pantalla permanece en blanco, sin logo, pie, mensajes, indicadores ni controles del formulario. Al finalizar aparece la encuesta o un aviso neutro de indisponibilidad/participación registrada. No se explican al participante los mecanismos internos del enlace. La creación reutiliza el CSRF obtenido al consultar la configuración para evitar otra petición redundante; no hay pausas artificiales.

Cada token está vinculado en servidor al navegador y admite una sola respuesta. Los enlaces copiados desde otro navegador, usados o vencidos muestran un mensaje sin permitir responder ni generar automáticamente un token de reemplazo. Los errores de red conservan el borrador y el envío se puede reintentar de forma idempotente. La URL pública de campaña puede abrirse manualmente o compartirse: `fbclid`, UTM, Referer y User-Agent no son pruebas de autorización de Meta y no se usan como tales.

El borrador de opiniones vive en `sessionStorage`, solo en esta pestaña. Nunca se guarda el número de celular en `localStorage` ni se descargan CSV públicos. El formato del celular y su unicidad normalizada se comprueban en el backend; no se verifica su titularidad. La pantalla final incorpora una operación numérica propia, de corta duración y vinculada al navegador, más un campo trampa invisible. No se necesita un proveedor externo. `localStorage` contiene únicamente un UUID del navegador y la marca de participación; el servidor aplica las restricciones reales y estos datos locales no son una prueba de identidad. La confirmación final aparece después del acuse del backend.

No se integran Meta Pixel ni otras herramientas que reciban respuestas o tokens. Configurar correo administrativo, retención y controles de red en el backend antes de publicar. Turnstile es una capa opcional; si se activa, configurar las claves y el dominio permitido en el backend. No existe una garantía absoluta de una persona por respuesta usando solo navegador/IP; usuarios con distintos dispositivos, redes y celulares pueden eludir esas señales.
## Simulación privada

El acceso `/simular` utiliza las mismas preguntas, navegación y validaciones que la encuesta principal. Se habilita desde **Simular** en el panel del backend y requiere credenciales de administrador. El estado y el CSV se conservan únicamente en memoria, sin modificar el borrador, identificadores ni bloqueos de la encuesta real. Las APIs `/api/simulation/*` usan la misma `VITE_API_URL` y las cookies del backend.
