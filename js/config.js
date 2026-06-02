// Configuración
const CONFIG = {
    API_KEY: 'b139582f-e45a-4711-bc26-054713319142',
    API_BASE_URL: 'https://api.openchargemap.io/v3/poi/',
    MAP: {
        DEFAULT_CENTER: [40.4168, -3.7038],
        DEFAULT_ZOOM: 6,
        MIN_ZOOM: 2,
        MAX_ZOOM: 18,
        TILE_LAYER: 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png',
        ATTRIBUTION: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
    },
    API: {
        MAX_RESULTS: 5000,
        DEFAULT_COUNTRY_CODE: 'ES',
        COMPACT: true,
        VERBOSE: false
    },
    CACHE: {
        ENABLED: true,
        DURATION: 1800000,
        KEY_PREFIX: 'ev_cache_'
    },
    CHARGING_SPEEDS: {
        SLOW: { min: 0, max: 7 },
        SEMI_FAST: { min: 7, max: 22 },
        FAST: { min: 22, max: 150 },
        ULTRA_FAST: { min: 150, max: Infinity }
    },
    // Bounding boxes de países principales para limitar llamada a la API
    COUNTRY_BOUNDS: {
        'ES': { north: 43.8, south: 36.0, east: 4.5, west: -9.3, divisions: 4 },     // España
        'FR': { north: 51.1, south: 41.3, east: 9.6, west: -5.2, divisions: 6 },     // Francia
        'DE': { north: 55.1, south: 47.3, east: 15.0, west: 5.9, divisions: 4 },     // Alemania
        'GB': { north: 60.9, south: 49.9, east: 1.8, west: -8.6, divisions: 6 },     // UK
        'IT': { north: 47.1, south: 36.6, east: 18.5, west: 6.6, divisions: 6 },     // Italia
        'US': { north: 49.4, south: 24.5, east: -66.9, west: -125.0, divisions: 12 }, // USA
        'CA': { north: 83.1, south: 41.7, east: -52.6, west: -141.0, divisions: 12 }, // Canadá
        'NL': { north: 53.6, south: 50.8, east: 7.2, west: 3.4, divisions: 2 },      // Holanda
        'BE': { north: 51.5, south: 49.5, east: 6.4, west: 2.5, divisions: 2 },      // Bélgica
        'CH': { north: 47.8, south: 45.8, east: 10.5, west: 5.9, divisions: 2 },     // Suiza
        'AT': { north: 49.0, south: 46.4, east: 17.2, west: 9.5, divisions: 2 },     // Austria
        'NO': { north: 71.2, south: 58.0, east: 31.1, west: 4.5, divisions: 6 },     // Noruega
        'SE': { north: 69.1, south: 55.3, east: 24.2, west: 11.0, divisions: 6 },    // Suecia
        'DK': { north: 57.8, south: 54.5, east: 15.2, west: 8.0, divisions: 2 },     // Dinamarca
        'PT': { north: 42.2, south: 37.0, east: -6.2, west: -9.5, divisions: 2 }     // Portugal
    }
};

// Almacenamiento
const Storage = {
    set(key, data) {
        try {
            localStorage.setItem(key, JSON.stringify(data));
            return true;
        } catch (error) {
            console.error('Error:', error);
            return false;
        }
    },
    get(key) {
        try {
            const data = localStorage.getItem(key);
            return data ? JSON.parse(data) : null;
        } catch (error) {
            return null;
        }
    },
    setCache(key, data) {
        return this.set(CONFIG.CACHE.KEY_PREFIX + key, {
            timestamp: Date.now(),
            data: data
        });
    },
    getCache(key) {
        if (!CONFIG.CACHE.ENABLED) return null;
        const cacheData = this.get(CONFIG.CACHE.KEY_PREFIX + key);
        if (!cacheData) return null;
        if (Date.now() - cacheData.timestamp > CONFIG.CACHE.DURATION) {
            localStorage.removeItem(CONFIG.CACHE.KEY_PREFIX + key);
            return null;
        }
        return cacheData.data;
    }
};

