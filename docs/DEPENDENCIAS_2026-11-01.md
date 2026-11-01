# Auditoría de dependencias — 1 de noviembre de 2026

La revisión detectó dos avisos publicados después de la entrega anterior:

- [GHSA-mrwp-f3q8-3g9p](https://github.com/advisories/GHSA-mrwp-f3q8-3g9p): se actualiza la dependencia transitiva `follow-redirects` a 1.16.2.
- [GHSA-g3hv-75wg-m249](https://github.com/advisories/GHSA-g3hv-75wg-m249): se elimina minimatch 3 del árbol de lint y se actualiza la rama 10 a 11.0.3 mediante un override limitado a `minimatch@>=10 <11`.

La actualización de herramientas utiliza ESLint 10, TypeScript ESLint compatible y React Hooks 7. El mínimo de Node pasa a 22.13. Las dos reglas Hooks que ya se ejecutaban se conservan explícitamente: `rules-of-hooks` y `exhaustive-deps`; el proyecto no utiliza el compilador de React.

El override no supone compatibilidad general entre minimatch 3, 10 y 11. Se revisaron los consumidores concretos de ESLint, config-array y TypeScript ESLint: utilizan los exports nombrados `Minimatch`/`minimatch`, `.match()` y `.pattern`, que siguen disponibles. No utilizan las APIs eliminadas de minimatch 11. Ver [changelog oficial](https://github.com/isaacs/minimatch/blob/v11.0.3/changelog.md). Retirar el override cuando los consumidores adopten directamente una versión corregida.

No se reduce el umbral de auditoría ni se ignoran estos avisos. Se comprueba la instalación, que no haya ramas 3/10 restantes, la misma cobertura de archivos de lint, pruebas, compilación y regresiones de navegador.
