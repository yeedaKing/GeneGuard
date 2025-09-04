import { Container, Row, Col } from "react-bootstrap";
import logo from "../assets/img/logo.png";
import linkedIn from '../assets/img/linkedIn.svg';
import github from '../assets/img/github.svg';
import instagram from '../assets/img/instagram.svg';

export const Footer = () => {
    return (
        <footer className="footer">
            <Container>
                <Row className="align-items-center">
                    <Col sm={6}>
                        <img src={logo} alt="Logo" />
                    </Col>
                    <Col sm={6} className="text-center text-sm-end">
                        <div className="social-icon">
                            <a href="https://www.linkedin.com/in/lisa-cho-1bb639246/"><img src={linkedIn}/></a>
                            <a href="https://github.com/chols8195"><img src={github}/></a>
                            <a href="https://www.instagram.com/lisa._.cho/?hl=en"><img src={instagram}/></a>
                        </div>
                        <p>CopyRight 2025. All Right Reserved</p>
                    </Col>
                </Row>
            </Container>
        </footer>
    )
}