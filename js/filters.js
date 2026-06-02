// Filtrado
const Filters = {
    currentFilters: { country: 'ES', speeds: [] },
    availableCountries: [],
    async init() {
        // Cargar países disponibles
        await this.loadCountries();
        
        document.getElementById('openFiltersBtn').addEventListener('click', () => this.openModal());
        document.getElementById('closeFiltersBtn').addEventListener('click', () => this.closeModal());
        document.getElementById('filtersModal').addEventListener('click', (e) => {
            if (e.target.id === 'filtersModal') this.closeModal();
        });
        document.getElementById('clearFiltersBtn').addEventListener('click', () => this.clearFilters());
        document.getElementById('applyFiltersBtn').addEventListener('click', () => this.applyFilters());
        
        document.querySelectorAll('input[data-filter]').forEach(cb => {
            cb.addEventListener('change', () => this.updateFilterCount());
        });
        document.getElementById('countryFilter').addEventListener('change', () => this.updateFilterCount());
    },
    async loadCountries() {
        this.availableCountries = await API.getAvailableCountries();
        this.populateCountryDropdown();
    },
    populateCountryDropdown() {
        const select = document.getElementById('countryFilter');
        if (!select) return;
        
        // Limpiar opciones actuales
        select.innerHTML = '';
        
        // Añadir países disponibles (sin opción "Todos los países")
        this.availableCountries.forEach(country => {
            const option = document.createElement('option');
            option.value = country.ISOCode;
            option.textContent = country.Title;
            
            // Seleccionar España por defecto
            if (country.ISOCode === 'ES') {
                option.selected = true;
            }
            
            select.appendChild(option);
        });
        
        console.log(`✓ Dropdown poblado con ${this.availableCountries.length} países`);
    },
    openModal() {
        document.getElementById('filtersModal').classList.add('active');
        this.updateFilterCount();
    },
    closeModal() {
        document.getElementById('filtersModal').classList.remove('active');
    },
    getSelectedFilters() {
        return {
            country: document.getElementById('countryFilter').value || '',
            speeds: Array.from(document.querySelectorAll('input[data-filter="speed"]:checked')).map(cb => cb.value)
        };
    },
    updateFilterCount() {
        const filters = this.getSelectedFilters();
        const filtered = this.filterStations(MapController.allStations, filters);
        document.getElementById('filteredCount').textContent = filtered.length;
    },
    clearFilters() {
        document.querySelectorAll('input[data-filter]').forEach(cb => cb.checked = false);
        document.getElementById('countryFilter').value = 'ES';
        this.updateFilterCount();
    },
    async applyFilters() {
        const filters = this.getSelectedFilters();
        this.currentFilters = filters;
        document.getElementById('currentCountry').textContent = this.getCountryName(filters.country);
        this.closeModal();
        await MapController.loadStations(filters.country || 'ES');
    },
    getCountryName(code) {
        if (!code) return 'Sin especificar';
        const country = this.availableCountries.find(c => c.ISOCode === code);
        return country ? country.Title : code;
    },
    filterStations(stations, filters = this.currentFilters) {
        return stations.filter(s => {
            // Filtro por velocidad
            if (filters.speeds.length > 0 && !filters.speeds.includes(s.chargingSpeed)) {
                return false;
            }
            
            return true;
        });
    }
};

