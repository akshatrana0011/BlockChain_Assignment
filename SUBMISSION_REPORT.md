# CampusFix DApp — Assignment Report

> Complete this report with actual details after deploying and testing. Do not report a test as successful unless you have run it and observed the result.

## 1. Student details
- **Name:** [Enter name]
- **Registration number:** [Enter registration number]
- **Course / subject:** [Enter course]
- **Instructor:** [Enter instructor]
- **Submission date:** [Enter date]

## 2. Objective
To implement a decentralized campus maintenance reporting application in which users can submit issues and view their status, while authorized administration updates request progress on an Ethereum-compatible blockchain.

## 3. Tools and technologies
- Solidity `^0.8.20` for the smart contract.
- Remix IDE for compilation and deployment.
- Ganache or an instructor-approved EVM network for testing.
- MetaMask for wallet connection and transaction signing.
- HTML, CSS, JavaScript, and ethers.js v6 for the user interface.

## 4. System design
The smart contract stores each request's ID, requester address, title, description, status, creation time, and last-update time. Request IDs are sequential. The contract emits events for new requests and status changes. Only the deploying account can change a request's status. The frontend connects through MetaMask and reads/writes contract data using ethers.js.

### Status model
1. **Open** — request has been created.
2. **In Progress** — work has started.
3. **Resolved** — issue has been addressed.

## 5. Implementation
- `createRequest(title, description)` validates the title and description and records a new request.
- `getRequest(id)` returns a single request.
- `getRequests(offset, limit)` returns a paginated list, newest first.
- `updateStatus(id, newStatus)` allows only the owner to change a status and rejects invalid IDs or unchanged statuses.
- The web UI provides wallet connection, request submission, request history, filtering, and owner-only status controls.

## 6. Deployment record
- **Network:** [Ganache / approved network]
- **Chain ID:** [Enter actual chain ID]
- **Contract address:** [Paste deployed address]
- **Contract owner:** [Paste owner address]
- **Transaction hash:** [Paste deployment transaction hash]

## 7. Test results

| Test | Expected result | Actual result / evidence |
|---|---|---|
| Compile contract | No errors | [Fill in] |
| Deploy contract | Successful deployment | [Fill in] |
| Create valid request | Request recorded on-chain | [Fill in] |
| Reject empty fields | Validation prevents request | [Fill in] |
| Reject over-limit text | Validation / contract revert | [Fill in] |
| Owner updates status | Status changes | [Fill in] |
| Non-owner updates status | Transaction reverts | [Fill in] |
| Reject invalid request ID | Transaction/call reverts | [Fill in] |
| Reject duplicate status | Transaction reverts | [Fill in] |

## 8. Evidence
Insert your own screenshots with captions:
- Figure 1 — successful contract compilation.
- Figure 2 — contract deployed in Remix.
- Figure 3 — MetaMask connected to the frontend.
- Figure 4 — request submitted successfully.
- Figure 5 — request visible in request history.
- Figure 6 — owner status update.
- Figure 7 — unauthorized status update rejected.

## 9. Limitations and future improvements
- The contract owner is a single administrator; production deployments could use multisignature administration or role-based access control.
- Request descriptions are public on-chain; users should not include personal or confidential information.
- On-chain data is persistent, and erroneous submissions cannot be deleted by this contract.
- Future versions could include campus locations, image storage via a separate decentralized storage service, event-based indexing, and automated tests.

## 10. Conclusion
CampusFix demonstrates a simple decentralized workflow for submitting and tracking campus maintenance requests. The contract provides persistent request records and restricts status changes to the owner, while the frontend offers a user-friendly interface for interacting with the contract.

---
**Submission checklist:** replace every bracketed field, add real screenshots, record real test results, verify the deployed address, and export the completed report to the format required by your instructor.