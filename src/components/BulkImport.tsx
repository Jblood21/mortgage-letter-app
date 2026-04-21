'use client';

import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import Papa from 'papaparse';
import { Upload, FileText, AlertCircle, CheckCircle, X, Download } from 'lucide-react';

interface BulkImportProps {
  onImport: (records: Record<string, string>[]) => Promise<void>;
  onClose: () => void;
}

interface ParsedRecord {
  data: Record<string, string>;
  errors: string[];
  isValid: boolean;
}

const REQUIRED_FIELDS = ['first_name', 'last_name', 'email', 'phone', 'loan_amount'];

const SAMPLE_CSV = `first_name,last_name,email,phone,loan_amount,loan_type,down_payment_percent,property_type
John,Smith,john.smith@email.com,(555) 123-4567,450000,conventional,20,single_family
Jane,Doe,jane.doe@email.com,(555) 987-6543,350000,fha,3.5,condo
Robert,Johnson,robert.j@email.com,(555) 456-7890,600000,jumbo,25,single_family`;

export default function BulkImport({ onImport, onClose }: BulkImportProps) {
  const [parsedData, setParsedData] = useState<ParsedRecord[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [importProgress, setImportProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const validateRecord = (record: Record<string, string>): string[] => {
    const errors: string[] = [];

    REQUIRED_FIELDS.forEach(field => {
      if (!record[field]?.trim()) {
        errors.push(`Missing required field: ${field}`);
      }
    });

    if (record.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(record.email)) {
      errors.push('Invalid email format');
    }

    if (record.loan_amount && isNaN(parseFloat(record.loan_amount))) {
      errors.push('Loan amount must be a number');
    }

    if (record.down_payment_percent) {
      const dp = parseFloat(record.down_payment_percent);
      if (isNaN(dp) || dp < 0 || dp > 100) {
        errors.push('Down payment percent must be between 0 and 100');
      }
    }

    return errors;
  };

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file) return;

    setError(null);

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const records: ParsedRecord[] = results.data.map((row) => {
          const data = row as Record<string, string>;
          const errors = validateRecord(data);
          return {
            data,
            errors,
            isValid: errors.length === 0,
          };
        });

        setParsedData(records);
      },
      error: (err) => {
        setError(`Failed to parse CSV: ${err.message}`);
      },
    });
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/csv': ['.csv'],
      'application/vnd.ms-excel': ['.csv'],
    },
    maxFiles: 1,
  });

  const handleImport = async () => {
    const validRecords = parsedData.filter(r => r.isValid);
    if (validRecords.length === 0) {
      setError('No valid records to import');
      return;
    }

    setIsProcessing(true);
    setImportProgress(0);

    try {
      const total = validRecords.length;
      const batchSize = 10;

      for (let i = 0; i < total; i += batchSize) {
        const batch = validRecords.slice(i, i + batchSize).map(r => r.data);
        await onImport(batch);
        setImportProgress(Math.min(100, Math.round(((i + batchSize) / total) * 100)));
      }

      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Import failed');
    } finally {
      setIsProcessing(false);
    }
  };

  const downloadSample = () => {
    const blob = new Blob([SAMPLE_CSV], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'sample_import.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const validCount = parsedData.filter(r => r.isValid).length;
  const invalidCount = parsedData.filter(r => !r.isValid).length;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        <div className="p-6 border-b flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold">Bulk Import Borrowers</h2>
            <p className="text-slate-500 text-sm mt-1">Upload a CSV file to create multiple letters at once</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 flex-1 overflow-y-auto">
          {parsedData.length === 0 ? (
            <>
              <div
                {...getRootProps()}
                className={`border-2 border-dashed rounded-xl p-12 text-center cursor-pointer transition-colors ${
                  isDragActive
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-slate-300 hover:border-slate-400'
                }`}
              >
                <input {...getInputProps()} />
                <Upload className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                <p className="text-lg font-medium text-slate-700">
                  {isDragActive ? 'Drop the file here' : 'Drag & drop a CSV file here'}
                </p>
                <p className="text-slate-500 mt-2">or click to browse</p>
              </div>

              <div className="mt-6 flex items-center justify-between">
                <div className="text-sm text-slate-500">
                  <p className="font-medium mb-2">Required fields:</p>
                  <div className="flex flex-wrap gap-2">
                    {REQUIRED_FIELDS.map(field => (
                      <span key={field} className="px-2 py-1 bg-slate-100 rounded text-xs">
                        {field}
                      </span>
                    ))}
                  </div>
                </div>
                <button
                  onClick={downloadSample}
                  className="flex items-center gap-2 text-blue-600 hover:text-blue-700 text-sm"
                >
                  <Download className="w-4 h-4" />
                  Download sample CSV
                </button>
              </div>
            </>
          ) : (
            <>
              <div className="flex items-center gap-4 mb-6">
                <div className="flex items-center gap-2 px-4 py-2 bg-green-50 text-green-700 rounded-lg">
                  <CheckCircle className="w-5 h-5" />
                  <span className="font-medium">{validCount} valid</span>
                </div>
                {invalidCount > 0 && (
                  <div className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-700 rounded-lg">
                    <AlertCircle className="w-5 h-5" />
                    <span className="font-medium">{invalidCount} invalid</span>
                  </div>
                )}
                <button
                  onClick={() => setParsedData([])}
                  className="ml-auto text-slate-500 hover:text-slate-700 text-sm"
                >
                  Upload different file
                </button>
              </div>

              <div className="border rounded-lg overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50 border-b">
                    <tr>
                      <th className="text-left py-3 px-4 font-medium">Status</th>
                      <th className="text-left py-3 px-4 font-medium">Name</th>
                      <th className="text-left py-3 px-4 font-medium">Email</th>
                      <th className="text-left py-3 px-4 font-medium">Loan Amount</th>
                      <th className="text-left py-3 px-4 font-medium">Issues</th>
                    </tr>
                  </thead>
                  <tbody>
                    {parsedData.slice(0, 20).map((record, index) => (
                      <tr key={index} className="border-b">
                        <td className="py-3 px-4">
                          {record.isValid ? (
                            <CheckCircle className="w-5 h-5 text-green-500" />
                          ) : (
                            <AlertCircle className="w-5 h-5 text-red-500" />
                          )}
                        </td>
                        <td className="py-3 px-4">
                          {record.data.first_name} {record.data.last_name}
                        </td>
                        <td className="py-3 px-4 text-slate-500">
                          {record.data.email}
                        </td>
                        <td className="py-3 px-4">
                          {record.data.loan_amount
                            ? `$${parseInt(record.data.loan_amount).toLocaleString()}`
                            : '-'}
                        </td>
                        <td className="py-3 px-4 text-red-600 text-xs">
                          {record.errors.join(', ') || '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {parsedData.length > 20 && (
                  <div className="p-3 text-center text-sm text-slate-500 bg-slate-50">
                    Showing 20 of {parsedData.length} records
                  </div>
                )}
              </div>
            </>
          )}

          {error && (
            <div className="mt-4 p-4 bg-red-50 text-red-700 rounded-lg flex items-start gap-3">
              <AlertCircle className="w-5 h-5 mt-0.5" />
              <p>{error}</p>
            </div>
          )}

          {isProcessing && (
            <div className="mt-4">
              <div className="flex items-center justify-between text-sm mb-2">
                <span>Importing records...</span>
                <span>{importProgress}%</span>
              </div>
              <div className="w-full bg-slate-200 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all"
                  style={{ width: `${importProgress}%` }}
                />
              </div>
            </div>
          )}
        </div>

        <div className="p-6 border-t flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg"
          >
            Cancel
          </button>
          <button
            onClick={handleImport}
            disabled={validCount === 0 || isProcessing}
            className={`px-6 py-2 rounded-lg font-medium flex items-center gap-2 ${
              validCount === 0 || isProcessing
                ? 'bg-slate-200 text-slate-400'
                : 'bg-blue-600 text-white hover:bg-blue-700'
            }`}
          >
            <FileText className="w-4 h-4" />
            Import {validCount} Records
          </button>
        </div>
      </div>
    </div>
  );
}