// API
const API = {
    buildURL(params = {}) {
        const query = new URLSearchParams({
            key: CONFIG.API_KEY,
            maxresults: params.maxResults || CONFIG.API.MAX_RESULTS,
            compact: CONFIG.API.COMPACT,
            verbose: CONFIG.API.VERBOSE,
            ...params
        });
        return `${CONFIG.API_BASE_URL}?${query}`;
    },
    async getAvailableCountries() {
        try {
            console.log('⟳ Obteniendo lista de países...');
            const response = await fetch(`https://api.openchargemap.io/v3/referencedata/?key=${CONFIG.API_KEY}`);
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            const data = await response.json();
            const countries = data.Countries || [];
            // Filtrar solo países con estaciones y ordenar alfabéticamente
            const validCountries = countries
                .filter(c => c.ISOCode && c.Title)
                .sort((a, b) => a.Title.localeCompare(b.Title));
            console.log(`✓ ${validCountries.length} países disponibles`);
            return validCountries;
        } catch (error) {
            console.error('Error al obtener países:', error);
            return [];
        }
    },
    
    
    // Dividir bounding box en grid de regiones
    
    divideBoundingBox(bounds, divisions = 4) {
        const { north, south, east, west } = bounds;
        
        // Calcular cuántas divisiones por eje
        const gridSize = Math.ceil(Math.sqrt(divisions));
        const latStep = (north - south) / gridSize;
        const lngStep = (east - west) / gridSize;
        
        const regions = [];
        
        for (let i = 0; i < gridSize; i++) {
            for (let j = 0; j < gridSize; j++) {
                const regionNorth = north - (i * latStep);
                const regionSouth = north - ((i + 1) * latStep);
                const regionWest = west + (j * lngStep);
                const regionEast = west + ((j + 1) * lngStep);
                
                regions.push({
                    bbox: `(${regionNorth},${regionWest}),(${regionSouth},${regionEast})`,
                    name: `Región ${i * gridSize + j + 1}`
                });
            }
        }
        
        return regions.slice(0, divisions); // Limitar a número exacto de divisiones
    },
    
    
    // Cargar estaciones por regiones usando bounding box
    
    async loadByRegions(countryCode, bounds) {
        const regions = this.divideBoundingBox(bounds, bounds.divisions || 4);
        let allStations = [];
        const seenIds = new Set();
        
        console.log(`⟳ Cargando ${countryCode} en ${regions.length} regiones...`);
        
        for (let i = 0; i < regions.length; i++) {
            const region = regions[i];
            
            try {
                console.log(`  → ${region.name} (${i + 1}/${regions.length})...`);
                
                const response = await fetch(this.buildURL({
                    boundingbox: region.bbox,
                    maxresults: 10000
                }));
                
                if (!response.ok) throw new Error(`HTTP ${response.status}`);
                
                const batch = await response.json();
                
                // Deduplicar (puntos en fronteras pueden aparecer en múltiples regiones)
                let newStations = 0;
                batch.forEach(station => {
                    if (!seenIds.has(station.ID)) {
                        seenIds.add(station.ID);
                        allStations.push(station);
                        newStations++;
                    }
                });
                
                console.log(`  ✓ ${region.name}: ${newStations} nuevas estaciones (total: ${allStations.length})`);
                
                // Actualizar progreso
                if (window.MapController) {
                    MapController.updateLoadingProgress(allStations.length, `${region.name} (${i + 1}/${regions.length})`);
                }
                
            } catch (error) {
                console.error(`  ✗ Error en ${region.name}:`, error);
            }
        }
        
        console.log(`✓ Total ${countryCode}: ${allStations.length} estaciones únicas`);
        return allStations;
    },
    async getChargingStations(countryCode = 'ES') {
        try {
            const cacheKey = `stations_${countryCode}`;
            const cached = Storage.getCache(cacheKey);
            if (cached) {
                console.log(`✓ Caché: ${cached.length} estaciones`);
                return cached;
            }
            
            // Bounding box si está disponible, sino carga simple
            const bounds = CONFIG.COUNTRY_BOUNDS[countryCode];
            let data;
            
            if (bounds) {
                // País grande -> dividir en regiones
                console.log(`📍 País ${countryCode} tiene bounding box definido`);
                data = await this.loadByRegions(countryCode, bounds);
            } else {
                // País desconocido -> carga simple
                console.log(`⟳ Cargando estaciones de ${countryCode} (carga simple)...`);
                
                const response = await fetch(this.buildURL({ 
                    countrycode: countryCode,
                    maxresults: 10000
                }));
                
                if (!response.ok) throw new Error(`HTTP ${response.status}`);
                data = await response.json();
                
                console.log(`✓ ${data.length} estaciones recibidas`);
                
                if (data.length >= 10000) {
                    console.warn(`⚠️ ${countryCode} alcanzó límite de 10,000 puntos. Puede tener más.`);
                }
            }
            
            // Guardar en caché
            Storage.setCache(cacheKey, data);
            return data;
            
        } catch (error) {
            console.error('Error:', error);
            throw error;
        }
    },
    transformStation(raw) {
        const addr = raw.AddressInfo || {};
        const conns = raw.Connections || [];
        const maxPower = Math.max(...conns.map(c => c.PowerKW || 0));
        let speed = 'slow';
        if (maxPower >= 150) speed = 'ultra-fast';
        else if (maxPower >= 22) speed = 'fast';
        else if (maxPower >= 7) speed = 'semi-fast';
        return {
            id: raw.ID,
            name: addr.Title || 'Sin nombre',
            address: addr.AddressLine1 || '',
            town: addr.Town || '',
            country: addr.Country?.ISOCode || '',
            latitude: addr.Latitude,
            longitude: addr.Longitude,
            numConnectors: conns.length,
            connectorType: conns[0]?.ConnectionType?.Title || 'Desconocido',
            maxPower: maxPower,
            chargingSpeed: speed,
            operator: raw.OperatorInfo?.Title || 'Desconocido',
            availability: 'no-data',
            connections: conns.map(c => ({
                type: c.ConnectionType?.Title || 'Desconocido',
                power: c.PowerKW || 0,
                currentType: c.CurrentType?.Title || null,
                voltage: c.Voltage || null,
                amps: c.Amps || null,
                quantity: c.Quantity || 1
            })),
            rawData: raw  // Guardar datos RAW completos para popup detallado
        };
    },
    async getTransformedStations(countryCode) {
        const raw = await this.getChargingStations(countryCode);
        return raw.map(s => this.transformStation(s));
    }
};

