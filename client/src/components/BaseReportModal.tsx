import { useState, useEffect } from "react";
import { X } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

interface BaseReportModalProps {
  isVisible: boolean;
  onClose: () => void;
  baseId?: string;
  baseName?: string;
  baseCoords?: string;
  baseType?: string;
  editingReport?: any;
}

interface ReportTemplate {
  id: number;
  name: string;
  reportType: string;
  template: {
    fields: Array<{
      name: string;
      type: string;
      label: string;
      required: boolean;
      options?: string[];
    }>;
  };
}

interface BaseReportFormData {
  title: string;
  reportType: string;
  baseId?: string;
  baseName?: string;
  baseCoords?: string;
  baseType?: string;
  content: Record<string, any>;
  tags: string[];
  priority: string;
  status: string;
}

export default function BaseReportModal({
  isVisible,
  onClose,
  baseId,
  baseName,
  baseCoords,
  baseType,
  editingReport,
}: BaseReportModalProps) {
  const [formData, setFormData] = useState<BaseReportFormData>({
    title: "",
    reportType: "base",
    baseId: baseId,
    baseName: baseName,
    baseCoords: baseCoords,
    baseType: baseType,
    content: {},
    tags: [],
    priority: "medium",
    status: "active",
  });
  const [tagInput, setTagInput] = useState("");

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch template for base reports
  const { data: template, isLoading } = useQuery<ReportTemplate>({
    queryKey: ["/api/report-templates", "base"],
    enabled: isVisible,
  });

  // Create or update report mutation
  const reportMutation = useMutation({
    mutationFn: async (data: BaseReportFormData) => {
      const url = editingReport ? `/api/reports/${editingReport.id}` : "/api/reports";
      const method = editingReport ? "PUT" : "POST";
      
      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error(`Failed to ${editingReport ? 'update' : 'create'} report`);
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/reports"] });
      toast({
        title: editingReport ? "Report updated" : "Report created",
        description: `Base report has been ${editingReport ? 'updated' : 'created'} successfully.`,
      });
      onClose();
      // Reset form
      setFormData({
        title: "",
        reportType: "base",
        baseId: baseId,
        baseName: baseName,
        baseCoords: baseCoords,
        baseType: baseType,
        content: {},
        tags: [],
        priority: "medium",
        status: "active",
      });
      setTagInput("");
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to ${editingReport ? 'update' : 'create'} report: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // Update form data when editing
  useEffect(() => {
    if (editingReport) {
      setFormData({
        title: editingReport.title || "",
        reportType: "base",
        baseId: baseId,
        baseName: baseName,
        baseCoords: baseCoords,
        baseType: baseType,
        content: editingReport.content || {},
        tags: editingReport.tags || [],
        priority: editingReport.priority || "medium",
        status: editingReport.status || "active",
      });
    }
  }, [editingReport, baseId, baseName, baseCoords, baseType]);

  // Update form data when props change
  useEffect(() => {
    setFormData(prev => ({
      ...prev,
      baseId: baseId,
      baseName: baseName,
      baseCoords: baseCoords,
      baseType: baseType,
    }));
  }, [baseId, baseName, baseCoords, baseType]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      toast({
        title: "Error",
        description: "Please enter a report title.",
        variant: "destructive",
      });
      return;
    }
    reportMutation.mutate(formData);
  };

  const handleFieldChange = (fieldName: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      content: {
        ...prev.content,
        [fieldName]: value,
      },
    }));
  };

  const addTag = () => {
    if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, tagInput.trim()],
      }));
      setTagInput("");
    }
  };

  const removeTag = (tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove),
    }));
  };

  const renderField = (field: any) => {
    const value = formData.content[field.name] || "";

    switch (field.type) {
      case "text":
        return (
          <input
            type="text"
            value={value}
            onChange={(e) => handleFieldChange(field.name, e.target.value)}
            className="w-full p-2 bg-gray-700 border border-gray-600 rounded text-gray-200"
            required={field.required}
            data-testid={`input-${field.name}`}
          />
        );
      case "textarea":
        return (
          <textarea
            value={value}
            onChange={(e) => handleFieldChange(field.name, e.target.value)}
            className="w-full p-2 bg-gray-700 border border-gray-600 rounded text-gray-200 h-24 resize-none"
            required={field.required}
            data-testid={`textarea-${field.name}`}
          />
        );
      case "select":
        return (
          <select
            value={value}
            onChange={(e) => handleFieldChange(field.name, e.target.value)}
            className="w-full p-2 bg-gray-700 border border-gray-600 rounded text-gray-200"
            required={field.required}
            data-testid={`select-${field.name}`}
          >
            <option value="">Select {field.label}</option>
            {field.options?.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        );
      case "number":
        return (
          <input
            type="number"
            value={value}
            onChange={(e) => handleFieldChange(field.name, Number(e.target.value))}
            className="w-full p-2 bg-gray-700 border border-gray-600 rounded text-gray-200"
            required={field.required}
            data-testid={`input-${field.name}`}
          />
        );
      default:
        return null;
    }
  };

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-gray-800 rounded-lg shadow-xl border border-gray-700 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-4 border-b border-gray-700">
          <h2 className="text-xl font-semibold text-gray-200" data-testid="text-modal-title">
            {editingReport ? "Edit Base Report" : "Create Base Report"}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-200 transition-colors"
            data-testid="button-close"
          >
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Base Information */}
          <div className="bg-gray-700 p-4 rounded-lg">
            <h3 className="text-lg font-medium text-gray-200 mb-2">Base Information</h3>
            <div className="grid grid-cols-2 gap-4 text-sm text-gray-300">
              <div>
                <span className="font-medium">Base Name:</span> {baseName || 'Unnamed Base'}
              </div>
              <div>
                <span className="font-medium">Coordinates:</span> {baseCoords || 'N/A'}
              </div>
              <div>
                <span className="font-medium">Base Type:</span> {baseType || 'Unknown'}
              </div>
              <div>
                <span className="font-medium">Base ID:</span> {baseId || 'N/A'}
              </div>
            </div>
          </div>

          {/* Report Title */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Report Title *
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              className="w-full p-2 bg-gray-700 border border-gray-600 rounded text-gray-200"
              placeholder="Enter report title..."
              required
              data-testid="input-title"
            />
          </div>

          {/* Template Fields */}
          {isLoading ? (
            <div className="text-gray-400 text-center py-4">Loading template...</div>
          ) : template?.template?.fields ? (
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-200">Report Details</h3>
              {template.template.fields.map((field) => (
                <div key={field.name}>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    {field.label} {field.required && "*"}
                  </label>
                  {renderField(field)}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-gray-400 text-center py-4">No template available</div>
          )}

          {/* Tags */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Tags
            </label>
            <div className="flex gap-2 mb-2">
              <input
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                className="flex-1 p-2 bg-gray-700 border border-gray-600 rounded text-gray-200"
                placeholder="Add a tag..."
                data-testid="input-tag"
              />
              <button
                type="button"
                onClick={addTag}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded transition-colors"
                data-testid="button-add-tag"
              >
                Add
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {formData.tags.map((tag) => (
                <span
                  key={tag}
                  className="px-2 py-1 bg-gray-600 text-gray-200 text-sm rounded flex items-center gap-1"
                  data-testid={`tag-${tag}`}
                >
                  {tag}
                  <button
                    type="button"
                    onClick={() => removeTag(tag)}
                    className="text-gray-400 hover:text-gray-200"
                    data-testid={`button-remove-tag-${tag}`}
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          </div>

          {/* Priority */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Priority
            </label>
            <select
              value={formData.priority}
              onChange={(e) => setFormData(prev => ({ ...prev, priority: e.target.value }))}
              className="w-full p-2 bg-gray-700 border border-gray-600 rounded text-gray-200"
              data-testid="select-priority"
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="critical">Critical</option>
            </select>
          </div>

          {/* Form Actions */}
          <div className="flex gap-3 pt-4">
            <button
              type="submit"
              disabled={reportMutation.isPending}
              className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded transition-colors"
              data-testid="button-submit"
            >
              {reportMutation.isPending 
                ? "Saving..." 
                : editingReport 
                  ? "Update Report" 
                  : "Create Report"
              }
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-gray-200 rounded transition-colors"
              data-testid="button-cancel"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}