# AgeWallet Simple JS Integration

Protect your website with age verification in minutes using the AgeWallet Simple JS loader.

## Installation

### Step 1: Get Your Credentials

1. Log in to the [AgeWallet Dashboard](https://app.agewallet.io/).
2. Create a new Application.
3. In the **Redirect URI** field, enter your website's **Home Page URL** (e.g., `https://mywinery.com`).
4. Copy your **Client ID**.

### Step 2: Add the Code

Paste the following code snippet immediately before the closing `</body>` tag on **every page** you want to protect. Be sure to replace 'YOUR_CLIENT_ID_HERE' wth the client ID you ontained in step 1.

#### Basic Code

```html
<script
    src="https://cdn.jsdelivr.net/gh/ashgoodman/agewallet-simplejs@1/aw-loader.js"
    data-client-id="YOUR_CLIENT_ID_HERE">
</script>
