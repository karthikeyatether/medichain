const MediChain = artifacts.require("MediChain");

module.exports = async function (callback) {
    try {
        const mediChain = await MediChain.deployed();
        const accounts = await web3.eth.getAccounts();

        console.log("🌱 Seeding blockchain with test data...");

        // Patient (Account 0) - role 1
        console.log(`💉 Registering Patient: karthikeya@gmail.com (Address: ${accounts[0]})`);
        await mediChain.register("Karthikeya", 30, 1, "karthikeya@gmail.com", "QmMockInitial123", { from: accounts[0] });

        // Doctor (Account 1) - role 2
        console.log(`🩺 Registering Doctor: shivdoc@gmail.com (Address: ${accounts[1]})`);
        await mediChain.register("Dr. Shiv", 45, 2, "shivdoc@gmail.com", "", { from: accounts[1] });

        // Insurer (Account 2) - role 3
        console.log(`🏢 Registering Insurer: irc@gmail.com (Address: ${accounts[2]})`);
        await mediChain.register("IRC Insurance", 0, 3, "irc@gmail.com", "", { from: accounts[2] });

        // Create a default policy for the Insurer so the Patient can buy it immediately
        console.log(`📝 Creating a default Health Policy for Insurer...`);
        // Arguments: name, coverValue, timePeriod, premium
        // Using 500000 INR cover, 1 year duration, 13000 INR premium
        await mediChain.createPolicy("Student Health Plan", 500000, 1, 13000, { from: accounts[2] });

        console.log("✅ Seeding complete! You can now log straight in.");
        callback();
    } catch (error) {
        console.error("❌ Error seeding data:", error);
        callback(error);
    }
};
