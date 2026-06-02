// App - Funcionamiento global
const App = {
    async init() {
        console.log('🚀 Iniciando aplicación...');
        try {
            MapController.init();
            RouteManager.init();
            HistoryManager.init();
            ProfileManager.init();
            await Filters.init(); // Esperar a que carguen los países
            await MapController.loadStations('ES');
            console.log('✓ Aplicación iniciada');
        } catch (error) {
            console.error('❌ Error:', error);
            alert('Error al iniciar');
        }
    }
};

// Función global para desplegable de información detallada en popup
window.toggleDetailedInfo = function(stationId) {
    const detailedDiv = document.getElementById(`detailed-info-${stationId}`);
    const button = event.currentTarget;
    const icon = button.querySelector('.material-icons-outlined');
    
    if (detailedDiv.style.display === 'none') {
        detailedDiv.style.display = 'block';
        icon.textContent = 'expand_less';
        button.childNodes[2].textContent = 'Ocultar información';
    } else {
        detailedDiv.style.display = 'none';
        icon.textContent = 'expand_more';
        button.childNodes[2].textContent = 'Información detallada';
    }
};

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => App.init());
} else {
    App.init();
}
