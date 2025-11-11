
import React from 'react';

interface CatalystInsightsModalProps {
  isOpen: boolean;
  onClose: () => void;
  isLoading: boolean;
  insightData: string | null;
  error: string | null;
}

// Declare marked for typescript
declare const marked: any;

export const CatalystInsightsModal: React.FC<CatalystInsightsModalProps> = ({ 
  isOpen, 
  onClose, 
  isLoading, 
  insightData,
  error 
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-[100] p-4 backdrop-blur-sm">
      <div className="bg-white dark:bg-slate-800 rounded-xl w-full max-w-3xl max-h-[85vh] flex flex-col shadow-2xl border border-sky-100 dark:border-sky-900">
        
        {/* Header */}
        <div className="p-6 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center bg-gradient-to-r from-sky-50 to-white dark:from-slate-800 dark:to-slate-800 rounded-t-xl">
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-br from-indigo-500 to-purple-600 p-2 rounded-lg shadow-lg shadow-indigo-200 dark:shadow-none">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-800 dark:text-white tracking-tight">CloudScale Catalyst</h2>
              <p className="text-xs text-indigo-600 dark:text-indigo-400 font-medium uppercase tracking-wider">Intelligence Linked to CloudScale DB</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
          
          {/* Status Indicator */}
          {!isLoading && !error && (
            <div className="flex items-center gap-2 text-xs font-mono text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/30 px-3 py-1 rounded-full border border-emerald-200 dark:border-emerald-800 mb-4 w-fit">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                CloudScale DB Connection: Active
            </div>
          )}

          {isLoading ? (
            <div className="flex flex-col items-center justify-center h-64 space-y-4">
              <div className="relative">
                <div className="w-16 h-16 border-4 border-sky-100 border-t-indigo-500 rounded-full animate-spin"></div>
                <div className="absolute inset-0 flex items-center justify-center">
                   <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.384-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                  </svg>
                </div>
              </div>
              <div className="text-center">
                <p className="text-lg font-medium text-slate-700 dark:text-slate-200">Syncing with CloudScale Database...</p>
                <p className="text-sm text-slate-500 dark:text-slate-400">Catalyst is generating insights from your recent records.</p>
              </div>
            </div>
          ) : error ? (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800 rounded-lg p-4 flex items-start gap-3">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-red-500 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <div>
                <h3 className="font-bold text-red-800 dark:text-red-200">Analysis Failed</h3>
                <p className="text-red-600 dark:text-red-300 text-sm mt-1">{error}</p>
              </div>
            </div>
          ) : insightData ? (
            <div className="prose dark:prose-invert max-w-none text-slate-700 dark:text-slate-300 prose-headings:text-indigo-900 dark:prose-headings:text-indigo-100 prose-strong:text-indigo-800 dark:prose-strong:text-indigo-200">
              <div dangerouslySetInnerHTML={{ __html: marked.parse(insightData) }} />
            </div>
          ) : null}
        </div>

        {/* Footer */}
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4 p-4 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-700 rounded-b-xl">
          <div className="flex flex-col">
              <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                <div className="h-2 w-2 rounded-full bg-green-500 shadow-[0_0_5px_rgba(34,197,94,0.5)]"></div>
                Live CloudScale DB Connection
              </div>
              {!isLoading && !error && (
                <div className="text-[10px] text-slate-400 mt-1">Report Generated: {new Date().toLocaleString()}</div>
              )}
          </div>
          
          <div className="flex gap-2">
              <button className="px-4 py-2 text-xs font-medium text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-600 transition-colors">
                 Download PDF
              </button>
              <button 
                onClick={onClose}
                className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium transition-colors text-sm shadow-sm"
              >
                Close Report
              </button>
          </div>
        </div>
      </div>
    </div>
  );
};
