import { Navbar, Container, Nav, Offcanvas } from "react-bootstrap";
import { useState, useEffect } from "react";
import logo from '../assets/img/logo.png';
import linkedIn from '../assets/img/linkedIn.svg';
import github from '../assets/img/github.svg';
import instagram from '../assets/img/instagram.svg';
import { Link } from 'react-router-dom';

export const NavBar = () => {
    const [activeLink, setActiveLink] = useState('home');
    const [scrolled, setScrolled] = useState(false);
    const [showMenu, setShowMenu] = useState(false);

    useEffect(() => {
        const onScroll = () => {
            if (window.scrollY > 50) {
                setScrolled(true);
            } else {
                setScrolled(false);
            }
        }

        window.addEventListener("scroll", onScroll);

        return () => window.removeEventListener("scroll", onScroll);
    }, [])

    const onUpdateActiveLink = (value) => {
        setActiveLink(value);
    }

    return (
        <Navbar expand="lg" className = {scrolled ? "scrolled": "top"}>
            <Container>
                <Navbar.Toggle className="d-lg-none" onClick= {() => setShowMenu(true)}>
                    <span className="navbar-toggler-icon"></span>
                </Navbar.Toggle>
                <Navbar.Brand as={Link} to="/">
                    <img src={logo} alt = "Logo" className = "logo-graphic"/>
                </Navbar.Brand>
                <Nav className="nav-links d-none d-lg-flex">
                    <Nav.Link as={Link} to="/" className={activeLink === 'home' ? 'active navbar-link' : 'navbar-link'} onClick={() => onUpdateActiveLink('home')}>Home</Nav.Link>
                    <Nav.Link as={Link} to="/resume" className={activeLink === 'resume' ? 'active navbar-link' : 'navbar-link'} onClick={() => onUpdateActiveLink('resume')}>Resume</Nav.Link>
                    <Nav.Link as={Link} to="/skills" className={activeLink === 'skills' ? 'active navbar-link' : 'navbar-link'} onClick={() => onUpdateActiveLink('skills')}>Skills</Nav.Link>
                    <Nav.Link as={Link} to="/project" className={activeLink === 'project' ? 'active navbar-link' : 'navbar-link'} onClick={() => onUpdateActiveLink('project')}>Projects</Nav.Link>                    
                </Nav>
                <div className="nav-cta d-none d-lg-flex">
                    <div className="social-icon">
                        <a href="https://www.linkedin.com/in/lisa-cho-1bb639246/"><img src={linkedIn} alt="" /></a>
                        <a href="https://github.com/chols8195"><img src={github} alt="" /></a>
                        <a href="https://www.instagram.com/lisa._.cho/?hl=en"><img src={instagram} alt="" /></a>
                    </div>     
                        <Link to='/connect'>
                            <button className="vvd"><span>Let's Connect</span></button>
                        </Link>               
                </div>

                <Navbar.Offcanvas show={showMenu} onHide={() => setShowMenu(false)} placement="start" className="nav-offcanvas d-lg-none">
                    <Offcanvas.Header closeButton closeVariant="white" />
                    <Offcanvas.Body>
                        <Nav>
                            <Nav.Link as={Link} to="/" className={activeLink === 'home' ? 'active navbar-link' : 'navbar-link'} onClick={() => { onUpdateActiveLink('home'); setShowMenu(false); }}>Home</Nav.Link>
                            <Nav.Link as={Link} to="/resume" className={activeLink === 'resume' ? 'active navbar-link' : 'navbar-link'} onClick={() => { onUpdateActiveLink('resume'); setShowMenu(false); }}>Resume</Nav.Link>
                            <Nav.Link as={Link} to="/skills" className={activeLink === 'skills' ? 'active navbar-link' : 'navbar-link'} onClick={() => { onUpdateActiveLink('skills'); setShowMenu(false); }}>Skills</Nav.Link>
                            <Nav.Link as={Link} to="/project" className={activeLink === 'project' ? 'active navbar-link' : 'navbar-link'} onClick={() => { onUpdateActiveLink('project'); setShowMenu(false); }}>Projects</Nav.Link>
                        </Nav>
                        <span className="navbar-text">
                            <div className="social-icon">
                                <a href="https://www.linkedin.com/in/lisa-cho-1bb639246/"><img src={linkedIn} alt="" /></a>
                                <a href="https://github.com/chols8195"><img src={github} alt="" /></a>
                                <a href="https://www.instagram.com/lisa._.cho/?hl=en"><img src={instagram} alt="" /></a>
                            </div>
                            <Link to='/connect' onClick={() => setShowMenu(false)}>
                                <button className="vvd"><span>Let's Connect</span></button>
                            </Link>
                        </span>
                    </Offcanvas.Body>
                </Navbar.Offcanvas>
            </Container>
        </Navbar>
    )
}