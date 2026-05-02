import Doctor from "./Doctor.js"
import Patient from "./Patient.js"
import Insurer from "./Insurer.js"
import { useEffect } from "react"
import { Container } from "react-bootstrap"
import { useWeb3 } from "../Web3Context"

const Dashboard = () => {
    const { token } = useWeb3();

    useEffect(() => {
        if (token === "") window.location.href = '/login'
    }, [token])

    return (
        <div className="dashboard-container">
            <Container>
                {token === "1" ? <Patient /> :
                    token === "2" ? <Doctor /> :
                        token === "3" ? <Insurer /> :
                            <div className="text-center mt-5"><div className="spinner-border text-primary" role="status"></div></div>}
            </Container>
        </div>
    )
}

export default Dashboard