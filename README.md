# MediChain

> A local Ethereum dApp prototype for role-based medical-record access, insurance workflows, and provider payments.

MediChain explores how patients, doctors, and insurers could coordinate around medical-record references and insurance claims using wallet-based identity, Solidity smart contracts, and IPFS-compatible content addressing.

This is an educational prototype for local development. It is not a production healthcare system, medical device, or recommendation for storing real patient data on a public blockchain.

## What the prototype demonstrates

- Patient, doctor, and insurer registration with wallet-linked roles.
- Patient-controlled doctor access with grant and revoke flows.
- Medical-record references represented as content hashes.
- Insurance policy creation, purchase, renewal, and claim workflows.
- Claim approval/rejection and provider payment settlement.
- Pull-based withdrawals guarded by OpenZeppelin `ReentrancyGuard`.
- UUPS upgradeable contract structure with owner-controlled upgrades.
- React dashboard with Web3 wallet integration and role-specific views.
- Local development diagrams for the contract and patient interaction flow.

## Architecture

```text
React client
    |
    +-- Web3.js / MetaMask
    |
Local Ethereum network (Ganache)
    |
MediChain.sol
    |
    +-- role registry and access mappings
    +-- insurance policies and claims
    +-- payment balances and withdrawals
    +-- IPFS/content-hash references
```

The smart contract is in `truffle/contracts/MediChain.sol`. The client is in `client/`, and the local blockchain project is in `truffle/`.

## Technology

- React 18 and React Bootstrap
- Web3.js and MetaMask
- Solidity `^0.8.20`
- Truffle and Ganache
- OpenZeppelin Contracts and upgradeable contracts
- IPFS-compatible storage integration
- Node.js and npm

## Run the local demo

### Requirements

- Node.js 18 or newer
- npm
- Ganache
- MetaMask browser extension
- Truffle CLI, or use the repository scripts

### Install

```bash
git clone https://github.com/karthikeyatether/medichain.git
cd medichain

npm install
npm run client:install
npm run truffle:install
```

### Start Ganache

Start a local Ganache workspace on `127.0.0.1:7545`, then connect MetaMask to that network and import a development account.

### Compile, deploy, and start

```bash
npm run truffle:compile
npm run truffle:migrate
npm run client:start
```

The client runs at `http://localhost:3000`.

On Windows, `run_project.bat` provides the same local workflow.

### Contract tests

```bash
npm run truffle:test
```

## Project structure

```text
client/
  src/                 React application and role-specific views
  public/assets/       diagrams and static assets
truffle/
  contracts/           Solidity contract
  migrations/          deployment scripts
  test/                contract tests
  truffle-config.js    local network configuration
```

## Security and privacy limitations

- Do not use real patient information, wallet keys, or production funds.
- Medical data should not be placed directly on-chain.
- IPFS hashes can still reveal relationships and metadata.
- The local network and development configuration are not production hardened.
- A security review, privacy threat model, access audit, and deployment review are required before any real-world use.

## License

This project is distributed under the [MIT License](LICENSE).
