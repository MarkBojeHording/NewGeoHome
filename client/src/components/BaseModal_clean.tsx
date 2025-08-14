// This is a clean version with fixed Reports panel
// The Reports tab should only show:
// 1. Header: "Base Reports"  
// 2. List of existing reports (scrollable)
// 3. "Create New Report" button at bottom
// NO placeholder containers for Enemy Players, Friendly Players, or Notes

import { useState, useRef, useEffect, useCallback, useMemo } from "react"
import { MapPin, Home, Shield, Wheat, Castle, Tent, X, HelpCircle, Calculator, FileText, Image, Edit, Camera, StickyNote, Search, Plus, Minus } from "lucide-react"
import { useQuery, useQueries } from "@tanstack/react-query"
import { apiRequest, queryClient } from '@/lib/queryClient'
import { RocketCalculatorSection } from './RocketCalculator'
import type { ExternalPlayer } from '@shared/schema'

// ... (rest of the BaseModal component would be here with the corrected Reports panel)

// The key fix is in the Reports panel section:
/*
        {showReportPanel && (
          <div 
            className="bg-gray-800 rounded-lg shadow-xl border border-gray-700 absolute"
            style={{
              height: '95vh',
              maxHeight: '805px',
              width: '320px',
              left: '16px',
              transform: 'translateX(-100%)',
              top: 0,
              zIndex: 45
            }}
          >
            <div className="p-4 h-full flex flex-col">
              <h3 className="text-white font-bold mb-4">Base Reports</h3>
              
              {/* List of reports for this base */}
              <div className="flex-1 overflow-y-auto mb-4">
                <div className="space-y-2">
                  {reportsLoading ? (
                    <p className="text-gray-400 text-sm">Loading reports...</p>
                  ) : baseReports.length === 0 ? (
                    <p className="text-gray-400 text-sm italic">No reports for this base yet.</p>
                  ) : (
                    baseReports.map(report => (
                      <div key={report.id} className="bg-gray-700 rounded p-3 text-sm">
                        <div className="flex justify-between items-start mb-2">
                          <span className="text-white font-medium">{report.reportType}</span>
                          <span className="text-gray-400 text-xs">
                            {report.reportTime ? new Date(report.reportTime).toLocaleTimeString('en-US', { 
                              hour: '2-digit', 
                              minute: '2-digit',
                              hour12: false 
                            }) : 'No time'}
                          </span>
                        </div>
                        {report.players && (
                          <div className="text-gray-300 mb-1">
                            <strong>Players:</strong> {report.players}
                          </div>
                        )}
                        {report.notes && (
                          <div className="text-gray-300">
                            <strong>Notes:</strong> {report.notes}
                          </div>
                        )}
                        <div className="flex gap-2 mt-2">
                          {report.youtube && <Camera className="w-3 h-3 text-white" />}
                          {report.notes && <StickyNote className="w-3 h-3 text-white" />}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
              
              {/* Create Report Button */}
              <button 
                onClick={() => {
                  if (editingLocation) {
                    window.dispatchEvent(new CustomEvent('openBaseReport', {
                      detail: { location: editingLocation }
                    }))
                  }
                }}
                className="w-full bg-yellow-600 hover:bg-yellow-700 text-white py-2 rounded text-sm font-medium transition-colors"
              >
                Create New Report
              </button>
            </div>
          </div>
        )}
*/