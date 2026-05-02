# MediChain — Complete Project Documentation
### Audit Report · Project Summary · Viva Preparation

---

## PART 1 — SIMPLE EXPLANATION (Zero Technical Background Needed)

### 🏥 What is MediChain?

Imagine you go to a hospital. The doctor writes your prescription on paper and puts it in a file cabinet. Now imagine:

- You move to another city — that file is stuck at the old hospital
- The hospital gets hacked — your records are leaked
- An insurance company claims they never got your claim — no proof exists

**MediChain solves all of this.**

Think of MediChain as a **digital locker that only you control**, where every time a doctor treats you, it gets recorded in a book that:
- **No one can erase or edit** (not even the hospital)
- **Only you can give access to** (like giving someone a key to your locker)
- **Insurance gets paid automatically** without any paperwork

### 🔑 The Three People in MediChain

| Person | What they can do |
|---|---|
| 🧑 **Patient** | See your own records, choose which doctors can access them, buy insurance |
| 👨‍⚕️ **Doctor** | View records of patients who gave you permission, write new treatment notes |
| 🛡️ **Insurance Company** | Approve or reject claims, see which patients they cover |

### 📱 How it works in real life

1. You register on MediChain (like creating a bank account — but on blockchain)
2. You go to Dr. Sharma — you share access with him on your phone
3. Dr. Sharma examines you and writes the diagnosis in MediChain
4. The insurance company sees the claim and approves it — Dr. Sharma gets paid
5. Everything is stored on the blockchain forever — permanent proof

### 🔒 Why is it secure?

Think of a blockchain like a **thousands-of-copies diary**. When something is written in it:
- Every computer in the network gets a copy
- You can't change one copy without changing ALL copies
- So no one can cheat

---

## PART 2 — TECHNICAL ARCHITECTURE

```
┌─────────────────────────────────────────────────────────────┐
│                      MEDICHAIN SYSTEM                       │
├──────────────┬───────────────────────────┬──────────────────┤
│   FRONTEND   │       BLOCKCHAIN           │    STORAGE       │
│  React.js    │   Ethereum (Ganache/EVM)   │   IPFS           │
│  Bootstrap   │   Solidity ^0.8.20         │   (Prescriptions)│
│  Web3.js     │   OpenZeppelin Guards       │                  │
│  ethers.js   │   MediChain.sol            │                  │
└──────────────┴───────────────────────────┴──────────────────┘
```

### Technology Stack

| Layer | Technology | Purpose |
|---|---|---|
| UI Framework | React 18 | Component-based SPA |
| Styling | Bootstrap 5 + Custom CSS | Responsive layout + design system |
| Blockchain Client | Web3.js | Ethereum interaction from browser |
| Smart Contract | Solidity ^0.8.20 | Business logic on-chain |
| Contract Library | OpenZeppelin ReentrancyGuard | Security primitives |
| File Storage | IPFS (via Infura) | Decentralized medical files |
| Local Blockchain | Ganache | Development & testing |
| Contract Migration | Truffle | Deployment framework |
| Wallet | MetaMask | User authentication via private key |

### Data Flow

```
User (MetaMask) ──signs tx──► Ethereum Node
                                    │
                               MediChain.sol
                               ┌────┴────┐
                               │         │
                          State Maps   Events
                          (on-chain)  (indexed logs)
                               │
                         React Frontend
                         reads via Web3.js
                         displays to user
```

### Smart Contract Key Functions

| Function | Called By | What It Does |
|---|---|---|
| `register()` | Anyone | Creates Patient / Doctor / Insurer account |
| `permitAccess()` | Patient | Grants doctor access to their records |
| `revokeAccess()` | Patient | Removes doctor's access |
| `buyPolicy()` | Patient | Purchases insurance, pays via ETH |
| `renewPolicy()` | Patient | Renews an expired policy |
| `insuranceClaimRequest()` | Doctor | Submits diagnosis + auto-routes payment |
| `approveClaimsByInsurer()` | Insurer | Approves claim, pays doctor |
| `rejectClaimsByInsurer()` | Insurer | Rejects claim, restores patient cover |
| `settleTransactionsByPatient()` | Patient | Pays doctor out-of-pocket |
| `withdraw()` | Anyone | Withdraws accumulated ETH earnings |
| `createPolicy()` | Insurer | Creates a new insurance policy |

