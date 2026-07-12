/* ==========================================================================
   DENTALAI OS - ANALYTICS & AI ROI DASHBOARD (ENHANCED)
   Tab-based clinical analytics reports and financial ROI metrics.
   ========================================================================== */

export function renderAnalytics(container) {
    let activeAnalyticsTab = 'tab-practice-metrics';

    container.className = 'page-view analytics-layout';

    function renderMainLayout() {
        container.innerHTML = `
            <!-- Page Header -->
            <div class="page-header">
                <div class="page-title-area">
                    <h1>Operational & Financial Reports</h1>
                    <p>Track clinical yield, acquisition channels, and AI performance metrics.</p>
                </div>
                
                <div class="calendar-view-toggles" style="border-radius:10px;">
                    <span class="calendar-toggle-tab ${activeAnalyticsTab === 'tab-practice-metrics' ? 'active' : ''}" id="tab-analytics-practice" style="padding:10px 18px;">Practice Metrics</span>
                    <span class="calendar-toggle-tab ${activeAnalyticsTab === 'tab-roi-dashboard' ? 'active' : ''}" id="tab-analytics-roi" style="padding:10px 18px;">AI ROI Dashboard</span>
                </div>
            </div>

            <!-- Tab Content Container -->
            <div id="analytics-tab-pane-container" style="display:flex; flex-direction:column; gap:24px;">
                <!-- Content injected dynamically -->
            </div>
        `;

        // Bind tabs click
        container.querySelector('#tab-analytics-practice').addEventListener('click', () => {
            activeAnalyticsTab = 'tab-practice-metrics';
            renderMainLayout();
            renderPracticePane();
        });

        container.querySelector('#tab-analytics-roi').addEventListener('click', () => {
            activeAnalyticsTab = 'tab-roi-dashboard';
            renderMainLayout();
            renderRoiPane();
        });

        if (activeAnalyticsTab === 'tab-practice-metrics') {
            renderPracticePane();
        } else {
            renderRoiPane();
        }
    }

    // Tab 1: Practice Metrics Pane
    function renderPracticePane() {
        const paneContainer = container.querySelector('#analytics-tab-pane-container');
        paneContainer.innerHTML = `
            <div class="analytics-grid-top">
                <div class="card chart-card">
                    <div class="chart-header">
                        <h3>Revenue Yield by Specialty</h3>
                        <span style="font-size:0.75rem; color:var(--text-muted);">Total: $84,210</span>
                    </div>
                    <div id="chart-revenue-breakdown" style="min-height: 280px;"></div>
                </div>

                <div class="card chart-card">
                    <div class="chart-header">
                        <h3>AI Booking Conversions</h3>
                        <span style="font-size:0.75rem; color:var(--text-success); font-weight:600;">94.2% Auto-Booked</span>
                    </div>
                    <div id="chart-ai-conversions" style="min-height: 280px;"></div>
                </div>
            </div>

            <div class="analytics-grid-bottom">
                <div class="card chart-card">
                    <div class="chart-header">
                        <h3>No-Show Rate Reduction</h3>
                        <span style="font-size:0.75rem; color:var(--text-muted);">AI Outreach vs Legacy SMS</span>
                    </div>
                    <div id="chart-noshow-comparison" style="min-height: 280px;"></div>
                </div>

                <div class="card chart-card">
                    <div class="chart-header">
                        <h3>Patient Acquisition Funnel</h3>
                        <span style="font-size:0.75rem; color:var(--text-muted);">June 2026</span>
                    </div>
                    <div class="analytics-table-container">
                        <table class="analytics-table">
                            <thead>
                                <tr>
                                    <th>Acquisition Channel</th>
                                    <th>Leads</th>
                                    <th>AI Booked</th>
                                    <th>Conversion</th>
                                    <th>Est. Value</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr>
                                    <td>Google Maps / Local SEO</td>
                                    <td>142</td>
                                    <td>131</td>
                                    <td>92.2%</td>
                                    <td><strong>$18,450</strong></td>
                                </tr>
                                <tr>
                                    <td>Delta Dental Directory</td>
                                    <td>98</td>
                                    <td>94</td>
                                    <td>95.9%</td>
                                    <td><strong>$11,200</strong></td>
                                </tr>
                                <tr>
                                    <td>Patient Referral Campaigns</td>
                                    <td>45</td>
                                    <td>41</td>
                                    <td>91.1%</td>
                                    <td><strong>$9,800</strong></td>
                                </tr>
                                <tr>
                                    <td>Paid Meta Ads Campaign</td>
                                    <td>68</td>
                                    <td>59</td>
                                    <td>86.7%</td>
                                    <td><strong>$6,450</strong></td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        `;

        // Render Practice charts
        setTimeout(() => {
            const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
            const themeMode = isDark ? 'dark' : 'light';
            const labelColor = isDark ? '#9ca3af' : '#475569';
            const gridColor = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)';

            const revenueChart = new ApexCharts(container.querySelector('#chart-revenue-breakdown'), {
                chart: { type: 'donut', height: 260, background: 'transparent', foreColor: labelColor },
                theme: { mode: themeMode },
                series: [42, 28, 18, 12],
                labels: ['Restorative', 'Preventative', 'Cosmetic', 'Endodontic'],
                colors: ['#6366f1', '#06b6d4', '#10b981', '#f59e0b'],
                stroke: { show: true, width: 2, colors: [isDark ? '#121826' : '#ffffff'] },
                legend: { position: 'bottom' }
            });
            revenueChart.render();

            const conversionChart = new ApexCharts(container.querySelector('#chart-ai-conversions'), {
                chart: { type: 'bar', height: 260, background: 'transparent', foreColor: labelColor, toolbar: { show: false } },
                theme: { mode: themeMode },
                series: [{ name: 'Calls Handled', data: [44, 55, 41, 67, 52] }, { name: 'Auto-Booked', data: [38, 51, 39, 64, 49] }],
                colors: ['#6366f1', '#10b981'],
                plotOptions: { bar: { horizontal: false, columnWidth: '55%', borderRadius: 4 } },
                xaxis: { categories: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'] },
                grid: { borderColor: gridColor }
            });
            conversionChart.render();

            const noshowChart = new ApexCharts(container.querySelector('#chart-noshow-comparison'), {
                chart: { type: 'line', height: 260, background: 'transparent', foreColor: labelColor, toolbar: { show: false } },
                theme: { mode: themeMode },
                series: [{ name: 'Legacy SMS Reminders', data: [12, 11.5, 13, 10.8, 14] }, { name: 'DentalAI Smart Triage', data: [1.8, 1.5, 2.1, 1.2, 0.9] }],
                colors: ['#ef4444', '#10b981'],
                stroke: { width: 3, curve: 'smooth' },
                xaxis: { categories: ['Jan', 'Feb', 'Mar', 'Apr', 'May'] },
                grid: { borderColor: gridColor },
                markers: { size: 4 }
            });
            noshowChart.render();
        }, 80);
    }

    // Tab 2: AI ROI Dashboard Pane
    function renderRoiPane() {
        const paneContainer = container.querySelector('#analytics-tab-pane-container');
        paneContainer.innerHTML = `
            <!-- ROI KPI Stats -->
            <div class="dashboard-grid">
                <div class="card kpi-card">
                    <div class="kpi-details">
                        <span class="kpi-title">AI Calls Handled</span>
                        <span class="kpi-value">1,420</span>
                        <span class="kpi-trend positive">
                            <i data-lucide="trending-up" class="icon-small"></i>
                            <span>98.6% Response Rate</span>
                        </span>
                    </div>
                    <div class="kpi-icon-box purple">
                        <i data-lucide="phone-call"></i>
                    </div>
                </div>

                <div class="card kpi-card">
                    <div class="kpi-details">
                        <span class="kpi-title">Missed Calls Recovered</span>
                        <span class="kpi-value">210</span>
                        <span class="kpi-trend positive">
                            <i data-lucide="sparkles" class="icon-small"></i>
                            <span>Out of Hours Triage</span>
                        </span>
                    </div>
                    <div class="kpi-icon-box blue">
                        <i data-lucide="shield-check"></i>
                    </div>
                </div>

                <div class="card kpi-card">
                    <div class="kpi-details">
                        <span class="kpi-title">AI Booked Revenue</span>
                        <span class="kpi-value">$54,800</span>
                        <span class="kpi-trend positive">
                            <i data-lucide="trending-up" class="icon-small"></i>
                            <span>340 Appointments</span>
                        </span>
                    </div>
                    <div class="kpi-icon-box green">
                        <i data-lucide="dollar-sign"></i>
                    </div>
                </div>

                <div class="card kpi-card">
                    <div class="kpi-details">
                        <span class="kpi-title">Est. Monthly Savings</span>
                        <span class="kpi-value">$4,250</span>
                        <span class="kpi-trend positive">
                            <i data-lucide="piggy-bank" class="icon-small"></i>
                            <span>235 Front-Desk Hrs</span>
                        </span>
                    </div>
                    <div class="kpi-icon-box amber">
                        <i data-lucide="calculator"></i>
                    </div>
                </div>
            </div>

            <!-- ROI Charts splits -->
            <div class="analytics-grid-top">
                <!-- Cumulative Savings Area Chart -->
                <div class="card chart-card">
                    <div class="chart-header">
                        <h3>Cumulative Practice Value Generated</h3>
                        <span style="font-size:0.75rem; color:var(--text-muted);">Jan - May 2026</span>
                    </div>
                    <div id="chart-roi-cumulative-savings" style="min-height: 280px;"></div>
                </div>

                <!-- Call Hours Split Column Chart -->
                <div class="card chart-card">
                    <div class="chart-header">
                        <h3>Out-of-Hours vs Business-Hours AI Engagement</h3>
                        <span style="font-size:0.75rem; color:var(--text-muted);">Weekly Calls handled</span>
                    </div>
                    <div id="chart-roi-hours-engagement" style="min-height: 280px;"></div>
                </div>
            </div>
        `;

        // Render ROI charts
        setTimeout(() => {
            const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
            const themeMode = isDark ? 'dark' : 'light';
            const labelColor = isDark ? '#9ca3af' : '#475569';
            const gridColor = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)';

            // Cumulative savings Area Chart
            const cumulativeSavingsChart = new ApexCharts(container.querySelector('#chart-roi-cumulative-savings'), {
                chart: { type: 'area', height: 260, background: 'transparent', foreColor: labelColor, toolbar: { show: false } },
                theme: { mode: themeMode },
                series: [{ name: 'Cumulative Value ($)', data: [5200, 11400, 19800, 31200, 54800] }],
                colors: ['#10b981'],
                xaxis: { categories: ['Jan', 'Feb', 'Mar', 'Apr', 'May'] },
                grid: { borderColor: gridColor },
                stroke: { curve: 'smooth', width: 3 }
            });
            cumulativeSavingsChart.render();

            // Out of hours split columns
            const hoursEngagementChart = new ApexCharts(container.querySelector('#chart-roi-hours-engagement'), {
                chart: { type: 'bar', height: 260, background: 'transparent', foreColor: labelColor, toolbar: { show: false }, stacked: true },
                theme: { mode: themeMode },
                series: [
                    { name: 'Business Hours Calls', data: [110, 130, 95, 120, 140] },
                    { name: 'Out of Hours (Night/Sat)', data: [65, 80, 50, 75, 90] }
                ],
                colors: ['#6366f1', '#06b6d4'],
                xaxis: { categories: ['Wk 1', 'Wk 2', 'Wk 3', 'Wk 4', 'Wk 5'] },
                grid: { borderColor: gridColor },
                plotOptions: { bar: { columnWidth: '50%', borderRadius: 4 } }
            });
            hoursEngagementChart.render();
        }, 80);

        if (window.lucide) {
            window.lucide.createIcons();
        }
    }

    renderMainLayout();
}
