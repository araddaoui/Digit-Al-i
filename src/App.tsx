/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import Navbar from './components/Navbar';
import StudentView from './components/StudentView';
import InstructorView from './components/InstructorView';
import SyllabusBrowser from './components/SyllabusBrowser';

export default function App() {
  const [mode, setMode] = useState<'student' | 'instructor'>('student');

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col text-gray-900 selection:bg-amber-200 selection:text-amber-950">
      {/* UW Branded Navbar */}
      <Navbar currentMode={mode} setMode={setMode} />

      {/* Primary Workspace Panel */}
      <main className="flex-1">
        {mode === 'student' ? (
          <div className="space-y-6">
            {/* Core Socratic Chat Interface */}
            <StudentView />
            
            {/* Searchable Syllabus & Policy Reference widget */}
            <div className="pb-12">
              <SyllabusBrowser />
            </div>
          </div>
        ) : (
          <div className="pb-12">
            {/* Dr. Ali H. Raddaoui's Analytics, Log Auditors and RAG Knowledge manager */}
            <InstructorView />
          </div>
        )}
      </main>

      {/* University branded footer */}
      <footer className="bg-gray-100 border-t border-gray-200 py-6 text-center text-xs text-gray-400 font-sans mt-auto">
        <div className="max-w-7xl mx-auto px-4">
          <p>© 2026 University of Wyoming. All rights reserved.</p>
          <p className="mt-1">
            School of Politics, Public Administration, and International Studies (SPPAIS) &bull; Dr. Ali H. Raddaoui
          </p>
        </div>
      </footer>
    </div>
  );
}
