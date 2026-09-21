import React, { useState, useRef } from 'react';
import {
  Upload, FileText, CheckCircle2, AlertTriangle, X, Download,
  Layers, Code2, Check, FileCheck, ArrowRight
} from 'lucide-react';
import Button from '../../../components/common/Button';
import Badge from '../../../components/common/Badge';
import { questionBankService } from '../services/questionBankService';

/**
 * ImportQuestionsFileModal
 * 
 * Supports drag-and-drop or browsing of .json and .csv question files.
 * Provides real-time client-side validation, error reports, preview table,
 * and sample template downloads.
 */
export default function ImportQuestionsFileModal({
  isOpen,
  onClose,
  onImportSuccess,
  target = 'bank', // 'bank' or 'assessment'
  targetTitle = 'Question Bank',
}) {
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [parsing, setParsing] = useState(false);
  const [parsedData, setParsedData] = useState(null); // { questions: [], errors: [] }
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef(null);

  if (!isOpen) return null;

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileSelect = (e) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  const processFile = async (file) => {
    const ext = file.name.split('.').pop().toLowerCase();
    if (ext !== 'json' && ext !== 'csv') {
      setParsedData({
        questions: [],
        errors: [{ index: 0, title: file.name, reason: 'Unsupported file type. Please upload a .json or .csv file.' }]
      });
      setSelectedFile(file);
      return;
    }

    setSelectedFile(file);
    setParsing(true);
    try {
      const result = await questionBankService.parseImportFile(file);
      setParsedData(result);
    } catch (err) {
      setParsedData({
        questions: [],
        errors: [{ index: 0, title: file.name, reason: 'Failed to parse file: ' + err.message }]
      });
    } finally {
      setParsing(false);
    }
  };

  const handleDownloadSample = (type) => {
    if (type === 'json') {
      const sample = questionBankService.getSampleJsonTemplate();
      questionBankService.exportToJson(sample, 'sample-questions-template.json');
    } else {
      const csvStr = questionBankService.getSampleCsvTemplate();
      const blob = new Blob([csvStr], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'sample-questions-template.csv');
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }
  };

  const handleReset = () => {
    setSelectedFile(null);
    setParsedData(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleConfirmImport = async () => {
    if (!parsedData || parsedData.questions.length === 0) return;
    setIsSubmitting(true);
    try {
      await onImportSuccess(parsedData.questions);
      handleReset();
      onClose();
    } catch (err) {
      console.error('Import failed:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const validCount = parsedData?.questions?.length || 0;
  const errorCount = parsedData?.errors?.length || 0;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        background: 'rgba(0, 0, 0, 0.75)',
        backdropFilter: 'blur(6px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
      }}
    >
      <div
        style={{
          background: 'var(--lms-card, #111116)',
          border: '1px solid var(--border-color, #27272a)',
          borderRadius: 16,
          width: '100%',
          maxWidth: 900,
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7)',
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '16px 24px',
            borderBottom: '1px solid var(--border-color, #27272a)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'var(--surface-dark, #0d0d12)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: 10,
                background: 'rgba(59, 130, 246, 0.15)',
                color: '#3b82f6',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Upload size={20} />
            </div>
            <div>
              <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: 'var(--text-primary, #fff)' }}>
                Import Questions (CSV / JSON)
              </h2>
              <p style={{ margin: 0, fontSize: 13, color: 'var(--text-muted, #94a3b8)' }}>
                Target: <span style={{ color: '#38bdf8', fontWeight: 600 }}>{targetTitle}</span>
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--text-muted, #94a3b8)',
              cursor: 'pointer',
              padding: 6,
              borderRadius: 6,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Content Body */}
        <div style={{ padding: 24, overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: 20 }}>
          
          {/* Download sample templates banner */}
          <div
            style={{
              padding: '14px 18px',
              borderRadius: 12,
              background: 'rgba(59, 130, 246, 0.08)',
              border: '1px solid rgba(59, 130, 246, 0.2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: 12,
            }}
          >
            <div>
              <div style={{ fontWeight: 600, fontSize: 14, color: '#60a5fa', display: 'flex', alignItems: 'center', gap: 6 }}>
                <FileText size={16} /> Need a formatted template?
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-muted, #94a3b8)', marginTop: 2 }}>
                Download sample files with coding exercises and MCQ problems pre-configured.
              </div>
            </div>

            <div style={{ display: 'flex', gap: 10 }}>
              <button
                type="button"
                onClick={() => handleDownloadSample('csv')}
                style={{
                  padding: '6px 12px',
                  borderRadius: 6,
                  fontSize: 12,
                  fontWeight: 600,
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  color: 'var(--text-primary, #fff)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                }}
              >
                <Download size={13} /> Sample CSV
              </button>
              <button
                type="button"
                onClick={() => handleDownloadSample('json')}
                style={{
                  padding: '6px 12px',
                  borderRadius: 6,
                  fontSize: 12,
                  fontWeight: 600,
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  color: 'var(--text-primary, #fff)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                }}
              >
                <Download size={13} /> Sample JSON
              </button>
            </div>
          </div>

          {/* Upload Dropzone */}
          {!selectedFile ? (
            <div
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              style={{
                border: `2px dashed ${dragActive ? '#3b82f6' : 'var(--border-color, #334155)'}`,
                background: dragActive ? 'rgba(59, 130, 246, 0.05)' : 'var(--surface-dark, #0d0d12)',
                borderRadius: 14,
                padding: '40px 24px',
                textAlign: 'center',
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".json,.csv"
                onChange={handleFileSelect}
                style={{ display: 'none' }}
              />
              <div
                style={{
                  width: 56,
                  height: 56,
                  borderRadius: '50%',
                  background: 'rgba(59, 130, 246, 0.12)',
                  color: '#3b82f6',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 16px',
                }}
              >
                <Upload size={28} />
              </div>
              <h3 style={{ margin: '0 0 6px', fontSize: 16, fontWeight: 600, color: 'var(--text-primary, #fff)' }}>
                Drag & Drop your question file here
              </h3>
              <p style={{ margin: 0, fontSize: 13, color: 'var(--text-muted, #94a3b8)' }}>
                Supports <strong style={{ color: '#fff' }}>.CSV</strong> and <strong style={{ color: '#fff' }}>.JSON</strong> (batch array format)
              </p>
            </div>
          ) : (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '12px 18px',
                background: 'var(--surface-dark, #0d0d12)',
                border: '1px solid var(--border-color, #334155)',
                borderRadius: 10,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <FileCheck size={24} color="#10b981" />
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary, #fff)' }}>
                    {selectedFile.name}
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted, #94a3b8)' }}>
                    {(selectedFile.size / 1024).toFixed(1)} KB
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={handleReset}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#ef4444',
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Change File
              </button>
            </div>
          )}

          {/* Parsing State */}
          {parsing && (
            <div style={{ textAlign: 'center', padding: '24px 0', color: 'var(--text-muted, #94a3b8)' }}>
              Parsing and validating questions...
            </div>
          )}

          {/* Validation & Preview Summary */}
          {parsedData && !parsing && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {/* Summary Badges */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div
                  style={{
                    padding: 14,
                    borderRadius: 10,
                    background: 'rgba(16, 185, 129, 0.08)',
                    border: '1px solid rgba(16, 185, 129, 0.25)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                  }}
                >
                  <CheckCircle2 size={24} color="#10b981" />
                  <div>
                    <div style={{ fontSize: 20, fontWeight: 800, color: '#10b981' }}>{validCount}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted, #94a3b8)' }}>Valid Questions Ready to Import</div>
                  </div>
                </div>

                <div
                  style={{
                    padding: 14,
                    borderRadius: 10,
                    background: errorCount > 0 ? 'rgba(239, 68, 68, 0.08)' : 'rgba(255, 255, 255, 0.03)',
                    border: `1px solid ${errorCount > 0 ? 'rgba(239, 68, 68, 0.25)' : 'var(--border-color, #334155)'}`,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                  }}
                >
                  <AlertTriangle size={24} color={errorCount > 0 ? '#ef4444' : '#64748b'} />
                  <div>
                    <div style={{ fontSize: 20, fontWeight: 800, color: errorCount > 0 ? '#ef4444' : '#64748b' }}>
                      {errorCount}
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted, #94a3b8)' }}>Invalid / Skipped Entries</div>
                  </div>
                </div>
              </div>

              {/* Error list if any */}
              {errorCount > 0 && (
                <div
                  style={{
                    background: 'rgba(239, 68, 68, 0.05)',
                    border: '1px solid rgba(239, 68, 68, 0.2)',
                    borderRadius: 8,
                    padding: 12,
                    maxHeight: 140,
                    overflowY: 'auto',
                  }}
                >
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#ef4444', marginBottom: 6 }}>
                    Validation Errors:
                  </div>
                  {parsedData.errors.map((err, idx) => (
                    <div key={idx} style={{ fontSize: 12, color: '#f87171', marginBottom: 4 }}>
                      • <strong>Row/Index #{err.index} ({err.title}):</strong> {err.reason}
                    </div>
                  ))}
                </div>
              )}

              {/* Preview of Valid Questions */}
              {validCount > 0 && (
                <div>
                  <h4 style={{ margin: '0 0 10px', fontSize: 14, fontWeight: 600, color: 'var(--text-primary, #fff)' }}>
                    Preview Valid Questions ({validCount}):
                  </h4>
                  <div
                    style={{
                      maxHeight: 220,
                      overflowY: 'auto',
                      border: '1px solid var(--border-color, #27272a)',
                      borderRadius: 8,
                      background: 'var(--surface-dark, #0d0d12)',
                    }}
                  >
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, textAlign: 'left' }}>
                      <thead>
                        <tr style={{ borderBottom: '1px solid var(--border-color, #27272a)', background: 'rgba(255,255,255,0.03)' }}>
                          <th style={{ padding: '8px 12px', color: 'var(--text-muted, #94a3b8)' }}>Title</th>
                          <th style={{ padding: '8px 12px', color: 'var(--text-muted, #94a3b8)' }}>Type</th>
                          <th style={{ padding: '8px 12px', color: 'var(--text-muted, #94a3b8)' }}>Difficulty</th>
                          <th style={{ padding: '8px 12px', color: 'var(--text-muted, #94a3b8)' }}>Marks</th>
                        </tr>
                      </thead>
                      <tbody>
                        {parsedData.questions.map((q, idx) => (
                          <tr
                            key={idx}
                            style={{
                              borderBottom: idx < validCount - 1 ? '1px solid var(--border-color, #1e293b)' : 'none',
                            }}
                          >
                            <td style={{ padding: '8px 12px', fontWeight: 500, color: 'var(--text-primary, #fff)' }}>
                              {q.title}
                            </td>
                            <td style={{ padding: '8px 12px' }}>
                              <Badge tone={q.questionType === 'CODING' ? 'info' : 'warning'}>
                                {q.questionType}
                              </Badge>
                            </td>
                            <td style={{ padding: '8px 12px' }}>
                              <Badge
                                tone={
                                  q.difficulty === 'EASY'
                                    ? 'success'
                                    : q.difficulty === 'HARD'
                                    ? 'error'
                                    : 'warning'
                                }
                              >
                                {q.difficulty}
                              </Badge>
                            </td>
                            <td style={{ padding: '8px 12px', color: 'var(--text-primary, #fff)', fontWeight: 600 }}>
                              {q.marks} pts
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

        </div>

        {/* Footer Actions */}
        <div
          style={{
            padding: '16px 24px',
            borderTop: '1px solid var(--border-color, #27272a)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'var(--surface-dark, #0d0d12)',
          }}
        >
          <Button variant="secondary" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>

          <Button
            variant="primary"
            onClick={handleConfirmImport}
            disabled={!parsedData || validCount === 0 || isSubmitting}
            isLoading={isSubmitting}
            style={{ display: 'flex', alignItems: 'center', gap: 8 }}
          >
            <span>Import {validCount > 0 ? `(${validCount}) Questions` : ''}</span>
            <ArrowRight size={16} />
          </Button>
        </div>

      </div>
    </div>
  );
}
