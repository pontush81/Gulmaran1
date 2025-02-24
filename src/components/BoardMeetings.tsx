import React from 'react';
import { supabase } from '../lib/supabase';
import type { BoardMeeting, BoardMeetingDocument } from '../types';
import { Calendar, FileText, Upload, Trash2, Download, Loader2, Plus, AlertCircle, X } from 'lucide-react';
import { cn } from '../lib/utils';

// Funktion för att skapa ett säkert filnamn
function createSafeFileName(originalName: string): string {
  return originalName
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Ta bort accenter
    .replace(/[^a-zA-Z0-9.-]/g, '_') // Ersätt otillåtna tecken med understreck
    .replace(/_{2,}/g, '_'); // Ta bort upprepade understreck
}

// Funktion för att hantera nedladdningsfel
async function downloadWithRetry(url: string, retries = 3, delay = 1000): Promise<Response> {
  let attempt = 0;
  while (attempt < retries) {
    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return response;
    } catch (error) {
      attempt++;
      if (attempt === retries) {
        throw error;
      }
      await new Promise(resolve => setTimeout(resolve, delay * attempt));
    }
  }
  throw new Error('Max retries reached');
}

// Funktion för att säkert skapa och klicka på nedladdningslänk
function triggerDownload(blob: Blob, filename: string): Promise<void> {
  return new Promise((resolve, reject) => {
    try {
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      
      // Använd setTimeout för att säkerställa att länken har lagts till i DOM
      setTimeout(() => {
        try {
          a.click();
          // Vänta lite innan cleanup för att säkerställa att nedladdningen har startat
          setTimeout(() => {
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);
            resolve();
          }, 1000);
        } catch (error) {
          reject(error);
        }
      }, 0);
    } catch (error) {
      reject(error);
    }
  });
}

