Planificador de rutas para vehículos eléctricos

Aplicación web para la planificación de rutas de carga de vehículos eléctricos. Permite localizar estaciones de carga en un mapa interactivo, filtrarlas, construir rutas con varias paradas y exportarlas a Google Maps.

Desarrollada como Trabajo de Fin de Grado (TFG) del Grado en Diseño y Creaciones Digitales de la Universitat Oberta de Catalunya (UOC).

Características

- Mapa interactivo con estaciones de carga obtenidas en tiempo real desde la API de Open Charge Map.
- Cobertura internacional: más de 90 países disponibles, con sistema de regiones para países de alta densidad.
- Filtros dinámicos por país y por velocidad de carga.
- Planificador de rutas: selección de varios puntos de carga, visualización de la ruta en el mapa y exportación directa a Google Maps.
- Historial de rutas guardadas mediante almacenamiento local del navegador.
- Perfil de usuario con gestión de múltiples vehículos eléctricos y preferencias de carga.
- Diseño responsive adaptado a dispositivos de escritorio y móviles.

Estructura del proyecto

index.html - Punto de entrada de la aplicación
css/styles.css - Estilos de la aplicación
js/config.js - Configuración (API, mapa, regiones)
js/filters.js - Sistema de filtros
js/profile-manager.js - Gestión del perfil y vehículos
js/history-manager.js - Historial de rutas guardadas
js/route-manager.js - Planificador de rutas
js/map-controller.js - Control del mapa y estaciones
js/app.js - Inicio de la aplicación

Tecnologías utilizadas

- HTML5 y CSS3 (diseño responsive con variables CSS).
- JavaScript (ES6+) sin frameworks.
- Leaflet.js para el mapa interactivo.
- Leaflet.markercluster para la agrupación de marcadores.
- Open Charge Map API como fuente de datos de estaciones.

Uso en local

Como buena práctica, también puede iniciarse con un servidor local:

```bash
# Con Python instalado
python -m http.server 8000
```

Y abrir `http://localhost:8000` en el navegador.

## Autor

José María Rodrigo Cruz — UOC