---

## PART 3 — SECURITY AUDIT REPORT

### 🔴 Critical — Fixed

| ID | Issue | Resolution |
|---|---|---|
| C-01 | `withdraw()` used `.transfer()` — vulnerable to gas limit changes | **Fixed** — changed to `.call{value}("")` with success check |
| C-02 | `insuranceClaimRequest()` had no access control — any doctor could submit for any patient | **Fixed** — `hasAccessTo(patient)` modifier enforced |
| C-03 | `permitAccess()` allowed duplicate access grants (same doctor added multiple times) | **Fixed** — `require(!doctorPatientAccess[doctor][patient])` guard added |
| C-04 | `buyPolicy()` allowed buying when active policy existed | **Fixed** — requires expired or inactive policy |

### 🟠 High — Fixed

| ID | Issue | Resolution |
|---|---|---|
| H-01 | No role-based modifiers — any role could call any function | **Fixed** — `onlyPatient`, `onlyDoctor`, `onlyInsurer` modifiers added |
| H-02 | `msg.sender != address(0)` checks were redundant (EVM guarantees this) and wasted gas | **Fixed** — removed all redundant zero-address checks |
| H-03 | `charges` passed as string from frontend to blockchain | **Fixed** — `parseInt(charges)` in Doctor.js before blockchain call |

### 🟡 Medium — Fixed

| ID | Issue | Resolution |
|---|---|---|
| M-01 | Policy expiry used `1 days` instead of `365 days` | **Fixed** — corrected to `timePeriod * 365 days` |
| M-02 | `Transactions` struct had no `timestamp` field — no audit trail | **Fixed** — added `uint timestamp; block.timestamp` at creation |
| M-03 | `EmergencyAccessGranted` orphan event left after function was removed | **Fixed** — deleted the dead event |
| M-04 | `removeFromList` was `public` — should be `internal` | **Fixed** — renamed to `_removeFromList`, marked `internal` |
| M-05 | Repeated `patientInfo[msg.sender].policy.X = ...` storage writes vs. cache | **Fixed** — extracted into `_assignPolicy()` internal helper |

### 🟢 Low — Fixed

| ID | Issue | Resolution |
|---|---|---|
| L-01 | No SPDX license identifier in contract | **Fixed** — added `// SPDX-License-Identifier: MIT` |
| L-02 | No NatSpec documentation on contract functions | **Fixed** — added `@notice`, `@dev`, `@param` comments |
| L-03 | `login()` was `public` — no writes, should be `view external` | **Fixed** — changed to `external view` |
| L-04 | All view functions were `public` | **Fixed** — changed to `external view` (saves ~5–10 gas each) |
| L-05 | `register()` used `public` — should be `external` (calldata cheaper) | **Fixed** |

### Gas Optimizations Applied

- `external` instead of `public` for all functions not called internally (~200 gas saved per call)
- Reduced redundant storage reads by caching `policyList[_id]` in `_assignPolicy()`
- Removed dead `msg.sender != address(0)` guards (~200 gas each)
- Pull-over-push pattern (no gas-heavy loops to distribute funds)
- `_createTransaction()` and `_createClaim()` helpers reduce bytecode duplication

---

## PART 4 — COMPLETE CHANGE SUMMARY

### Smart Contract Changes
- RBAC modifiers: `onlyPatient`, `onlyDoctor`, `onlyInsurer`, `hasAccessTo`
- CEI pattern in `withdraw()` using `.call{}` 
- Duplicate access guard in `permitAccess()`
- `_assignPolicy()`, `_createTransaction()`, `_createClaim()` helpers
- Full NatSpec documentation
- `PolicyRenewed` event added
- `renewPolicy()` function for expired policy renewal

