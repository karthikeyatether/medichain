import Doctor from "./Doctor.js"
import Patient from "./Patient.js"
import Insurer from "./Insurer.js"
import { useEffect, useState } from "react"
import { Container } from "react-bootstrap"

const Dashboard = ({ mediChain, token, account, ipfs }) => {
    const [ethValue, setEthValue] = useState(0);

    useEffect(() => {
        fetch('https://api.coinbase.com/v2/exchange-rates?currency=ETH')
            .then(res => res.json())
            .then(res => setEthValue(res.data.rates.INR))
            .catch(err => {
                console.error("Failed to fetch ETH rate, using offline fallback", err);
                setEthValue(250000); // Default to 250,000 INR
            });

        if (token === "") window.location.href = '/login'
    }, [token])

    return (
        <div className="dashboard-container">
            <Container>
                {token === "1" ? <Patient ipfs={ipfs} ethValue={ethValue} mediChain={mediChain} account={account} /> :
                    token === "2" ? <Doctor ipfs={ipfs} mediChain={mediChain} account={account} ethValue={ethValue} /> :
                        token === "3" ? <Insurer ipfs={ipfs} ethValue={ethValue} mediChain={mediChain} account={account} /> :
                            <div className="text-center mt-5"><div className="spinner-border text-primary" role="status"></div></div>}
            </Container>
        </div>
    )
}

export default Dashboard