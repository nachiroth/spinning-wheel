# Guía de Usuario - Spinning Wheel

## Idioma

[English](USER_GUIDE.md) | [Español](USER_GUIDE.es.md)

## Resumen

Spinning Wheel permite definir opciones de desafío, girar al azar y usar modo turno, donde se eliminan opciones ya usadas después de cada giro.

## Controles Principales

- `Idioma`: alterna EN/ES
- `Sonido`: silenciar/activar efectos
- `Modo turno`: elimina opciones seleccionadas tras cada resultado
- `Pantalla completa`: alterna fullscreen
- `Configuración`: abre/cierra el panel lateral

## Flujo Básico

1. Click en `¡Girar!` (o `Enter`).
2. Esperar a que la ruleta se detenga.
3. Revisar el desafío seleccionado en el overlay de resultado.
4. Click en `Continuar` (o `Enter`) para seguir.

## Panel de Configuración

Dentro de Configuración podés:

- Elegir paleta de colores.
- Agregar un desafío (máx. 30 caracteres).
- Editar texto de desafíos en línea.
- Eliminar desafíos.
- `Restaurar`: volver a la lista por defecto.
- `Reiniciar`: limpiar eliminaciones y reiniciar el set actual.

## Modo Turno

Con modo turno activo:

1. Girás la ruleta.
2. La opción seleccionada queda marcada para eliminarse al pulsar `Continuar`.
3. Repetís hasta no dejar opciones.
4. Aparece modal de finalización.

## Atajos de Teclado

- `Enter`
- En campo de texto: agrega opción.
- Fuera del input: gira / continuar / jugar de nuevo.
- `Esc`
- Cierra el panel de configuración.
- Cierra el overlay de resultado.

## Solución de Problemas

- Sin sonido: interactuá una vez con la app (click/teclado), revisá icono de silencio y volumen del sistema.
- No gira la ruleta: verificá que exista al menos una opción activa y que no haya modal bloqueando.
- No guarda cambios: verificá que `localStorage` esté habilitado en el contexto de la app.
