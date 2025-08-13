import { useState, useEffect } from "react";
import { X } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

interface ActionReportModalProps {
  isVisible: boolean;
  onClose: () => void;
  baseId?: string;
  baseName?: string;
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

interface ReportFormData {
  title: string;
  reportType: string;
  baseId?: string;
  baseName?: string;
  content: Record<string, any>;
  tags: string[];
  priority: string;
  status: string;
}

export default function ActionReportModal({
  isVisible,
  onClose,
  baseId,
  baseName,
  editingReport,
}: ActionReportModalProps) {
  const [formData, setFormData] = useState<ReportFormData>({
    title: "",
    reportType: "base",
    baseId: baseId,
    baseName: baseName,
    content: {},
    tags: [],
    priority: "medium",
    status: "active",
  });
  const [tagInput, setTagInput] = useState("");

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch template for the report type
  const { data: template, isLoading } = useQuery<ReportTemplate>({
    queryKey: ["/api/report-templates", "base"],
    enabled: isVisible,
  });

  // Create or update report mutation
  const reportMutation = useMutation({
    mutationFn: async (data: ReportFormData) => {
      const url = editingReport ? `/api/reports/${editingReport.id}` : "/api/reports";
      const method = editingReport ? "PUT" : "POST";
      
      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) throw new Error("Failed to save report");
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: editingReport ? "Report Updated" : "Report Created",
        description: `Report "${formData.title}" has been saved successfully.`,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/reports"] });
      onClose();
      resetForm();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to save report",
        variant: "destructive",
      });
    },
  });

  // Reset form data
  const resetForm = () => {
    setFormData({
      title: "",
      reportType: "base",
      baseId: baseId,
      baseName: baseName,
      content: {},
      tags: [],
      priority: "medium",
      status: "active",
    });
    setTagInput("");
  };

  // Load editing report data
  useEffect(() => {
    if (editingReport) {
      setFormData({
        title: editingReport.title || "",
        reportType: editingReport.reportType || "base",
        baseId: editingReport.baseId || baseId,
        baseName: editingReport.baseName || baseName,
        content: editingReport.content || {},
        tags: editingReport.tags || [],
        priority: editingReport.priority || "medium",
        status: editingReport.status || "active",
      });
    } else {
      resetForm();
    }
  }, [editingReport, baseId, baseName]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      toast({
        title: "Error",
        description: "Report title is required",
        variant: "destructive",
      });
      return;
    }
    reportMutation.mutate(formData);
  };

  const addTag = () => {
    if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, tagInput.trim()]
      }));
      setTagInput("");
    }
  };

  const removeTag = (tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  const handleContentChange = (fieldName: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      content: {
        ...prev.content,
        [fieldName]: value
      }
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
            onChange={(e) => handleContentChange(field.name, e.target.value)}
            className="w-full p-2 border border-gray-600 rounded bg-gray-800 text-white"
            required={field.required}
          />
        );
      
      case "textarea":
        return (
          <textarea
            value={value}
            onChange={(e) => handleContentChange(field.name, e.target.value)}
            rows={4}
            className="w-full p-2 border border-gray-600 rounded bg-gray-800 text-white resize-none"
            required={field.required}
          />
        );
      
      case "select":
        return (
          <select
            value={value}
            onChange={(e) => handleContentChange(field.name, e.target.value)}
            className="w-full p-2 border border-gray-600 rounded bg-gray-800 text-white"
            required={field.required}
          >
            <option value="">Select {field.label}</option>
            {field.options?.map((option: string) => (
              <option key={option} value={option}>
                {option.charAt(0).toUpperCase() + option.slice(1)}
              </option>
            ))}
          </select>
        );
      
      case "number":
        return (
          <input
            type="number"
            value={value}
            onChange={(e) => handleContentChange(field.name, e.target.value)}
            className="w-full p-2 border border-gray-600 rounded bg-gray-800 text-white"
            required={field.required}
          />
        );
      
      default:
        return (
          <input
            type="text"
            value={value}
            onChange={(e) => handleContentChange(field.name, e.target.value)}
            className="w-full p-2 border border-gray-600 rounded bg-gray-800 text-white"
            required={field.required}
          />
        );
    }
  };

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-gray-900 rounded-lg border border-gray-700 p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-white">
            {editingReport ? "Edit Report" : "Create New Report"}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-200 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center p-8">
            <div className="text-gray-400">Loading template...</div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Report Type Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Report Type
              </label>
              <select
                value={formData.reportType}
                onChange={(e) => setFormData(prev => ({ ...prev, reportType: e.target.value }))}
                className="w-full p-2 border border-gray-600 rounded bg-gray-800 text-white"
              >
                <option value="general">General Report</option>
                <option value="base">Base Report</option>
                <option value="raid">Raid Report</option>
              </select>
            </div>

            {/* Basic Fields */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Title *
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                className="w-full p-2 border border-gray-600 rounded bg-gray-800 text-white"
                required
              />
            </div>

            {baseName && (
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Base
                </label>
                <input
                  type="text"
                  value={baseName}
                  readOnly
                  className="w-full p-2 border border-gray-600 rounded bg-gray-700 text-gray-300"
                />
              </div>
            )}

            {/* Template Fields */}
            {template?.template.fields.map((field) => (
              <div key={field.name}>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  {field.label} {field.required && "*"}
                </label>
                {renderField(field)}
              </div>
            ))}

            {/* Priority and Status */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Priority
                </label>
                <select
                  value={formData.priority}
                  onChange={(e) => setFormData(prev => ({ ...prev, priority: e.target.value }))}
                  className="w-full p-2 border border-gray-600 rounded bg-gray-800 text-white"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="critical">Critical</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Status
                </label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value }))}
                  className="w-full p-2 border border-gray-600 rounded bg-gray-800 text-white"
                >
                  <option value="active">Active</option>
                  <option value="completed">Completed</option>
                  <option value="archived">Archived</option>
                </select>
              </div>
            </div>

            {/* Tags */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Tags
              </label>
              <div className="flex gap-2 mb-2">
                <input
                  type="text"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), addTag())}
                  className="flex-1 p-2 border border-gray-600 rounded bg-gray-800 text-white"
                  placeholder="Add tag and press Enter"
                />
                <button
                  type="button"
                  onClick={addTag}
                  className="px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                >
                  Add
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {formData.tags.map((tag) => (
                  <span
                    key={tag}
                    className="px-2 py-1 bg-gray-700 text-gray-300 rounded-full text-sm flex items-center gap-1"
                  >
                    {tag}
                    <button
                      type="button"
                      onClick={() => removeTag(tag)}
                      className="text-red-400 hover:text-red-300"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            </div>

            {/* Submit Buttons */}
            <div className="flex gap-3 justify-end pt-4">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 bg-gray-700 text-gray-200 rounded hover:bg-gray-600 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={reportMutation.isPending}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                {reportMutation.isPending
                  ? "Saving..."
                  : editingReport
                  ? "Update Report"
                  : "Create Report"
                }
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}