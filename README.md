# AgeWallet Simple JS Integration

Protect your website with age verification in minutes using the AgeWallet Simple JS loader. This script works on any website, including Wix, Squarespace, Webflow, and static HTML.

## Installation

### Step 1: Get Your Credentials

1. Log in to the AgeWallet Dashboard

2. Create a new Application.

3. In the **Redirect URI** field, enter your website's **Home Page URL** (e.g., `https://mywinery.com`).

4. Copy your **Client ID**.

### Step 2: Add the Code

Paste the following code snippet immediately before the closing `</body>` tag on **every page** you want to protect.

#### Basic Code (Default Style)

    <script
        src="https://cdn.jsdelivr.net/gh/agewallet-client/agewallet-simple-js@1/aw-loader.js"
        data-client-id="YOUR_CLIENT_ID_HERE">
    </script>

##### Be sure to replace `YOUR_CLIENT_ID_HERE` with your actual client id obtained in Step 1

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
        src="https://cdn.jsdelivr.net/gh/agewallet-client/agewallet-simple-js@1/aw-loader.js"
        data-client-id="YOUR_CLIENT_ID_HERE"
        data-title="Restricted Access"
        data-description="Welcome to the reserve. Please verify your age."
        data-logo="https://mywinery.com/images/logo.png"
        data-yes-label="Enter Site"
        data-no-label="Exit"
        data-expiry="60"
        data-css="https://simpleaw-test.netlify.app/demo.css">
    </script>

## Troubleshooting

- **Gate appears but verification fails:** Ensure your "Redirect URI" in the AgeWallet Dashboard matches your website's address exactly (including `https://`).

- **Gate doesn't appear:** Check your browser console (F12) for errors. Ensure the script tag is placed correctly before `</body>`.
