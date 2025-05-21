import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { pollsApi } from '../services/api';
import PollCard from '../components/PollCard';

const Home = () => {
  const [polls, setPolls] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  useEffect(() => {
    const fetchPolls = async () => {
      try {
        const data = await pollsApi.getPolls();
        setPolls(data);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching polls:', err);
        setError('Failed to load polls. Please try again later.');
        setLoading(false);
      }
    };
    
    fetchPolls();
  }, []);
  
  if (loading) {
    return (
      <div className="loading-container">
        <h2>Loading polls...</h2>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="error-container">
        <h2>Error</h2>
        <p>{error}</p>
        <button 
          className="btn btn-primary" 
          onClick={() => window.location.reload()}
        >
          Try Again
        </button>
      </div>
    );
  }
  
  return (
    <div className="home-container">
      <div className="home-header">
        <h1>Team Polls</h1>
        <p>Create and vote on polls in real-time</p>
        <Link to="/create" className="btn btn-primary">
          Create New Poll
        </Link>
      </div>
      
      <div className="polls-container">
        <h2>Recent Polls</h2>
        {polls.length === 0 ? (
          <div className="no-polls">
            <p>No polls available. Create your first poll!</p>
          </div>
        ) : (
          polls.map(poll => (
            <PollCard key={poll.id} poll={poll} />
          ))
        )}
      </div>
    </div>
  );
};

export default Home;
