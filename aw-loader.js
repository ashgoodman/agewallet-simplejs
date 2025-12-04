(function() {

    // --- 1. Configuration ---
    var scriptTag = document.currentScript;
    if (!scriptTag) {
        console.error("[AgeWallet] Critical Error: document.currentScript is null");
        return;
    }

    var clientId = scriptTag.getAttribute("data-client-id");

    // --- ASSETS (With Defaults) ---
    // Default Logo: AgeWallet Official Light Logo (for dark card)
    var defaultLogo = "https://www.agewallet.com/wp-content/uploads/2025/07/age-wallet-logo-light-tmb2-cleaned-300x225.png";
    var logoUrl = scriptTag.getAttribute("data-logo") || defaultLogo;

    var customCss = scriptTag.getAttribute("data-css");

    // --- TEXT STRINGS (With Defaults) ---
    var textTitle = scriptTag.getAttribute("data-title") || "Age Verification";
    var textDesc = scriptTag.getAttribute("data-description") || "You must verify your age to view this content.";
    var textYes = scriptTag.getAttribute("data-yes-label") || "Verify with AgeWallet";
    var textNo = scriptTag.getAttribute("data-no-label") || "I Disagree";
    var textError = scriptTag.getAttribute("data-error-msg") || "Sorry, you do not meet the minimum requirements.";

    var expiryMinutes = parseInt(scriptTag.getAttribute("data-expiry") || "1440", 10);

    var storageKey = "aw_session_" + clientId;
    var stateKey = "aw_state_" + clientId;
    var verifierKey = "aw_verifier_" + clientId;

    // --- 2. Persistence Check ---
    try {
        console.log("[AgeWallet] Checking local storage for valid session...");
        var session = JSON.parse(localStorage.getItem(storageKey));
        if (session && session.verified) {
            var now = new Date().getTime();
            if (now < session.expiry) {
                return; // Valid session, let page load
            } else {
                localStorage.removeItem(storageKey);
            }
        }
    } catch (e) {
        localStorage.removeItem(storageKey);
    }

    // --- 3. Immediate Content Hiding ---
    console.log("[AgeWallet] Injecting CSS to hide page content.");
    var style = document.createElement('style');
    style.id = "aw-content-hider";
    style.innerHTML = "body > *:not(.aw-gate-overlay) { display: none !important; } body { overflow: hidden !important; background-color: #000 !important; }";
    document.head.appendChild(style);

    // --- 4. Inject Custom CSS ---
    if (customCss) {
        var link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = customCss;
        document.head.appendChild(link);
    }

    // --- 5. Initialization ---
    function initAgeWallet() {

        // A. Pre-Calculate PKCE
        var authUrl = null;
        var redirectUri = "https://app.agewallet.io/embed/callback";

        async function prepareAuth() {
            try {
                var state = Array.from(crypto.getRandomValues(new Uint8Array(32)), b => b.toString(16).padStart(2, '0')).join('');
                var nonce = Array.from(crypto.getRandomValues(new Uint8Array(32)), b => b.toString(16).padStart(2, '0')).join('');
                var verifier = Array.from(crypto.getRandomValues(new Uint8Array(64)), b => b.toString(16).padStart(2, '0')).join('');

                var encoder = new TextEncoder();
                var data = encoder.encode(verifier);
                var hash = await crypto.subtle.digest('SHA-256', data);
                var challenge = btoa(String.fromCharCode(...new Uint8Array(hash)))
                    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

                sessionStorage.setItem(stateKey, state);
                sessionStorage.setItem(verifierKey, verifier);

                authUrl = `https://app.agewallet.io/user/authorize?response_type=code&client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=openid&state=${state}&nonce=${nonce}&code_challenge=${challenge}&code_challenge_method=S256`;
            } catch(e) {
                console.error("[AgeWallet] Crypto Error:", e);
            }
        }
        prepareAuth();

        // B. Inject UI
        console.log("[AgeWallet] Building and injecting Overlay UI.");
        var gateStyle = document.createElement('style');
        gateStyle.innerHTML = `
            .aw-gate-overlay { position: fixed; top: 0; left: 0; width: 100vw; height: 100vh; background-color: #000; z-index: 2147483647; display: flex; justify-content: center; align-items: center; padding: 24px; box-sizing: border-box; }
            .aw-gate-card { background: #0d0d10; border: 1px solid #1e1e24; box-shadow: 0 10px 30px rgba(0,0,0,.45); color: #f5f7fb; border-radius: 16px; padding: 28px; max-width: 500px; width: 100%; text-align: center; font-family: -apple-system, system-ui, sans-serif; }
            .aw-gate-logo { max-width: 150px; height: auto; margin-bottom: 20px; }
            .aw-gate-title { margin: 0 0 16px 0; font-size: 24px; font-weight: 700; color: #fff; }
            .aw-gate-desc { margin: 0 0 24px 0; color: #c8cbd4; line-height: 1.6; font-size: 16px; }
            .aw-gate-buttons { display: flex; justify-content: center; gap: 12px; margin-top: 16px; flex-wrap: wrap; }
            .aw-btn { display: inline-flex; align-items: center; justify-content: center; min-height: 48px; padding: 10px 24px; border-radius: 12px; font-size: 16px; font-weight: 700; cursor: pointer; transition: all .2s ease; border: 1px solid transparent; }
            .aw-btn-no { background: #2a2a32; color: #cdd0d7; }
            .aw-btn-no:hover { background: #3a3a44; }
            .aw-btn-yes { background: #6a1b9a; color: #fff; box-shadow: 0 6px 15px rgba(106, 27, 154, 0.25); }
            .aw-btn-yes:hover { background: #5a1784; transform: translateY(-1px); }
            .aw-error { margin-top: 16px; color: #ff4d4f; font-size: 14px; display: none; }
            .aw-disclaimer { margin-top: 20px; font-size: 12px; color: #666; }
            .aw-disclaimer a { color: #666; text-decoration: underline; }
        `;
        document.head.appendChild(gateStyle);

        var overlay = document.createElement('div');
        overlay.className = 'aw-gate-overlay';

        // Using the logoUrl (which now has a default)
        overlay.innerHTML = `
            <div class="aw-gate-card">
                <img src="${logoUrl}" class="aw-gate-logo" alt="Logo">
                <h1 class="aw-gate-title">${textTitle}</h1>
                <div class="aw-gate-desc">
                    <p>${textDesc}</p>
                </div>
                <div class="aw-gate-buttons">
                    <button class="aw-btn aw-btn-no" id="aw-deny">${textNo}</button>
                    <button class="aw-btn aw-btn-yes" id="aw-verify">${textYes}</button>
                </div>
                <div class="aw-error" id="aw-error-msg">${textError}</div>
                <p class="aw-disclaimer">
                    By proceeding you agree to allow <a href="https://agewallet.com" target="_blank">AgeWallet™</a> to verify your age.
                </p>
            </div>
        `;
        document.body.appendChild(overlay);

        // C. Click Handlers
        document.getElementById('aw-deny').onclick = function() {
            document.getElementById('aw-error-msg').style.display = 'block';
        };

        var verifyBtn = document.getElementById('aw-verify');
        verifyBtn.onclick = function() {
            if (!authUrl) {
                verifyBtn.innerText = "Loading...";
                setTimeout(() => { if(authUrl) verifyBtn.click(); }, 500);
                return;
            }
            window.open(authUrl, "agewallet_verify", "width=1024,height=800");
            verifyBtn.innerText = "Verifying...";
        };

        // D. Message Listener
        window.addEventListener("message", async function(event) {
            if (event.origin !== "https://app.agewallet.io") return;

            var data = event.data;
            if (!data) return;

            var storedState = sessionStorage.getItem(stateKey);
            if (data.state && data.state !== storedState) {
                console.error("[AgeWallet] ❌ Security Error: State mismatch.");
                return;
            }

            if (data.error === "access_denied" && data.error_description === "Region does not require verification") {
                unlockSite();
                return;
            }

            if (data.code) {
                console.log("[AgeWallet] Auth Code received.");
                verifyBtn.innerText = "Finalizing...";

                try {
                    var verifier = sessionStorage.getItem(verifierKey);
                    var tokenResp = await fetch("https://app.agewallet.io/embed/token", {
                        method: "POST",
                        headers: { "Content-Type": "application/x-www-form-urlencoded" },
                        body: new URLSearchParams({
                            client_id: clientId,
                            code: data.code,
                            code_verifier: verifier,
                            redirect_uri: redirectUri
                        })
                    });
                    var tokenData = await tokenResp.json();
                    if (tokenData.error) throw new Error("Token Error: " + JSON.stringify(tokenData));

                    var userResp = await fetch("https://app.agewallet.io/user/userinfo", {
                        headers: { "Authorization": "Bearer " + tokenData.access_token }
                    });
                    var userData = await userResp.json();

                    if (userData.age_verified === true) {
                        unlockSite();
                    } else {
                        console.warn("[AgeWallet] ❌ Failed verification.");
                        alert("Verification failed: Age requirement not met.");
                        verifyBtn.innerText = textYes;
                    }

                } catch (e) {
                    console.error("[AgeWallet] ❌ Error:", e);
                    alert("Verification error. Please try again.");
                    verifyBtn.innerText = textYes;
                }
            }
        });

        function unlockSite() {
            var expiresAt = new Date().getTime() + (expiryMinutes * 60 * 1000);
            localStorage.setItem(storageKey, JSON.stringify({ verified: true, expiry: expiresAt }));

            var hider = document.getElementById("aw-content-hider");
            if (hider) hider.remove();
            overlay.remove();
            document.body.style.overflow = '';
            document.body.style.backgroundColor = '';
        }
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", initAgeWallet);
    } else {
        initAgeWallet();
    }
})();

