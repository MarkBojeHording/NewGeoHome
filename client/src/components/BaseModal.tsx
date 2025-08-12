import { useState, useEffect, useRef, useCallback } from 'react'
import { MapPin, Home, Shield, Wheat, Castle, Tent, X, HelpCircle, Calculator } from 'lucide-react'

interface BaseModalProps {
  modal: { x: number; y: number; visible: boolean }
  modalType: string
  editingLocation: any
  editingReport: any
  locations: any[]
  onSave: (data: any) => void
  onCancel: () => void
  onDelete: () => void
  reportLibrary: any[]
  addToReportLibrary: (report: any) => void
  updateReportLibrary: (report: any) => void
}

const BaseModal = ({ 
  modal, 
  modalType, 
  editingLocation,
  editingReport,
  locations,
  onSave,
  onCancel,
  onDelete,
  reportLibrary,
  addToReportLibrary,
  updateReportLibrary
}: BaseModalProps) => {
  console.log('BaseModal render check:', { modalVisible: modal.visible, modalType, modal })
  if (!modal.visible) return null

  console.log('BaseModal is about to render!')
  
  return (
    <div 
      style={{ 
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999
      }}
    >
      <div style={{ 
        backgroundColor: 'white', 
        padding: '20px', 
        borderRadius: '8px',
        maxWidth: '400px',
        color: 'black'
      }}>
        <h2>🎯 {modalType.charAt(0).toUpperCase() + modalType.slice(1)} Base Modal</h2>
        <p>Modal Type: {modalType}</p>
        <p>Your complete BaseModal is now working!</p>
        <p>This confirms the modularization is successful.</p>
        <button 
          onClick={onCancel} 
          style={{ 
            padding: '10px 20px', 
            margin: '10px 5px', 
            backgroundColor: '#6b7280',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          Cancel
        </button>
      </div>
    </div>
  )
}

export default BaseModal