'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { useApp } from '@/context/AppContext';
import { PreApprovalLetter } from '@/types';
import { formatDate, formatCurrency, getDaysUntilExpiration } from '@/lib/utils';
import RichTextEditor from './RichTextEditor';
import { Mail, Upload, Link2, Loader2, CheckCircle, Copy } from 'lucide-react';

interface LetterViewProps {
  letter: PreApprovalLetter;
}

export default function LetterView({ letter }: LetterViewProps) {
  const router = useRouter();
  const { updateLetter, deleteLetter } = useApp();
  const letterRef = useRef<HTMLDivElement>(null);

  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState(letter.letterContent);
  const [isExporting, setIsExporting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [isUploadingToArive, setIsUploadingToArive] = useState(false);
  const [showEmailSuccess, setShowEmailSuccess] = useState(false);
  const [showUploadSuccess, setShowUploadSuccess] = useState(false);
  const [portalLink, setPortalLink] = useState<string | null>(null);
  const [showPortalModal, setShowPortalModal] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);

  const daysUntilExpiration = getDaysUntilExpiration(letter.loan.expirationDate);
  const isExpired = daysUntilExpiration < 0;

  const handleSave = () => {
    updateLetter({
      ...letter,
      letterContent: editedContent,
      updatedAt: new Date().toISOString(),
    });
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditedContent(letter.letterContent);
    setIsEditing(false);
  };

  const handleExportPDF = async () => {
    if (!letterRef.current) return;

    setIsExporting(true);
    try {
      const canvas = await html2canvas(letterRef.current, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'letter',
      });

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = canvas.width;
      const imgHeight = canvas.height;
      const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight);
      const imgX = (pdfWidth - imgWidth * ratio) / 2;
      const imgY = 10;

      pdf.addImage(
        imgData,
        'PNG',
        imgX,
        imgY,
        imgWidth * ratio,
        imgHeight * ratio
      );

      const filename = `PreApproval_${letter.borrower.lastName}_${new Date().toISOString().split('T')[0]}.pdf`;
      pdf.save(filename);
    } catch (error) {
      console.error('Error exporting PDF:', error);
      alert('Failed to export PDF. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  const handlePrint = () => {
    const printContent = letterRef.current?.innerHTML || '';
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Pre-Approval Letter - ${letter.borrower.firstName} ${letter.borrower.lastName}</title>
          <style>
            body { margin: 0; padding: 20px; }
            @media print {
              body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
            }
          </style>
        </head>
        <body>
          ${printContent}
        </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.focus();
      setTimeout(() => {
        printWindow.print();
        printWindow.close();
      }, 250);
    }
  };

  const handleDelete = () => {
    deleteLetter(letter.id);
    router.push('/');
  };

  const handleStatusChange = (newStatus: PreApprovalLetter['status']) => {
    updateLetter({
      ...letter,
      status: newStatus,
      updatedAt: new Date().toISOString(),
    });
  };

  // Send email to borrower
  const handleSendEmail = async () => {
    setIsSendingEmail(true);
    try {
      const response = await fetch('/api/email/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: letter.borrower.email,
          subject: `Your Pre-Approval Letter - ${formatCurrency(letter.loan.preApprovalAmount)}`,
          letterContent: letter.letterContent,
          borrowerName: `${letter.borrower.firstName} ${letter.borrower.lastName}`,
          loanOfficerName: letter.loanOfficer.name,
          loanOfficerPhone: letter.loanOfficer.phone,
          loanOfficerEmail: letter.loanOfficer.email,
        }),
      });

      if (response.ok) {
        setShowEmailSuccess(true);
        setTimeout(() => setShowEmailSuccess(false), 3000);
      } else {
        const data = await response.json();
        alert(data.error || 'Failed to send email');
      }
    } catch (_error) {
      alert('Failed to send email. Please try again.');
    } finally {
      setIsSendingEmail(false);
    }
  };

  // Upload letter to Arive
  const handleUploadToArive = async () => {
    const ariveConfig = localStorage.getItem('ariveConfig');
    if (!ariveConfig) {
      alert('Please configure Arive integration in Settings first.');
      return;
    }

    setIsUploadingToArive(true);
    try {
      const config = JSON.parse(ariveConfig);
      const response = await fetch('/api/arive/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          apiKey: config.apiKey,
          companyId: config.companyId,
          baseUrl: config.baseUrl,
          letterId: letter.id,
          borrowerEmail: letter.borrower.email,
          letterContent: letter.letterContent,
        }),
      });

      if (response.ok) {
        setShowUploadSuccess(true);
        setTimeout(() => setShowUploadSuccess(false), 3000);
      } else {
        const data = await response.json();
        alert(data.error || 'Failed to upload to Arive');
      }
    } catch (_error) {
      alert('Failed to upload to Arive. Please try again.');
    } finally {
      setIsUploadingToArive(false);
    }
  };

  // Generate borrower portal link
  const handleGeneratePortalLink = () => {
    const token = btoa(`${letter.id}-${Date.now()}`);
    const baseUrl = window.location.origin;
    const link = `${baseUrl}/portal/${token}`;
    setPortalLink(link);
    setShowPortalModal(true);
  };

  const handleCopyLink = async () => {
    if (portalLink) {
      await navigator.clipboard.writeText(portalLink);
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 2000);
    }
  };

  return (
    <div className="max-w-5xl mx-auto">
      {/* Header with Actions */}
      <div className="bg-white rounded-xl shadow-sm p-4 mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold">
              {letter.borrower.firstName} {letter.borrower.lastName}
              {letter.coBorrower && (
                <span> & {letter.coBorrower.firstName} {letter.coBorrower.lastName}</span>
              )}
            </h1>
            <div className="flex items-center gap-4 mt-1 text-sm text-slate-500">
              <span>Created: {formatDate(letter.createdAt)}</span>
              <span>|</span>
              <span>Pre-Approval: {formatCurrency(letter.loan.preApprovalAmount)}</span>
              <span>|</span>
              <span className={isExpired ? 'text-red-600 font-medium' : ''}>
                {isExpired
                  ? 'EXPIRED'
                  : `Expires in ${daysUntilExpiration} days`}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Status Badge */}
            <select
              value={letter.status}
              onChange={(e) => handleStatusChange(e.target.value as PreApprovalLetter['status'])}
              className={`px-3 py-1 rounded-full text-sm font-medium border-0 cursor-pointer ${
                letter.status === 'issued'
                  ? 'bg-green-100 text-green-700'
                  : letter.status === 'expired'
                  ? 'bg-red-100 text-red-700'
                  : letter.status === 'revoked'
                  ? 'bg-slate-100 text-slate-700'
                  : 'bg-yellow-100 text-yellow-700'
              }`}
            >
              <option value="draft">Draft</option>
              <option value="issued">Issued</option>
              <option value="expired">Expired</option>
              <option value="revoked">Revoked</option>
            </select>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 mt-4 pt-4 border-t">
          {isEditing ? (
            <>
              <button
                onClick={handleSave}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Save Changes
              </button>
              <button
                onClick={handleCancel}
                className="px-4 py-2 bg-slate-200 text-slate-700 rounded-lg hover:bg-slate-300"
              >
                Cancel
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => setIsEditing(true)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                Edit Letter
              </button>
              <button
                onClick={handleExportPDF}
                disabled={isExporting}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center gap-2 disabled:opacity-50"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                {isExporting ? 'Exporting...' : 'Export PDF'}
              </button>
              <button
                onClick={handlePrint}
                className="px-4 py-2 bg-slate-600 text-white rounded-lg hover:bg-slate-700 flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                </svg>
                Print
              </button>
              <button
                onClick={() => router.push(`/new-letter?duplicate=${letter.id}`)}
                className="px-4 py-2 bg-slate-200 text-slate-700 rounded-lg hover:bg-slate-300 flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
                Duplicate
              </button>

              {/* Quick Actions */}
              <div className="h-6 w-px bg-slate-300 mx-2" />

              <button
                onClick={handleSendEmail}
                disabled={isSendingEmail}
                className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 flex items-center gap-2 disabled:opacity-50"
              >
                {isSendingEmail ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : showEmailSuccess ? (
                  <CheckCircle className="w-4 h-4" />
                ) : (
                  <Mail className="w-4 h-4" />
                )}
                {showEmailSuccess ? 'Sent!' : 'Email'}
              </button>

              <button
                onClick={handleUploadToArive}
                disabled={isUploadingToArive}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 flex items-center gap-2 disabled:opacity-50"
              >
                {isUploadingToArive ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : showUploadSuccess ? (
                  <CheckCircle className="w-4 h-4" />
                ) : (
                  <Upload className="w-4 h-4" />
                )}
                {showUploadSuccess ? 'Uploaded!' : 'Upload'}
              </button>

              <button
                onClick={handleGeneratePortalLink}
                className="px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 flex items-center gap-2"
              >
                <Link2 className="w-4 h-4" />
                Share Link
              </button>
              <div className="flex-1" />
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                Delete
              </button>
            </>
          )}
        </div>
      </div>

      {/* Letter Content */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        {isEditing ? (
          <div className="p-6">
            <RichTextEditor value={editedContent} onChange={setEditedContent} />
          </div>
        ) : (
          <div ref={letterRef} className="bg-white">
            {/* Letter Header with Branding */}
            <div className="px-8 py-6 border-b-2 border-slate-200">
              <div className="flex items-start justify-between">
                {/* Left Side: Mortgage Company */}
                <div className="flex items-center gap-4">
                  {letter.loanOfficer.companyLogo ? (
                    <img
                      src={letter.loanOfficer.companyLogo}
                      alt={letter.loanOfficer.companyName}
                      className="h-16 w-auto object-contain"
                    />
                  ) : (
                    <div className="w-16 h-16 bg-blue-600 rounded-lg flex items-center justify-center">
                      <span className="text-white font-bold text-xl">
                        {letter.loanOfficer.companyName.charAt(0)}
                      </span>
                    </div>
                  )}
                  <div>
                    <h2 className="font-bold text-lg text-slate-800">
                      {letter.loanOfficer.companyName}
                    </h2>
                    <p className="text-sm text-slate-500">
                      NMLS# {letter.loanOfficer.companyNmls}
                    </p>
                  </div>
                </div>

                {/* Right Side: Loan Officer */}
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <p className="font-semibold text-slate-800">{letter.loanOfficer.name}</p>
                    <p className="text-sm text-slate-500">{letter.loanOfficer.title}</p>
                    <p className="text-sm text-slate-500">NMLS# {letter.loanOfficer.nmls}</p>
                    <p className="text-sm text-blue-600">{letter.loanOfficer.phone}</p>
                  </div>
                  {letter.loanOfficer.personalPhoto ? (
                    <img
                      src={letter.loanOfficer.personalPhoto}
                      alt={letter.loanOfficer.name}
                      className="w-16 h-16 rounded-full object-cover border-2 border-white shadow-md"
                    />
                  ) : (
                    <div className="w-16 h-16 bg-slate-200 rounded-full flex items-center justify-center">
                      <span className="text-slate-500 font-bold text-xl">
                        {letter.loanOfficer.name.charAt(0)}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Real Estate Agent Section (Dual Branding) */}
              {letter.realEstateAgent && (
                <div className="mt-6 pt-6 border-t border-slate-200">
                  <p className="text-xs text-slate-400 uppercase tracking-wide mb-3">In Partnership With</p>
                  <div className="flex items-start justify-between">
                    {/* Left Side: Brokerage */}
                    <div className="flex items-center gap-4">
                      {letter.realEstateAgent.brokerageLogo ? (
                        <img
                          src={letter.realEstateAgent.brokerageLogo}
                          alt={letter.realEstateAgent.brokerageName}
                          className="h-14 w-auto object-contain"
                        />
                      ) : (
                        <div className="w-14 h-14 bg-emerald-600 rounded-lg flex items-center justify-center">
                          <span className="text-white font-bold text-lg">
                            {letter.realEstateAgent.brokerageName.charAt(0)}
                          </span>
                        </div>
                      )}
                      <div>
                        <h3 className="font-semibold text-slate-700">
                          {letter.realEstateAgent.brokerageName}
                        </h3>
                        {letter.realEstateAgent.brokeragePhone && (
                          <p className="text-sm text-slate-500">{letter.realEstateAgent.brokeragePhone}</p>
                        )}
                      </div>
                    </div>

                    {/* Right Side: Agent */}
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <p className="font-semibold text-slate-700">{letter.realEstateAgent.name}</p>
                        {letter.realEstateAgent.title && (
                          <p className="text-sm text-slate-500">{letter.realEstateAgent.title}</p>
                        )}
                        {letter.realEstateAgent.licenseNumber && (
                          <p className="text-sm text-slate-500">{letter.realEstateAgent.licenseNumber}</p>
                        )}
                        <p className="text-sm text-emerald-600">{letter.realEstateAgent.phone}</p>
                      </div>
                      {letter.realEstateAgent.personalPhoto ? (
                        <img
                          src={letter.realEstateAgent.personalPhoto}
                          alt={letter.realEstateAgent.name}
                          className="w-14 h-14 rounded-full object-cover border-2 border-white shadow-md"
                        />
                      ) : (
                        <div className="w-14 h-14 bg-slate-200 rounded-full flex items-center justify-center">
                          <span className="text-slate-500 font-bold text-lg">
                            {letter.realEstateAgent.name.charAt(0)}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Letter Body */}
            <div
              className="p-8"
              dangerouslySetInnerHTML={{ __html: letter.letterContent }}
            />

            {/* Letter Footer with Contact Info */}
            <div className="px-8 py-4 bg-slate-50 border-t text-center">
              <div className="flex items-center justify-center gap-8 text-sm text-slate-600">
                <span>{letter.loanOfficer.email}</span>
                <span>{letter.loanOfficer.phone}</span>
                {letter.realEstateAgent && (
                  <>
                    <span className="w-px h-4 bg-slate-300" />
                    <span>{letter.realEstateAgent.email}</span>
                    <span>{letter.realEstateAgent.phone}</span>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Portal Link Modal */}
      {showPortalModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-lg w-full mx-4">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center">
                <Link2 className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold">Borrower Portal Link</h3>
                <p className="text-sm text-slate-500">Share this link with your borrower</p>
              </div>
            </div>

            <div className="bg-slate-50 rounded-lg p-3 mb-4 flex items-center gap-2">
              <input
                type="text"
                value={portalLink || ''}
                readOnly
                className="flex-1 bg-transparent text-sm text-slate-700 outline-none"
              />
              <button
                onClick={handleCopyLink}
                className="p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-200 rounded"
              >
                {linkCopied ? (
                  <CheckCircle className="w-5 h-5 text-green-600" />
                ) : (
                  <Copy className="w-5 h-5" />
                )}
              </button>
            </div>

            <p className="text-xs text-slate-500 mb-4">
              This link gives the borrower access to view and download their pre-approval letter.
              The link will remain active for 30 days.
            </p>

            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowPortalModal(false)}
                className="px-4 py-2 bg-slate-200 text-slate-700 rounded-lg hover:bg-slate-300"
              >
                Close
              </button>
              <button
                onClick={handleCopyLink}
                className="px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 flex items-center gap-2"
              >
                {linkCopied ? 'Copied!' : 'Copy Link'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-2">Delete Letter?</h3>
            <p className="text-slate-600 mb-6">
              Are you sure you want to delete this pre-approval letter for{' '}
              {letter.borrower.firstName} {letter.borrower.lastName}? This action cannot be undone.
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