/*
====================================================================
   AGEWALLET LOADER - CONFIGURATION
====================================================================

   1. GETTING YOUR CREDENTIALS
      - Go to the AgeWallet Dashboard.
      - Create a new App.
      - In "Redirect URI", enter your website's Home Page URL (e.g. https://mywinery.com).
      - Copy your Client ID.

   2. BASIC USAGE
      - Uses default AgeWallet styling and English text.
      - Place this script before the closing </body> tag on every page you want to protect.
   -----------------------------------------------------------------
   <script
       src="https://cdn.jsdelivr.net/gh/ashgoodman/agewallet-simplejs@1/aw-loader.js"
       data-client-id="YOUR_CLIENT_ID">
   </script>


   3. ADVANCED USAGE (Fully Customized)
      - Overrides the logo, message, and button text.
      - Sets verification to expire after 60 minutes.
   -----------------------------------------------------------------
   <script
       src="https://cdn.jsdelivr.net/gh/ashgoodman/agewallet-simplejs@1/aw-loader.js"
       data-client-id="YOUR_CLIENT_ID"
       data-title="Age Verification Required"
       data-description="Please confirm you are over 18 to enter."
       data-logo="https://yoursite.com/assets/logo.png"
       data-yes-label="Verify Now"
       data-no-label="I am under 18"
       data-error-msg="Access denied."
       data-expiry="60">
   </script>

====================================================================
*/