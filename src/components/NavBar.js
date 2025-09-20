import { Navbar, Container, Nav, Offcanvas } from "react-bootstrap";
import { useState, useContext } from "react";
import { Link, useLocation } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import logo from '../assets/img/logo.png';

export const NavBar = () => {
    const location = useLocation();
    const { user, logout } = useContext(AuthContext);
    const [showMenu, setShowMenu] = useState(false);

    const getActiveLink = (path) => {
        return location.pathname === path ? 'active navbar-link' : 'navbar-link';
    };

    const handleLogout = () => {
        logout();
        setShowMenu(false);
    };

    return (
        <Navbar expand="lg" className="fixed-top">
            <Container>
                <Navbar.Toggle className="d-lg-none" onClick={() => setShowMenu(true)}>
                    <span className="navbar-toggler-icon"></span>
                </Navbar.Toggle>
                
                <Navbar.Brand as={Link} to="/">
                    <img src={logo} alt = "Logo" className = "logo-graphic"/>
                </Navbar.Brand>

                <Nav className="nav-links d-none d-lg-flex">
                    <Nav.Link as={Link} to="/" className={getActiveLink('/')}>
                        Home
                    </Nav.Link>
                    
                    {/* Always show informational links - scroll to sections */}
                    <Nav.Link href="#about" className="navbar-link">
                        About
                    </Nav.Link>
                    <Nav.Link href="#features" className="navbar-link">
                        How It Works
                    </Nav.Link>
                    <Nav.Link href="#pricing" className="navbar-link">
                        Pricing
                    </Nav.Link>
                    
                    {/* Only show feature links when logged in */}
                    {user && (
                        <>
                            <Nav.Link as={Link} to="/analysis" className={getActiveLink('/analysis')}>
                                Analysis
                            </Nav.Link>
                            <Nav.Link as={Link} to="/results" className={getActiveLink('/results')}>
                                Results
                            </Nav.Link>
                            <Nav.Link as={Link} to="/groups" className={getActiveLink('/groups')}>
                                Groups
                            </Nav.Link>
                        </>
                    )}
                </Nav>

                <div className="auth-buttons d-none d-lg-flex">
                    {user ? (
                        <>
                            <span style={{ color: 'var(--color-light-gray)', marginRight: '16px' }}>
                                Hi, {user.name}
                            </span>
                            <button className="btn-sign-in" onClick={handleLogout}>
                                Logout
                            </button>
                        </>
                    ) : (
                        <>
                            <Link to="/auth?mode=login" className="btn-sign-in">
                                Sign In
                            </Link>
                            <Link to="/auth?mode=register" className="btn-sign-up">
                                Sign Up
                            </Link>
                        </>
                    )}
                </div>

                <Navbar.Offcanvas 
                    show={showMenu} 
                    onHide={() => setShowMenu(false)} 
                    placement="start" 
                    className="nav-offcanvas d-lg-none"
                >
                    <Offcanvas.Header closeButton closeVariant="white" />
                    <Offcanvas.Body>
                        <Nav>
                            <Nav.Link as={Link} to="/" className={getActiveLink('/')} onClick={() => setShowMenu(false)}>
                                Home
                            </Nav.Link>
                            
                            {/* Always show informational links in mobile menu too - scroll to sections */}
                            <Nav.Link href="#about" className="navbar-link" onClick={() => setShowMenu(false)}>
                                About
                            </Nav.Link>
                            <Nav.Link href="#features" className="navbar-link" onClick={() => setShowMenu(false)}>
                                How It Works
                            </Nav.Link>
                            <Nav.Link href="#pricing" className="navbar-link" onClick={() => setShowMenu(false)}>
                                Pricing
                            </Nav.Link>
                            
                            {/* Only show feature links when logged in */}
                            {user && (
                                <>
                                    <Nav.Link as={Link} to="/analysis" className={getActiveLink('/analysis')} onClick={() => setShowMenu(false)}>
                                        Analysis
                                    </Nav.Link>
                                    <Nav.Link as={Link} to="/results" className={getActiveLink('/results')} onClick={() => setShowMenu(false)}>
                                        Results
                                    </Nav.Link>
                                    <Nav.Link as={Link} to="/groups" className={getActiveLink('/groups')} onClick={() => setShowMenu(false)}>
                                        Groups
                                    </Nav.Link>
                                </>
                            )}
                        </Nav>
                        
                        <div className="navbar-text">
                            {user ? (
                                <>
                                    <span style={{ color: 'var(--color-light-gray)', marginBottom: '12px', display: 'block' }}>
                                        Hi, {user.name}
                                    </span>
                                    <button className="btn-sign-in" onClick={handleLogout}>
                                        Logout
                                    </button>
                                </>
                            ) : (
                                <div className="auth-buttons">
                                    <Link to="/auth?mode=login" className="btn-sign-in" onClick={() => setShowMenu(false)}>
                                        Sign In
                                    </Link>
                                    <Link to="/auth?mode=register" className="btn-sign-up" onClick={() => setShowMenu(false)}>
                                        Sign Up
                                    </Link>
                                </div>
                            )}
                        </div>
                    </Offcanvas.Body>
                </Navbar.Offcanvas>
            </Container>
        </Navbar>
    );
};