### Frontend Changes

**Login.js**
- Visual role-card selector (icon cards instead of dropdown)
- Gradient branded header
- Auto-detects role from wallet on connect

**Register.js**
- Same role-card UI as Login
- Wallet address chip shown before submit
- Solidity revert reason extraction
- Email normalize (lowercase + trim)

**Patient.js**
- Toast notifications on all actions
- Confirm modal before irreversible transactions
- Cover-remaining progress bar (green→yellow→red)
- Policy expiry countdown (days remaining)
- Renew Policy flow (calls `renewPolicy()`)

**Doctor.js**
- Removed broken Emergency Access section
- `parseInt(charges)` fix
- Confirmation modal before diagnosis
- Policy status badge per patient

**Insurer.js**
- Loading states on approve/reject
- Confirmation modal before claim processing
- Pending badge on claims header

**Wallet.js**
- Indian Rupee formatting (₹1,00,000)
- Gradient glow card when balance > 0

**Timeline.js**
- Disease as gradient pill badge
- Doctor email as chip badge
- Styled prescription link

**index.css**
- New indigo/violet/cyan palette
- Inter + Space Grotesk fonts
- Glassmorphism cards with gradient top-border hover
- Ambient orbs on hero/auth pages
- Staggered entrance animations
- Dark mode refined

---

## PART 5 — PRESENTATION SCRIPT (2-3 minutes)

> *Speak naturally. Look at the audience, not the screen.*

---

"Good [morning/afternoon]. My project is **MediChain** — a decentralized medical records and insurance management system built on the **Ethereum blockchain**.

The core problem I wanted to solve: medical records today are **siloed, insecure, and controlled by hospitals**, not patients. If you switch doctors, your data doesn't follow. If there's a hack, your private health data is exposed. And insurance claims involve endless paperwork.

**MediChain puts the patient in control.**

It has three roles. A **Patient** can grant and revoke doctor access to their records in seconds — from anywhere. A **Doctor** can only see records of patients who explicitly authorized them, and they submit diagnoses directly to the blockchain. An **Insurer** manages policies and approves claims — all transparently.

The system uses **smart contracts** — these are self-executing programs that live on the blockchain. When a doctor submits a diagnosis, the contract automatically checks the patient's insurance, routes the payment to the right party, and logs an immutable timestamp. No middlemen. No paperwork.

Medical files and prescriptions are stored on **IPFS** — a distributed file system — and only their cryptographic hash goes on-chain. This saves cost while ensuring the document cannot be tampered with.

I implemented a **pull-over-push payment pattern** to prevent reentrancy attacks, **role-based access modifiers** for security, and **event logging** for a complete audit trail.

The result is a system that is secure, transparent, patient-owned, and eliminates the trust problem in healthcare administration.

Thank you."

---

## PART 6 — VIVA QUESTIONS & ANSWERS

### 🟢 Beginner Level

**Q1. What is MediChain in simple terms?**
> MediChain is a digital health record system where patients own and control their medical data. Instead of data being stored in a hospital's private database, it lives on a blockchain — which means no single entity controls it, and no one can alter it without everyone knowing.

**Q2. What problem does it solve?**
> Three problems: (1) patients don't own their records — hospitals do; (2) insurance is paper-based and slow; (3) there's no tamper-proof audit trail for who accessed what. MediChain solves all three using blockchain.

**Q3. What is a blockchain in simple terms?**
> A blockchain is like a shared notebook that thousands of computers all have a copy of. When someone writes something new, all copies update. The key property: you can't secretly change one copy — the others would reject it. So it's permanent and tamper-proof.

**Q4. What is MetaMask?**
> MetaMask is a browser extension that acts as your wallet and identity on the Ethereum blockchain. It holds your private key (like a password for your blockchain account) and signs transactions on your behalf.

