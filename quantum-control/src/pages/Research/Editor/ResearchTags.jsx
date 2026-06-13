import React, { useState, useEffect } from 'react';
import { researchService } from '../../../services/researchService';
import { Tag, Plus, X, Search, Loader2 } from 'lucide-react';

export default function ResearchTags({ data, update }) {
  const [allTags, setAllTags] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [newTagName, setNewTagName] = useState('');
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    loadTags();
  }, []);

  const loadTags = async () => {
    try {
      setLoading(true);
      const tags = await researchService.getTags();
      setAllTags(tags);
    } catch (err) {
      console.error('Failed to load tags', err);
    } finally {
      setLoading(false);
    }
  };

  const selectedTags = data.tags || [];
  const selectedTagIds = selectedTags.map(t => t.id);

  const filteredTags = allTags.filter(tag => 
    tag.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
    !selectedTagIds.includes(tag.id)
  );

  const handleAddTag = (tag) => {
    const newTags = [...selectedTags, tag];
    update({ tags: newTags });
    setSearchQuery('');
  };

  const handleRemoveTag = (tagIdToRemove) => {
    const newTags = selectedTags.filter(t => t.id !== tagIdToRemove);
    update({ tags: newTags });
  };

  const handleCreateTag = async (e) => {
    e.preventDefault();
    if (!newTagName.trim()) return;

    try {
      setCreating(true);
      const newTag = await researchService.createTag(newTagName);
      setAllTags([...allTags, newTag]);
      handleAddTag(newTag);
      setNewTagName('');
    } catch (err) {
      console.error('Failed to create tag', err);
      alert('Failed to create tag. It might already exist.');
    } finally {
      setCreating(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <div>
        <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', margin: '0 0 1rem 0' }}>
          <Tag size={20} /> Research Tags
        </h3>
        <p style={{ color: 'var(--admin-placeholder)', marginBottom: '1.5rem' }}>
          Categorize your research to help visitors find related content.
        </p>
      </div>

      {/* Selected Tags */}
      <div>
        <h4 style={{ margin: '0 0 1rem 0', color: '#ccc' }}>Selected Tags</h4>
        {selectedTags.length === 0 ? (
          <p style={{ color: 'var(--admin-placeholder)' }}>No tags selected yet.</p>
        ) : (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
            {selectedTags.map(tag => (
              <span 
                key={tag.id}
                style={{ 
                  display: 'flex', alignItems: 'center', gap: '0.5rem', 
                  background: 'rgba(255,255,255,0.1)', padding: '0.25rem 0.75rem', 
                  borderRadius: '16px', fontSize: '0.9rem' 
                }}
              >
                {tag.name}
                <button 
                  onClick={() => handleRemoveTag(tag.id)}
                  style={{ 
                    background: 'none', border: 'none', color: '#ff4444', 
                    cursor: 'pointer', padding: '0', display: 'flex', alignItems: 'center' 
                  }}
                  title="Remove tag"
                >
                  <X size={14} />
                </button>
              </span>
            ))}
          </div>
        )}
      </div>

      <hr style={{ border: 'none', borderTop: '1px solid rgba(255,255,255,0.1)' }} />

      {/* Add / Search Tags */}
      <div style={{ display: 'flex', gap: '2rem', alignItems: 'flex-start' }}>
        
        {/* Existing Tags Search */}
        <div style={{ flex: 1 }}>
          <h4 style={{ margin: '0 0 1rem 0', color: '#ccc' }}>Search Existing Tags</h4>
          <div style={{ position: 'relative', marginBottom: '1rem' }}>
            <Search size={16} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--admin-placeholder)' }} />
            <input 
              type="text"
              placeholder="Search tags..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="admin-input"
              style={{ paddingLeft: '2.5rem', width: '100%' }}
            />
          </div>

          {loading ? (
            <div style={{ color: 'var(--admin-placeholder)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Loader2 size={16} className="spin" /> Loading tags...
            </div>
          ) : (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', maxHeight: '150px', overflowY: 'auto' }}>
              {filteredTags.length > 0 ? filteredTags.map(tag => (
                <button
                  key={tag.id}
                  onClick={() => handleAddTag(tag)}
                  style={{
                    background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
                    color: '#fff', padding: '0.25rem 0.75rem', borderRadius: '4px', cursor: 'pointer',
                    fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.5rem'
                  }}
                >
                  <Plus size={14} /> {tag.name}
                </button>
              )) : (
                <p style={{ color: 'var(--admin-placeholder)', fontSize: '0.9rem' }}>
                  {searchQuery ? 'No tags found matching your search.' : 'No available tags to add.'}
                </p>
              )}
            </div>
          )}
        </div>

        {/* Create New Tag */}
        <div style={{ flex: 1, background: 'rgba(255,255,255,0.02)', padding: '1.5rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
          <h4 style={{ margin: '0 0 1rem 0', color: '#ccc' }}>Create New Tag</h4>
          <form onSubmit={handleCreateTag} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <input 
              type="text"
              placeholder="e.g. Digital Twin"
              value={newTagName}
              onChange={(e) => setNewTagName(e.target.value)}
              className="admin-input"
              required
            />
            <button 
              type="submit" 
              disabled={creating || !newTagName.trim()}
              className="admin-button-primary"
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
            >
              {creating ? <Loader2 size={16} className="spin" /> : <Plus size={16} />}
              Create & Add Tag
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
