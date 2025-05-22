
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import './App.css';

// Components
import Navbar from './components/Navbar';
import Home from './pages/Home';
import CreatePoll from './pages/CreatePoll';
import PollDetails from './pages/PollDetails';
import NotFound from './pages/NotFound';

// Context
import { AuthProvider } from './context/AuthContext';

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="app-container">
          <Navbar />
          <main className="main-content">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/create" element={<CreatePoll />} />
              <Route path="/polls/:id" element={<PollDetails />} />
              <Route path="/404" element={<NotFound />} />
              <Route path="*" element={<Navigate to="/404" />} />
            </Routes>
          </main>
          <footer className="footer">
            <p>© {new Date().getFullYear()} Team Polls App</p>
          </footer>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
