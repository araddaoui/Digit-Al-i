import React, { useState } from 'react';
import { BookOpen, Search, HelpCircle, FileText, Calendar, Compass } from 'lucide-react';
import { syllabusChunks } from '../syllabusData';

export default function SyllabusBrowser() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');

  const categories = ['All', 'Logistics', 'Framework', 'Tunisia', 'Egypt', 'Syria', 'Yemen', 'Policies', 'Resources'];

  const filtered = syllabusChunks.filter(chunk => {
    const matchesSearch = 
      chunk.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
      chunk.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
      chunk.tags.some(t => t.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesCategory = selectedCategory === 'All' || chunk.category === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  const downloadSyllabus = () => {
    let text = `# POLS 4710 / INST 4990: The Arab Spring and Its Aftermaths\n`;
    text += `University of Wyoming -- Fall 2026\n`;
    text += `Instructor: Dr. Ali H. Raddaoui (araddaou@uwyo.edu)\n`;
    text += `========================================================================\n\n`;

    syllabusChunks.forEach(chunk => {
      text += `## ${chunk.title.toUpperCase()}\n`;
      text += `Category: ${chunk.category}\n`;
      text += `Tags: ${chunk.tags.join(', ')}\n\n`;
      text += `${chunk.content}\n\n`;
      text += `------------------------------------------------------------------------\n\n`;
    });

    const blob = new Blob([text], { type: 'text/markdown;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'POLS_4710_Syllabus_Updated.md');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="bg-white rounded-xl shadow-md border border-gray-200 p-5 max-w-7xl mx-auto my-6">
      {/* Title & Download Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b pb-3 mb-4">
        <div className="flex items-center gap-2">
          <BookOpen className="h-5 w-5 text-amber-800 shrink-0" />
          <div>
            <h2 className="text-base font-bold text-[#4d3112] font-sans">
              POLS 4710 / INST 4990 Syllabus Reference Center
            </h2>
            <p className="text-xs text-gray-500 font-sans">
              Directly browse and search sections of Dr. Ali H. Raddaoui's official syllabus, policies, and readings.
            </p>
          </div>
        </div>
        <button
          id="btn-download-syllabus"
          onClick={downloadSyllabus}
          className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-[#4d3112] hover:bg-amber-950 text-[#ffc72c] text-xs font-bold rounded-lg shadow-sm hover:shadow transition-all shrink-0 font-sans cursor-pointer"
        >
          <FileText className="h-4 w-4" />
          Download Full Syllabus (.md)
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col md:flex-row gap-3 items-center mb-4">
        {/* Search Input */}
        <div className="relative w-full md:w-80">
          <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400">
            <Search className="h-4 w-4" />
          </span>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search policies, grades, authors..."
            className="pl-9 pr-4 py-2 w-full border border-gray-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-[#4d3112]"
          />
        </div>

        {/* Category Filters */}
        <div className="flex gap-1 overflow-x-auto w-full py-1">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-2.5 py-1 text-xs font-semibold rounded-full transition whitespace-nowrap shrink-0 ${
                selectedCategory === cat
                  ? 'bg-[#4d3112] text-[#ffc72c]'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Syllabus Chunks List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[300px] overflow-y-auto pr-1">
        {filtered.length === 0 ? (
          <p className="text-xs text-gray-400 italic py-8 text-center col-span-2">
            No syllabus entries match your search criteria. Try filtering by another category or general terms.
          </p>
        ) : (
          filtered.map(chunk => (
            <div 
              key={chunk.id} 
              className="p-3.5 bg-amber-50/20 hover:bg-amber-50/40 rounded-lg border border-gray-150 transition space-y-2 flex flex-col justify-between"
            >
              <div>
                <div className="flex justify-between items-start gap-2 mb-1.5">
                  <h4 className="text-xs font-bold text-gray-900 font-sans flex items-center gap-1">
                    <FileText className="h-3.5 w-3.5 text-[#4d3112]" />
                    {chunk.title}
                  </h4>
                  <span className="text-[9px] bg-amber-200 text-[#4d3112] font-extrabold px-2 py-0.5 rounded uppercase tracking-wider font-mono">
                    {chunk.category}
                  </span>
                </div>
                <p className="text-xs text-gray-700 leading-relaxed font-sans whitespace-pre-line">
                  {chunk.content}
                </p>
              </div>

              {/* Tags list */}
              <div className="flex flex-wrap gap-1 pt-2 border-t border-gray-100 mt-2">
                {chunk.tags.map(t => (
                  <span key={t} className="text-[9px] bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded font-mono">
                    #{t}
                  </span>
                ))}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
