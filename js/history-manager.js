// Manager del Historial
const HistoryManager = {
    init() {
        // Evento para abrir modal
        document.getElementById('historialBtn').addEventListener('click', () => this.openModal());
    },
    openModal() {
        this.loadRoutes();
        document.getElementById('historyModal').classList.add('active');
    },
    closeModal() {
        document.getElementById('historyModal').classList.remove('active');
    },
    loadRoutes() {
        const savedRoutes = JSON.parse(localStorage.getItem('ev_saved_routes') || '[]');
        const emptyDiv = document.getElementById('historyEmpty');
        const listDiv = document.getElementById('historyList');
        
        if (savedRoutes.length === 0) {
            emptyDiv.style.display = 'block';
            listDiv.style.display = 'none';
        } else {
            emptyDiv.style.display = 'none';
            listDiv.style.display = 'flex';
            
            // Ordenar por fecha (más recientes primero)
            savedRoutes.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
            
            // Generar HTML
            listDiv.innerHTML = savedRoutes.map((route, index) => {
                const date = new Date(route.createdAt).toLocaleDateString('es-ES');
                const pointsCount = route.points.length;
                
                return `
                    <div class="history-item">
                        <div class="history-item-header">
                            <div class="history-item-icon">
                                <span class="material-icons-outlined">route</span>
                            </div>
                            <div class="history-item-info">
                                <div class="history-item-name">${route.name}</div>
                                <div class="history-item-meta">${pointsCount} punto${pointsCount !== 1 ? 's' : ''} • ${date}</div>
                            </div>
                        </div>
                        
                        <div class="history-item-actions">
                            <button class="btn-history-action btn-view" onclick="HistoryManager.toggleDetails(${index})">
                                <span class="material-icons-outlined" style="font-size: 16px;">expand_more</span>
                                Ver detalles
                            </button>
                            <button class="btn-history-action btn-load" onclick="HistoryManager.loadRoute(${index})">
                                <span class="material-icons-outlined" style="font-size: 16px;">file_download</span>
                                Cargar
                            </button>
                            <button class="btn-history-action btn-delete" onclick="HistoryManager.deleteRoute(${index})">
                                <span class="material-icons-outlined" style="font-size: 16px;">delete</span>
                                Eliminar
                            </button>
                        </div>
                        
                        <div class="history-item-details" id="details-${index}">
                            ${route.points.map((point, idx) => `
                                <div class="history-point">
                                    <div class="history-point-number">${idx + 1}</div>
                                    <div>
                                        <div class="history-point-name">${point.name}</div>
                                        <div class="history-point-location">${point.town}, ${point.country}</div>
                                    </div>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                `;
            }).join('');
        }
    },
    toggleDetails(index) {
        const detailsDiv = document.getElementById(`details-${index}`);
        detailsDiv.classList.toggle('active');
    },
    loadRoute(index) {
        const savedRoutes = JSON.parse(localStorage.getItem('ev_saved_routes') || '[]');
        savedRoutes.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        const route = savedRoutes[index];
        
        if (!route) return;
        
        // Limpiar ruta actual si existe
        if (RouteManager.routePoints.length > 0) {
            if (!confirm('Ya tienes una ruta en el planificador. ¿Quieres reemplazarla?')) {
                return;
            }
        }
        
        // Cerrar modal de historial y mostrar animación de carga
        this.closeModal();
        MapController.showLoading('Cargando ruta...');
        
        // Retraso para que el navegador pinte el overlay antes
        // de la operación (recrear marcadores del mapa)
        setTimeout(() => {
            RouteManager.routePoints = [...route.points];
            RouteManager.updateUI();
            RouteManager.updateMapVisualization();
            RouteManager.openPanel();
            MapController.hideLoading();
            
            console.log(`✓ Ruta "${route.name}" cargada en el planificador`);
        }, 50);
    },
    deleteRoute(index) {
        const savedRoutes = JSON.parse(localStorage.getItem('ev_saved_routes') || '[]');
        savedRoutes.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        const route = savedRoutes[index];
        
        if (!confirm(`¿Seguro que quieres eliminar la ruta "${route.name}"?`)) {
            return;
        }
        
        // Mostrar animación de carga
        MapController.showLoading('Eliminando...');
        
        // Retraso para que el navegador pinte el overlay
        setTimeout(() => {
            // Eliminar ruta (hay que encontrarla en el array original sin ordenar)
            const allRoutes = JSON.parse(localStorage.getItem('ev_saved_routes') || '[]');
            const indexToDelete = allRoutes.findIndex(r => r.createdAt === route.createdAt);
            
            if (indexToDelete !== -1) {
                allRoutes.splice(indexToDelete, 1);
                localStorage.setItem('ev_saved_routes', JSON.stringify(allRoutes));
            }
            
            // Recargar lista
            this.loadRoutes();
            MapController.hideLoading();
            
            console.log(`✓ Ruta "${route.name}" eliminada`);
        }, 50);
    }
};

