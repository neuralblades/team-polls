import { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { pollsApi } from '../services/api';
import { initSocket, joinPoll, leavePoll, submitVote, getSocket } from '../services/socket';
import PollOption from '../components/PollOption';
import AuthContext from '../context/AuthContext';

const PollDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { token, userId } = useContext(AuthContext);
  
  const [poll, setPoll] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedOption, setSelectedOption] = useState(null);
  const [hasVoted, setHasVoted] = useState(false);
  
  // Initialize socket and fetch poll data
  useEffect(() => {
    const fetchPoll = async () => {
      try {
        const data = await pollsApi.getPoll(id);
        setPoll(data);
        setLoading(false);
        
        // Check if user has already voted
        const userVote = data.options.find(option => {
          return data.votes && data.votes.some(vote => 
            vote.user_id === userId && vote.option_id === option.id
          );
        });
        
        if (userVote) {
          setSelectedOption(userVote.id);
          setHasVoted(true);
        }
      } catch (err) {
        console.error('Error fetching poll:', err);
        if (err.response && err.response.status === 404) {
          navigate('/404');
        } else {
          setError('Failed to load poll. Please try again later.');
          setLoading(false);
        }
      }
    };
    
    // Initialize socket connection
    if (token) {
      const socket = initSocket(token);
      
      // Join poll room
      joinPoll(id);
      
      // Listen for poll updates
      socket.on('poll:update', (updatedPoll) => {
        setPoll(updatedPoll);
      });
      
      // Listen for errors
      socket.on('error', (error) => {
        console.error('Socket error:', error);
      });
    }
    
    fetchPoll();
    
    // Cleanup
    return () => {
      leavePoll(id);
      const socket = getSocket();
      if (socket) {
        socket.off('poll:update');
        socket.off('error');
      }
    };
  }, [id, token, userId, navigate]);
  
  // Handle vote
  const handleVote = async (optionId) => {
    if (hasVoted) return;
    
    setSelectedOption(optionId);
    
    try {
      // Submit vote via API
      await pollsApi.votePoll(id, optionId);
      
      // Submit vote via socket for real-time updates
      submitVote(id, optionId);
      
      setHasVoted(true);
    } catch (err) {
      console.error('Error submitting vote:', err);
      setSelectedOption(null);
    }
  };
  
  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return null;
    const options = { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };
  
  if (loading) {
    return (
      <div className="loading-container">
        <h2>Loading poll...</h2>
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
    <div className="poll-details-container">
      <h1>{poll.title}</h1>
      {poll.description && <p className="poll-description">{poll.description}</p>}
      
      <div className="poll-meta">
        <span>Created: {formatDate(poll.created_at)}</span>
        {poll.expires_at && (
          <span> • Expires: {formatDate(poll.expires_at)}</span>
        )}
        <span> • {poll.total_votes} votes</span>
      </div>
      
      <div className="poll-options">
        {poll.options.map(option => (
          <PollOption
            key={option.id}
            option={option}
            totalVotes={poll.total_votes}
            onVote={handleVote}
            selected={selectedOption === option.id}
            disabled={hasVoted && selectedOption !== option.id}
          />
        ))}
      </div>
      
      {hasVoted && (
        <div className="vote-confirmation">
          <p>Your vote has been recorded. Thank you!</p>
        </div>
      )}
    </div>
  );
};

export default PollDetails;
