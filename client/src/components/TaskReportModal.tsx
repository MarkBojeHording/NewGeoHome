import { useState, useEffect } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { X, Package, Pickaxe } from 'lucide-react'
import { Button } from './ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select'
import { apiRequest } from '../lib/queryClient'
import { useToast } from '@/hooks/use-toast'

interface TaskReportModalProps {
  isVisible: boolean;
  onClose: () => void;
  baseId: string;
  baseName: string;
  baseCoords: string;
  editingReport?: any;
}

export default function TaskReportModal({
  isVisible,
  onClose,
  baseId,
  baseName,
  baseCoords,
  editingReport,
}: TaskReportModalProps) {
  const queryClient = useQueryClient()
  const { toast } = useToast()
  
  const [selectedTaskType, setSelectedTaskType] = useState('needs_pickup')
  const [pickupType, setPickupType] = useState('')

  useEffect(() => {
    if (isVisible) {
      if (editingReport) {
        // Load existing task report data for editing
        setSelectedTaskType(editingReport.taskType || 'needs_pickup')
        setPickupType(editingReport.taskData?.pickupType || '')
      } else {
        // Reset form for new task report
        setSelectedTaskType('needs_pickup')
        setPickupType('')
      }
    }
  }, [isVisible, editingReport])

  // Generate consistent display ID
  const generateDisplayId = (dbId: number) => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
    let seed = dbId
    let result = 'T' // T for Task
    for (let i = 0; i < 6; i++) {
      result += chars.charAt(seed % chars.length)
      seed = Math.floor(seed / chars.length) + (i * 7)
    }
    return result
  }

  const createTaskMutation = useMutation({
    mutationFn: async (taskData: any) => {
      const response = await apiRequest("POST", "/api/reports", taskData)
      return response
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/reports'] })
      queryClient.invalidateQueries({ queryKey: ['/api/reports/base'] })
      toast({
        title: "Task Created",
        description: "Task report has been created successfully.",
      })
      onClose()
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to create task report. Please try again.",
        variant: "destructive",
      })
      console.error('Error creating task:', error)
    }
  })

  const updateTaskMutation = useMutation({
    mutationFn: async (data: { id: number; taskData: any }) => {
      const response = await apiRequest("PUT", `/api/reports/${data.id}`, data.taskData)
      return response
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/reports'] })
      queryClient.invalidateQueries({ queryKey: ['/api/reports/base'] })
      toast({
        title: "Task Updated",
        description: "Task report has been updated successfully.",
      })
      onClose()
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to update task report. Please try again.",
        variant: "destructive",
      })
      console.error('Error updating task:', error)
    }
  })

  const markStatusMutation = useMutation({
    mutationFn: async (data: { id: number; status: string }) => {
      const updateData = {
        status: data.status,
        completedAt: new Date().toISOString(),
        completedBy: "user" // Replace with actual user ID when auth is implemented
      }
      const response = await apiRequest("PUT", `/api/reports/${data.id}`, updateData)
      return response
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['/api/reports'] })
      queryClient.invalidateQueries({ queryKey: ['/api/reports/base'] })
      toast({
        title: "Task Updated",
        description: `Task marked as ${variables.status}.`,
      })
      onClose()
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to update task status. Please try again.",
        variant: "destructive",
      })
      console.error('Error updating task status:', error)
    }
  })

  const deleteTaskMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await apiRequest("DELETE", `/api/reports/${id}`)
      return response
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/reports'] })
      queryClient.invalidateQueries({ queryKey: ['/api/reports/base'] })
      toast({
        title: "Task Deleted",
        description: "Task report has been deleted.",
      })
      onClose()
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to delete task report. Please try again.",
        variant: "destructive",
      })
      console.error('Error deleting task:', error)
    }
  })

  const handleSave = () => {
    if (!selectedTaskType) {
      toast({
        title: "Error",
        description: "Please select a task type.",
        variant: "destructive",
      })
      return
    }

    if (selectedTaskType === 'needs_pickup' && !pickupType) {
      toast({
        title: "Error",
        description: "Please select pickup type (Loot or Ore).",
        variant: "destructive",
      })
      return
    }

    const taskData = {
      type: 'task',
      taskType: selectedTaskType,
      taskData: selectedTaskType === 'needs_pickup' ? { pickupType } : {},
      baseTags: [baseId],
      notes: `Task: ${selectedTaskType === 'needs_pickup' ? `Pickup ${pickupType}` : selectedTaskType}`,
      outcome: 'neutral',
      status: 'pending',
      location: { gridX: 0, gridY: 0 }, // Will be set by the location where base is placed
      createdBy: "user" // Replace with actual user ID when auth is implemented
    }

    if (editingReport) {
      updateTaskMutation.mutate({ id: editingReport.id, taskData })
    } else {
      createTaskMutation.mutate(taskData)
    }
  }

  const handleMarkCompleted = () => {
    if (editingReport) {
      markStatusMutation.mutate({ id: editingReport.id, status: 'completed' })
    }
  }

  const handleMarkFailed = () => {
    if (editingReport) {
      markStatusMutation.mutate({ id: editingReport.id, status: 'failed' })
    }
  }

  const handleDelete = () => {
    if (editingReport && window.confirm('Are you sure you want to delete this task? This action cannot be undone.')) {
      deleteTaskMutation.mutate(editingReport.id)
    }
  }

  if (!isVisible) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-gray-800 rounded-lg p-6 w-96 max-w-[90vw] border border-orange-500">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-bold text-orange-400">
              {editingReport ? editingReport.displayId || generateDisplayId(editingReport.id) : 'New Task'}
            </h2>
            <p className="text-sm text-orange-600">{baseName} ({baseCoords})</p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="text-orange-400 hover:text-orange-300"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Task Type Dropdown */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-orange-300 mb-2">
            Task Type
          </label>
          <Select value={selectedTaskType} onValueChange={setSelectedTaskType}>
            <SelectTrigger className="bg-gray-700 border-orange-500 text-white">
              <SelectValue placeholder="Select task type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="needs_pickup">Needs Pick up</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Task-Specific Container */}
        {selectedTaskType === 'needs_pickup' && (
          <div className="mb-6 p-4 border border-orange-500/40 rounded-lg bg-gray-900/50">
            <h3 className="text-sm font-medium text-orange-300 mb-3">Pick up Options</h3>
            <div className="flex gap-3">
              <Button
                variant={pickupType === 'loot' ? 'default' : 'outline'}
                onClick={() => setPickupType('loot')}
                className={`flex-1 ${
                  pickupType === 'loot'
                    ? 'bg-orange-600 hover:bg-orange-700'
                    : 'border-orange-500 text-orange-400 hover:bg-orange-500/20'
                }`}
              >
                <Package className="h-4 w-4 mr-2" />
                Loot
              </Button>
              <Button
                variant={pickupType === 'ore' ? 'default' : 'outline'}
                onClick={() => setPickupType('ore')}
                className={`flex-1 ${
                  pickupType === 'ore'
                    ? 'bg-orange-600 hover:bg-orange-700'
                    : 'border-orange-500 text-orange-400 hover:bg-orange-500/20'
                }`}
              >
                <Pickaxe className="h-4 w-4 mr-2" />
                Ore
              </Button>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-2">
          {editingReport ? (
            <>
              <Button
                onClick={handleSave}
                disabled={updateTaskMutation.isPending}
                className="bg-blue-600 hover:bg-blue-700 flex-1"
              >
                Save
              </Button>
              <Button
                onClick={handleMarkCompleted}
                disabled={markStatusMutation.isPending}
                className="bg-green-600 hover:bg-green-700 flex-1"
              >
                Mark Complete
              </Button>
              <Button
                onClick={handleMarkFailed}
                disabled={markStatusMutation.isPending}
                className="bg-yellow-600 hover:bg-yellow-700 flex-1"
              >
                Mark Failed
              </Button>
              <Button
                onClick={handleDelete}
                disabled={deleteTaskMutation.isPending}
                variant="destructive"
                className="flex-1"
              >
                Delete
              </Button>
              <Button
                onClick={onClose}
                variant="outline"
                className="border-orange-500 text-orange-400 hover:bg-orange-500/20"
              >
                Cancel
              </Button>
            </>
          ) : (
            <>
              <Button
                onClick={handleSave}
                disabled={createTaskMutation.isPending}
                className="bg-orange-600 hover:bg-orange-700 flex-1"
              >
                Save
              </Button>
              <Button
                onClick={onClose}
                variant="outline"
                className="border-orange-500 text-orange-400 hover:bg-orange-500/20 flex-1"
              >
                Cancel
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}