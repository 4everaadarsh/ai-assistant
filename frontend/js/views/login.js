/* ==========================================================================
   DENTALAI OS - LOGIN VIEW RENDERER
   Displays a premium, sleek login portal.
   ========================================================================== */

import { router } from '../router.js';

export function renderLogin(container) {
    container.className = 'login-view';
    container.innerHTML = `
        <div class="login-card">
            <div class="login-logo">
                <div class="logo-icon">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="tooth-icon"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/><path d="M9 9a3 3 0 1 0 6 0"/></svg>
                </div>
                <h2>DentalAI <span class="brand-suffix">OS</span></h2>
            </div>
            
            <div class="login-intro">
                <h1>Welcome Back</h1>
                <p>Sign in to access Apex Dental clinic operations.</p>
            </div>

            <form class="login-form" id="login-form">
                <div class="form-group">
                    <label for="login-email">Email Address</label>
                    <div class="input-with-icon">
                        <i data-lucide="mail"></i>
                        <input type="email" id="login-email" placeholder="doctor@apexdental.com" value="dr.mercer@apexdental.com" required>
                    </div>
                </div>

                <div class="form-group">
                    <label for="login-password">Password</label>
                    <div class="input-with-icon">
                        <i data-lucide="lock"></i>
                        <input type="password" id="login-password" placeholder="••••••••••••" value="password123" required>
                    </div>
                </div>

                <div class="login-utilities">
                    <label class="checkbox-label">
                        <input type="checkbox" checked>
                        <span>Remember clinic device</span>
                    </label>
                    <a href="#login" class="forgot-link" id="forgot-password-link">Forgot password?</a>
                </div>

                <button type="submit" class="btn btn-primary btn-login-submit">
                    <span>Sign In to System</span>
                    <i data-lucide="arrow-right"></i>
                </button>
            </form>

            <div class="demo-credentials-helper">
                <p>💡 <strong>Investor / Client Presentation Mode</strong></p>
                <p style="margin-top: 4px;">Click the sign-in button to instantly load the fully functional demo as <strong>Dr. Sarah Mercer, DDS</strong>.</p>
            </div>
        </div>
    `;

    // Add form submit listener
    const form = container.querySelector('#login-form');
    form.addEventListener('submit', (e) => {
        e.preventDefault();
        
        // Log the user in
        router.setLoginState(true);
        
        // Redirect to dashboard
        window.location.hash = '#dashboard';
    });

    // Forgot password simulation
    const forgotLink = container.querySelector('#forgot-password-link');
    forgotLink.addEventListener('click', (e) => {
        e.preventDefault();
        alert("In a production deployment, this triggers a secure reset flow via AWS Cognito / Auth0.");
    });
}
