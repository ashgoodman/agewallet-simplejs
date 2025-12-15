(() => {
    const $ = i => document.getElementById(i);
    const C = t => document.createElement(t);

    // --- 1. BFCACHE PROTECTION ---
    window.addEventListener('pageshow', e => {
        if (e.persisted) window.location.reload();
    });

    // --- 2. IMMEDIATE CONTENT PROTECTION ---
    var HID = "aw-content-hider";
    var commonCss = ".aw-card{background:#0d0d10;border:1px solid #1e1e24;color:#f5f7fb;border-radius:16px;padding:24px;text-align:center;font-family:system-ui,sans-serif;box-shadow:0 10px 30px rgba(0,0,0,.5)}.aw-btn{display:inline-flex;justify-content:center;align-items:center;min-height:48px;padding:10px 24px;border-radius:12px;font-weight:700;cursor:pointer;border:0;transition:.2s;font-size:16px;font-family:system-ui,sans-serif}.aw-btn:hover{transform:translateY(-1px)}.aw-title{margin:0 0 16px 0;font-size:24px;font-weight:700;color:#fff}.aw-desc{margin:0 0 24px 0;color:#c8cbd4;line-height:1.6;font-size:16px}";

    try {
        var allCss = "body>*:not(.aw-gate-overlay){display:none!important}body{overflow:hidden!important;background:#000!important}" + commonCss + ".aw-gate-overlay{position:fixed;top:0;left:0;width:100vw;height:100vh;background:#000;z-index:2147483647;display:flex;justify-content:center;align-items:center;padding:24px;box-sizing:border-box}.aw-gate-card{max-width:500px;width:100%}.aw-error-card{position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);z-index:2147483647;max-width:320px;width:90%}.aw-gate-logo{display:block;margin:0 auto 20px auto;max-width:150px;height:auto}.aw-gate-buttons{display:flex;justify-content:center;gap:12px;margin-top:16px;flex-wrap:wrap}.aw-btn-no{background:#2a2a32;color:#cdd0d7}.aw-btn-no:hover{background:#3a3a44}.aw-btn-yes{background:#6a1b9a;color:#fff;box-shadow:0 6px 15px rgba(106,27,154,.25)}.aw-btn-yes:hover{background:#5a1784}.aw-error{margin-top:16px;color:#ff4d4f;font-size:14px;display:none}.aw-disclaimer{margin-top:20px;font-size:12px;color:#666}.aw-disclaimer a{color:#666;text-decoration:underline}";

        var style = C('style');
        style.id = HID;
        style.type = 'text/css';
        if (style.styleSheet) { style.styleSheet.cssText = allCss; }
        else { style.appendChild(document.createTextNode(allCss)); }
        document.head.appendChild(style);
    } catch(e) {}

    // --- 3. INITIALIZATION ---
    const init = () => {
        var scriptTag = document.currentScript;
        if (!scriptTag) {
            var scripts = document.getElementsByTagName('script');
            for (var i = 0; i < scripts.length; i++) {
                if (scripts[i].hasAttribute('data-client-id')) {
                    scriptTag = scripts[i];
                    break;
                }
            }
        }

        if (!scriptTag) {
            renderError("Configuration Error", "Could not locate AgeWallet configuration.");
            return;
        }

        var cid = scriptTag.getAttribute("data-client-id");
        if (!cid) {
            renderError("Configuration Error", "Missing Client ID.");
            return;
        }

        var K_S = "aw_session_" + cid;
        var K_SIG = "aw_signal_" + cid;
        var K_OIDC = "aw_oidc_" + cid;

        var defaultLogo = "https://www.agewallet.com/wp-content/uploads/2025/07/age-wallet-logo-light-tmb2-cleaned-300x225.png";
        var logoUrl = scriptTag.getAttribute("data-logo") || defaultLogo;
        var customCss = scriptTag.getAttribute("data-css");
        var textTitle = scriptTag.getAttribute("data-title") || "Age Verification";
        var textDesc = scriptTag.getAttribute("data-description") || "You must verify your age to view this content.";
        var textYes = scriptTag.getAttribute("data-yes-label") || "Verify with AgeWallet";
        var textNo = scriptTag.getAttribute("data-no-label") || "I Disagree";
        var textError = scriptTag.getAttribute("data-error-msg") || "Sorry, you do not meet the minimum requirements.";
        var expiryMinutes = parseInt(scriptTag.getAttribute("data-expiry") || "1440", 10);

        var isPrivateMode = false;
        isSafariPrivate().then(res => { isPrivateMode = res; });

        // --- HELPERS ---
        function renderError(title, msg) {
            if (!$(HID)) {
                var s = C('style');
                s.id = HID;
                s.innerHTML = "body>*:not(.aw-gate-overlay){display:none!important}body{overflow:hidden!important;background:#000!important}" + commonCss + ".aw-error-card{position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);z-index:2147483647;width:90%;max-width:320px}.aw-btn-no{background:#2a2a32;color:#cdd0d7}";
                document.head.appendChild(s);
            }
            var card = C('div');
            card.className = "aw-card aw-error-card";
            card.innerHTML = '<div class="aw-title aw-error-title" style="color:#ff4d4f">' + title + '</div><div class="aw-desc aw-error-desc">' + msg + '</div><button class="aw-btn aw-btn-no" onclick="window.location.reload()">Reload Page</button>';
            document.body.appendChild(card);
        }

        function isSafariPrivate() {
            var isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
            if (!isSafari) return Promise.resolve(false);
            return new Promise(resolve => {
                try {
                    var db = window.indexedDB.open("test");
                    db.onerror = () => resolve(true);
                    db.onsuccess = () => resolve(false);
                } catch (e) { resolve(true); }
            });
        }

        const encodeState = data => btoa(JSON.stringify(data)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

        const decodeState = str => {
            try {
                str = str.replace(/-/g, '+').replace(/_/g, '/');
                while (str.length % 4) str += '=';
                return JSON.parse(atob(str));
            } catch (e) { return null; }
        };

        const setCookie = (name, value, minutes) => {
            var expires = "";
            if (minutes) {
                var date = new Date();
                date.setTime(date.getTime() + (minutes * 60 * 1000));
                expires = "; expires=" + date.toUTCString();
            }
            document.cookie = name + "=" + (encodeURIComponent(value) || "") + expires + "; path=/; SameSite=Lax";
        };

        const store = (k, v, m) => {
            try { localStorage.setItem(k, v); } catch(e){}
            setCookie(k, v, m);
        };

        // --- LOGIC ROUTER ---
        var params = new URLSearchParams(window.location.search);
        if (params.has("code") && params.has("state")) {
            if (window.opener) runCallbackMode(params);
            else handleStatelessReturn(params);
        } else {
            runGatekeeperMode();
        }

        function runCallbackMode(urlParams) {
            var code = urlParams.get("code");
            var state = urlParams.get("state");
            try {
                // Minified Keys: c=code, s=state, t=timestamp
                var signalData = JSON.stringify({ c: code, s: state, t: new Date().getTime() });
                store(K_SIG, signalData);
            } catch (e) {}
            setTimeout(() => window.close(), 300);
        }

        async function handleStatelessReturn(urlParams) {
            var code = urlParams.get("code");
            var stateStr = urlParams.get("state");
            var stateData = decodeState(stateStr);

            if (stateData && stateData.v) {
                try {
                    var verifier = stateData.v;
                    var returnUrl = stateData.r || window.location.pathname;
                    var redirectUri = window.location.origin;

                    var tokenResp = await fetch("https://app.agewallet.io/embed/token", {
                        method: "POST",
                        headers: { "Content-Type": "application/x-www-form-urlencoded" },
                        body: new URLSearchParams({ client_id: cid, code: code, code_verifier: verifier, redirect_uri: redirectUri })
                    });
                    var tokenData = await tokenResp.json();
                    if (tokenData.error) throw new Error(tokenData.error_description);

                    var userResp = await fetch("https://app.agewallet.io/user/userinfo", {
                        headers: { "Authorization": "Bearer " + tokenData.access_token }
                    });
                    var userData = await userResp.json();

                    if (userData.age_verified === true) {
                        var expiresAt = new Date().getTime() + (expiryMinutes * 60 * 1000);
                        // Minified Keys: v=1, e=expiry
                        var sessionData = JSON.stringify({ v: 1, e: expiresAt });
                        store(K_S, sessionData, expiryMinutes);
                        window.location.href = returnUrl;
                    } else {
                        alert("Verification failed.");
                        window.location.href = returnUrl;
                    }
                } catch (e) {
                    window.location.href = window.location.pathname;
                }
            } else {
                runCallbackMode(urlParams);
            }
        }

        function runGatekeeperMode() {
            var session = null;
            try { session = JSON.parse(localStorage.getItem(K_S)); } catch(e){}
            if (!session) {
                var cookieVal = document.cookie.match(new RegExp('(^| )' + K_S + '=([^;]+)'));
                if (cookieVal) try { session = JSON.parse(decodeURIComponent(cookieVal[2])); } catch(e){}
            }

            // Check minified keys 'v' and 'e'
            if (session && session.v) {
                var now = new Date().getTime();
                if (now < session.e) {
                    if ($(HID)) $(HID).remove();
                    document.body.style.overflow = '';
                    document.body.style.backgroundColor = '';
                    return;
                } else {
                    localStorage.removeItem(K_S);
                    setCookie(K_S, "", -1);
                }
            }

            if (customCss) {
                var link = C('link');
                link.rel = 'stylesheet';
                link.href = customCss;
                document.head.appendChild(link);
            }
            renderGate();
        }

        function renderGate() {
            var overlay = C('div');
            overlay.className = 'aw-gate-overlay';
            overlay.innerHTML = '<div class="aw-card aw-gate-card"><img src="' + logoUrl + '" class="aw-gate-logo" alt="Logo"><h1 class="aw-title aw-gate-title">' + textTitle + '</h1><div class="aw-desc aw-gate-desc">' + textDesc + '</div><div class="aw-gate-buttons"><button class="aw-btn aw-btn-no" id="aw-deny">' + textNo + '</button><button class="aw-btn aw-btn-yes" id="aw-verify">' + textYes + '</button></div><div class="aw-error" id="aw-error-msg">' + textError + '</div><p class="aw-disclaimer">By proceeding you agree to allow <a href="https://agewallet.com" target="_blank">AgeWallet™</a> to verify your age.</p></div>';
            document.body.appendChild(overlay);

            $('aw-deny').onclick = () => { $('aw-error-msg').style.display = 'block'; };
            var verifyBtn = $('aw-verify');
            verifyBtn.onclick = () => startVerificationFlow(verifyBtn);
        }

        async function startVerificationFlow(btnElement) {
            var currentUrl = window.location.origin;

            const rnd = l => Array.from(crypto.getRandomValues(new Uint8Array(l)), b => b.toString(16).padStart(2, '0')).join('');
            const pkce = async v => btoa(String.fromCharCode(...new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(v))))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

            var state = rnd(32);
            var nonce = rnd(32);
            var verifier = rnd(64);

            if (isPrivateMode) {
                btnElement.innerText = "Redirecting...";
                var challenge = await pkce(verifier);
                var statePacket = { v: verifier, r: window.location.href };
                var encodedState = encodeState(statePacket);
                window.location.href = "https://app.agewallet.io/user/authorize?response_type=code&client_id=" + cid + "&redirect_uri=" + encodeURIComponent(currentUrl) + "&scope=openid&state=" + encodedState + "&nonce=" + nonce + "&code_challenge=" + challenge + "&code_challenge_method=S256";
                return;
            }

            var popup = window.open('', 'agewallet_verify', 'width=1024,height=800');

            if (!popup || popup.closed || typeof popup.closed == 'undefined') {
                alert("Popups are blocked. Please allow popups for this site to verify your age.");
                return;
            }

            var loaderHtml = '<style>body{background:#0d0d10;color:#fff;font-family:system-ui,sans-serif;display:flex;flex-direction:column;align-items:center;justify-content:center;height:100vh;margin:0}.logo{max-width:150px;margin-bottom:20px}.spinner{border:4px solid rgba(255,255,255,.1);border-left-color:#6a1b9a;border-radius:50%;width:40px;height:40px;animation:spin 1s linear infinite;margin-bottom:15px}@keyframes spin{0%{transform:rotate(0deg)}100%{transform:rotate(360deg)}}p{color:#c8cbd4;font-size:16px}</style><body><img src="' + logoUrl + '" class="logo"><div class="spinner"></div><p>Connecting to AgeWallet...</p></body>';
            popup.document.write(loaderHtml);

            btnElement.innerText = "Verifying...";

            var challenge = await pkce(verifier);

            // Minified Keys: s=state, v=verifier, n=nonce
            sessionStorage.setItem(K_OIDC, JSON.stringify({ s: state, v: verifier, n: nonce }));

            var authUrl = "https://app.agewallet.io/user/authorize?response_type=code&client_id=" + cid + "&redirect_uri=" + encodeURIComponent(currentUrl) + "&scope=openid&state=" + state + "&nonce=" + nonce + "&code_challenge=" + challenge + "&code_challenge_method=S256";

            setTimeout(() => { popup.location.href = authUrl; }, 100);

            setupSignalListener(state, currentUrl, btnElement);
        }

        function setupSignalListener(expectedState, redirectUri, btnElement) {
            var checkInterval;
            async function processSignal(signalData) {
                // Check minified key 's'
                if (signalData.s !== expectedState) return;
                if (checkInterval) clearInterval(checkInterval);
                window.removeEventListener('storage', storageHandler);
                localStorage.removeItem(K_SIG);
                btnElement.innerText = "Finalizing...";

                try {
                    var oidcData = JSON.parse(sessionStorage.getItem(K_OIDC));
                    if (!oidcData) throw new Error("Missing OIDC");
                    var tokenResp = await fetch("https://app.agewallet.io/embed/token", {
                        method: "POST",
                        headers: { "Content-Type": "application/x-www-form-urlencoded" },
                        // Read minified keys 'c' (from signal) and 'v' (from oidc)
                        body: new URLSearchParams({ client_id: cid, code: signalData.c, code_verifier: oidcData.v, redirect_uri: redirectUri })
                    });
                    var tokenData = await tokenResp.json();
                    if (tokenData.error) throw new Error(tokenData.error);
                    var userResp = await fetch("https://app.agewallet.io/user/userinfo", { headers: { "Authorization": "Bearer " + tokenData.access_token } });
                    var userData = await userResp.json();
                    if (userData.age_verified === true) {
                        if ($(HID)) $(HID).remove();
                        if (document.querySelector('.aw-gate-overlay')) document.querySelector('.aw-gate-overlay').remove();
                        document.body.style.overflow = '';
                        document.body.style.backgroundColor = '';
                        var expiresAt = new Date().getTime() + (expiryMinutes * 60 * 1000);
                        // Minified Keys: v=1, e=expiry
                        var sessionData = JSON.stringify({ v: 1, e: expiresAt });
                        store(K_S, sessionData, expiryMinutes);
                    } else {
                        alert("Verification failed.");
                        btnElement.innerText = textYes;
                    }
                } catch (e) {
                    console.error(e);
                    alert("Error.");
                    btnElement.innerText = textYes;
                }
            }
            function storageHandler(e) { if (e.key === K_SIG && e.newValue) try { processSignal(JSON.parse(e.newValue)); } catch(err) {} }
            window.addEventListener('storage', storageHandler);
            checkInterval = setInterval(() => {
                var raw = localStorage.getItem(K_SIG);
                if (raw) try { processSignal(JSON.parse(raw)); } catch(err) {}
            }, 1000);
        }
    };

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", init);
    } else {
        init();
    }
})();

