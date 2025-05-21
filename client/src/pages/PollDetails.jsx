import { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { pollsApi } from '../services/api';
import { initSocket, joinPoll, leavePoll, submitVote } from '../services/socket';
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

    fetchPoll();
  }, [id, userId, navigate]);

  // Set up socket connection separately
  useEffect(() => {
    let socketInstance = null;

    // Initialize socket connection
    if (token) {
      console.log('Initializing socket with token:', token ? `${token.substring(0, 10)}...` : 'No token');
      socketInstance = initSocket(token);

      if (socketInstance) {
        // Join poll room
        joinPoll(id);

        // Listen for poll updates
        socketInstance.on('poll:update', (updatedPoll) => {
          console.log('Received poll update:', updatedPoll.title);
          setPoll(updatedPoll);
        });

        // Listen for errors
        socketInstance.on('error', (error) => {
          console.error('Socket error:', error);
          setError(`Socket error: ${error.message || 'Unknown error'}`);
        });
      } else {
        console.error('Failed to initialize socket - no socket instance returned');
      }
    } else {
      console.error('Cannot initialize socket - no authentication token available');
    }

    // Cleanup
    return () => {
      if (socketInstance) {
        console.log('Cleaning up socket connection');
        leavePoll(id);
        socketInstance.off('poll:update');
        socketInstance.off('error');
      }
    };
  }, [id, token]);

  // Handle vote
  const handleVote = async (optionId) => {
    if (hasVoted) {
      console.log('User has already voted, ignoring vote request');
      return;
    }

    if (!userId) {
      console.error('Cannot vote: No user ID available');
      setError('Authentication error. Please refresh the page and try again.');
      return;
    }

    if (!token) {
      console.error('Cannot vote: No authentication token available');
      setError('Authentication error. Please refresh the page and try again.');
      return;
    }

    console.log('Authentication status:', {
      userId: userId || 'none',
      hasToken: !!token,
      tokenLength: token ? token.length : 0
    });

    setSelectedOption(optionId);

    try {
      console.log(`Submitting vote for poll ${id}, option ${optionId}, user ${userId}`);

      // Submit vote via API first
      console.log('Submitting vote via API...');
      const updatedPoll = await pollsApi.votePoll(id, optionId);
      console.log('API vote successful:', updatedPoll ? 'Poll updated' : 'No response');

      // Then submit via socket for real-time updates
      console.log('Submitting vote via socket...');
      submitVote(id, optionId);

      setHasVoted(true);
      console.log('Vote recorded successfully');
    } catch (err) {
      console.error('Error submitting vote:', err);
      console.error('Error details:', err.response?.data || 'No response data');
      setError(`Failed to submit vote: ${err.message || 'Unknown error'}`);
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
        <span style={{ display: 'flex', alignItems: 'center' }}>
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '0.25rem' }}>
            <circle cx="12" cy="12" r="10"></circle>
            <polyline points="12 6 12 12 16 14"></polyline>
          </svg>
          Created: {formatDate(poll.created_at)}
        </span>

        {poll.expires_at && (
          <span style={{ display: 'flex', alignItems: 'center' }}>
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '0.25rem' }}>
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
              <line x1="16" y1="2" x2="16" y2="6"></line>
              <line x1="8" y1="2" x2="8" y2="6"></line>
              <line x1="3" y1="10" x2="21" y2="10"></line>
            </svg>
            Expires: {formatDate(poll.expires_at)}
          </span>
        )}

        <span style={{ display: 'flex', alignItems: 'center' }}>
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '0.25rem' }}>
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
            <circle cx="9" cy="7" r="4"></circle>
            <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
            <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
          </svg>
          {poll.total_votes} votes
        </span>
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
          Your vote has been recorded. Thank you!
        </div>
      )}
    </div>
  );
};

export default PollDetails;
