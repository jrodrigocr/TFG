// Manager de Mi Perfil
const ProfileManager = {
    currentEditingId: null,
    
    init() {
        document.getElementById('perfilBtn').addEventListener('click', () => this.openModal());
        this.loadProfile();
    },
    
    getDefaultProfile() {
        return {
            vehicles: [],
            chargingPreferences: {
                minSpeed: 'all'
            }
        };
    },
    
    loadProfile() {
        const profile = JSON.parse(localStorage.getItem('ev_user_profile') || 'null') || this.getDefaultProfile();
        this.renderVehicles(profile.vehicles);
        this.renderPreferences(profile.chargingPreferences);
    },
    
    renderVehicles(vehicles) {
        const listDiv = document.getElementById('vehiclesList');
        
        if (vehicles.length === 0) {
            listDiv.innerHTML = '<p style="color: #757575; text-align: center; padding: var(--spacing-large);">No hay vehículos registrados</p>';
            return;
        }
        
        listDiv.innerHTML = vehicles.map((vehicle, index) => `
            <div class="vehicle-card ${vehicle.active ? 'active' : ''}">
                <div class="vehicle-header">
                    <div class="vehicle-icon">
                        <span class="material-icons-outlined">directions_car</span>
                    </div>
                    <div class="vehicle-info">
                        <div class="vehicle-name">${vehicle.brand} ${vehicle.model}</div>
                        <div class="vehicle-specs">${vehicle.range}km • ${vehicle.battery}kWh</div>
                    </div>
                </div>
                
                <div class="vehicle-active">
                    <label>
                        <input type="radio" name="activeVehicle" ${vehicle.active ? 'checked' : ''} onchange="ProfileManager.setActiveVehicle(${vehicle.id})">
                        <span>${vehicle.active ? 'Vehículo activo' : 'Seleccionar como activo'}</span>
                    </label>
                </div>
                
                <div class="vehicle-actions">
                    <button class="btn-vehicle-action" onclick="ProfileManager.editVehicle(${vehicle.id})">
                        <span class="material-icons-outlined" style="font-size: 16px;">edit</span>
                        Editar
                    </button>
                    <button class="btn-vehicle-action" onclick="ProfileManager.deleteVehicle(${vehicle.id})">
                        <span class="material-icons-outlined" style="font-size: 16px;">delete</span>
                        Eliminar
                    </button>
                </div>
            </div>
        `).join('');
    },
    
    renderPreferences(preferences) {
        const minSpeed = preferences.minSpeed || 'all';
        
        if (minSpeed === 'all') {
            document.getElementById('speedAll').checked = true;
        } else if (minSpeed === 50) {
            document.getElementById('speed50').checked = true;
        } else if (minSpeed === 150) {
            document.getElementById('speed150').checked = true;
        }
    },
    
    openModal() {
        this.loadProfile();
        document.getElementById('profileModal').classList.add('active');
    },
    
    closeModal() {
        document.getElementById('profileModal').classList.remove('active');
    },
    
    showVehicleForm(vehicleId = null) {
        this.currentEditingId = vehicleId;
        
        if (vehicleId) {
            // Editar vehículo existente
            const profile = JSON.parse(localStorage.getItem('ev_user_profile') || 'null') || this.getDefaultProfile();
            const vehicle = profile.vehicles.find(v => v.id === vehicleId);
            
            if (vehicle) {
                document.getElementById('vehicleFormTitle').innerHTML = '<span class="material-icons-outlined">edit</span> Editar Vehículo';
                document.getElementById('vehicleBrand').value = vehicle.brand;
                document.getElementById('vehicleModel').value = vehicle.model;
                document.getElementById('vehicleRange').value = vehicle.range;
                document.getElementById('vehicleBattery').value = vehicle.battery;
            }
        } else {
            // Nuevo vehículo
            document.getElementById('vehicleFormTitle').innerHTML = '<span class="material-icons-outlined">directions_car</span> Agregar Vehículo';
            document.getElementById('vehicleBrand').value = '';
            document.getElementById('vehicleModel').value = '';
            document.getElementById('vehicleRange').value = '';
            document.getElementById('vehicleBattery').value = '';
        }
        
        document.getElementById('vehicleFormModal').classList.add('active');
    },
    
    closeVehicleForm() {
        document.getElementById('vehicleFormModal').classList.remove('active');
        this.currentEditingId = null;
    },
    
    saveVehicle() {
        const brand = document.getElementById('vehicleBrand').value.trim();
        const model = document.getElementById('vehicleModel').value.trim();
        const range = parseInt(document.getElementById('vehicleRange').value);
        const battery = parseInt(document.getElementById('vehicleBattery').value);
        
        // Validación
        if (!brand || !model || !range || !battery) {
            alert('Por favor completa todos los campos');
            return;
        }
        
        if (range <= 0 || battery <= 0) {
            alert('La autonomía y la batería deben ser valores positivos');
            return;
        }
        
        const profile = JSON.parse(localStorage.getItem('ev_user_profile') || 'null') || this.getDefaultProfile();
        
        if (this.currentEditingId) {
            // Editar vehículo existente
            const vehicleIndex = profile.vehicles.findIndex(v => v.id === this.currentEditingId);
            if (vehicleIndex !== -1) {
                profile.vehicles[vehicleIndex] = {
                    ...profile.vehicles[vehicleIndex],
                    brand,
                    model,
                    range,
                    battery
                };
            }
        } else {
            // Nuevo vehículo
            const newVehicle = {
                id: Date.now(),
                brand,
                model,
                range,
                battery,
                active: profile.vehicles.length === 0 // Primer vehículo es activo por defecto
            };
            profile.vehicles.push(newVehicle);
        }
        
        localStorage.setItem('ev_user_profile', JSON.stringify(profile));
        this.closeVehicleForm();
        this.loadProfile();
        
        console.log('✓ Vehículo guardado');
    },
    
    editVehicle(vehicleId) {
        this.showVehicleForm(vehicleId);
    },
    
    deleteVehicle(vehicleId) {
        const profile = JSON.parse(localStorage.getItem('ev_user_profile') || 'null') || this.getDefaultProfile();
        const vehicle = profile.vehicles.find(v => v.id === vehicleId);
        
        if (!confirm(`¿Seguro que quieres eliminar ${vehicle.brand} ${vehicle.model}?`)) {
            return;
        }
        
        const wasActive = vehicle.active;
        profile.vehicles = profile.vehicles.filter(v => v.id !== vehicleId);
        
        // Si se eliminó el vehículo activo, activar el primero
        if (wasActive && profile.vehicles.length > 0) {
            profile.vehicles[0].active = true;
        }
        
        localStorage.setItem('ev_user_profile', JSON.stringify(profile));
        this.loadProfile();
        
        console.log('✓ Vehículo eliminado');
    },
    
    setActiveVehicle(vehicleId) {
        const profile = JSON.parse(localStorage.getItem('ev_user_profile') || 'null') || this.getDefaultProfile();
        
        // Desactivar todos
        profile.vehicles.forEach(v => v.active = false);
        
        // Activar el seleccionado
        const vehicle = profile.vehicles.find(v => v.id === vehicleId);
        if (vehicle) {
            vehicle.active = true;
        }
        
        localStorage.setItem('ev_user_profile', JSON.stringify(profile));
        this.loadProfile();
        
        console.log(`✓ Vehículo activo: ${vehicle.brand} ${vehicle.model}`);
    },
    
    saveProfile() {
        const profile = JSON.parse(localStorage.getItem('ev_user_profile') || 'null') || this.getDefaultProfile();
        
        // Guardar preferencias de carga
        let minSpeed = 'all';
        if (document.getElementById('speed50').checked) {
            minSpeed = 50;
        } else if (document.getElementById('speed150').checked) {
            minSpeed = 150;
        }
        
        profile.chargingPreferences.minSpeed = minSpeed;
        
        localStorage.setItem('ev_user_profile', JSON.stringify(profile));
        
        this.closeModal();
        alert('Perfil guardado correctamente');
        
        console.log('✓ Perfil guardado:', profile);
    }
};