export function BoardMeetings() {
  const [meetings, setMeetings] = React.useState<BoardMeeting[]>([]);
  const [isAdmin, setIsAdmin] = React.useState(false);
  const [loading, setLoading] = React.useState(true);
  const [uploading, setUploading] = React.useState<string | null>(null);
  const [downloading, setDownloading] = React.useState<string | null>(null);
  const [showAddMeeting, setShowAddMeeting] = React.useState(false);
  const [newMeeting, setNewMeeting] = React.useState({ date: '', title: '' });
  const [error, setError] = React.useState<string | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const abortControllerRef = React.useRef<AbortController | null>(null);

  React.useEffect(() => {
    checkUser();
    loadMeetings();
    return () => {
      // Avbryt pågående nedladdningar vid unmount
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  React.useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  async function checkUser() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data } = await supabase
          .from('users')
          .select('role')
          .eq('id', user.id)
          .single();
        
        setIsAdmin(data?.role === 'admin');
      }
    } catch (error) {
      console.error('Error checking user:', error);
    }
  }

  async function loadMeetings() {
    try {
      const { data: meetings, error: meetingsError } = await supabase
        .from('board_meetings')
        .select('*')
        .order('date', { ascending: false });

      if (meetingsError) throw meetingsError;

      const { data: documents, error: documentsError } = await supabase
        .from('board_meeting_documents')
        .select('*');

      if (documentsError) throw documentsError;

      const meetingsWithDocs = meetings?.map(meeting => ({
        ...meeting,
        documents: documents?.filter(doc => doc.meeting_id === meeting.id) || []
      })) || [];

      setMeetings(meetingsWithDocs);
    } catch (error: any) {
      setError('Kunde inte ladda möten: ' + error.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleAddMeeting(e: React.FormEvent) {
    e.preventDefault();
    try {
      const { error } = await supabase
        .from('board_meetings')
        .insert([newMeeting]);

      if (error) throw error;

      setShowAddMeeting(false);
      setNewMeeting({ date: '', title: '' });
      loadMeetings();
    } catch (error: any) {
      setError('Kunde inte lägga till möte: ' + error.message);
    }
  }

  async function handleFileUpload(meetingId: string, file: File) {
    setUploading(meetingId);
    setError(null);
    try {
      const safeFileName = createSafeFileName(file.name);
      const timestamp = new Date().getTime();
      const uniqueFileName = `${timestamp}_${safeFileName}`;
      const filePath = `${meetingId}/${uniqueFileName}`;

      const { error: uploadError } = await supabase.storage
        .from('board-meeting-documents')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) throw uploadError;

      const { error: dbError } = await supabase
        .from('board_meeting_documents')
        .insert([{
          meeting_id: meetingId,
          name: file.name,
          file_path: filePath
        }]);

      if (dbError) throw dbError;

      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }

      loadMeetings();
    } catch (error: any) {
      setError('Kunde inte ladda upp fil: ' + error.message);
    } finally {
      setUploading(null);
    }
  }

  async function handleDownload(document: BoardMeetingDocument) {
    if (downloading) return; // Förhindra flera samtidiga nedladdningar
    setDownloading(document.id);
    setError(null);

    // Skapa en ny AbortController för denna nedladdning
    abortControllerRef.current = new AbortController();
    
    try {
      // Skapa en signerad URL med längre giltighetstid
      const { data: { signedUrl }, error: signedUrlError } = await supabase.storage
        .from('board-meeting-documents')
        .createSignedUrl(document.file_path, 300); // 5 minuter giltighetstid

      if (signedUrlError) throw signedUrlError;
      if (!signedUrl) throw new Error('Kunde inte skapa nedladdningslänk');

      // Försök hämta filen med retry-logik
      const response = await downloadWithRetry(signedUrl);
      const blob = await response.blob();

      // Trigga nedladdningen
      await triggerDownload(blob, document.name);
    } catch (error: any) {
      console.error('Download error:', error);
      let errorMessage = 'Ett fel uppstod vid nedladdning';
      
      if (error.message.includes('404')) {
        errorMessage = 'Filen kunde inte hittas';
      } else if (error.message.includes('network')) {
        errorMessage = 'Nätverksfel vid nedladdning';
      }
      
      setError(errorMessage);
    } finally {
      setDownloading(null);
      abortControllerRef.current = null;
    }
  }

  async function handleDeleteDocument(document: BoardMeetingDocument) {
    try {
      const { error: storageError } = await supabase.storage
        .from('board-meeting-documents')
        .remove([document.file_path]);

      if (storageError) throw storageError;

      const { error: dbError } = await supabase
        .from('board_meeting_documents')
        .delete()
        .eq('id', document.id);

      if (dbError) throw dbError;

      loadMeetings();
    } catch (error: any) {
      setError('Kunde inte ta bort dokument: ' + error.message);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600 dark:text-blue-400" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="bg-red-50 dark:bg-red-900/50 border border-red-200 dark:border-red-800 rounded-lg p-4 flex items-start">
          <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 mt-0.5 mr-2 flex-shrink-0" />
          <p className="text-red-700 dark:text-red-300">{error}</p>
        </div>
      )}

      {isAdmin && (
        <div className="flex justify-end">
          <button
            onClick={() => setShowAddMeeting(true)}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="h-5 w-5 mr-2" />
            Lägg till möte
          </button>
        </div>
      )}

      {showAddMeeting && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                Lägg till nytt möte
              </h2>
              <button
                onClick={() => setShowAddMeeting(false)}
                className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleAddMeeting} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Datum
                </label>
                <input
                  type="date"
                  value={newMeeting.date}
                  onChange={(e) => setNewMeeting({ ...newMeeting, date: e.target.value })}
                  className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md text-gray-900 dark:text-gray-100"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Titel
                </label>
                <input
                  type="text"
                  value={newMeeting.title}
                  onChange={(e) => setNewMeeting({ ...newMeeting, title: e.target.value })}
                  className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md text-gray-900 dark:text-gray-100"
                  required
                />
              </div>
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddMeeting(false)}
                  className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors"
                >
                  Avbryt
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                >
                  Lägg till
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-700">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Datum
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Titel
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Dokument
              </th>
              {isAdmin && (
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Ladda upp
                </th>
              )}
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
            {meetings.map((meeting) => (
              <tr key={meeting.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <Calendar className="h-5 w-5 text-gray-400 dark:text-gray-500 mr-2" />
                    <span className="text-sm text-gray-900 dark:text-gray-100">
                      {new Date(meeting.date).toLocaleDateString('sv-SE')}
                    </span>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="text-sm text-gray-900 dark:text-gray-100">{meeting.title}</div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex flex-wrap gap-2">
                    {meeting.documents?.map((doc) => (
                      <div
                        key={doc.id}
                        className="flex items-center bg-gray-100 dark:bg-gray-700 px-3 py-1 rounded-full text-sm"
                      >
                        <FileText className="h-4 w-4 text-gray-500 dark:text-gray-400 mr-2" />
                        <span className="text-gray-700 dark:text-gray-300">{doc.name}</span>
                        <button
                          onClick={() => handleDownload(doc)}
                          disabled={downloading === doc.id}
                          className={cn(
                            "ml-2 text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300",
                            downloading === doc.id && "opacity-50 cursor-not-allowed"
                          )}
                          title="Ladda ner"
                        >
                          {downloading === doc.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Download className="h-4 w-4" />
                          )}
                        </button>
                        {isAdmin && (
                          <button
                            onClick={() => handleDeleteDocument(doc)}
                            className="ml-1 text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300"
                            title="Ta bort"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </td>
                {isAdmin && (
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <input
                      type="file"
                      ref={fileInputRef}
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          handleFileUpload(meeting.id, file);
                        }
                      }}
                    />
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploading === meeting.id}
                      className={cn(
                        "inline-flex items-center px-3 py-1.5 border rounded-md text-sm font-medium transition-colors",
                        uploading === meeting.id
                          ? "bg-gray-100 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed border-gray-300 dark:border-gray-600"
                          : "text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 border-gray-300 dark:border-gray-600"
                      )}
                    >
                      {uploading === meeting.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <>
                          <Upload className="h-4 w-4 mr-1" />
                          Ladda upp
                        </>
                      )}
                    </button>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}