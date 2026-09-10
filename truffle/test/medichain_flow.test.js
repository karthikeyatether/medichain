const MediChain = artifacts.require("MediChain");
const { assert } = require("chai");

contract("MediChain Full Lifecycle Integration Suite", (accounts) => {
    const [
        deployer,
        patientOne,
        patientTwo,
        doctorOne,
        doctorTwo,
        insurerOne,
        stranger
    ] = accounts;

    let mediChain;

    before(async () => {
        mediChain = await MediChain.deployed();
    });

    describe("1. Deployment & Protocol Initialization", () => {
        it("should deploy contract successfully with valid address", async () => {
            const address = await mediChain.address;
            assert.isOk(address);
            assert.notEqual(address, "0x0000000000000000000000000000000000000000");
        });

        it("should initialize with correct name and zero initial counters", async () => {
            const name = await mediChain.name();
            assert.equal(name, "MediChain", "Contract name must match MediChain");
            const claimsCount = await mediChain.claimsCount();
            assert.equal(claimsCount.toNumber(), 0);
            const txCount = await mediChain.transactionCount();
            assert.equal(txCount.toNumber(), 0);
        });
    });

    describe("2. Multi-Role Registration & Access Control (RBAC)", () => {
        it("should successfully register a Patient", async () => {
            const tx = await mediChain.register(
                "Alice Smith",
                28,
                1,
                "alice@test.com",
                "QmInitRecordAliceHash",
                { from: patientOne }
            );

            assert.equal(tx.logs[0].event, "PatientRegistered");
            const patient = await mediChain.patientInfo(patientOne);
            assert.isTrue(patient.exists);
            assert.equal(patient.name, "Alice Smith");
            assert.equal(patient.email, "alice@test.com");
            assert.equal(patient.age.toNumber(), 28);
            assert.isFalse(patient.policyActive);

            const role = await mediChain.login(patientOne);
            assert.equal(role.toNumber(), 1, "Role must be 1 for Patient");
        });

        it("should successfully register a Doctor", async () => {
            const tx = await mediChain.register(
                "Dr. Bob",
                45,
                2,
                "dr.bob@hospital.com",
                "",
                { from: doctorOne }
            );

            assert.equal(tx.logs[0].event, "DoctorRegistered");
            const doctor = await mediChain.doctorInfo(doctorOne);
            assert.isTrue(doctor.exists);
            assert.equal(doctor.name, "Dr. Bob");
            assert.equal(doctor.email, "dr.bob@hospital.com");

            const role = await mediChain.login(doctorOne);
            assert.equal(role.toNumber(), 2, "Role must be 2 for Doctor");
        });

        it("should successfully register an Insurer", async () => {
            const tx = await mediChain.register(
                "ShieldHealth Insurance",
                0,
                3,
                "contact@shieldhealth.com",
                "",
                { from: insurerOne }
            );

            assert.equal(tx.logs[0].event, "InsurerRegistered");
            const insurer = await mediChain.insurerInfo(insurerOne);
            assert.isTrue(insurer.exists);
            assert.equal(insurer.name, "ShieldHealth Insurance");

            const role = await mediChain.login(insurerOne);
            assert.equal(role.toNumber(), 3, "Role must be 3 for Insurer");
        });

        it("should return role 0 for unregistered addresses", async () => {
            const role = await mediChain.login(stranger);
            assert.equal(role.toNumber(), 0, "Stranger must have role 0");
        });

        it("should revert if email is already registered", async () => {
            try {
                await mediChain.register(
                    "Clone Alice",
                    30,
                    1,
                    "alice@test.com", // Duplicate
                    "QmAnotherHash",
                    { from: stranger }
                );
                assert.fail("Should have reverted on duplicate email");
            } catch (err) {
                assert.include(err.message, "Email already registered");
            }
        });

        it("should revert if a wallet tries to register a second role", async () => {
            try {
                await mediChain.register(
                    "Alice Doctor",
                    28,
                    2,
                    "alice.dr@test.com",
                    "",
                    { from: patientOne }
                );
                assert.fail("Should have reverted on duplicate wallet");
            } catch (err) {
                assert.include(err.message, "Already registered as patient");
            }
        });
    });

    describe("3. Insurance Policy Creation & Purchase", () => {
        it("should allow an Insurer to create a policy", async () => {
            const tx = await mediChain.createPolicy(
                "Platinum Comprehensive Plan",
                500000, // 500,000 INR cover
                1,      // 1 year duration
                15000,  // 15,000 INR premium
                { from: insurerOne }
            );

            assert.equal(tx.logs[0].event, "PolicyCreated");
            const policies = await mediChain.getAllPolicies();
            assert.equal(policies.length, 1);
            assert.equal(policies[0].name, "Platinum Comprehensive Plan");
            assert.equal(policies[0].coverValue.toNumber(), 500000);
        });

        it("should prevent non-insurers from creating policies", async () => {
            try {
                await mediChain.createPolicy(
                    "Fake Plan",
                    100000,
                    1,
                    5000,
                    { from: patientOne }
                );
                assert.fail("Should have reverted non-insurer policy creation");
            } catch (err) {
                assert.include(err.message, "Not a registered insurer");
            }
        });

        it("should allow Patient to purchase a policy with ETH", async () => {
            const premiumWei = web3.utils.toWei("0.05", "ether");
            const tx = await mediChain.buyPolicy(0, { from: patientOne, value: premiumWei });

            assert.equal(tx.logs[0].event, "PolicyBought");

            const patient = await mediChain.patientInfo(patientOne);
            assert.isTrue(patient.policyActive);
            assert.equal(patient.policy.coverValue.toNumber(), 500000);
            assert.isAbove(patient.policyExpiry.toNumber(), Math.floor(Date.now() / 1000));

            // Verify insurer pending withdrawals increased
            const insurerPending = await mediChain.pendingWithdrawals(insurerOne);
            assert.equal(insurerPending.toString(), premiumWei);

            // Verify insurer customers list has patient without duplicates
            const insurerPatients = await mediChain.getInsurerPatientList(insurerOne);
            assert.equal(insurerPatients.length, 1);
            assert.equal(insurerPatients[0], patientOne);
        });

        it("should prevent purchasing a second policy while current policy is active", async () => {
            try {
                await mediChain.buyPolicy(0, {
                    from: patientOne,
                    value: web3.utils.toWei("0.05", "ether")
                });
                assert.fail("Should have reverted on active policy purchase");
            } catch (err) {
                assert.include(err.message, "Active policy exists - use renewPolicy");
            }
        });
    });

    describe("4. Access Delegation (Patient -> Doctor)", () => {
        it("should allow Patient to permit Doctor access", async () => {
            const tx = await mediChain.permitAccess("dr.bob@hospital.com", { from: patientOne });
            assert.equal(tx.logs[0].event, "AccessGranted");

            const hasAccess = await mediChain.doctorPatientAccess(doctorOne, patientOne);
            assert.isTrue(hasAccess);

            const docPatientList = await mediChain.getDoctorPatientList(doctorOne);
            assert.include(docPatientList, patientOne);

            const patDoctorList = await mediChain.getPatientDoctorList(patientOne);
            assert.include(patDoctorList, doctorOne);
        });

        it("should prevent duplicate access grants to the same doctor", async () => {
            try {
                await mediChain.permitAccess("dr.bob@hospital.com", { from: patientOne });
                assert.fail("Should have reverted on duplicate access grant");
            } catch (err) {
                assert.include(err.message, "Access already granted");
            }
        });

        it("should allow Patient to revoke Doctor access", async () => {
            const tx = await mediChain.revokeAccess(doctorOne, { from: patientOne });
            assert.equal(tx.logs[0].event, "AccessRevoked");

            const hasAccess = await mediChain.doctorPatientAccess(doctorOne, patientOne);
            assert.isFalse(hasAccess);
        });

        it("should revert if revoking access that is not active", async () => {
            try {
                await mediChain.revokeAccess(doctorOne, { from: patientOne });
                assert.fail("Should have reverted revoking inactive access");
            } catch (err) {
                assert.include(err.message, "No active access to revoke");
            }
        });

        it("should re-grant access for subsequent clinical flow tests", async () => {
            await mediChain.permitAccess("dr.bob@hospital.com", { from: patientOne });
            const hasAccess = await mediChain.doctorPatientAccess(doctorOne, patientOne);
            assert.isTrue(hasAccess);
        });
    });

    describe("5. Clinical Diagnosis, Claims, & Split-Billing Lifecycle", () => {
        it("should allow authorized Doctor to submit a fully-covered claim", async () => {
            const charges = 25000; // 25,000 INR
            const tx = await mediChain.insuranceClaimRequest(
                patientOne,
                "QmDiagnosticCheckupRecord1",
                charges,
                { from: doctorOne }
            );

            assert.equal(tx.logs[0].event, "ClaimRequested");
            const claimId = tx.logs[0].args.claimId.toNumber();
            assert.equal(claimId, 1);

            // Verify patient cover deduction: 500,000 - 25,000 = 475,000
            const patient = await mediChain.patientInfo(patientOne);
            assert.equal(patient.policy.coverValue.toNumber(), 475000);
            assert.isTrue(patient.policyActive);

            const claim = await mediChain.claims(claimId);
            assert.equal(claim.doctor, doctorOne);
            assert.equal(claim.patient, patientOne);
            assert.equal(claim.valueClaimed.toNumber(), charges);
            assert.isFalse(claim.approved);
            assert.isFalse(claim.rejected);
        });

        it("should prevent unauthorized Doctor from submitting diagnoses", async () => {
            // doctorTwo is not registered or granted access
            try {
                await mediChain.insuranceClaimRequest(
                    patientOne,
                    "QmUnauthorizedRecord",
                    10000,
                    { from: doctorTwo }
                );
                assert.fail("Should have reverted unauthorized doctor");
            } catch (err) {
                assert.include(err.message, "Not a registered doctor");
            }
        });

        it("should allow Insurer to approve the claim and credit Doctor", async () => {
            const claimId = 1;
            const payoutWei = web3.utils.toWei("0.08", "ether");

            const initialDocPending = await mediChain.pendingWithdrawals(doctorOne);

            const tx = await mediChain.approveClaimsByInsurer(claimId, {
                from: insurerOne,
                value: payoutWei
            });

            assert.equal(tx.logs[0].event, "ClaimApproved");

            const claim = await mediChain.claims(claimId);
            assert.isTrue(claim.approved);

            // Check doctor pending withdrawals increased by payoutWei
            const finalDocPending = await mediChain.pendingWithdrawals(doctorOne);
            assert.equal(
                finalDocPending.sub(initialDocPending).toString(),
                payoutWei
            );
        });

        it("should handle partial coverage split-billing when charges exceed remaining cover", async () => {
            // Patient has 475,000 cover remaining.
            // Doctor submits 500,000 charges:
            // -> 475,000 goes to insurer claim
            // -> 25,000 goes to patient out-of-pocket transaction
            const charges = 500000;
            const tx = await mediChain.insuranceClaimRequest(
                patientOne,
                "QmSurgeryPartialRecord",
                charges,
                { from: doctorOne }
            );

            assert.equal(tx.logs[0].event, "ClaimRequested");
            const claimId = tx.logs[0].args.claimId.toNumber();
            assert.equal(claimId, 2);

            const patient = await mediChain.patientInfo(patientOne);
            assert.equal(patient.policy.coverValue.toNumber(), 0);
            assert.isFalse(patient.policyActive);

            const claim = await mediChain.claims(claimId);
            assert.equal(claim.valueClaimed.toNumber(), 475000);

            // Verify out-of-pocket patient transaction exists
            const patientTxs = await mediChain.getPatientTransactions(patientOne);
            assert.isAbove(patientTxs.length, 0);

            const lastPatientTxId = patientTxs[patientTxs.length - 1];
            const patientTx = await mediChain.transactions(lastPatientTxId);
            assert.equal(patientTx.sender, patientOne);
            assert.equal(patientTx.receiver, doctorOne);
            assert.equal(patientTx.value.toNumber(), 25000); // 500k - 475k
            assert.isFalse(patientTx.settled);
        });

        it("should allow Insurer to reject claim and restore policy cover", async () => {
            const claimId = 2; // 475,000 INR
            const tx = await mediChain.rejectClaimsByInsurer(claimId, { from: insurerOne });
            assert.equal(tx.logs[0].event, "ClaimRejected");

            const claim = await mediChain.claims(claimId);
            assert.isTrue(claim.rejected);

            // Verify cover restored to patient
            const patient = await mediChain.patientInfo(patientOne);
            assert.equal(patient.policy.coverValue.toNumber(), 475000);
            assert.isTrue(patient.policyActive);
        });

        it("should allow Patient to settle out-of-pocket transaction via ETH", async () => {
            const patientTxs = await mediChain.getPatientTransactions(patientOne);
            const outOfPocketTxId = patientTxs[0];

            const initialDocPending = await mediChain.pendingWithdrawals(doctorOne);
            const settlementWei = web3.utils.toWei("0.01", "ether");

            const tx = await mediChain.settleTransactionsByPatient(outOfPocketTxId, {
                from: patientOne,
                value: settlementWei
            });

            assert.equal(tx.logs[0].event, "TransactionSettled");

            const settledTx = await mediChain.transactions(outOfPocketTxId);
            assert.isTrue(settledTx.settled);

            const finalDocPending = await mediChain.pendingWithdrawals(doctorOne);
            assert.equal(
                finalDocPending.sub(initialDocPending).toString(),
                settlementWei
            );
        });
    });

    describe("6. Pull-Payment Withdrawals (CEI Security Pattern)", () => {
        it("should allow Doctor to withdraw all accumulated earnings", async () => {
            const pendingBefore = await mediChain.pendingWithdrawals(doctorOne);
            assert.isTrue(pendingBefore.gt(web3.utils.toBN(0)));

            const balanceBefore = web3.utils.toBN(await web3.eth.getBalance(doctorOne));
            const tx = await mediChain.withdraw({ from: doctorOne });
            assert.equal(tx.logs[0].event, "FundsWithdrawn");

            const pendingAfter = await mediChain.pendingWithdrawals(doctorOne);
            assert.equal(pendingAfter.toNumber(), 0);

            const balanceAfter = web3.utils.toBN(await web3.eth.getBalance(doctorOne));
            assert.isTrue(balanceAfter.gt(balanceBefore.sub(web3.utils.toBN(web3.utils.toWei("0.01", "ether")))));
        });

        it("should revert if a user with zero balance calls withdraw", async () => {
            try {
                await mediChain.withdraw({ from: doctorOne });
                assert.fail("Should have reverted on empty withdrawal");
            } catch (err) {
                assert.include(err.message, "No funds to withdraw");
            }
        });

        it("should allow Insurer to withdraw accumulated premium funds", async () => {
            const pendingBefore = await mediChain.pendingWithdrawals(insurerOne);
            assert.isTrue(pendingBefore.gt(web3.utils.toBN(0)));

            const tx = await mediChain.withdraw({ from: insurerOne });
            assert.equal(tx.logs[0].event, "FundsWithdrawn");

            const pendingAfter = await mediChain.pendingWithdrawals(insurerOne);
            assert.equal(pendingAfter.toNumber(), 0);
        });
    });
});
