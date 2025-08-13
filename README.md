# 🎯 Vortex - Spin, Win, Repeat!

[![License](https://img.shields.io/github/license/Chrispin-m/vort3x)](LICENSE)
[![Stars](https://img.shields.io/github/stars/Chrispin-m/vort3x?style=social)](https://github.com/Chrispin-m/vort3x/stargazers)
[![Issues](https://img.shields.io/github/issues/Chrispin-m/vort3x)](https://github.com/Chrispin-m/vort3x/issues)
[![Last Commit](https://img.shields.io/github/last-commit/Chrispin-m/vort3x)](https://github.com/Chrispin-m/vort3x/commits/main)

---

**Vortex** is a **mobile-first decentralized application (dApp)** where players turn small token amounts into high-energy spins on a **provably fair wheel**.  
Every spin is built for **fun**, **fairness**, and **transparency**, with **player control** and **security** at its core.

---

## 🌟 What is Vortex?

Small token balances often go unused — Vortex changes that.  
It transforms them into an **interactive game** where users spin to multiply rewards in two ways:

1. **On-chain spinning** - 100% blockchain-verified spins, no deposits required.  
2. **Off-chain spinning** - Lightning-fast gameplay using preloaded in-app balances.

💡 In both modes, results are **auditable** and powered by secure smart contracts.

---

## 🎮 Core Features

- **Two Game Modes**
  - On-chain: Fully verified on the blockchain.
  - Off-chain: Instant spins with preloaded balance.
- **Provably Fair**
  - No hidden edge; prize pools are visible and verifiable.
- **Multiple Winners**
  - Rewards shared among winners.
  - Partial refunds for non-winners — nobody loses everything.
- **Full Wallet Control**
  - Track live balances.
  - Withdraw instantly at any time.
- **Cross-Platform Experience**
  - Works seamlessly on **web and mobile**.

---

## 🛠 Architecture Overview

The system prioritizes **speed**, **security**, and **scalability**.

```mermaid
flowchart TD
    A[User Wallet] -->|Connect| B[Vortex Frontend App]
    B -->|Spin Request| C{Spin Mode?}
    C -->|On-chain| D[Smart Contract]
    C -->|Off-chain| E[Game Server]
    D -->|Blockchain Transaction| F[Prize Pool Contract]
    E -->|Process Result| F
    F -->|Send Result| B
    B -->|Update Balance| A
    B -->|Withdraw| D
````

---

## 📸 Example Gameplay

> **Scenario:**
> You load **1 cUSD** → Spin the wheel → Hit a **3× multiplier** → Balance jumps to **3 cUSD** instantly.
>
> Or, skip deposits: connect your wallet, spin on-chain, and get rewards directly sent to your wallet.

---

## 🤝 Contributing

We welcome contributions from developers, designers, and blockchain enthusiasts.
Open an issue or submit a pull request to make Vortex even better.

---

## 📊 GitHub Repo 




Analytics Dashboard (Live)

**Repository Overview**
![Repo Stats](https://github-readme-stats.vercel.app/api/pin/?username=Chrispin-m&repo=vort3x&theme=radical)

**Languages Used in This Repo**
![Top Languages](https://github-readme-stats.vercel.app/api/top-langs/?username=Chrispin-m&repo=vort3x&layout=compact&theme=radical)

**Active Contributors**
![Contributors](https://contrib.rocks/image?repo=Chrispin-m/vort3x)

**Commit Activity for This Repo**
![Commit Graph](https://github-readme-activity-graph.vercel.app/graph?username=Chrispin-m&repo=vort3x&theme=react-dark&hide_border=true)

---

## 📜 License

This project is licensed under the [MIT License](LICENSE).

---
