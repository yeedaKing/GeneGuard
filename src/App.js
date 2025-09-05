import './App.css';
import { NavBar } from './components/NavBar';
import 'bootstrap/dist/css/bootstrap.min.css';
import { Banner } from './components/Banner';
import { Skills } from './components/Skills';
import { Projects } from './components/Projects';
import { Contact } from './components/Contact';
import { Footer } from './components/Footer';
import { Resume } from './components/Resume';
import { HashRouter } from 'react-router-dom';

function App() {
  return (
    <HashRouter>
      <NavBar />
      <Banner />
      <Resume />
      <Skills />
      <Projects />
      <Contact />
      <Footer />
    </HashRouter>
  );
}

export default App;
