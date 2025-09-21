import { Navbar, Container, Nav, Offcanvas } from "react-bootstrap";
import { useState, useContext } from "react";
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { useAnalysis } from '../context/AnalysisContext';
import logo from '../assets/img/logo.png';

export const NavBar = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const { user, logout } = useContext(AuthContext);
    const { hasResults, getSummaryData } = useAnalysis();
    const [showMenu, setShowMenu] = useState(false);

    const getActiveLink = (path) => {
        return location.pathname === path ? 'active navbar-link' : 'navbar-link';
    };

    const handleLogout = () => {
        logout();
        setShowMenu(false);
    };

    // Handle hash navigation
    const handleHashClick = (hash) => {
        if (location.pathname !== '/') {
            navigate('/');
            setTimeout(() => {
                const element = document.querySelector(hash);
                if (element) {
                    element.scrollIntoView({ behavior: 'smooth' });
                }
            }, 100);
        } else {
            const element = document.querySelector(hash);
            if (element) {
                element.scrollIntoView({ behavior: 'smooth' });
            }
        }
        setShowMenu(false);
    };

    const handleLogoClick = (e) => {
        e.preventDefault();
        if (location.pathname !== '/') {
            navigate('/');
        } else {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    };

    const summaryData = getSummaryData();

    return (
        <Navbar expand="lg" className="fixed-top">
            <Container>
                <Navbar.Toggle className="d-lg-none" onClick={() => setShowMenu(true)}>
                    <span className="navbar-toggler-icon"></span>
                </Navbar.Toggle>
                
                <Navbar.Brand onClick={handleLogoClick} as={Link} to="/">
                    <img src={logo} alt="Logo" className="logo-graphic"/>
                </Navbar.Brand>

                <Nav className="nav-links d-none d-lg-flex">
                    <Nav.Link as={Link} to="/" className={getActiveLink('/')}>
                        Home
                    </Nav.Link>
                    
                    <Nav.Link 
                        className="navbar-link" 
                        onClick={() => handleHashClick('#about')}
                        style={{ cursor: 'pointer' }}
                    >
                        About
                    </Nav.Link>
                    <Nav.Link 
                        className="navbar-link"
                        onClick={() => handleHashClick('#features')}
                        style={{ cursor: 'pointer' }}
                    >
                        How It Works
                    </Nav.Link>
                    <Nav.Link 
                        className="navbar-link"
                        onClick={() => handleHashClick('#pricing')}
                        style={{ cursor: 'pointer' }}
                    >
                        Pricing
                    </Nav.Link>
                    
                    {user && (
                        <>
                            <Nav.Link as={Link} to="/analysis" className={getActiveLink('/analysis')}>
                                Analysis
                            </Nav.Link>
                            <Nav.Link 
                                as={Link} 
                                to="/summary" 
                                className={getActiveLink('/summary')}
                                style={{ 
                                    display: 'flex', 
                                    alignItems: 'center', 
                                    gap: '6px' 
                                }}
                            >
                                Summary
                            </Nav.Link>                            
                            <Nav.Link 
                                as={Link} 
                                to="/results" 
                                className={getActiveLink('/results')}
                                style={{ 
                                    display: 'flex', 
                                    alignItems: 'center', 
                                    gap: '6px' 
                                }}
                            >
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
                            
                            <Nav.Link 
                                className="navbar-link" 
                                onClick={() => handleHashClick('#about')}
                                style={{ cursor: 'pointer' }}
                            >
                                About
                            </Nav.Link>
                            <Nav.Link 
                                className="navbar-link"
                                onClick={() => handleHashClick('#features')}
                                style={{ cursor: 'pointer' }}
                            >
                                How It Works
                            </Nav.Link>
                            <Nav.Link 
                                className="navbar-link"
                                onClick={() => handleHashClick('#pricing')}
                                style={{ cursor: 'pointer' }}
                            >
                                Pricing
                            </Nav.Link>
                            
                            {user && (
                                <>
                                    <Nav.Link as={Link} to="/analysis" className={getActiveLink('/analysis')} onClick={() => setShowMenu(false)}>
                                        Analysis
                                    </Nav.Link>
                                    <Nav.Link as={Link} to="/summary" className={getActiveLink('/summary')} onClick={() => setShowMenu(false)}>
                                        Summary
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