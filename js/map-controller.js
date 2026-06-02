// Mapa
const MapController = {
    map: null,
    markersLayer: null,
    allStations: [],
    currentMarkers: [],
    init() {
        this.map = L.map('map', {
            center: CONFIG.MAP.DEFAULT_CENTER,
            zoom: CONFIG.MAP.DEFAULT_ZOOM,
            minZoom: CONFIG.MAP.MIN_ZOOM,
            maxZoom: CONFIG.MAP.MAX_ZOOM,
            zoomControl: false
        });
        L.tileLayer(CONFIG.MAP.TILE_LAYER, {
            attribution: CONFIG.MAP.ATTRIBUTION,
            maxZoom: CONFIG.MAP.MAX_ZOOM
        }).addTo(this.map);
        
        // Crear cluster group para marcadores
        this.markersLayer = L.markerClusterGroup({
            maxClusterRadius: 80,        // Radio de agrupación (px)
            spiderfyOnMaxZoom: true,     // Expandir en zoom máximo
            showCoverageOnHover: false,  // No mostrar área al hover
            zoomToBoundsOnClick: true,   // Zoom al click en cluster
            disableClusteringAtZoom: 16, // Desagrupar a partir de zoom 16
            chunkedLoading: true,        // Carga por chunks (mejor rendimiento)
            chunkInterval: 200,          // Intervalo entre chunks (ms)
            chunkDelay: 50              // Delay entre chunks (ms)
        }).addTo(this.map);
        
        document.getElementById('zoomInBtn').addEventListener('click', () => this.map.zoomIn());
        document.getElementById('zoomOutBtn').addEventListener('click', () => this.map.zoomOut());
        console.log('✓ Mapa iniciado con clustering');
    },
    async loadStations(countryCode = 'ES') {
        try {
            this.showLoading();
            
            // Obtener estaciones (con paginación automática)
            const stations = await API.getTransformedStations(countryCode);
            
            this.allStations = stations;
            const filtered = Filters.filterStations(stations);
            this.displayStations(filtered);
            this.updateStationCount(filtered.length);
            this.hideLoading();
            console.log(`✓ ${filtered.length} estaciones mostradas`);
        } catch (error) {
            console.error('Error:', error);
            this.hideLoading();
            alert('Error al cargar estaciones');
        }
    },
    displayStations(stations) {
        this.clearMarkers();
        stations.forEach(s => {
            if (s.latitude && s.longitude) {
                const marker = this.createMarker(s);
                this.markersLayer.addLayer(marker);
                this.currentMarkers.push(marker);
            }
        });
        if (this.currentMarkers.length > 0) {
            const group = L.featureGroup(this.currentMarkers);
            this.map.fitBounds(group.getBounds(), { padding: [50, 50], maxZoom: 12 });
        }
    },
    createPopupContent(station) {
        const raw = station.rawData || {};
        const addr = raw.AddressInfo || {};
        const usage = raw.UsageType || {};
        
        // Helper: formatear valor o "No disponible"
        const fmt = (val) => val || 'No disponible';
        
        // Coste
        const costText = raw.UsageCost || (usage.IsFreeCharge ? 'Gratuito' : 'No disponible');
        
        // Potencias disponibles (en Kw)
        let powerText = '';
        if (station.connections && station.connections.length > 0) {
            const powers = [...new Set(station.connections.map(c => c.power).filter(p => p > 0))].sort((a, b) => a - b);
            powerText = powers.map(p => `${p}kW`).join(', ');
        }
        
        // HTML del popup
        return `
            <div class="station-popup">
                <h3 class="station-name">${station.name}</h3>
                
                <div class="station-info">
                    <div class="station-detail">
                        <span class="material-icons-outlined">location_on</span>
                        <span>${station.town || station.address}, ${station.country}</span>
                    </div>
                    
                    <div class="station-detail">
                        <span class="material-icons-outlined">ev_station</span>
                        <span>${raw.NumberOfPoints || station.numConnectors} punto${(raw.NumberOfPoints || station.numConnectors) !== 1 ? 's' : ''} de carga</span>
                    </div>
                    
                    ${powerText ? `
                        <div class="station-detail">
                            <span class="material-icons-outlined">power</span>
                            <span><strong>Conectores disponibles:</strong> ${powerText}</span>
                        </div>
                    ` : ''}
                    
                    <div class="station-detail">
                        <span class="material-icons-outlined">payments</span>
                        <span>${costText}</span>
                    </div>
                    
                    ${station.operator !== 'Desconocido' ? `
                        <div class="station-detail">
                            <span class="material-icons-outlined">business</span>
                            <span>${station.operator}</span>
                        </div>
                    ` : ''}
                    
                    ${addr.AccessComments ? `
                        <div class="station-detail">
                            <span class="material-icons-outlined">info</span>
                            <span>${addr.AccessComments}</span>
                        </div>
                    ` : ''}
                </div>
                
                <!-- Botón para añadir a ruta -->
                <button class="btn-add-to-route" onclick="RouteManager.addPoint({
                    id: ${station.id},
                    name: '${station.name.replace(/'/g, "\\'")}',
                    town: '${(station.town || station.address).replace(/'/g, "\\'")}',
                    country: '${station.country}',
                    latitude: ${station.latitude},
                    longitude: ${station.longitude}
                })" style="
                    width: 100%;
                    padding: 10px;
                    margin-top: 12px;
                    background-color: var(--color-secondary);
                    color: white;
                    border: none;
                    border-radius: 4px;
                    font-weight: 600;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 8px;
                    transition: all 0.2s;
                " onmouseover="this.style.backgroundColor='#388E3C'" onmouseout="this.style.backgroundColor='var(--color-secondary)'">
                    <span class="material-icons-outlined" style="font-size: 18px;">add_location</span>
                    Añadir a ruta
                </button>
                
                <!-- Botón para información detallada -->
                <button class="btn-detailed-info" onclick="toggleDetailedInfo(${station.id})" style="
                    width: 100%;
                    padding: 10px;
                    margin-top: 12px;
                    background: transparent;
                    border: 1px solid #1565C0;
                    border-radius: 4px;
                    color: #1565C0;
                    font-weight: 600;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 8px;
                ">
                    <span class="material-icons-outlined" style="font-size: 18px;">expand_more</span>
                    Información detallada
                </button>
                
                <!-- Sección detallada (inicialmente oculta) -->
                <div id="detailed-info-${station.id}" style="display: none; margin-top: 16px; padding-top: 16px; border-top: 1px solid #E0E0E0;">
                    
                    <h4 style="margin: 12px 0 8px 0; color: #1565C0; font-size: 14px; font-weight: 600;">📍 Ubicación Detallada</h4>
                    <div style="font-size: 13px; line-height: 1.6;">
                        <div><strong>Dirección:</strong> ${fmt(addr.AddressLine1)}</div>
                        <div><strong>Ciudad:</strong> ${fmt(addr.Town)}</div>
                        <div><strong>Provincia/Estado:</strong> ${fmt(addr.StateOrProvince)}</div>
                        <div><strong>Código Postal:</strong> ${fmt(addr.Postcode)}</div>
                        <div><strong>Coordenadas:</strong> ${station.latitude}, ${station.longitude}</div>
                        ${addr.ContactTelephone1 ? `<div><strong>Teléfono:</strong> ${addr.ContactTelephone1}</div>` : ''}
                        ${addr.ContactEmail ? `<div><strong>Email:</strong> ${addr.ContactEmail}</div>` : ''}
                        ${addr.RelatedURL ? `<div><strong>Web:</strong> <a href="${addr.RelatedURL}" target="_blank" style="color: #1565C0;">Más información</a></div>` : ''}
                    </div>
                    
                    <h4 style="margin: 16px 0 8px 0; color: #1565C0; font-size: 14px; font-weight: 600;">💰 Coste</h4>
                    <div style="font-size: 13px; line-height: 1.6;">
                        <div><strong>Coste:</strong> ${costText}</div>
                    </div>
                    
                    <h4 style="margin: 16px 0 8px 0; color: #1565C0; font-size: 14px; font-weight: 600;">📅 Metadatos</h4>
                    <div style="font-size: 13px; line-height: 1.6;">
                        <div><strong>ID:</strong> ${station.id}</div>
                        ${raw.DateCreated ? `<div><strong>Fecha creación:</strong> ${new Date(raw.DateCreated).toLocaleDateString()}</div>` : ''}
                        ${raw.DateLastStatusUpdate ? `<div><strong>Última actualización:</strong> ${new Date(raw.DateLastStatusUpdate).toLocaleDateString()}</div>` : ''}
                    </div>
                </div>
            </div>
        `;
    },
    createMarker(s, routeNumber = null) {
        const colors = { available: '#4CAF50', busy: '#FFC107', unavailable: '#F44336', 'no-data': '#9E9E9E' };
        let color = colors[s.availability];
        let iconContent = '⚡';
        
        // Si es parte de la ruta, usar color rojo y mostrar número
        if (routeNumber !== null) {
            color = '#F44336';
            iconContent = routeNumber;
        }
        
        const icon = L.divIcon({
            className: 'custom-marker',
            html: `<div style="width:32px;height:40px;background-color:${color};border-radius:50% 50% 50% 0;transform:rotate(-45deg);border:2px solid white;box-shadow:0 2px 4px rgba(0,0,0,0.3);display:flex;align-items:center;justify-content:center"><span style="transform:rotate(45deg);color:white;font-size:${routeNumber !== null ? '14px' : '18px'};font-weight:${routeNumber !== null ? '700' : '400'}">${iconContent}</span></div>`,
            iconSize: [32, 40],
            iconAnchor: [16, 40],
            popupAnchor: [0, -40]
        });
        const marker = L.marker([s.latitude, s.longitude], { icon });
        
        // Guardar ID de la estación en el marcador
        marker.stationId = s.id;
        
        // Usar nueva función para crear contenido del popup
        marker.bindPopup(this.createPopupContent(s), {
            maxWidth: 400,
            minWidth: 300
        });
        
        return marker;
    },
    updateRouteMarkers(routePoints) {
        // Recrear todos los marcadores con la visualización correcta
        this.clearMarkers();
        
        const routeIds = routePoints.map(p => p.id);
        
        this.allStations.forEach(s => {
            const filtered = Filters.filterStations([s])[0];
            if (!filtered) return;
            
            const routeIndex = routeIds.indexOf(s.id);
            const routeNumber = routeIndex >= 0 ? routeIndex + 1 : null;
            
            const marker = this.createMarker(s, routeNumber);
            this.markersLayer.addLayer(marker);
            this.currentMarkers.push(marker);
        });
    },
    clearMarkers() {
        this.markersLayer.clearLayers();
        this.currentMarkers = [];
    },
    updateStationCount(count) {
        document.getElementById('visibleCount').textContent = count;
    },
    updateLoadingProgress(count, message = '') {
        const progressEl = document.getElementById('loadingProgress');
        if (progressEl) {
            const formattedCount = count.toLocaleString();
            const regionInfo = message ? ` - ${message}` : '';
            progressEl.textContent = `${formattedCount} estaciones cargadas...${regionInfo}`;
        }
    },
    showLoading(text = 'Cargando estaciones de carga...') {
        const overlay = document.getElementById('loadingOverlay');
        const textEl = document.getElementById('loadingText');
        const progressEl = document.getElementById('loadingProgress');
        if (overlay) {
            overlay.classList.add('active');
        }
        if (textEl) {
            textEl.textContent = text;
        }
        if (progressEl) {
            progressEl.textContent = '';
        }
    },
    hideLoading() {
        const overlay = document.getElementById('loadingOverlay');
        if (overlay) {
            overlay.classList.remove('active');
        }
    }
};

