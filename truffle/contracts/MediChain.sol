// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";

/**
 * @title MediChain
 * @notice Decentralized medical records, insurance, and payment management on Ethereum.
 * @dev Uses pull-over-push payment pattern (ReentrancyGuard) for secure withdrawals.
 */
contract MediChain is Initializable, ReentrancyGuard, UUPSUpgradeable, OwnableUpgradeable {

    // ─────────────────────────────────────────────
    // State Variables
    // ─────────────────────────────────────────────
    string public name;
    address[] public patientList;
    address[] public doctorList;
    address[] public insurerList;
    Policy[] public policyList;
    uint public claimsCount;
    uint public transactionCount;

    mapping(uint    => Claims)       public claims;
    mapping(uint    => Transactions) public transactions;
    mapping(address => Patient)      public patientInfo;
    mapping(address => Doctor)       public doctorInfo;
    mapping(address => Insurer)      public insurerInfo;
    mapping(address => uint)         public pendingWithdrawals;
    mapping(string  => address)      public emailToAddress;
    mapping(string  => uint)         public emailToDesignation;
    /// @dev doctorPatientAccess[doctor][patient] = true if access granted
    mapping(address => mapping(address => bool)) public doctorPatientAccess;

    // ─────────────────────────────────────────────
    // Events
    // ─────────────────────────────────────────────
    event PatientRegistered(address indexed patient,  string name);
    event DoctorRegistered (address indexed doctor,   string name);
    event InsurerRegistered(address indexed insurer,  string name);
    event AccessGranted    (address indexed patient,  address indexed doctor);
    event AccessRevoked    (address indexed patient,  address indexed doctor);
    event PolicyCreated    (uint indexed id,          address indexed insurer, string name);
    event PolicyBought     (address indexed patient,  uint indexed policyId);
    event PolicyRenewed    (address indexed patient,  uint indexed policyId);
    event ClaimRequested   (uint indexed claimId,     address indexed doctor, address indexed patient);
    event ClaimApproved    (uint indexed claimId);
    event ClaimRejected    (uint indexed claimId);
    event TransactionSettled(uint indexed txId,       address indexed sender, address indexed receiver);
    event FundsWithdrawn   (address indexed user,     uint amount);

    // ─────────────────────────────────────────────
    // Structs
    // ─────────────────────────────────────────────
    struct Patient {
        string    name;
        string    email;
        uint      age;
        string[]  records;       // IPFS hashes — append-only audit trail
        bool      exists;
        bool      policyActive;
        Policy    policy;
        uint      policyExpiry;  // Unix timestamp
        uint[]    transactions;
        address[] doctorAccessList;
    }

    struct Doctor {
        string    name;
        string    email;
        bool      exists;
        uint[]    transactions;
        address[] patientAccessList;
    }

    struct Insurer {
        string    name;
        string    email;
        bool      exists;
        Policy[]  policies;
        address[] patients;
        uint[]    claims;
        uint[]    transactions;
    }

    struct Policy {
        uint    id;
        address insurer;
        string  name;
        uint    coverValue;
        uint    timePeriod;  // in years
        uint    premium;     // in INR (for display), ETH collected at buyPolicy call
    }

    struct Claims {
        address doctor;
        address patient;
        address insurer;
        string  policyName;
        string  record;       // IPFS hash of diagnosis record
        uint    valueClaimed; // in INR
        bool    approved;
        bool    rejected;
        uint    transactionId;
    }

    struct Transactions {
        address sender;
        address receiver;
        uint    value;      // in INR
        bool    settled;
        uint    timestamp;  // block.timestamp at creation
    }

    // ─────────────────────────────────────────────
    // Modifiers
    // ─────────────────────────────────────────────
    modifier onlyPatient() {
        require(patientInfo[msg.sender].exists, "Not a registered patient");
        _;
    }

    modifier onlyDoctor() {
        require(doctorInfo[msg.sender].exists, "Not a registered doctor");
        _;
    }

    modifier onlyInsurer() {
        require(insurerInfo[msg.sender].exists, "Not a registered insurer");
        _;
    }

    modifier hasAccessTo(address _patient) {
        require(doctorPatientAccess[msg.sender][_patient], "No access to this patient");
        _;
    }

    // ─────────────────────────────────────────────
    // Initialization (UUPS Proxy)
    // ─────────────────────────────────────────────
    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    function initialize() public initializer {
        __Ownable_init(msg.sender);

        name = "MediChain";
        claimsCount = 0;
        transactionCount = 0;
    }

    function _authorizeUpgrade(address newImplementation) internal override onlyOwner {}

    // ─────────────────────────────────────────────
    // Registration
    // ─────────────────────────────────────────────

    /**
     * @notice Register as Patient (1), Doctor (2), or Insurer (3).
     * @dev One wallet can only ever hold one role. Email must be unique globally.
     */
    function register(
        string memory _name,
        uint _age,
        uint _designation,
        string memory _email,
        string memory _hash
    ) external {
        require(bytes(_name).length  > 0,          "Name required");
        require(bytes(_email).length > 0,           "Email required");
        require(emailToAddress[_email] == address(0), "Email already registered");
        require(!patientInfo[msg.sender].exists,    "Already registered as patient");
        require(!doctorInfo[msg.sender].exists,     "Already registered as doctor");
        require(!insurerInfo[msg.sender].exists,    "Already registered as insurer");

        if (_designation == 1) {
            require(_age > 0,                       "Age required for patients");
            require(bytes(_hash).length > 0,        "Initial record hash required");
            Patient storage p = patientInfo[msg.sender];
            p.name   = _name;
            p.email  = _email;
            p.age    = _age;
            p.exists = true;
            p.records.push(_hash);
            patientList.push(msg.sender);
            emailToAddress[_email]    = msg.sender;
            emailToDesignation[_email] = 1;
            emit PatientRegistered(msg.sender, _name);

        } else if (_designation == 2) {
            Doctor storage d = doctorInfo[msg.sender];
            d.name   = _name;
            d.email  = _email;
            d.exists = true;
            doctorList.push(msg.sender);
            emailToAddress[_email]    = msg.sender;
            emailToDesignation[_email] = 2;
            emit DoctorRegistered(msg.sender, _name);

        } else if (_designation == 3) {
            Insurer storage i = insurerInfo[msg.sender];
            i.name   = _name;
            i.email  = _email;
            i.exists = true;
            insurerList.push(msg.sender);
            emailToAddress[_email]    = msg.sender;
            emailToDesignation[_email] = 3;
            emit InsurerRegistered(msg.sender, _name);

        } else {
            revert("Invalid designation");
        }
    }

    /**
     * @notice Returns the role (1/2/3) of an address, or 0 if unregistered.
     */
    function login(address _addr) external view returns (uint) {
        if (patientInfo[_addr].exists)  return 1;
        if (doctorInfo[_addr].exists)   return 2;
        if (insurerInfo[_addr].exists)  return 3;
        return 0;
    }

    // ─────────────────────────────────────────────
    // View Helpers
    // ─────────────────────────────────────────────
    function getPatientDoctorList(address _addr)   external view returns (address[] memory) { return patientInfo[_addr].doctorAccessList;  }
    function getDoctorPatientList(address _addr)   external view returns (address[] memory) { return doctorInfo[_addr].patientAccessList;   }
    function getInsurerPolicyList(address _addr)   external view returns (Policy[]  memory) { return insurerInfo[_addr].policies;           }
    function getInsurerPatientList(address _addr)  external view returns (address[] memory) { return insurerInfo[_addr].patients;            }
    function getInsurerClaims(address _addr)       external view returns (uint[]    memory) { return insurerInfo[_addr].claims;              }
    function getPatientTransactions(address _addr) external view returns (uint[]    memory) { return patientInfo[_addr].transactions;        }
    function getDoctorTransactions(address _addr)  external view returns (uint[]    memory) { return doctorInfo[_addr].transactions;         }
    function getInsurerTransactions(address _addr) external view returns (uint[]    memory) { return insurerInfo[_addr].transactions;        }
    function getPatientRecords(address _addr)      external view returns (string[]  memory) { return patientInfo[_addr].records;             }
    function getAllDoctorsAddress()                 external view returns (address[] memory) { return doctorList;                             }
    function getAllInsurersAddress()                external view returns (address[] memory) { return insurerList;                            }
    function getAllPolicies()                       external view returns (Policy[]  memory) { return policyList;                            }

    // ─────────────────────────────────────────────
    // Patient Actions
    // ─────────────────────────────────────────────

    /**
     * @notice Grant a doctor access to your medical records.
     * @dev Prevents duplicate grants with doctorPatientAccess mapping.
     */
    function permitAccess(string memory _email) external onlyPatient {
        require(bytes(_email).length > 0, "Email required");
        address _addr = emailToAddress[_email];
        require(_addr != address(0),                        "Doctor email not found");
        require(doctorInfo[_addr].exists,                   "Not a registered doctor");
        require(!doctorPatientAccess[_addr][msg.sender],    "Access already granted");

        doctorInfo[_addr].patientAccessList.push(msg.sender);
        patientInfo[msg.sender].doctorAccessList.push(_addr);
        doctorPatientAccess[_addr][msg.sender] = true;
        emit AccessGranted(msg.sender, _addr);
    }

    /**
     * @notice Revoke a doctor's access to your records.
     */
    function revokeAccess(address _addr) external onlyPatient {
        require(doctorInfo[_addr].exists,                  "Not a registered doctor");
        require(doctorPatientAccess[_addr][msg.sender],    "No active access to revoke");

        _removeFromList(doctorInfo[_addr].patientAccessList, msg.sender);
        _removeFromList(patientInfo[msg.sender].doctorAccessList, _addr);
        doctorPatientAccess[_addr][msg.sender] = false;
        emit AccessRevoked(msg.sender, _addr);
    }

    /**
     * @notice Purchase an insurance policy. Premiums go to insurer's withdrawal balance.
     */
    function buyPolicy(uint _id) external payable onlyPatient nonReentrant {
        require(_id < policyList.length,           "Invalid policy ID");
        require(!patientInfo[msg.sender].policyActive ||
                block.timestamp > patientInfo[msg.sender].policyExpiry,
                "Active policy exists - use renewPolicy");

        require(msg.value > 0,                     "Must send ETH premium");

        _assignPolicy(msg.sender, _id);
        pendingWithdrawals[policyList[_id].insurer] += msg.value;
        emit PolicyBought(msg.sender, _id);
    }

    /**
     * @notice Settle an out-of-pocket transaction (when not covered by insurance).
     */
    function settleTransactionsByPatient(uint _id) external payable onlyPatient nonReentrant {
        require(msg.sender == transactions[_id].sender, "Not your transaction");
        require(!transactions[_id].settled,             "Already settled");
        require(msg.value > 0,                          "Must send ETH");

        address _receiver = transactions[_id].receiver;
        require(doctorInfo[_receiver].exists, "Receiver not a doctor");

        pendingWithdrawals[_receiver]  += msg.value;
        transactions[_id].settled       = true;
        emit TransactionSettled(_id, msg.sender, _receiver);
    }

    /**
     * @notice Renew an expired or inactive insurance policy.
     */
    function renewPolicy(uint _id) external payable onlyPatient nonReentrant {
        require(_id < policyList.length,  "Invalid policy ID");
        require(
            !patientInfo[msg.sender].policyActive ||
            block.timestamp > patientInfo[msg.sender].policyExpiry,
            "Current policy is still active"
        );
        require(msg.value > 0, "Must send ETH premium");

        _assignPolicy(msg.sender, _id);
        pendingWithdrawals[policyList[_id].insurer] += msg.value;
        emit PolicyRenewed(msg.sender, _id);
    }

    // ─────────────────────────────────────────────
    // Doctor Actions
    // ─────────────────────────────────────────────

    /**
     * @notice Submit a diagnosis and create an insurance claim or out-of-pocket transaction.
     * @param paddr   Patient's wallet address
     * @param _hash   IPFS hash of the medical record
     * @param charges Consultation charges in INR
     */
    function insuranceClaimRequest(
        address paddr,
        string  memory _hash,
        uint    charges
    ) external onlyDoctor hasAccessTo(paddr) {
        require(patientInfo[paddr].exists,   "Patient not found");
        require(bytes(_hash).length > 0,     "Record hash required");
        require(charges > 0,                 "Charges must be > 0");

        // Auto-expire policy if needed
        if (patientInfo[paddr].policyActive && block.timestamp > patientInfo[paddr].policyExpiry) {
            patientInfo[paddr].policyActive = false;
        }

        patientInfo[paddr].records.push(_hash);

        if (patientInfo[paddr].policyActive && patientInfo[paddr].policy.coverValue > 0) {
            address iaddr    = patientInfo[paddr].policy.insurer;
            uint    cover    = patientInfo[paddr].policy.coverValue;

            if (cover >= charges) {
                // Fully covered — insurer pays doctor
                _createTransaction(iaddr, msg.sender, charges);
                insurerInfo[iaddr].transactions.push(transactionCount);
                patientInfo[paddr].policy.coverValue -= charges;
                if (patientInfo[paddr].policy.coverValue == 0) {
                    patientInfo[paddr].policyActive = false;
                }
                _createClaim(paddr, iaddr, charges);

            } else {
                // Partially covered — patient pays remainder, insurer pays their part
                uint patientOwes = charges - cover;
                _createTransaction(paddr, msg.sender, patientOwes);
                patientInfo[paddr].transactions.push(transactionCount);

                _createTransaction(iaddr, msg.sender, cover);
                insurerInfo[iaddr].transactions.push(transactionCount);
                _createClaim(paddr, iaddr, cover);

                patientInfo[paddr].policy.coverValue = 0;
                patientInfo[paddr].policyActive      = false;
            }
        } else {
            // No insurance — patient pays out-of-pocket
            _createTransaction(paddr, msg.sender, charges);
            patientInfo[paddr].transactions.push(transactionCount);
        }
    }

    // ─────────────────────────────────────────────
    // Insurer Actions
    // ─────────────────────────────────────────────

    /**
     * @notice Create a new insurance policy.
     */
    function createPolicy(
        string memory _name,
        uint _coverValue,
        uint _timePeriod,
        uint _premium
    ) external onlyInsurer {
        require(bytes(_name).length > 0, "Policy name required");
        require(_coverValue > 0,         "Cover value must be > 0");
        require(_premium    > 0,         "Premium must be > 0");
        require(_timePeriod > 0,         "Time period must be > 0");

        Policy memory pol = Policy(policyList.length, msg.sender, _name, _coverValue, _timePeriod, _premium);
        policyList.push(pol);
        insurerInfo[msg.sender].policies.push(pol);
        emit PolicyCreated(pol.id, msg.sender, _name);
    }

    /**
     * @notice Approve an insurance claim — funds transferred to doctor.
     */
    function approveClaimsByInsurer(uint _id) external payable onlyInsurer nonReentrant {
        require(msg.sender == claims[_id].insurer, "Not your claim");
        require(!claims[_id].approved,             "Already approved");
        require(!claims[_id].rejected,             "Already rejected");
        require(doctorInfo[claims[_id].doctor].exists, "Doctor not found");
        require(msg.value > 0,                     "Must send ETH");

        pendingWithdrawals[claims[_id].doctor] += msg.value;
        claims[_id].approved                    = true;
        transactions[claims[_id].transactionId].settled = true;
        emit ClaimApproved(_id);
    }

    /**
     * @notice Reject an insurance claim — cover value restored to patient.
     */
    function rejectClaimsByInsurer(uint _id) external onlyInsurer {
        require(msg.sender == claims[_id].insurer, "Not your claim");
        require(!claims[_id].approved,             "Already approved");
        require(!claims[_id].rejected,             "Already rejected");
        require(patientInfo[claims[_id].patient].exists, "Patient not found");

        claims[_id].rejected = true;
        transactions[claims[_id].transactionId].sender = claims[_id].patient;
        patientInfo[claims[_id].patient].transactions.push(claims[_id].transactionId);

        // Restore cover value
        Policy storage pol = patientInfo[claims[_id].patient].policy;
        pol.coverValue += claims[_id].valueClaimed;
        if (!patientInfo[claims[_id].patient].policyActive) {
            patientInfo[claims[_id].patient].policyActive = true;
        }
        emit ClaimRejected(_id);
    }

    // ─────────────────────────────────────────────
    // Withdrawal (Pull Pattern)
    // ─────────────────────────────────────────────

    /**
     * @notice Withdraw accumulated earnings to your wallet.
     * @dev Pull-over-push pattern prevents reentrancy attacks.
     */
    function withdraw() external nonReentrant {
        uint amount = pendingWithdrawals[msg.sender];
        require(amount > 0, "No funds to withdraw");
        pendingWithdrawals[msg.sender] = 0;  // Zero before transfer (CEI pattern)
        (bool success, ) = payable(msg.sender).call{value: amount}("");
        require(success, "Transfer failed");
        emit FundsWithdrawn(msg.sender, amount);
    }

    // ─────────────────────────────────────────────
    // Internal Helpers
    // ─────────────────────────────────────────────

    /// @dev Assigns policy data to a patient record.
    function _assignPolicy(address patient, uint _id) internal {
        Patient storage p  = patientInfo[patient];
        Policy  storage src = policyList[_id];
        p.policy.id         = src.id;
        p.policy.name       = src.name;
        p.policy.coverValue = src.coverValue;
        p.policy.insurer    = src.insurer;
        p.policy.timePeriod = src.timePeriod;
        p.policy.premium    = src.premium;
        p.policyActive      = true;
        p.policyExpiry      = block.timestamp + (src.timePeriod * 365 days);
        insurerInfo[src.insurer].patients.push(patient);
    }

    /// @dev Creates a new transaction record and pushes ID to doctor.
    function _createTransaction(address sender, address receiver, uint value) internal {
        transactionCount++;
        transactions[transactionCount] = Transactions(sender, receiver, value, false, block.timestamp);
        doctorInfo[receiver].transactions.push(transactionCount);
    }

    /// @dev Creates a new claim record.
    function _createClaim(address patient, address insurer, uint value) internal {
        claimsCount++;
        address doctor = msg.sender;
        claims[claimsCount] = Claims(
            doctor, patient, insurer,
            patientInfo[patient].policy.name,
            patientInfo[patient].records[patientInfo[patient].records.length - 1],
            value, false, false, transactionCount
        );
        insurerInfo[insurer].claims.push(claimsCount);
        emit ClaimRequested(claimsCount, doctor, patient);
    }

    /// @dev O(n) remove-by-swap-with-last pattern. Safe for small lists.
    function _removeFromList(address[] storage arr, address addr) internal {
        uint len = arr.length;
        for (uint i = 0; i < len; i++) {
            if (arr[i] == addr) {
                arr[i] = arr[len - 1];
                arr.pop();
                return;
            }
        }
        revert("Address not in list");
    }
}
