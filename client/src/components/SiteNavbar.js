import Identicon from 'identicon.js';
import { Container, Nav, Navbar, Button } from "react-bootstrap";
import { Link, useNavigate } from 'react-router-dom';
import logo from '../assets/logo.svg'

const SiteNavbar = ({ token, account, setAccount, setToken }) => {
    const navigate = useNavigate()

    const logout = () => {
        localStorage.removeItem('token')
        localStorage.removeItem('account')
        setToken('')
        setAccount('');
        navigate('/login');
    }
    return (
        <Navbar collapseOnSelect expand="md" fixed="top" className="site-navbar">
            <Container>
                <Navbar.Brand as={Link} to="/">
                    <img className='ml-2' height="40" src={logo} alt="MediChain Logo" />
                    <span>MediChain</span>
                </Navbar.Brand>
                <Navbar.Toggle aria-controls="responsive-navbar-nav" />
                <Navbar.Collapse id="responsive-navbar-nav">
                    <Nav className="ms-auto align-items-center">
                        {token !== '' && account !== "" ?
                            <>
                                <Nav.Link as="div" className='d-flex align-items-center cursor-pointer'>
                                    <img
                                        className='rounded-circle border border-primary p-1'
                                        width='40'
                                        height='40'
                                        src={`data:image/png;base64,${new Identicon(account, 40).toString()}`}
                                        alt="profile"
                                    />
                                    <span className='ms-2 font-weight-bold text-dark'>
                                        {account.slice(0, 5) + '...' + account.slice(-4)}
                                    </span>
                                </Nav.Link>
                                <Button variant="outline-danger" size="sm" className="ms-3 rounded-pill px-4" onClick={logout}>
                                    Log Out
                                </Button>
                            </>
                            :
                            <>
                                <Nav.Link as={Link} to="/login" className="me-2">
                                    Login
                                </Nav.Link>
                                <Button as={Link} to="/register" variant="primary" className="rounded-pill px-4 btn-primary">
                                    Register
                                </Button>
                            </>
                        }
                    </Nav>
                </Navbar.Collapse>
            </Container>
        </Navbar>
    )
}

export default SiteNavbar
