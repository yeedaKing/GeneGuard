import './App.css';
import 'bootstrap/dist/css/bootstrap.min.css';
import { NavBar } from './components/NavBar';
import { Banner } from './components/Banner';
import { Skills } from './components/Skills';
import { Projects } from './components/Projects';
import { Contact } from './components/Contact';
import { Footer } from './components/Footer';
import { Resume } from './components/Resume';

import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useEffect } from 'react';

const NAV_H = 105;

function SectionScrollPage() {
  const { pathname } = useLocation();

  useEffect(() => {
    const id = pathname === '/' ? 'home' : pathname.slice(1); 
    const el = document.getElementById(id);
    if (el) {
      const y = el.getBoundingClientRect().top + window.pageYOffset - NAV_H;
      window.scrollTo({ top: y, behavior: 'smooth' });
    }
  }, [pathname]);

  return (
    <>
      <NavBar />
      <Banner />
      <Resume />
      <Skills />
      <Projects />
      <Contact />
      <Footer />
    </>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<SectionScrollPage />} />
        <Route path="/resume" element={<SectionScrollPage />} />
        <Route path="/skills" element={<SectionScrollPage />} />
        <Route path="/project" element={<SectionScrollPage />} />
        <Route path="/connect" element={<SectionScrollPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
