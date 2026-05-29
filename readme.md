<div align="center">
  <img src="src/icon128.png" width="80" height="80">
  <h1>XBypass</h1>
</div>

A Chrome/Edge/Brave/Opera/Vivaldi/Helium/Arc extension that bypasses X's age restriction gate.


I got tired of seeing "Age-restricted adult content" on posts that had nothing 18+ about them. The kicker - on the X mobile app you can just tap the post quickly and it loads fine. I built this so I can see those posts on browser.


## Installation

1. Download `XBypass.zip` from the [latest release](https://github.com/JULJERYT/XBypass/releases/latest)
3. Go to `chrome://extensions/`
4. Enable **Developer mode**
5. Drag n drop the zip file onto the extensions page
6. Done


## Usage

Click the extension icon to toggle the bypass on/off. Dev mode in the popup shows logs if you want to see whats being patched


## Screenshots

<table>
<tr>
<td align="center"><strong>Before</strong></td>
<td align="center"><strong>After</strong></td>
</tr>
<tr>
<td><img src="./screenshots/before.png" alt="Before"></td>
<td><img src="./screenshots/after.png" alt="After"></td>
</tr>
</table>


## How it works

X stores feature flags in the pages JS state (things like `age_verification_gate_enabled`, `rweb_age_assurance_flow_enabled` `sensitive_tweet_warnings_enabled`). XBypass hooks into three places and flips those flags before the page has a chance to act on them:

- **`__INITIAL_STATE__`** - X's global state object, intercepted at the setter before the page renders
- **`Object.assign`** - wrapped to patch anything that looks like a feature config being merged in
- **`JSON.parse`** - wrapped to patch parsed API responses that contain feature data

All client-side. The extension injects into the pages main JS context, patches the flags, optionally spoofs the birthdate field. Thats the whole thing.

## No requests

XBypass makes zero requests to X servers (or any servers for that matter). It only modifies values already present in your browsers JS environment

The chance of getting banned for this is very small - but never zero. X could theoretically detect client-side state anomalies. Use at your own risk.

---

### made by jul