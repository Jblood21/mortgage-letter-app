'use client';

import { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { LetterTemplate, LoanInfo, TEMPLATE_VARIABLES } from '@/types';
import { generateId } from '@/lib/utils';
import RichTextEditor from './RichTextEditor';

export default function TemplateManager() {
  const { state, addTemplate, updateTemplate, deleteTemplate } = useApp();
  const { templates } = state;

  const [selectedTemplate, setSelectedTemplate] = useState<LetterTemplate | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [showVariables, setShowVariables] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Form state
  const [formData, setFormData] = useState<Partial<LetterTemplate>>({
    name: '',
    description: '',
    loanType: 'all',
    content: '',
  });

  const handleCreateNew = () => {
    setFormData({
      name: '',
      description: '',
      loanType: 'all',
      content: '<div style="font-family: Arial, sans-serif; padding: 40px;">Start creating your template here...</div>',
    });
    setSelectedTemplate(null);
    setIsCreating(true);
    setIsEditing(true);
  };

  const handleSelectTemplate = (template: LetterTemplate) => {
    setSelectedTemplate(template);
    setFormData({
      name: template.name,
      description: template.description,
      loanType: template.loanType,
      content: template.content,
    });
    setIsCreating(false);
    setIsEditing(false);
  };

  const handleSave = () => {
    if (!formData.name || !formData.content) return;

    const template: LetterTemplate = {
      id: isCreating ? generateId() : selectedTemplate!.id,
      name: formData.name!,
      description: formData.description,
      loanType: formData.loanType as LoanInfo['loanType'] | 'all',
      content: formData.content!,
      variables: [],
      isDefault: isCreating ? false : selectedTemplate!.isDefault,
      createdAt: isCreating ? new Date().toISOString() : selectedTemplate!.createdAt,
      updatedAt: new Date().toISOString(),
    };

    if (isCreating) {
      addTemplate(template);
    } else {
      updateTemplate(template);
    }

    setSelectedTemplate(template);
    setIsEditing(false);
    setIsCreating(false);
  };

  const handleDelete = () => {
    if (selectedTemplate) {
      deleteTemplate(selectedTemplate.id);
      setSelectedTemplate(null);
      setShowDeleteConfirm(false);
    }
  };

  const insertVariable = (variable: string) => {
    // This would ideally insert at cursor position, but for simplicity we append
    setFormData({
      ...formData,
      content: formData.content + variable,
    });
  };

  return (
    <div className="flex gap-6 h-[calc(100vh-140px)]">
      {/* Template List */}
      <div className="w-80 bg-white rounded-xl shadow-sm overflow-hidden flex flex-col">
        <div className="p-4 border-b">
          <h2 className="font-semibold mb-3">Templates</h2>
          <button
            onClick={handleCreateNew}
            className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center justify-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            New Template
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          {templates.map((template) => (
            <div
              key={template.id}
              onClick={() => handleSelectTemplate(template)}
              className={`p-4 border-b cursor-pointer transition-colors ${
                selectedTemplate?.id === template.id
                  ? 'bg-blue-50 border-l-4 border-l-blue-600'
                  : 'hover:bg-slate-50'
              }`}
            >
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-medium">{template.name}</h3>
                  <p className="text-sm text-slate-500 mt-1">{template.description}</p>
                </div>
                {template.isDefault && (
                  <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded">
                    Default
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2 mt-2">
                <span className="text-xs bg-slate-100 px-2 py-0.5 rounded">
                  {template.loanType === 'all' ? 'All Types' : template.loanType.toUpperCase()}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Template Editor */}
      <div className="flex-1 bg-white rounded-xl shadow-sm overflow-hidden flex flex-col">
        {selectedTemplate || isCreating ? (
          <>
            <div className="p-4 border-b flex items-center justify-between">
              <div className="flex-1">
                {isEditing ? (
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="text-xl font-semibold w-full px-2 py-1 border border-slate-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Template Name"
                  />
                ) : (
                  <h2 className="text-xl font-semibold">{selectedTemplate?.name}</h2>
                )}
              </div>

              <div className="flex items-center gap-2 ml-4">
                {isEditing ? (
                  <>
                    <button
                      onClick={handleSave}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                    >
                      Save
                    </button>
                    <button
                      onClick={() => {
                        setIsEditing(false);
                        setIsCreating(false);
                        if (selectedTemplate) {
                          setFormData({
                            name: selectedTemplate.name,
                            description: selectedTemplate.description,
                            loanType: selectedTemplate.loanType,
                            content: selectedTemplate.content,
                          });
                        }
                      }}
                      className="px-4 py-2 bg-slate-200 text-slate-700 rounded-lg hover:bg-slate-300"
                    >
                      Cancel
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={() => setIsEditing(true)}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                      Edit
                    </button>
                    {!selectedTemplate?.isDefault && (
                      <button
                        onClick={() => setShowDeleteConfirm(true)}
                        className="px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg"
                      >
                        Delete
                      </button>
                    )}
                  </>
                )}
              </div>
            </div>

            {isEditing && (
              <div className="px-4 py-3 border-b bg-slate-50 flex items-center gap-4">
                <div>
                  <label className="text-sm font-medium text-slate-700 mr-2">Loan Type:</label>
                  <select
                    value={formData.loanType}
                    onChange={(e) => setFormData({ ...formData, loanType: e.target.value as LoanInfo['loanType'] | 'all' })}
                    className="px-3 py-1 border border-slate-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="all">All Types</option>
                    <option value="conventional">Conventional</option>
                    <option value="fha">FHA</option>
                    <option value="va">VA</option>
                    <option value="usda">USDA</option>
                    <option value="jumbo">Jumbo</option>
                  </select>
                </div>
                <div className="flex-1">
                  <input
                    type="text"
                    value={formData.description || ''}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-3 py-1 border border-slate-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Template description"
                  />
                </div>
                <button
                  onClick={() => setShowVariables(!showVariables)}
                  className={`px-3 py-1 rounded border ${
                    showVariables
                      ? 'bg-blue-100 border-blue-300 text-blue-700'
                      : 'bg-white border-slate-300 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  Variables
                </button>
              </div>
            )}

            <div className="flex-1 overflow-hidden flex">
              <div className={`flex-1 overflow-y-auto p-4 ${isEditing ? '' : 'bg-white'}`}>
                {isEditing ? (
                  <RichTextEditor
                    value={formData.content || ''}
                    onChange={(value) => setFormData({ ...formData, content: value })}
                  />
                ) : (
                  <div
                    className="prose max-w-none"
                    dangerouslySetInnerHTML={{ __html: selectedTemplate?.content || '' }}
                  />
                )}
              </div>

              {/* Variables Panel */}
              {isEditing && showVariables && (
                <div className="w-72 border-l bg-slate-50 overflow-y-auto p-4">
                  <h3 className="font-medium mb-3">Available Variables</h3>
                  <p className="text-xs text-slate-500 mb-4">
                    Click to insert a variable into your template.
                  </p>

                  {['borrower', 'property', 'loan', 'loanOfficer', 'dates'].map((category) => (
                    <div key={category} className="mb-4">
                      <h4 className="text-sm font-medium text-slate-700 mb-2 capitalize">
                        {category === 'loanOfficer' ? 'Loan Officer' : category}
                      </h4>
                      <div className="space-y-1">
                        {TEMPLATE_VARIABLES.filter((v) => v.category === category).map((variable) => (
                          <button
                            key={variable.key}
                            onClick={() => insertVariable(variable.key)}
                            className="w-full text-left px-2 py-1 text-xs bg-white border border-slate-200 rounded hover:bg-blue-50 hover:border-blue-300"
                          >
                            <span className="font-mono text-blue-600">{variable.key}</span>
                            <span className="text-slate-500 ml-1">- {variable.label}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-slate-400">
            <div className="text-center">
              <svg className="w-16 h-16 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <p>Select a template to view or edit</p>
            </div>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-2">Delete Template?</h3>
            <p className="text-slate-600 mb-6">
              Are you sure you want to delete &quot;{selectedTemplate?.name}&quot;? This action cannot be undone.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="px-4 py-2 bg-slate-200 text-slate-700 rounded-lg hover:bg-slate-300"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
