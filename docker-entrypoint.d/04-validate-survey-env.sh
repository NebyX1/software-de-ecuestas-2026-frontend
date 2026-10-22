#!/bin/sh
set -eu
fail() { echo "Configuracion de frontend invalida: $1" >&2; exit 1; }

# These values are interpolated into nginx.conf: accept only a private HTTP
# endpoint and a single CIDR, never nginx directives or unresolved placeholders.
printf '%s' "${BACKEND_UPSTREAM:-}" | grep -Eq '^http://[a-zA-Z0-9][a-zA-Z0-9_.-]*:[0-9]{1,5}$' || fail 'BACKEND_UPSTREAM debe ser http://DNS_INTERNO:PUERTO'
case "$BACKEND_UPSTREAM" in
  *PENDIENTE*|*CHANGE_ME*|http://localhost:*|http://127.*) fail 'Completar el DNS interno real del backend' ;;
esac
port="${BACKEND_UPSTREAM##*:}"
[ "$port" -ge 1 ] && [ "$port" -le 65535 ] || fail 'Puerto de backend fuera de rango'
printf '%s' "${TRUSTED_PROXY_CIDR:-}" | grep -Eq '^([0-9]{1,3}\.){3}[0-9]{1,3}/([1-9]|[12][0-9]|3[0-2])$|^[0-9a-fA-F:]+/([1-9]|[1-9][0-9]|1[01][0-9]|12[0-8])$' || fail 'Completar TRUSTED_PROXY_CIDR con la red exacta del proxy (sin /0)'
