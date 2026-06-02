// Planificador de Rutas
const RouteManager = {
    routePoints: [],
    routeLine: null,
    init() {
        document.getElementById('hideRouteBtn').addEventListener('click', () => this.hidePanel());
        document.getElementById('showRouteBtn').addEventListener('click', () => this.showPanel());
        document.getElementById('exportRouteBtn').addEventListener('click', () => this.exportToGoogleMaps());
        document.getElementById('saveRouteBtn').addEventListener('click', () => this.saveRoute());
        document.getElementById('clearRouteBtn').addEventListener('click', () => this.clearRoute());
    },
    addPoint(station) {
        // Verificar si ya está en la ruta
        if (this.routePoints.some(p => p.id === station.id)) {
            alert('Esta estación ya está en tu ruta');
            return;
        }
        
        // Mostrar animación de carga
        MapController.showLoading('Añadiendo a Mi Ruta...');
        
        // Pequeño retraso para que el navegador pinte el overlay antes
        // de la operación (recrear marcadores del mapa)
        setTimeout(() => {
            this.routePoints.push(station);
            this.updateUI();
            this.updateMapVisualization();
            this.openPanel();
            MapController.hideLoading();
            
            console.log(`✓ Punto añadido a ruta: ${station.name}`);
        }, 50);
    },
    removePoint(stationId) {
        // Verificar que el punto existe antes de mostrar la animación
        if (!this.routePoints.some(p => p.id === stationId)) {
            return;
        }
        
        // Mostrar animación de carga
        MapController.showLoading('Eliminando...');
        
        // Pequeño retraso para que el navegador pinte el overlay antes
        // de la operación (recrear marcadores del mapa)
        setTimeout(() => {
            const index = this.routePoints.findIndex(p => p.id === stationId);
            if (index !== -1) {
                this.routePoints.splice(index, 1);
            }
            this.updateUI();
            this.updateMapVisualization();
            
            if (this.routePoints.length === 0) {
                this.closePanel();
            }
            
            MapController.hideLoading();
        }, 50);
    },
    clearRoute() {
        if (confirm('¿Seguro que quieres limpiar la ruta?')) {
            // Mostrar animación de carga
            MapController.showLoading('Eliminando...');
            
            // Pequeño retraso para que el navegador pinte el overlay antes
            // de la operación (recrear marcadores del mapa)
            setTimeout(() => {
                this.routePoints = [];
                this.updateUI();
                this.updateMapVisualization();
                this.closePanel();
                MapController.hideLoading();
            }, 50);
        }
    },
    updateUI() {
        const emptyDiv = document.getElementById('routeEmpty');
        const listDiv = document.getElementById('routeList');
        const actionsDiv = document.getElementById('routeActions');
        
        if (this.routePoints.length === 0) {
            emptyDiv.style.display = 'block';
            listDiv.style.display = 'none';
            actionsDiv.style.display = 'none';
            listDiv.innerHTML = '';
        } else {
            emptyDiv.style.display = 'none';
            listDiv.style.display = 'flex';
            actionsDiv.style.display = 'flex';
            
            // Generar HTML de la lista
            listDiv.innerHTML = this.routePoints.map((point, index) => `
                <div class="route-item">
                    <div class="route-number">${index + 1}</div>
                    <div class="route-item-info">
                        <div class="route-item-name">${point.name}</div>
                        <div class="route-item-location">${point.town}, ${point.country}</div>
                    </div>
                    <button class="btn-remove-point" onclick="RouteManager.removePoint(${point.id})">
                        <span class="material-icons-outlined">close</span>
                    </button>
                </div>
            `).join('');
        }
    },
    updateMapVisualization() {
        // Actualizar marcadores con números
        MapController.updateRouteMarkers(this.routePoints);
        
        // Dibujar/actualizar línea de puntos
        if (this.routeLine) {
            MapController.map.removeLayer(this.routeLine);
            this.routeLine = null;
        }
        
        if (this.routePoints.length >= 2) {
            const latLngs = this.routePoints.map(p => [p.latitude, p.longitude]);
            this.routeLine = L.polyline(latLngs, {
                color: '#F44336',
                weight: 4,
                opacity: 0.7,
                dashArray: '10, 10'
            }).addTo(MapController.map);
        }
    },
    exportToGoogleMaps() {
        if (this.routePoints.length < 2) {
            alert('Necesitas al menos 2 puntos para crear una ruta');
            return;
        }
        
        // Crear URL de Google Maps con waypoints
        const origin = `${this.routePoints[0].latitude},${this.routePoints[0].longitude}`;
        const destination = `${this.routePoints[this.routePoints.length - 1].latitude},${this.routePoints[this.routePoints.length - 1].longitude}`;
        
        let url = `https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${destination}`;
        
        // Añadir puntos intermedios
        if (this.routePoints.length > 2) {
            const waypoints = this.routePoints
                .slice(1, -1)
                .map(p => `${p.latitude},${p.longitude}`)
                .join('|');
            url += `&waypoints=${waypoints}`;
        }
        
        // Abrir en nueva pestaña
        window.open(url, '_blank');
        
        console.log('✓ Ruta exportada a Google Maps');
    },
    saveRoute() {
        if (this.routePoints.length < 2) {
            alert('Necesitas al menos 2 puntos para guardar una ruta');
            return;
        }
        
        // Generar nombre automático: "De: (primer punto) a: (último punto)"
        const firstName = this.routePoints[0].name;
        const lastName = this.routePoints[this.routePoints.length - 1].name;
        const routeName = `De: ${firstName} a: ${lastName}`;
        
        const route = {
            name: routeName,
            points: this.routePoints,
            createdAt: new Date().toISOString()
        };
        
        // Guardar en almacenamiento local
        const savedRoutes = JSON.parse(localStorage.getItem('ev_saved_routes') || '[]');
        savedRoutes.push(route);
        localStorage.setItem('ev_saved_routes', JSON.stringify(savedRoutes));
        
        alert(`Ruta "${routeName}" guardada correctamente`);
        console.log('✓ Ruta guardada en historial');
    },
    openPanel() {
        // Abre el panel y oculta el botón flotante "Mostrar panel"
        document.getElementById('routePanel').classList.add('active');
        document.getElementById('showRouteBtn').classList.remove('visible');
    },
    showPanel() {
        // Acción del botón "Mostrar panel"
        this.openPanel();
    },
    hidePanel() {
        // Acción del botón "Ocultar panel": oculta el panel y muestra el botón flotante
        document.getElementById('routePanel').classList.remove('active');
        document.getElementById('showRouteBtn').classList.add('visible');
    },
    closePanel() {
        // Cierra el panel por completo (sin ruta activa): oculta panel y botón flotante
        document.getElementById('routePanel').classList.remove('active');
        document.getElementById('showRouteBtn').classList.remove('visible');
    },
    isInRoute(stationId) {
        return this.routePoints.some(p => p.id === stationId);
    },
    getRouteIndex(stationId) {
        return this.routePoints.findIndex(p => p.id === stationId);
    }
};

