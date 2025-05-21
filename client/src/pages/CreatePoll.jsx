import { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { pollsApi } from '../services/api';
import AuthContext from '../context/AuthContext';

const CreatePoll = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useContext(AuthContext);
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    options: ['', ''],
    expiresAt: ''
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  const { title, description, options, expiresAt } = formData;
  
  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };
  
  const handleOptionChange = (index, value) => {
    const newOptions = [...options];
    newOptions[index] = value;
    setFormData({
      ...formData,
      options: newOptions
    });
  };
  
  const addOption = () => {
    setFormData({
      ...formData,
      options: [...options, '']
    });
  };
  
  const removeOption = (index) => {
    if (options.length <= 2) {
      return;
    }
    
    const newOptions = options.filter((_, i) => i !== index);
    setFormData({
      ...formData,
      options: newOptions
    });
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate form
    if (!title.trim()) {
      setError('Title is required');
      return;
    }
    
    const validOptions = options.filter(option => option.trim() !== '');
    if (validOptions.length < 2) {
      setError('At least two options are required');
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      const pollData = {
        title,
        description,
        options: validOptions,
        expiresAt: expiresAt || null
      };
      
      const newPoll = await pollsApi.createPoll(pollData);
      navigate(`/polls/${newPoll.id}`);
    } catch (err) {
      console.error('Error creating poll:', err);
      setError('Failed to create poll. Please try again.');
      setLoading(false);
    }
  };
  
  return (
    <div className="create-poll-container">
      <h1>Create New Poll</h1>
      
      {error && (
        <div className="alert alert-danger">
          {error}
        </div>
      )}
      
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="title" className="form-label">Poll Question</label>
          <input
            type="text"
            id="title"
            name="title"
            value={title}
            onChange={handleChange}
            className="form-control"
            placeholder="What would you like to ask?"
            required
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="description" className="form-label">Description (Optional)</label>
          <textarea
            id="description"
            name="description"
            value={description}
            onChange={handleChange}
            className="form-control"
            placeholder="Add more details about your poll"
            rows="3"
          />
        </div>
        
        <div className="form-group">
          <label className="form-label">Options</label>
          {options.map((option, index) => (
            <div key={index} className="option-input">
              <input
                type="text"
                value={option}
                onChange={(e) => handleOptionChange(index, e.target.value)}
                className="form-control"
                placeholder={`Option ${index + 1}`}
                required
              />
              {options.length > 2 && (
                <button
                  type="button"
                  onClick={() => removeOption(index)}
                  className="btn btn-danger"
                >
                  Remove
                </button>
              )}
            </div>
          ))}
          
          <button
            type="button"
            onClick={addOption}
            className="btn btn-secondary"
          >
            Add Option
          </button>
        </div>
        
        <div className="form-group">
          <label htmlFor="expiresAt" className="form-label">Expiration (Optional)</label>
          <input
            type="datetime-local"
            id="expiresAt"
            name="expiresAt"
            value={expiresAt}
            onChange={handleChange}
            className="form-control"
          />
        </div>
        
        <button
          type="submit"
          className="btn btn-primary"
          disabled={loading}
        >
          {loading ? 'Creating...' : 'Create Poll'}
        </button>
      </form>
    </div>
  );
};

export default CreatePoll;
