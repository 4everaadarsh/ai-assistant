/* ==========================================================================
   DENTALAI OS SPA HASH ROUTER
   Swaps page views dynamically, manages layout visibility and loading indicators.
   ========================================================================== */

// Import views
import { renderLogin } from './views/login.js';
import { renderDashboard } from './views/dashboard.js';
import { renderPatients } from './views/patients.js';
import { renderAppointments } from './views/appointments.js';
import { renderReceptionist } from './views/receptionist.js';
import { renderAnalytics } from './views/analytics.js';

// Route maps
const routes = {
    'login': { render: renderLogin, requiresAuth: false, navId: null },
    'dashboard': { render: renderDashboard, requiresAuth: true, navId: 'nav-dashboard' },
    'patients': { render: renderPatients, requiresAuth: true, navId: 'nav-patients' },
    'appointments': { render: renderAppointments, requiresAuth: true, navId: 'nav-appointments' },
    'receptionist': { render: renderReceptionist, requiresAuth: true, navId: 'nav-receptionist' },
    'analytics': { render: renderAnalytics, requiresAuth: true, navId: 'nav-analytics' }
};

class Router {
    constructor() {
        this.currentRoute = null;
        this.isLoggedIn = false; // Mock login state
        this.viewContainer = document.getElementById('view-container');
        this.sidebar = document.getElementById('sidebar');
        this.header = document.getElementById('top-header');
        this.pageLoader = document.getElementById('global-page-loader');
        this.copilotWidget = document.getElementById('ai-copilot-widget');
    }

    init() {
        // Listen to hash changes
        window.addEventListener('hashchange', () => this.handleRouting());
        
        // Initial routing trigger
        this.handleRouting();
    }

    // Set mock login state
    setLoginState(loggedIn) {
        this.isLoggedIn = loggedIn;
        if (loggedIn) {
            this.sidebar.classList.remove('hidden');
            this.header.classList.remove('hidden');
            document.getElementById('main-content').classList.remove('full-width');
            this.copilotWidget.classList.remove('hidden');
        } else {
            this.sidebar.classList.add('hidden');
            this.header.classList.add('hidden');
            document.getElementById('main-content').classList.add('full-width');
            this.copilotWidget.classList.add('hidden');
            window.location.hash = '#login';
        }
    }

    async handleRouting() {
        let fullHash = window.location.hash.slice(1) || 'dashboard';
        let hash = fullHash;
        
        // Strip query params for route matching
        if (hash.includes('?')) {
            hash = hash.split('?')[0];
        }

        // Check if route exists
        if (!routes[hash]) {
            hash = 'dashboard';
        }

        const route = routes[hash];

        // Auth guard
        if (route.requiresAuth && !this.isLoggedIn) {
            window.location.hash = '#login';
            return;
        }

        // Show page loader
        this.pageLoader.style.display = 'flex';
        this.viewContainer.style.opacity = '0';

        // Brief artificial delay for a premium loading state feel
        await new Promise(resolve => setTimeout(resolve, 350));

        // Update nav sidebar highlighting
        this.updateNavHighlighting(route.navId);

        // Render target page
        try {
            // Clear page container
            const pageDiv = document.createElement('div');
            pageDiv.className = `page-view page-${hash}`;
            
            // Invoke rendering function
            route.render(pageDiv);
            
            // Swap containers
            this.viewContainer.innerHTML = '';
            this.viewContainer.appendChild(pageDiv);
            
            // Re-trigger Lucide icon parsing for new elements
            if (window.lucide) {
                window.lucide.createIcons();
            }

            this.currentRoute = hash;
        } catch (error) {
            console.error(`Error rendering route #${hash}:`, error);
            this.viewContainer.innerHTML = `<div class="error-state"><h3>Failed to render page</h3><p>${error.message}</p></div>`;
        } finally {
            // Hide page loader
            this.pageLoader.style.display = 'none';
            this.viewContainer.style.opacity = '1';
        }
    }

    updateNavHighlighting(activeNavId) {
        // Remove active class from all links
        document.querySelectorAll('.sidebar-nav .nav-link').forEach(link => {
            link.classList.remove('active');
        });

        // Add active class to current link
        if (activeNavId) {
            const activeLink = document.getElementById(activeNavId);
            if (activeLink) {
                activeLink.classList.add('active');
            }
        }
    }
}

export const router = new Router();
window.__appRouter = router; // attach for debugging
