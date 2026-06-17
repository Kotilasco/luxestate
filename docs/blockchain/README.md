# ZAI-CTS Blockchain Architecture

Hyperledger Fabric anchors carbon credit lifecycle events. PostgreSQL remains the system of record.

## Chaincode Responsibilities

- Project registration reference
- Credit issuance
- Credit serialization
- Authorization checks
- Transfer
- Retirement
- Corresponding adjustment
- Audit history

## On-Chain vs Off-Chain

| Data | Location |
| --- | --- |
| Transaction hash | Fabric |
| Credit serial number hash | Fabric |
| Project/MRV evidence | PostgreSQL/Object Storage |
| Sensitive documents | Encrypted object storage |
| Human-readable audit event | PostgreSQL audit schema |

