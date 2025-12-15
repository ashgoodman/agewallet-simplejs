# AgeWallet Simple JS Integration

Protect your website with age verification in minutes using the AgeWallet Simple JS loader. This script works on any website, including Wix, Squarespace, Webflow, and static HTML.

## Installation

### Step 1: Get Your Credentials

1. Log in to the AgeWallet Dashboard.

2. Create a new Application.

3. In the **Redirect URI** field, enter your website's **Root URL** exactly (e.g., `https://mywinery.com`).

    - **IMPORTANT:** Do not include a trailing slash (use `https://site.com`, NOT `https://site.com/`).

4. Copy your **Client ID**.

### Step 2: Add the Code

Paste the following code snippet inside the `<head>` tag of **every page** you want to protect.

- **Placement:** It is critical to place this as close to the top of the `<head>` as possible to prevent content flashing (FOUC) before the verification gate loads.

#### Basic Code (Default Style)

    <script
        src="[https://cdn.jsdelivr.net/gh/agewallet-client/agewallet-simple-js@1/aw-loader.min.js](https://cdn.jsdelivr.net/gh/agewallet-client/agewallet-simple-js@1/aw-loader.min.js)"
        data-client-id="YOUR_CLIENT_ID_HERE"
        onerror="document.body.innerHTML='<div style=\'position:fixed;top:0;left:0;width:100%;height:100%;background:#0d0d10;color:#fff;display:flex;justify-content:center;align-items:center;flex-direction:column;font-family:sans-serif;z-index:99999\'><h2>Verification Error</h2><p style=\'margin-bottom:20px\'>We could not verify security settings.</p><button onclick=\'location.reload()\' style=\'padding:10px 20px;cursor:pointer\'>Reload Page</button></div>';">
    </script>

##### Be sure to replace `YOUR_CLIENT_ID_HERE` with your actual client id obtained in Step 1

### About the `onerror` Attribute

The `onerror` code block acts as a **Fail-Safe**. If the AgeWallet script is blocked by a network error or aggressive content blocker, this code triggers immediately to hide your site content and display a "Verification Error" overlay. This ensures your restricted content is never exposed if the security system fails to load.

## Configuration Options

Customize the look and feel of your age gate by adding `data-` attributes to your script tag.

| Attribute | Description | Default Value |
| :--- | :--- | :--- |
| `data-title` | The main headline text. | "Age Verification" |
| `data-description` | The message body text. | "You must verify your age..." |
| `data-logo` | URL to your logo image. | AgeWallet Logo |
| `data-yes-label` | Text for the verify button. | "Verify with AgeWallet" |
| `data-no-label` | Text for the deny button. | "I Disagree" |
| `data-error-msg` | Message shown if verification fails. | "Sorry, you do not meet..." |
| `data-expiry` | Session duration in minutes. | `1440` (24 hours) |
| `data-css` | URL to a custom CSS stylesheet. | None |

### Advanced Example (Branded)

This example sets a custom logo, changes the text, expires the session after 1 hour, and loads a custom theme.

    <script
        src="[https://cdn.jsdelivr.net/gh/agewallet-client/agewallet-simple-js@1/aw-loader.min.js](https://cdn.jsdelivr.net/gh/agewallet-client/agewallet-simple-js@1/aw-loader.min.js)"
        data-client-id="YOUR_CLIENT_ID_HERE"
        data-title="Restricted Access"
        data-description="Welcome to the reserve. Please verify your age."
        data-logo="[https://mywinery.com/images/logo.png](https://mywinery.com/images/logo.png)"
        data-yes-label="Enter Site"
        data-no-label="Exit"
        data-expiry="60"
        data-css="[https://mywinery.com/custom-gate.css](https://mywinery.com/custom-gate.css)"
        onerror="document.body.innerHTML='<div style=\'position:fixed;top:0;left:0;width:100%;height:100%;background:#0d0d10;color:#fff;display:flex;justify-content:center;align-items:center;flex-direction:column;font-family:sans-serif;z-index:99999\'><h2>Verification Error</h2><p style=\'margin-bottom:20px\'>We could not verify security settings.</p><button onclick=\'location.reload()\' style=\'padding:10px 20px;cursor:pointer\'>Reload Page</button></div>';">
    </script>

## Troubleshooting

- **Gate appears but verification fails:** Ensure your "Redirect URI" in the AgeWallet Dashboard matches your website's address exactly (including `https://`).

- **Gate doesn't appear:** Check your browser console (F12) for errors. Ensure the script tag is placed correctly in the `<head>` of the document.