/*
====================================================================
   AGEWALLET LOADER - CONFIGURATION
====================================================================

   1. GETTING YOUR CREDENTIALS
      - Go to the AgeWallet Dashboard.
      - Create a new App.
      - In "Redirect URI", enter your website's ROOT URL exactly (e.g. https://mywinery.com).
      - IMPORTANT: Do not include a trailing slash (e.g., use https://site.com, NOT https://site.com/).
      - Copy your Client ID.

   2. BASIC USAGE
      - Uses default AgeWallet styling and English text.
      - CRITICAL: Place this script in the <head> tag, as close to the top as possible.
   -----------------------------------------------------------------
   <script
       src="https://cdn.jsdelivr.net/gh/agewallet-client/agewallet-simple-js@1/aw-loader.min.js"
       data-client-id="YOUR_CLIENT_ID"
       onerror="document.body.innerHTML='<div style=\'position:fixed;top:0;left:0;width:100%;height:100%;background:#0d0d10;color:#fff;display:flex;justify-content:center;align-items:center;flex-direction:column;font-family:sans-serif;z-index:99999\'><h2>Verification Error</h2><p style=\'margin-bottom:20px\'>We could not verify security settings.</p><button onclick=\'location.reload()\' style=\'padding:10px 20px;cursor:pointer\'>Reload Page</button></div>';">
   </script>


   3. ADVANCED USAGE (Fully Customized)
      - Overrides the logo, message, and button text.
      - Sets verification to expire after 60 minutes.
      - Place in <head>.
   -----------------------------------------------------------------
   <script
       src="https://cdn.jsdelivr.net/gh/agewallet-client/agewallet-simple-js@1/aw-loader.min.js"
       data-client-id="YOUR_CLIENT_ID"
       data-title="Age Verification Required"
       data-description="Please confirm you are over 18 to enter."
       data-logo="https://yoursite.com/assets/logo.png"
       data-yes-label="Verify Now"
       data-no-label="I am under 18"
       data-error-msg="Access denied."
       data-expiry="60"
       onerror="document.body.innerHTML='<div style=\'position:fixed;top:0;left:0;width:100%;height:100%;background:#0d0d10;color:#fff;display:flex;justify-content:center;align-items:center;flex-direction:column;font-family:sans-serif;z-index:99999\'><h2>Verification Error</h2><p style=\'margin-bottom:20px\'>We could not verify security settings.</p><button onclick=\'location.reload()\' style=\'padding:10px 20px;cursor:pointer\'>Reload Page</button></div>';">
   </script>

====================================================================
*/