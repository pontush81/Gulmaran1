import React from 'react';
import { supabase } from '../lib/supabase';
import { ChevronRight, Edit, Save, X, Menu, ChevronDown } from 'lucide-react';
import { cn } from '../lib/utils';
import { Editor } from '../components/Editor';
import { GuestApartment } from '../components/GuestApartment';

interface Page {
  id: string;
  title: string;
  slug: string;
  content: string;
  created_at: string;
  updated_at: string;
}

export function Home() {
  const [pages, setPages] = React.useState<Page[]>([]);
  const [selectedPage, setSelectedPage] = React.useState<Page | null>(null);
  const [isEditing, setIsEditing] = React.useState(false);
  const [content, setContent] = React.useState('');
  const [isAdmin, setIsAdmin] = React.useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);
  const [saving, setSaving] = React.useState(false);
  const [activeSection, setActiveSection] = React.useState<string | null>(null);

  React.useEffect(() => {
    loadPages();
    checkUser();
  }, []);

  async function checkUser() {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data } = await supabase
        .from('users')
        .select('role')
        .eq('id', user.id)
        .single();
      
      setIsAdmin(data?.role === 'admin');
    }
  }

  async function loadPages() {
    try {
      const { data, error } = await supabase
        .from('pages')
        .select('*')
        .order('title');

      if (error) throw error;
      
      setPages(data || []);
      if (data?.length > 0) {
        setSelectedPage(data[0]);
        setContent(data[0].content || '');
      }
    } catch (error) {
      console.error('Error loading pages:', error);
    }
  }

  async function handleSave() {
    if (!selectedPage) return;
    setSaving(true);

    try {
      const { error } = await supabase
        .from('pages')
        .update({ 
          content,
          updated_at: new Date().toISOString()
        })
        .eq('id', selectedPage.id);

      if (error) throw error;
      
      setSelectedPage(prev => prev ? { ...prev, content } : null);
      setPages(prev => prev.map(page => 
        page.id === selectedPage.id 
          ? { ...page, content }
          : page
      ));
      
      setIsEditing(false);
    } catch (error) {
      console.error('Error saving content:', error);
    } finally {
      setSaving(false);
    }
  }

  const scrollToSection = (pageId: string) => {
    const element = document.getElementById(`page-${pageId}`);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
      setActiveSection(pageId);
      setIsMobileMenuOpen(false);
    }
  };

  // Observe section visibility
  React.useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const pageId = entry.target.id.replace('page-', '');
            setActiveSection(pageId);
          }
        });
      },
      {
        threshold: 0.5
      }
    );

    pages.forEach(page => {
      const element = document.getElementById(`page-${page.id}`);
      if (element) observer.observe(element);
    });

    return () => observer.disconnect();
  }, [pages]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Mobile menu button */}
      <div className="fixed top-16 right-0 left-0 z-10 bg-white dark:bg-gray-800 shadow-sm p-4 md:hidden">
        <button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="flex items-center justify-between w-full text-gray-700 dark:text-gray-300"
        >
          <span className="font-medium">
            {pages.find(p => p.id === activeSection)?.title || 'Välj sektion'}
          </span>
          <ChevronDown className={cn(
            "h-5 w-5 transition-transform",
            isMobileMenuOpen && "transform rotate-180"
          )} />
        </button>

        {isMobileMenuOpen && (
          <div className="absolute top-full left-0 right-0 bg-white dark:bg-gray-800 shadow-lg py-2">
            {pages.map((page) => (
              <button
                key={page.id}
                onClick={() => scrollToSection(page.id)}
                className={cn(
                  "w-full text-left px-4 py-2 text-sm transition-colors",
                  activeSection === page.id
                    ? "bg-blue-50 dark:bg-blue-900 text-blue-700 dark:text-blue-300"
                    : "text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700"
                )}
              >
                {page.title}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Desktop sidebar */}
      <div className="hidden md:block fixed top-16 left-0 w-64 h-[calc(100vh-4rem)] bg-white dark:bg-gray-800 shadow-lg overflow-y-auto">
        <nav className="p-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Innehåll</h2>
          <div className="space-y-1">
            {pages.map((page) => (
              <button
                key={page.id}
                onClick={() => scrollToSection(page.id)}
                className={cn(
                  "w-full text-left px-4 py-2 rounded-lg flex items-center transition-colors",
                  activeSection === page.id
                    ? "bg-blue-50 dark:bg-blue-900 text-blue-700 dark:text-blue-300"
                    : "text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700"
                )}
              >
                <span className="flex-1">{page.title}</span>
                {activeSection === page.id && (
                  <ChevronRight className="h-4 w-4" />
                )}
              </button>
            ))}
          </div>
        </nav>
      </div>

      {/* Main content */}
      <div className="md:pl-64 pt-28 md:pt-16">
        <div className="max-w-4xl mx-auto px-4 pb-16 space-y-16">
          {pages.map((page) => (
            <section
              key={page.id}
              id={`page-${page.id}`}
              className="scroll-mt-28 md:scroll-mt-16"
            >
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-gray-100">
                  {page.title}
                </h1>
                {isAdmin && (
                  <button
                    onClick={() => {
                      setSelectedPage(page);
                      setContent(page.content);
                      setIsEditing(true);
                    }}
                    className="flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    Redigera
                  </button>
                )}
              </div>

              <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md prose dark:prose-invert max-w-none">
                <div dangerouslySetInnerHTML={{ __html: page.content || '' }} />
                
                {/* Show GuestApartment component only for the guest apartment page */}
                {page.title === 'Gästlägenhet' && (
                  <div className="mt-8 not-prose">
                    <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-gray-100">Bokningar</h2>
                    <GuestApartment />
                  </div>
                )}
              </div>
            </section>
          ))}
        </div>
      </div>

      {/* Editor modal */}
      {isEditing && selectedPage && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg w-full max-w-4xl max-h-[90vh] overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b dark:border-gray-700">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                Redigera: {selectedPage.title}
              </h2>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    setIsEditing(false);
                    setContent(selectedPage.content || '');
                  }}
                  className="p-2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>
            
            <div className="p-4 h-[calc(90vh-8rem)] overflow-y-auto">
              <Editor
                content={content}
                onChange={setContent}
              />
            </div>

            <div className="flex justify-end gap-2 p-4 border-t dark:border-gray-700">
              <button
                onClick={() => {
                  setIsEditing(false);
                  setContent(selectedPage.content || '');
                }}
                className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors"
              >
                Avbryt
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className={cn(
                  "flex items-center px-4 py-2 rounded-md transition-colors",
                  saving
                    ? "bg-gray-400 text-white cursor-not-allowed"
                    : "bg-blue-600 text-white hover:bg-blue-700"
                )}
              >
                <Save className="h-4 w-4 mr-2" />
                {saving ? 'Sparar...' : 'Spara'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}