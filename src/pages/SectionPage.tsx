import React from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import type { Section, User } from '../types';

export function SectionPage() {
  const { id } = useParams<{ id: string }>();
  const [section, setSection] = React.useState<Section | null>(null);
  const [isEditing, setIsEditing] = React.useState(false);
  const [content, setContent] = React.useState('');
  const [isAdmin, setIsAdmin] = React.useState(false);

  React.useEffect(() => {
    loadSection();
    checkUser();
  }, [id]);

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

  async function loadSection() {
    if (!id) return;

    const { data } = await supabase
      .from('sections')
      .select('*')
      .eq('id', id)
      .single();
    
    if (data) {
      setSection(data);
      setContent(data.content || '');
    }
  }

  async function handleSave() {
    if (!id) return;

    const { error } = await supabase
      .from('sections')
      .update({ 
        content,
        updated_at: new Date().toISOString()
      })
      .eq('id', id);

    if (!error) {
      setIsEditing(false);
      loadSection();
    }
  }

  if (!section) {
    return <div>Laddar...</div>;
  }

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-8">{section.title}</h1>
      
      {isAdmin && (
        <div className="mb-4">
          <button
            onClick={() => isEditing ? handleSave() : setIsEditing(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
          >
            {isEditing ? 'Spara' : 'Redigera'}
          </button>
          {isEditing && (
            <button
              onClick={() => {
                setIsEditing(false);
                setContent(section.content || '');
              }}
              className="ml-2 bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700"
            >
              Avbryt
            </button>
          )}
        </div>
      )}
      
      {isEditing ? (
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          className="w-full h-96 p-4 border border-gray-300 rounded-md"
          placeholder="Skriv innehållet här..."
        />
      ) : (
        <div className="bg-white p-6 rounded-lg shadow-md prose max-w-none">
          {section.content ? (
            <div className="whitespace-pre-wrap">{section.content}</div>
          ) : (
            <p className="text-gray-500 italic">Inget innehåll än.</p>
          )}
        </div>
      )}
    </div>
  );
}