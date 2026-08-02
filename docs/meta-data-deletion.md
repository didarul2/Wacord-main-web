# Meta Data Deletion Instructions — Wacord

**Last updated:** 2 August 2026  
**App / Product:** Wacord  
**Purpose:** Meta Platform Terms — user data deletion instructions (App Dashboard → Data Deletion Instructions URL)

This page explains how Facebook / Instagram users and Wacord Merchants can request deletion of data associated with the Wacord Meta integration, in line with [Meta’s Data Deletion requirements](https://developers.facebook.com/docs/development/create-an-app/app-dashboard/data-deletion-callback).

---

## 1. Overview

Wacord is a B2B SaaS platform that connects Merchant Facebook Pages / Instagram accounts to a unified inbox.

- Merchants remain the **data controllers** of their Buyer data.
- Wacord acts as a **data processor** and will delete Meta-linked user data when a valid deletion request is received (subject to legal retention exceptions below).

---

## 2. How to request deletion via Facebook (Meta flow)

If you previously used or authorized the Wacord Facebook / Instagram app:

1. Log in to Facebook.
2. Open **Settings & privacy → Settings → Apps and Websites**:  
   [https://www.facebook.com/settings?tab=applications](https://www.facebook.com/settings?tab=applications)
3. Find **Wacord**, then remove / disconnect the app.
4. Open **View Removed Apps and Websites**.
5. Next to Wacord, click **Send Request** to ask that your data be deleted.

Meta may also call our secure Data Deletion Request Callback. When that happens we start deletion and return a confirmation code plus a status URL.

---

## 3. How to request deletion via Wacord (manual / Merchant flow)

You can also email or contact Support with:

- Subject: **Meta Data Deletion Request**
- Your full name and email used with Wacord / Facebook
- Facebook Page name or Page ID (if known)
- Instagram business account handle (if applicable)
- Approximate connection date
- Confirmation that you want Meta-linked data deleted

Contact: use the [Contact / Support](./index.html#contact) options on wacord.com, or your account manager.

We may verify identity / Page ownership before processing.

---

## 4. What we delete

For a valid Meta-linked deletion request, we initiate deletion of data Wacord holds from Facebook / Instagram about that user or connected identity, which may include:

- App-scoped user identifiers and related auth metadata
- Page / Instagram connection tokens and channel credentials tied to that identity (as applicable)
- Conversation and inbox records synced from Meta for that identity, where Wacord is the processor and deletion is requested
- Cached profile fields provided by Meta APIs for that identity

**Merchant account data** (billing, subscription, agent seats) is handled under our general Privacy Policy deletion process and may require a Merchant admin request.

---

## 5. What we may retain (exceptions)

We may retain limited information when required by law or legitimate operational needs, for example:

- Records needed for tax, accounting, fraud prevention, or dispute resolution
- Security / audit logs for a limited period
- Anonymized or aggregated analytics that no longer identify you
- Data a Merchant must keep as controller under their own legal obligations (we process Merchant instructions; end-Buyer commerce records may require Merchant action)

Residual encrypted backups may persist for a short period before irreversible purge.

---

## 6. Timeline

- We **initiate** deletion promptly after a valid request (or Meta callback).
- Typical completion target: **within 30 days** (often sooner).
- Complex Merchant / multi-Page accounts may take longer; we will communicate if verification is needed.

---

## 7. Check deletion status

If you received a confirmation code (from Meta’s callback response or from Support):

1. Open this page with your code:  
   `https://wacord.com/data-deletion.html?code=YOUR_CODE`
2. Or enter the code in the status box on this page.
3. Contact Support with the code if status is unclear.

Status meanings:
- **Received** — request logged, verification / processing started
- **In progress** — deletion running
- **Completed** — Meta-linked data deletion finished (subject to legal exceptions)
- **Needs info** — we need identity / Page verification

---

## 8. Related policies

- [Privacy Policy](./privacy.html) — full retention, rights, and Meta inbox practices
- [Terms of Service](./terms.html)

---

*This page is provided to satisfy Meta’s requirement that apps explain how users can request deletion of their data. It is not legal advice.*