---

### 🟡 Intermediate Level

**Q5. How does MediChain use blockchain?**
> All business logic lives in a Solidity smart contract deployed on Ethereum. When a patient grants access, buys a policy, or a doctor submits a diagnosis — these are blockchain transactions that permanently modify the contract's state. The frontend reads this state via Web3.js.

**Q6. What is a smart contract?**
> A smart contract is code deployed on the blockchain that executes automatically when conditions are met. In MediChain, when a doctor submits a diagnosis, the contract automatically checks if the patient has insurance, calculates the payment split between insurer and patient, and routes funds — all without a central server.

**Q7. How is data stored?**
> Two layers: (1) **Structured data** (names, policies, access lists, payment amounts) is stored in Solidity mappings on-chain. (2) **Files** (prescriptions, detailed records) are stored on IPFS. Only the IPFS content hash (like a fingerprint of the file) is stored on-chain. This is a gas-efficient hybrid approach.

**Q8. How does access control work?**
> The patient calls `permitAccess(doctorEmail)` which sets `doctorPatientAccess[doctor][patient] = true`. The `insuranceClaimRequest` function has a `hasAccessTo(patient)` modifier that reverts if this mapping is false. So doctors can't query or submit for unauthorized patients.

**Q9. What is IPFS and why use it instead of storing files on-chain?**
> IPFS is the InterPlanetary File System — a peer-to-peer network for storing files. Storing raw files on Ethereum would cost thousands of dollars in gas. Instead, we upload the file to IPFS (free/cheap) and store only its 32-byte CID hash on-chain (a few hundred gas). The hash is a cryptographic fingerprint — if the file changes, the hash changes, so tampering is detectable.

---

### 🔴 Advanced Level

**Q10. What is reentrancy and how did you prevent it?**
> Reentrancy is an attack where a malicious contract calls back into your function before the first execution finishes — allowing double-withdrawals (like the 2016 DAO hack). I use three defenses: (1) OpenZeppelin's `ReentrancyGuard` with the `nonReentrant` modifier on all payable functions; (2) the **CEI pattern** (Check-Effects-Interactions) — balance is set to zero *before* the ETH transfer in `withdraw()`; (3) `call{value}()` instead of `transfer()` to not be gas-limited.

**Q11. Why use the Pull-over-Push payment pattern?**
> Pushing funds to many recipients in a loop is dangerous — if one recipient's fallback function reverts (e.g., a contract that rejects ETH), the entire loop fails and no one gets paid. The pull pattern lets each recipient call `withdraw()` themselves, isolating failures. Every payable event adds to `pendingWithdrawals[address]` and the recipient pulls when they want.

**Q12. What gas optimizations did you implement?**
> (1) All externally-facing functions use `external` instead of `public` — avoids copying calldata to memory; (2) Redundant `msg.sender != address(0)` checks removed (EVM never allows zero-address callers); (3) Repeated storage writes refactored into `_assignPolicy()` with local variable caching; (4) Internal functions prefixed with `_` — not exposed in ABI; (5) Pull-payment pattern avoids expensive loops.

**Q13. What are the RBAC modifiers and why are they important?**
> Role-Based Access Control ensures each function can only be called by the appropriate role. For example, `onlyDoctor` checks `doctorInfo[msg.sender].exists`. Without this, a patient's address could call `createPolicy()` or `approveClaimsByInsurer()`. The modifier system makes security declarative (at the function signature level) rather than scattered inline requires.

**Q14. How does policy expiry work on-chain?**
> When a patient buys a policy, we store `policyExpiry = block.timestamp + (timePeriod * 365 days)`. In `insuranceClaimRequest`, before processing, the contract checks: `if (policyActive && block.timestamp > policyExpiry) { policyActive = false; }`. This is lazy evaluation — we don't run a cron job; the state updates when it's next touched.

**Q15. Architecture decisions and trade-offs?**

