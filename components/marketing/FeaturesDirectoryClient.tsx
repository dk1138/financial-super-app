'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';

export interface OptimizerGroupItem {
  id: string;
  name: string;
  badge: string;
  icon: string;
  desc: string;
}

export interface OptimizerGroup {
  groupTitle: string;
  groupIcon: string;
  groupColor: string;
  groupDesc: string;
  tools: OptimizerGroupItem[];
}

export default function FeaturesDirectoryClient({
  optimizerGroups,
  toolSlugByKey,
  totalToolCount,
}: {
  optimizerGroups: OptimizerGroup[];
  toolSlugByKey: Record<string, string>;
  totalToolCount: number;
}) {
  const [searchQuery, setSearchQuery] = useState('');

  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return null;
    const q = searchQuery.toLowerCase().trim();
    const results: Array<OptimizerGroupItem & { groupTitle: string }> = [];
    optimizerGroups.forEach((g) => {
      g.tools.forEach((t) => {
        if (
          t.name.toLowerCase().includes(q) ||
          t.desc.toLowerCase().includes(q) ||
          t.badge.toLowerCase().includes(q) ||
          g.groupTitle.toLowerCase().includes(q)
        ) {
          results.push({ ...t, groupTitle: g.groupTitle });
        }
      });
    });
    return results;
  }, [searchQuery, optimizerGroups]);

  return (
    <section className="py-24 bg-[#0f172a]" id="all-calculators">
      <div className="container mx-auto px-6 max-w-6xl">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-12">
          <div className="text-start">
            <span className="text-blue-400 text-xs font-bold uppercase tracking-widest bg-blue-500/10 border border-blue-500/20 px-3 py-1 rounded-full">
              Interactive Directory
            </span>
            <h2 className="text-3xl md:text-4xl font-black text-white mt-3 mb-2 tracking-tight">
              All {totalToolCount} Smart Optimizers &amp; Calculators
            </h2>
            <p className="text-slate-400 text-sm md:text-base max-w-xl mb-0">
              Independent, precision tools designed to solve specific high-stakes questions in Canadian wealth.
            </p>
          </div>

          <div className="relative w-full sm:w-80 flex items-center">
            <i className="bi bi-search absolute left-3.5 text-slate-400 pointer-events-none text-xs"></i>
            <input
              type="text"
              aria-label="Search Canadian financial calculators"
              placeholder="Search tools (e.g. LIF, Smith, TFSA, CPP)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700/80 rounded-full py-2.5 pl-9 pr-9 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500 transition-colors shadow-inner"
            />
            {searchQuery && (
              <button
                type="button"
                aria-label="Clear search"
                onClick={() => setSearchQuery('')}
                className="absolute right-3 text-slate-500 hover:text-white text-xs border-0 bg-transparent p-0"
              >
                <i className="bi bi-x-circle-fill"></i>
              </button>
            )}
          </div>
        </div>

        {searchResults ? (
          <div>
            <div className="d-flex justify-content-between align-items-center mb-6">
              <span className="text-sm text-slate-400">
                Showing <b>{searchResults.length}</b> tools matching &quot;<span className="text-blue-400">{searchQuery}</span>&quot;
              </span>
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="text-xs text-blue-400 hover:text-blue-300 font-bold bg-transparent border-0 p-0"
              >
                Clear Search
              </button>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5 text-start">
              {searchResults.map((opt) => (
                <div
                  key={opt.id}
                  className="bg-slate-900/80 border border-slate-800 hover:border-slate-700/80 p-6 rounded-2xl transition-all flex flex-col justify-between group hover:shadow-xl hover:shadow-black/30"
                >
                  <div>
                    <h4 className="text-base font-bold text-white mb-2 leading-snug group-hover:text-blue-300 transition-colors">
                      {opt.name}
                    </h4>
                    <p className="text-slate-400 text-xs leading-relaxed mb-4">{opt.desc}</p>
                  </div>

                  <div className="pt-3 border-t border-slate-800/80 flex justify-between items-center gap-2 text-[11px]">
                    {toolSlugByKey[opt.id] ? (
                      <Link
                        href={`/tools/${toolSlugByKey[opt.id]}`}
                        className="text-slate-400 hover:text-emerald-400 font-semibold flex items-center gap-1 text-decoration-none transition-colors"
                      >
                        <i className="bi bi-book text-[10px]"></i>
                        <span>Standalone Guide</span>
                      </Link>
                    ) : (
                      <span />
                    )}
                    <Link
                      href={`/planner?tab=optimizers&tool=${opt.id}`}
                      className="text-blue-400 hover:text-blue-300 font-bold flex items-center gap-1 text-decoration-none group-hover:translate-x-0.5 transition-transform"
                    >
                      <span>Open in Planner</span>
                      <i className="bi bi-chevron-right text-[10px]"></i>
                    </Link>
                  </div>
                </div>
              ))}
            </div>

            {searchResults.length === 0 && (
              <div className="p-12 text-center bg-slate-900 border border-slate-800 rounded-2xl my-8">
                <i className="bi bi-search text-slate-500 text-3xl mb-3 d-block"></i>
                <h5 className="text-white font-bold mb-1">No Tools Found</h5>
                <p className="text-slate-400 text-xs mb-4">
                  No tools matched &quot;{searchQuery}&quot;. Try searching for &quot;tax&quot;, &quot;mortgage&quot;, &quot;rrsp&quot;, &quot;cpp&quot;, or &quot;pension&quot;.
                </p>
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold px-4 py-2 rounded-full"
                >
                  View All {totalToolCount} Tools
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-16">
            {optimizerGroups.map((group, gIdx) => (
              <div key={gIdx} className="text-start border-t border-slate-800/80 pt-10">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-6">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <i className={`bi ${group.groupIcon} ${group.groupColor} text-lg`}></i>
                      <h3 className="text-2xl font-bold text-white tracking-tight">{group.groupTitle}</h3>
                      <span className="bg-slate-800 text-slate-400 text-xs px-2.5 py-0.5 rounded-full font-bold ml-2">
                        {group.tools.length} Tools
                      </span>
                    </div>
                    <p className="text-slate-400 text-xs leading-relaxed max-w-2xl mb-0">{group.groupDesc}</p>
                  </div>
                </div>

                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
                  {group.tools.map((opt) => (
                    <div
                      key={opt.id}
                      className="bg-slate-900/80 border border-slate-800 hover:border-slate-700/80 p-6 rounded-2xl transition-all flex flex-col justify-between group hover:shadow-xl hover:shadow-black/30"
                    >
                      <div>
                        <h4 className="text-base font-bold text-white mb-2 leading-snug group-hover:text-blue-300 transition-colors">
                          {opt.name}
                        </h4>
                        <p className="text-slate-400 text-xs leading-relaxed mb-4">{opt.desc}</p>
                      </div>

                      <div className="pt-3 border-t border-slate-800/80 flex justify-between items-center gap-2 text-[11px]">
                        {toolSlugByKey[opt.id] ? (
                          <Link
                            href={`/tools/${toolSlugByKey[opt.id]}`}
                            className="text-slate-400 hover:text-emerald-400 font-semibold flex items-center gap-1 text-decoration-none transition-colors"
                          >
                            <i className="bi bi-book text-[10px]"></i>
                            <span>Standalone Guide</span>
                          </Link>
                        ) : (
                          <span />
                        )}
                        <Link
                          href={`/planner?tab=optimizers&tool=${opt.id}`}
                          className="text-blue-400 hover:text-blue-300 font-bold flex items-center gap-1 text-decoration-none group-hover:translate-x-0.5 transition-transform"
                        >
                          <span>Open in Planner</span>
                          <i className="bi bi-chevron-right text-[10px]"></i>
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
