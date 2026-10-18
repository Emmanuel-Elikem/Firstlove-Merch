# Simplified Direct Mobile Money (MoMo) Checkout & Order Verification Plan

Transition the First Love Cape Coast shirt pre-order system from Paystack to a direct, frictionless Mobile Money (MoMo) checkout flow with transparent GHC 1/shirt charges, secure reference code generation, instant WhatsApp group ticket redirection with payment screenshot submission, and coordinator reconciliation.

## User Review & Critical Decisions

> [!IMPORTANT]
> The following parameters and requirements were confirmed by Rev D FLC:
> - **Payment Channel**: Direct Mobile Money (MTN MoMo) instead of third-party Paystack gateway.
> - **MoMo Recipient**: **0536193423** (Account Name: **Emmanuel Nerkwei Nettey**).
> - **Network / Service Charge**: **GHC 1.00 per shirt** (`quantity × GHC 1.00`).
> - **Payment Reference**: Secure randomly generated Ticket Code (e.g. `FLC-9428`) to be entered as the MoMo payment reference/reason.
> - **Verification Workflow**: Upon tapping "I Have Sent Payment", the app records the reservation, generates the consolidated digital ticket with 1-click copy, and automatically opens the official WhatsApp Group with the ticket text pre-filled so the buyer can paste their MoMo transaction screenshot for verification.

---

## 1. Overview & Core Concept

- **What It Does**: Replaces the external card/gateway popup with a streamlined in-church MoMo payment interface. Customers input their name and phone, review the shirt subtotal and GHC 1/shirt network charge, see the church MoMo number and account name displayed boldly with 1-click copy buttons, use their unique ticket ID as the payment reference, and seamlessly transition to WhatsApp with their proof of payment.
- **Target Audience**: Church members, university students (UCC, CUC, Cape Coast halls), fellowship bacenta leaders, and outreach attendees.
- **Key Value**: 100% familiar Ghanaian MoMo UX with zero card failure rates, zero Paystack gateway timeouts, instant WhatsApp group integration, and full control over verification.

---

## 2. User Experience & Visual Design

### Key User Flows

1. **Bag Review & Customer Input**:
   - Customer selects colorway (including White / Purple-Pink vs White / Deep Teal), edition, size, and quantity.
   - Inside the slide-over pre-order bag, customer enters their Full Name and Phone Number (for church pickup).
   - Cost Breakdown displays:
     - **Shirts Subtotal**: `GHC {subtotal.toFixed(2)}`
     - **MoMo Network & Processing Charge**: `+ GHC {totalShirts * 1.00} (GHC 1.00 / shirt)`
     - **Total Due**: `GHC {(subtotal + totalShirts * 1.00).toFixed(2)}`
2. **Bold MoMo Payment Display Card**:
   - Prominently styled MoMo transfer card:
     - **Number**: `0536193423` (Bold yellow/amber monospace text with a 1-tap "Copy Number" button)
     - **Name**: `Emmanuel Nerkwei Nettey` (Verified recipient badge)
     - **Exact Amount to Send**: `GHC {totalAmount.toFixed(2)}` (1-tap "Copy Amount" button)
     - **Payment Reference**: `FLC-XXXX` (1-tap "Copy Reference" button)
   - Step-by-step guidance:
     1. Dial `*170#` or use MTN MoMo / Telecel / AT app to send funds to `0536193423`.
     2. Ensure recipient displays as **Emmanuel Nerkwei Nettey**.
     3. Enter your unique **Ticket Code** as the transaction Reference.
     4. Tap "Confirm Payment & Open WhatsApp Group".
3. **Automated WhatsApp Redirection & Digital Ticket**:
   - Instantly persists order to backend database with status `pending`.
   - Copies the formatted pre-order ticket to the user's clipboard.
   - Automatically opens WhatsApp with the pre-formatted ticket text and instructions to attach the payment confirmation screenshot.
4. **Coordinator Admin Verification**:
   - Coordinators log in using passkey (`Elsieee`).
   - View orders with customer name, phone number, MoMo reference, and amount.
   - Use the reversible dropdown (`Pending` $\leftrightarrow$ `Ready for Pickup` $\leftrightarrow$ `Collected`) to match WhatsApp screenshots and church pickup.

---

## 3. Key Product Decisions & Trade-Offs

- **Decision 1: Direct MoMo Transfer vs. Gateway Redirection**:
  - *Chosen Approach*: Direct peer-to-merchant MoMo transfer to `0536193423` with ticket reference.
  - *Why*: Eliminates payment gateway failures, transaction timeouts, and complex merchant onboarding while keeping the church workflow personal and accountable.
  - *Trade-Off*: Verification is handled via screenshot matching in the WhatsApp group and admin dashboard rather than automatic webhook callbacks.
- **Decision 2: Fee Structure**:
  - *Chosen Approach*: GHC 1.00 per shirt (`quantity * 1`).
  - *Why*: Directly honors Rev D's exact specification while keeping shirts accessible to students.
- **Decision 3: Secure Reference Generation**:
  - *Chosen Approach*: Cryptographically unguessable ticket format `FLC-` + 4-digit random number (e.g. `FLC-6821`), unique per checkout session.

---

## 4. Technical Architecture & Data Strategy

```
┌────────────────────────────────────────────────────────┐
│                   Pre-Order Store                      │
│     (Colorway Selector, Size, Quantity, Cart Bag)      │
└───────────────────────────┬────────────────────────────┘
                            │
                            ▼
┌────────────────────────────────────────────────────────┐
│             Checkout Drawer (CartDrawer.tsx)           │
│  - Cost: Subtotal + GHC 1/shirt fee                   │
│  - Bold MoMo Card: 0536193423 (Emmanuel Nerkwei Nettey)│
│  - Generated Ticket Ref: FLC-XXXX                      │
│  - 1-Click Copy Affordances                            │
└───────────────────────────┬────────────────────────────┘
                            │ Tap "Confirm & Open WhatsApp"
                            ▼
┌────────────────────────────────────────────────────────┐
│      Persistence & Automated WhatsApp Dispatch         │
│  - POST /api/orders (Status: Pending MoMo Verification)│
│  - Copies formatted ticket to clipboard                │
│  - Redirects to WhatsApp Group with ticket & prompt    │
└───────────────────────────┬────────────────────────────┘
                            │
                            ▼
┌────────────────────────────────────────────────────────┐
│         Coordinator Admin Console (Elsieee)            │
│  - Reversible Status Dropdown (Pending/Ready/Collected)│
│  - Manufacturer Tally (Separating Whites & Sizes)      │
│  - MoMo Reference & Audit Trail                        │
└────────────────────────────────────────────────────────┘
```

### Components to Update
1. **`src/types/merch.ts`**: Update `CustomerOrder` to support `channel: 'momo_manual'`, `momoNumber: '0536193423'`, and fee breakdown.
2. **`src/components/CartDrawer.tsx`**: Replace Paystack inline SDK with the bold MoMo checkout component, copy-to-clipboard buttons, and seamless WhatsApp dispatch.
3. **`src/components/OrderReceiptModal.tsx`**: Update ticket message template to highlight the MoMo transfer reference and screenshot instructions.
4. **`src/components/AdminOrdersView.tsx`**: Remove Paystack gateway settings cards; update financial metrics to track MoMo orders, revenue, and collection statuses.
5. **`server.ts`**: Streamline orders endpoint without external Paystack webhook requirements.