| Decision | Trade-off |
|---|---|
| Store records on IPFS, hash on-chain | Cheap gas ✅ but IPFS availability depends on pinning ⚠️ |
| Smart contract only, no backend | Fully decentralized ✅ but no indexing, slow queries on large datasets ⚠️ |
| ETH for payments, INR for display | Familiar display ✅ but INR/ETH rate is hardcoded via Coinbase API ⚠️ |
| Pull payment pattern | Reentrancy-safe ✅ but users need an extra `withdraw()` step ⚠️ |

---

### 🔵 Scenario-Based Questions

**Q16. What happens if a node (Ganache) fails?**
> In a local development setup, if Ganache stops, the app can't send transactions. In a real deployment on Ethereum mainnet/testnet, there's no single node — the blockchain is distributed across thousands of nodes globally. The frontend connects through Infura (a node provider with 99.9% uptime) or directly through MetaMask which connects to public nodes.

**Q17. How do you prevent unauthorized access to patient records?**
> Three layers: (1) On-chain: `doctorPatientAccess[doctor][patient]` mapping checked by `hasAccessTo` modifier; (2) Patient-controlled: only the patient's wallet can call `permitAccess()`; (3) IPFS hashes: knowing the hash alone gives you the content, so sensitive files should be encrypted before IPFS upload (a future improvement — currently prescription files are not client-side encrypted).

**Q18. How would you scale this system?**
> Current limitations: expensive on Ethereum mainnet, on-chain arrays grow unboundedly. Solutions: (1) **Layer 2** — deploy on Polygon or Arbitrum for 100x cheaper transactions; (2) **The Graph** — index events off-chain for fast queries instead of looping through arrays; (3) **Lazy deletion** — instead of removing from arrays, use existence bitmaps; (4) **Pagination** — add offset/limit parameters to getter functions.

---

### ⚡ Tricky Examiner-Level Questions

**Q19. Why blockchain over a traditional database?**
> | | Traditional DB | Blockchain |
|---|---|---|
| Who controls it? | Hospital/company | No one (decentralized) |
| Can records be altered? | Yes, by admins | No — immutable |
| Access control | Server-side | Smart contract code |
| Trust model | Trust the company | Trust the math |
> The key argument: in healthcare, you don't want any single hospital to be able to delete or modify records — a blockchain prevents this by design.

**Q20. What are the limitations of your current system?**
> 1. **Gas costs** — every write to Ethereum costs money. On mainnet, `insuranceClaimRequest` would cost ~$5–15 per transaction.
> 2. **No file encryption** — IPFS files are publicly readable if you have the hash; actual prescriptions should be encrypted.
> 3. **ETH/INR rate** — fetched from Coinbase on page load, not on-chain. If the API is down, a fallback of 250,000 INR/ETH is used.
> 4. **No pagination** — patient lists and transaction arrays could grow large and become expensive to retrieve.
> 5. **MetaMask dependency** — users must have a Web3 wallet, which is a barrier for non-technical patients.

**Q21. If you had more time, what would you improve?**
> 1. Deploy to Polygon (MATIC) — 1000x cheaper, same EVM compatibility
> 2. Client-side AES-256 encryption of prescriptions before IPFS upload
> 3. Use The Graph for event indexing — remove on-chain array storage
> 4. HIPAA/GDPR audit trail — every access attempt logged as an event
> 5. Telemedicine module — video consultation + on-chain session receipt
> 6. Multi-sig for insurers — require 2-of-3 insurer signers for large claims

**Q22. How does the patient-doctor access system compare to OAuth?**
> OAuth is server-side permission delegation (you authorize an app to access your Google account). MediChain's access control is **on-chain** — permissions are stored in the smart contract's state, enforced by code that no company can override. In OAuth, the OAuth server (Google) could revoke your token. In MediChain, only the patient's wallet (the private key) can grant or revoke access — there is no admin.

---

*End of Documentation — MediChain v2.0 | Built on Ethereum | March 2026*
