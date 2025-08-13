# 🎯 Vortex — Spin, Win, Repeat!

**Vortex** is a mobile-first decentralized application (dApp) where users turn tiny token amounts into exciting spins on a provably fair wheel.  
Every spin is fun, transparent, and can lead to meaningful rewards — all while keeping user control and security at the heart of the experience.

---

## 🌟 What is Vortex?

Vortex takes small token balances that are often ignored and turns them into an engaging game experience.  
Users can **spin a wheel** in two ways:

1. **On-chain spinning** — Spins are executed directly on the blockchain, with no deposit needed.
2. **Off-chain spinning** — Spins happen instantly through a pre-deposited balance for a faster and smoother experience.

💡 Both modes are fair, transparent, and powered by smart contracts.

---

## 🎮 Key Features

- **Two Game Modes**
  - On-chain mode: Fully blockchain-verified spins.
  - Off-chain mode: Instant spins with balance stored in-app.
- **Provably Fair**
  - No hidden house edge.
  - Prize pools are transparent and distributed fairly.
- **Multiple Winners**
  - Rewards are split among winners.
  - Partial refunds for non-winners so no one loses everything.
- **Full Control**
  - View your live balance at any time.
  - Withdraw remaining tokens instantly to your wallet.

---

## 🛠 Architecture Overview

The system is designed for **speed**, **security**, and **scalability**.

```mermaid
flowchart TD
    A[User Wallet] -->|Connect| B[Vortex Frontend App]
    B -->|Spin Request| C{Spin Mode?}
    C -->|On-chain| D[Smart Contract]
    C -->|Off-chain| E[Game Server]
    D -->|Blockchain Transaction| F[Prize Pool Smart Contract]
    E -->|Process Result| F
    F -->|Send Result| B
    B -->|Update Balance| A
    B -->|Withdraw| D
