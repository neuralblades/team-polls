import { Link } from 'react-router-dom';

const PollCard = ({ poll }) => {
  // Format date
  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  // Check if poll is expired
  const isExpired = poll.expires_at && new Date(poll.expires_at) < new Date();

  // Check if poll is active
  const isActive = poll.is_active && !isExpired;

  return (
    <div className="card" style={{
      borderLeft: isActive ? '4px solid var(--primary-color)' : isExpired ? '4px solid var(--danger-color)' : '4px solid var(--secondary-color)'
    }}>
      <h3 style={{
        color: isActive ? 'var(--dark-color)' : 'var(--secondary-color)',
        marginBottom: '0.75rem'
      }}>
        {poll.title}
        {!isActive && <span style={{
          fontSize: '0.8rem',
          backgroundColor: 'var(--danger-color)',
          color: 'white',
          padding: '0.2rem 0.5rem',
          borderRadius: '4px',
          marginLeft: '0.75rem',
          verticalAlign: 'middle'
        }}>Closed</span>}
      </h3>

      {poll.description && <p style={{
        color: 'var(--secondary-color)',
        marginBottom: '1rem',
        fontSize: '0.95rem'
      }}>{poll.description}</p>}

      <div className="poll-meta" style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
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
          {poll.total_votes || 0} votes
        </span>
      </div>

      <div className="poll-actions" style={{ marginTop: '1.5rem' }}>
        <Link to={`/polls/${poll.id}`} className={`btn ${isActive ? 'btn-primary' : 'btn-secondary'}`}>
          {isActive ? 'Vote Now' : 'View Results'}
        </Link>
      </div>
    </div>
  );
};

export default PollCard;