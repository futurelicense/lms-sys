import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Award, CheckCircle, AlertCircle } from 'lucide-react';
import Button from '../../../components/common/Button';
import Input from '../../../components/common/Input';
import TextArea from '../../../components/common/TextArea';
import Alert from '../../../components/feedback/Alert';
import rubricService from '../services/rubricService';

export const RubricManager = () => {
  const [rubrics, setRubrics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Form state
  const [showCreate, setShowCreate] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [criteria, setCriteria] = useState([
    { criterionName: 'Code Quality & Formatting', description: 'Clean code, proper naming, readability', maxPoints: 10, weight: 1.0 },
    { criterionName: 'Correctness & Edge Cases', description: 'Passes edge cases and logical requirements', maxPoints: 10, weight: 1.0 },
  ]);
  const [saving, setSaving] = useState(false);

  const fetchRubrics = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await rubricService.list();
      setRubrics(res?.content ?? []);
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to load rubrics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRubrics();
  }, []);

  const handleAddCriterion = () => {
    setCriteria([...criteria, { criterionName: '', description: '', maxPoints: 10, weight: 1.0 }]);
  };

  const handleRemoveCriterion = (idx) => {
    if (criteria.length === 1) return;
    setCriteria(criteria.filter((_, i) => i !== idx));
  };

  const handleCriterionChange = (idx, field, value) => {
    const updated = [...criteria];
    updated[idx][field] = value;
    setCriteria(updated);
  };

  const handleCreateRubric = async (e) => {
    e.preventDefault();
    if (!title.trim()) return;

    setSaving(true);
    try {
      await rubricService.create({
        title,
        description,
        criteria,
      });
      setTitle('');
      setDescription('');
      setShowCreate(false);
      fetchRubrics();
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to create rubric');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteRubric = async (id) => {
    if (!window.confirm('Delete this rubric?')) return;
    try {
      await rubricService.remove(id);
      fetchRubrics();
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to delete rubric');
    }
  };

  return (
    <div style={{ padding: '20px 0' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Award size={20} color="var(--primary-color, #4f46e5)" /> Grading Rubrics
          </h2>
          <p style={{ color: 'var(--text-secondary, #6b7280)', fontSize: '0.875rem' }}>
            Define structured criteria and point weightings for manual assessment evaluations.
          </p>
        </div>
        <Button onClick={() => setShowCreate(!showCreate)} variant={showCreate ? 'secondary' : 'primary'}>
          {showCreate ? 'Cancel' : '+ Create Rubric'}
        </Button>
      </div>

      {error && (
        <div style={{ marginBottom: 16 }}>
          <Alert tone="error">{error}</Alert>
        </div>
      )}

      {showCreate && (
        <form onSubmit={handleCreateRubric} style={{ background: 'var(--bg-card, #f9fafb)', padding: 20, borderRadius: 8, border: '1px solid var(--border-color, #e5e7eb)', marginBottom: 24 }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: 16 }}>New Rubric</h3>
          <Input label="Rubric Title" required value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Algorithmic Complexity & Style" />
          <div style={{ marginTop: 12 }}>
            <TextArea label="Description" rows={2} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Optional rubric description..." />
          </div>

          <div style={{ marginTop: 20 }}>
            <h4 style={{ fontSize: '0.9rem', fontWeight: 600, marginBottom: 12 }}>Criteria Breakdown</h4>
            {criteria.map((c, i) => (
              <div key={i} style={{ display: 'grid', gridTemplateColumns: '2fr 3fr 1fr 1fr auto', gap: 12, alignItems: 'center', marginBottom: 12, background: '#fff', padding: 12, borderRadius: 6, border: '1px solid #e5e7eb' }}>
                <Input label="Criterion Name" value={c.criterionName} onChange={(e) => handleCriterionChange(i, 'criterionName', e.target.value)} required placeholder="e.g. Readability" />
                <Input label="Description" value={c.description} onChange={(e) => handleCriterionChange(i, 'description', e.target.value)} placeholder="Evaluation guidelines" />
                <Input label="Max Points" type="number" min={1} max={100} value={c.maxPoints} onChange={(e) => handleCriterionChange(i, 'maxPoints', parseInt(e.target.value) || 10)} required />
                <Input label="Weight" type="number" step="0.1" min={0.1} max={5.0} value={c.weight} onChange={(e) => handleCriterionChange(i, 'weight', parseFloat(e.target.value) || 1.0)} required />
                <button type="button" onClick={() => handleRemoveCriterion(i)} style={{ border: 'none', background: 'transparent', color: '#ef4444', cursor: 'pointer', paddingTop: 20 }}>
                  <Trash2 size={18} />
                </button>
              </div>
            ))}
            <Button type="button" variant="secondary" onClick={handleAddCriterion} style={{ marginTop: 8 }}>
              + Add Criterion
            </Button>
          </div>

          <div style={{ marginTop: 20, display: 'flex', gap: 12 }}>
            <Button type="submit" isLoading={saving}>Save Rubric</Button>
            <Button type="button" variant="secondary" onClick={() => setShowCreate(false)}>Cancel</Button>
          </div>
        </form>
      )}

      {loading ? (
        <p style={{ color: 'var(--text-secondary, #6b7280)' }}>Loading rubrics...</p>
      ) : rubrics.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 40, background: 'var(--bg-card, #f9fafb)', borderRadius: 8, border: '1px border-dashed #e5e7eb' }}>
          <AlertCircle size={32} color="#9ca3af" style={{ marginBottom: 8 }} />
          <p style={{ fontWeight: 500 }}>No rubrics created yet</p>
          <p style={{ fontSize: '0.85rem', color: '#6b7280' }}>Create rubrics to standardize manual grading across student submissions.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 16 }}>
          {rubrics.map((r) => (
            <div key={r.id} style={{ background: '#fff', border: '1px solid var(--border-color, #e5e7eb)', borderRadius: 8, padding: 16, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <h3 style={{ fontSize: '1rem', fontWeight: 600 }}>{r.title}</h3>
                  <button type="button" onClick={() => handleDeleteRubric(r.id)} style={{ border: 'none', background: 'transparent', color: '#ef4444', cursor: 'pointer' }}>
                    <Trash2 size={16} />
                  </button>
                </div>
                {r.description && <p style={{ fontSize: '0.85rem', color: '#6b7280', marginTop: 4 }}>{r.description}</p>}
                
                <div style={{ marginTop: 12 }}>
                  <p style={{ fontSize: '0.75rem', fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase' }}>Criteria ({r.criteria?.length || 0})</p>
                  <ul style={{ listStyle: 'none', padding: 0, margin: '6px 0 0 0' }}>
                    {r.criteria?.map((c) => (
                      <li key={c.id} style={{ fontSize: '0.85rem', padding: '4px 0', borderBottom: '1px solid #f3f4f6', display: 'flex', justifyContent: 'space-between' }}>
                        <span>{c.criterionName}</span>
                        <span style={{ fontWeight: 600, color: '#4f46e5' }}>{c.maxPoints} pts (x{c.weight})</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default RubricManager;
