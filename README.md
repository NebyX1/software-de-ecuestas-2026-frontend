# Frontend de encuestas

Aplicación independiente con React 19, TypeScript estricto, Vite, Tailwind 4/DaisyUI, React Hook Form, Zod, Zustand, Axios y React Query. Sigue la separación `features/<dominio>/{components,hooks,schema}` y `lib/{axios,query-client}` del frontend Buzón Ciudadano. Conserva las preguntas, opciones y saltos condicionales de la encuesta Lavalleja 2026.

## Desarrollo y validación

Requiere Node.js 22.12+ (22 LTS) o 24 LTS.

```sh
npm ci
npm run dev
npm run lint
npm test
npm run build
```

Vite redirige `/api`, `/admin`, `/public` y `/static` al backend (`BACKEND_UPSTREAM`, por defecto `http://127.0.0.1:5000`). No se necesita un dominio API ni cookies de terceros en el navegador.

## Coolify

Copiar el contenido completo de esta carpeta a su propio repositorio GitHub. Crear una aplicación Dockerfile, elegir el puerto interno **8080**, configurar HTTPS y el healthcheck `/health`.

El frontend se publica en **`https://uypolls.online`** y el backend en **`https://mapi.uypolls.online`**. La publicidad usará `https://uypolls.online/participar` y la administración `https://mapi.uypolls.online/admin/login`. Asignar cada dominio a su aplicación en Coolify con su certificado HTTPS. La encuesta llama `/api` de su propio dominio y Nginx conecta con el backend por red privada.

La plantilla `.env.example` incluye las variables de Coolify y marca con `PENDIENTE` el DNS privado del backend y el CIDR del proxy. En la carpeta de trabajo completa también se preparó un archivo privado `.env.coolify` para importar en Coolify; no se incluye en Git ni en los ZIP. Ver `docs/COOLIFY.md` en las exportaciones para los pasos completos. El navegador usa `/api` del propio dominio y no requiere `VITE_API_URL`.

- **Build argument opcional** `VITE_TURNSTILE_SITE_KEY`: clave pública del widget Cloudflare Turnstile, habilitada para el dominio final. Modificarla requiere reconstruir la imagen. La clave secreta pertenece únicamente al backend. Sin estas claves el control numérico propio sigue funcionando y no se necesita una cuenta externa.
- **Runtime variable** `BACKEND_UPSTREAM`: URL privada del backend en la red Docker compartida, por ejemplo `http://encuestas-backend:5000`. No agregar una barra final. Conectar ambas aplicaciones a la misma red de Coolify; evitar publicar MariaDB y Redis.
- Las URLs de participación en `uypolls.online` son `/participar` (link base de la publicidad) y `/s/<token>` (enlace personal). La administración está en `mapi.uypolls.online/admin/login`; la ruta `/admin` del frontend conserva acceso compatible mediante proxy.
- **Runtime variable** `TRUSTED_PROXY_CIDR`: CIDR exacto de la red del proxy Coolify que conecta a Nginx. Por defecto `127.0.0.1/32`, útil únicamente para acceso directo local. No usar `0.0.0.0/0`. Nginx toma `X-Forwarded-For` solo desde esta red, determina la IP real y envía un único valor a Flask; el backend usa `TRUSTED_PROXY_COUNT=1`. Si se omite este ajuste en Coolify, todos los visitantes pueden aparecer con la IP del proxy y el control de duplicados por IP bloqueará visitas legítimas.
- Nginx acepta el esquema HTTP/HTTPS reenviado únicamente desde esa red confiable. El dominio público `mapi` debe llegar a Flask mediante el proxy HTTPS de Coolify; no publicar directamente el puerto 5000 en el host. Verificar IP y cookies con dos conexiones reales diferentes antes de activar la campaña.

La imagen ejecuta Nginx sin root. El proxy sirve `/api`, `/admin` y los recursos administrativos desde el backend. Los recursos compilados están cacheados por hash; el HTML y los datos no se cachean. Los logs de acceso de Nginx omiten rutas y consultas para evitar registrar los tokens. Revisar también los logs del proxy de Coolify y de cualquier CDN.

## Encuesta y seguridad

La navegación exige los requisitos de cada pantalla y vuelve a validarlos al restaurar borradores. Minas no muestra preguntas municipales. Las seis localidades municipales solo evalúan su municipio; las zonas «otra» preguntan pertenencia y omiten el bloque cuando no se declara un municipio. Cambiar localidad/pertenencia elimina opiniones municipales anteriores; confirmar la misma conserva las vigentes. Se limpian partido y texto Otro cuando cambia su condición. Ver `docs/LOGICA_ENCUESTA.md` en los paquetes exportados.

Al enviar se incluyen datos técnicos opcionales del navegador: idioma, zona horaria, pantalla, ventana, densidad y capacidad táctil. Client Hints agrega sistema y modelo cuando están disponibles, con espera máxima de 500 ms; su ausencia no bloquea la encuesta. El backend combina esos datos con la detección del User-Agent. El aviso de privacidad informa esta captura. No se guardan estos metadatos en el borrador ni se obtiene un identificador de hardware. Los datos son descriptivos y pueden ser aproximados; ver `docs/DISPOSITIVOS.md` en los paquetes exportados.

La aceptación explícita de participación crea el enlace mediante POST; las vistas previas de Meta y las visitas GET no consumen invitaciones. Cada token está vinculado en servidor al navegador y admite una sola respuesta. Los enlaces copiados, usados o vencidos muestran un mensaje sin permitir responder. Los errores de red conservan el borrador y el envío se puede reintentar de forma idempotente.

El borrador de opiniones vive en `sessionStorage`, solo en esta pestaña. Nunca se guarda el número de celular en `localStorage` ni se descargan CSV públicos. El formato del celular y su unicidad normalizada se comprueban en el backend; no se verifica su titularidad. La pantalla final incorpora una operación numérica propia, de corta duración y vinculada al navegador, más un campo trampa invisible. No se necesita un proveedor externo. `localStorage` contiene únicamente un UUID del navegador y la marca de participación; el servidor aplica las restricciones reales y estos datos locales no son una prueba de identidad. La confirmación final aparece después del acuse del backend.

No se integran Meta Pixel ni otras herramientas que reciban respuestas o tokens. Configurar correo administrativo, retención y controles de red en el backend antes de publicar. Turnstile es una capa opcional; si se activa, configurar ambas claves y el dominio permitido. No existe una garantía absoluta de una persona por respuesta usando solo navegador/IP; usuarios con distintos dispositivos, redes y celulares pueden eludir esas señales.
## Simulación privada

El acceso `/simular` utiliza las mismas preguntas, navegación y validaciones que la encuesta principal. Se habilita desde **Simular** en el panel del backend y requiere credenciales de administrador. El estado y el CSV se conservan únicamente en memoria, sin modificar el borrador, identificadores ni bloqueos de la encuesta real. Las APIs `/api/simulation/*` viajan por el proxy existente, sin configuración de CORS adicional.
