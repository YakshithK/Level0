import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/utils';
import { User } from '@supabase/supabase-js';

interface Project {
  id: string;
  name: string;
  created_at: string;
}

const ProjectPage: React.FC = () => {
  const navigate = useNavigate();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<User | null | undefined>(undefined);

  useEffect(() => {
    console.log("")
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
    };
    checkUser();
  }, []);

  useEffect(() => {
    const fetchProjects = async () => {
      if (!user) return;
      
      setLoading(true);
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching projects:', error);
      } else {
        setProjects(data || []);
      }
      setLoading(false);
    };

    fetchProjects();
  }, [user]);

  if (user === undefined) {
    return <div className="min-h-screen flex items-center justify-center bg-[#181c24] text-[#e5e7ef]"><span>Loading...</span></div>;
  }

  if (!user) {
    return <div className="min-h-screen flex items-center justify-center bg-[#181c24] text-[#e5e7ef]">
      <div className="text-center">
        <h1 className="text-2xl mb-4">Please sign in to view your projects</h1>
        <button 
          onClick={() => navigate('/')}
          className="bg-neon-cyan text-black font-semibold px-6 py-2 rounded-lg hover:bg-neon-cyan/90 transition-colors"
        >
          Go to Home
        </button>
      </div>
    </div>;
  }

  return (
    <div className="min-h-screen bg-[#181c24] text-[#e5e7ef] p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Your Projects</h1>
          <button
            onClick={() => navigate('/')}
            className="bg-neon-cyan text-black font-semibold px-6 py-2 rounded-lg hover:bg-neon-cyan/90 transition-colors"
          >
            Create New Project
          </button>
        </div>
        
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <span className="text-lg">Loading projects...</span>
          </div>
        ) : projects.length === 0 ? (
          <div className="text-center py-16">
            <h2 className="text-xl mb-4">No projects yet</h2>
            <p className="text-[#888] mb-6">Create your first game by describing what you want to build</p>
            <button
              onClick={() => navigate('/')}
              className="bg-neon-cyan text-black font-semibold px-6 py-2 rounded-lg hover:bg-neon-cyan/90 transition-colors"
            >
              Create Your First Project
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map((project) => (
              <div 
                key={project.id}
                onClick={() => navigate(`/projects/${project.id}`)}
                className="bg-[#23272f] border border-[#444] rounded-lg p-6 cursor-pointer hover:border-[#00ffff] transition-all duration-300 hover:shadow-lg hover:shadow-[#00ffff]/20"
              >
                <h3 className="text-lg font-semibold mb-2 text-white">{project.name}</h3>
                <p className="text-[#888] text-sm">
                  Created {new Date(project.created_at).toLocaleDateString()}
                </p>
                <div className="mt-4 text-[#00ffff] text-sm font-medium">
                  Click to open →
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ProjectPage;