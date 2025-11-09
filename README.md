# ZPay — Project Roadmap
### *Building the bridge between Zcash privacy and Solana utility.*

ZPay connects **Zcash’s shielded transactions** with **Solana’s programmable ecosystem** — enabling truly private payments for Fungible Tokens, Launchpads, Stablecoins, and DeFi.  
This roadmap outlines how the system will evolve from a working MVP to a production ready cross chain payments platform.

---

## Core Architecture

ZPay is built using **Next.js** for both frontend and backend logic, with a **serverless API layer** powered by **AWS Amplify** and **Upstash Redis** for lightweight persistence.

**Stack Overview:**
- **Frontend:** Next.js + TypeScript + Tailwind CSS  
- **Backend:** Next.js API Routes (serverless)  
- **Database / Queue:** Upstash Redis (REST API + edge caching)  
- **Hosting & CI/CD:** AWS Amplify  
- **Zcash Integration:** `lightwalletd` or `zcashd` RPC  
- **Solana Integration:** `@solana/web3.js` for wallet & transaction control  

---

## Payment Flow — Zcash → Solana

1. **Payment Session Creation**  
   - A merchant or app requests a payment via `/api/payments/create`.  
   - ZPay generates a unique **Zcash address** and a **session ID**.  
   - The session details (address, amount, target action) are saved to Redis.  

2. **Payment Detection**  
   - The backend continuously checks Zcash network activity (via RPC or `lightwalletd`).  
   - Once the expected payment is detected and confirmed, the session is updated to `confirmed`.  

3. **Solana Execution**  
   - Upon confirmation, ZPay triggers a **Solana transaction** from a custodial wallet.  
   - Supported actions include:
     - Sending SOL or SPL tokens  
     - Buying and Selling Tokens
     - Invoking on-chain programs  
   - Both the Zcash and Solana transaction hashes are stored and exposed via API.  

4. **User Feedback**  
   - The frontend UI polls `/api/payments/status/:id` to show live updates.  
   - Once complete, the user sees a success screen with linked transaction hashes (Zcash + Solscan).

---

## User & Merchant Experience

### **Frontend UI**
- Simple checkout page with “Pay with Zcash” flow  
- QR code and live payment status  
- Animated confirmation once Solana transaction completes  

### **Merchant Dashboard**
- Overview of all payment sessions  
- Status indicators (Pending / Confirmed / Executed)  
- Linked Zcash and Solana transaction hashes  
- Option to export transaction logs for accounting  

### **Developer API**
- `POST /api/payments/create` → start new session  
- `GET /api/payments/status/:id` → poll session state  
- `GET /api/payments/list` → list all sessions (merchant view)  

---

## Privacy & Security Principles
- All Zcash transactions remain **shielded** by default.  
- Solana execution uses **custodial keys** managed server-side for now.  
- Future iterations will integrate **trust-minimized bridges** (RenVM, Zolana) for non-custodial swaps.  
- Redis stores only minimal, non-sensitive metadata (no user identifiers).  

---

## Technical Features
- **Private by default:** Zcash handles sender privacy, no external tracking.  
- **Fast & composable:** Payments settle quickly with Solana finality.  
- **Developer-friendly:** Simple APIs for integration into any DApp or marketplace.  
- **Transparent traceability:** Both sides of the transaction are visible via hashes — without exposing identities.  

---

## Launch Objectives
The MVP launch will include:
- Zcash payment creation and detection  
- Solana action execution (Token Purchases or SOL send)  
- Live frontend with real-time payment updates  
- Merchant dashboard for viewing transaction history  
- Automatic deployment to AWS Amplify via GitHub  

---

## Future Plans & Stretch Goals

### **Short-Term Enhancements**
- Integrate **Upstash Kafka** for event-driven updates (no polling)  
- Add webhook callbacks for merchant automation  
- Introduce multiple Solana actions (swap, stake, join DAO)  
- Implement API authentication via JWT or merchant keys  

### **Medium-Term**
- Replace custodial management with **bridge integrations** (RenVM / Zolana).  
- Add zk-proof payment receipts to verify payment origin privately.  
- Build a multi-merchant dashboard with analytics.  

### **Long-Term Vision**
- A full **privacy-first payments layer** for Solana and beyond.  
- Enable other blockchains (Ethereum L2s, Avalanche, etc.)  
- Offer SDKs for web, mobile, and game developers.  

---

## Current Status
**MVP in Development**  
Stay updated: [github.com/SolairePrivacy/ZPay](https://github.com/SolairePrivacy/ZPay)

---
> “Private money meets programmable finance.”  
> — *ZPay Team* 