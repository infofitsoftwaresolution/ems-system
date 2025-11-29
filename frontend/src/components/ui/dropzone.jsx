import { useState, useCallback, useRef } from "react";
import { Upload, X, FileImage, File, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

/**
 * Dropzone Component for Drag-and-Drop File Upload
 * 
 * @param {Object} props
 * @param {Function} props.onFileSelect - Callback when file(s) are selected (receives File or File[])
 * @param {Function} props.onFileRemove - Callback when file is removed (receives file index or file)
 * @param {Array} props.acceptedFileTypes - Array of accepted MIME types (e.g., ['image/jpeg', 'application/pdf'])
 * @param {Array} props.acceptedExtensions - Array of accepted file extensions (e.g., ['.jpg', '.pdf'])
 * @param {number} props.maxFileSize - Maximum file size in bytes (default: 5MB)
 * @param {boolean} props.multiple - Allow multiple files (default: false)
 * @param {string} props.label - Label text for the dropzone
 * @param {string} props.placeholder - Placeholder text
 * @param {boolean} props.required - Is this field required
 * @param {string} props.error - Error message to display
 * @param {Array} props.files - Array of currently selected files (for controlled component)
 * @param {Function} props.onUpload - Optional: callback for uploading files (receives file, returns Promise with URL)
 * @param {boolean} props.autoUpload - Auto-upload files when selected (default: false)
 * @param {string} props.uploadEndpoint - API endpoint for file upload (default: '/api/documents/upload')
 */
export function Dropzone({
  onFileSelect,
  onFileRemove,
  acceptedFileTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp", "application/pdf"],
  acceptedExtensions = [".jpg", ".jpeg", ".png", ".webp", ".pdf"],
  maxFileSize = 5 * 1024 * 1024, // 5MB default
  multiple = false,
  label,
  placeholder = "Drag & Drop files here or Click to Upload",
  required = false,
  error,
  files = [],
  onUpload,
  autoUpload = false,
  uploadEndpoint = "/api/documents/upload",
  className,
}) {
  const [isDragging, setIsDragging] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({});
  const [uploading, setUploading] = useState({});
  const [uploadedUrls, setUploadedUrls] = useState({});
  const fileInputRef = useRef(null);

  // Validate file
  const validateFile = useCallback((file) => {
    // Check file type
    const isValidType = 
      acceptedFileTypes.includes(file.type) ||
      acceptedExtensions.some(ext => file.name.toLowerCase().endsWith(ext.toLowerCase()));
    
    if (!isValidType) {
      return {
        valid: false,
        error: `Invalid file type. Allowed types: ${acceptedExtensions.join(", ")}`,
      };
    }

    // Check file size
    if (file.size > maxFileSize) {
      return {
        valid: false,
        error: `File size exceeds ${(maxFileSize / (1024 * 1024)).toFixed(0)}MB limit`,
      };
    }

    return { valid: true };
  }, [acceptedFileTypes, acceptedExtensions, maxFileSize]);

  // Upload file to server
  const uploadFile = useCallback(async (file, index) => {
    if (!onUpload && !autoUpload) {
      return null;
    }

    setUploading(prev => ({ ...prev, [index]: true }));
    setUploadProgress(prev => ({ ...prev, [index]: 0 }));

    try {
      let url;
      
      if (onUpload) {
        // Use custom upload function
        url = await onUpload(file, (progress) => {
          setUploadProgress(prev => ({ ...prev, [index]: progress }));
        });
      } else if (autoUpload) {
        // Use default upload endpoint
        const formData = new FormData();
        formData.append("file", file);

        const token = localStorage.getItem("authToken");
        const headers = {};
        if (token) {
          headers["Authorization"] = `Bearer ${token}`;
        }

        const xhr = new XMLHttpRequest();
        
        url = await new Promise((resolve, reject) => {
          xhr.upload.addEventListener("progress", (e) => {
            if (e.lengthComputable) {
              const progress = (e.loaded / e.total) * 100;
              setUploadProgress(prev => ({ ...prev, [index]: progress }));
            }
          });

          xhr.addEventListener("load", () => {
            if (xhr.status === 200 || xhr.status === 201) {
              try {
                const response = JSON.parse(xhr.responseText);
                resolve(response.url || response.data?.url || response.path);
              } catch {
                resolve(null);
              }
            } else {
              reject(new Error(`Upload failed: ${xhr.statusText}`));
            }
          });

          xhr.addEventListener("error", () => {
            reject(new Error("Upload failed"));
          });

          const apiUrl = import.meta.env.VITE_API_URL || 
            (import.meta.env.PROD ? "" : "http://localhost:3001");
          
          xhr.open("POST", `${apiUrl}${uploadEndpoint}`);
          Object.keys(headers).forEach(key => {
            xhr.setRequestHeader(key, headers[key]);
          });
          xhr.send(formData);
        });
      }

      setUploadedUrls(prev => ({ ...prev, [index]: url }));
      setUploading(prev => ({ ...prev, [index]: false }));
      return url;
    } catch (error) {
      console.error("Upload error:", error);
      setUploading(prev => ({ ...prev, [index]: false }));
      throw error;
    }
  }, [onUpload, autoUpload, uploadEndpoint]);

  // Handle file selection
  const handleFiles = useCallback(async (fileList) => {
    const fileArray = Array.from(fileList);
    const validFiles = [];
    const errors = [];

    for (let i = 0; i < fileArray.length; i++) {
      const file = fileArray[i];
      const validation = validateFile(file);
      
      if (validation.valid) {
        validFiles.push(file);
      } else {
        errors.push({ file: file.name, error: validation.error });
      }
    }

    if (errors.length > 0) {
      // Show errors (you can customize this)
      console.error("File validation errors:", errors);
    }

    if (validFiles.length > 0) {
      if (multiple) {
        onFileSelect?.(validFiles);
        // Upload files if auto-upload is enabled
        if (autoUpload || onUpload) {
          const currentFilesCount = Array.isArray(files) ? files.length : (files ? 1 : 0);
          for (let i = 0; i < validFiles.length; i++) {
            await uploadFile(validFiles[i], currentFilesCount + i);
          }
        }
      } else {
        onFileSelect?.(validFiles[0]);
        // Upload file if auto-upload is enabled
        if (autoUpload || onUpload) {
          await uploadFile(validFiles[0], 0);
        }
      }
    }
  }, [validateFile, multiple, onFileSelect, autoUpload, onUpload, uploadFile]);

  // Handle drag events
  const handleDragEnter = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFiles(files);
    }
  }, [handleFiles]);

  // Handle file input change
  const handleFileInputChange = useCallback((e) => {
    const files = e.target.files;
    if (files.length > 0) {
      handleFiles(files);
    }
    // Reset input to allow selecting the same file again
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }, [handleFiles]);

  // Handle remove file
  const handleRemove = useCallback((index) => {
    if (multiple && Array.isArray(files)) {
      const newFiles = files.filter((_, i) => i !== index);
      onFileSelect?.(newFiles);
      onFileRemove?.(index);
    } else {
      onFileSelect?.(null);
      onFileRemove?.(files);
    }
    
    // Clear upload state
    setUploadProgress(prev => {
      const newProgress = { ...prev };
      delete newProgress[index];
      return newProgress;
    });
    setUploading(prev => {
      const newUploading = { ...prev };
      delete newUploading[index];
      return newUploading;
    });
    setUploadedUrls(prev => {
      const newUrls = { ...prev };
      delete newUrls[index];
      return newUrls;
    });
  }, [multiple, files, onFileSelect, onFileRemove]);

  // Get file preview - create object URL on demand
  const getFilePreview = (file) => {
    if (file.type?.startsWith("image/")) {
      return URL.createObjectURL(file);
    }
    return null;
  };

  // Get file icon
  const getFileIcon = (file) => {
    if (file.type === "application/pdf") {
      return <File className="h-8 w-8 text-red-500" />;
    }
    if (file.type?.startsWith("image/")) {
      return <FileImage className="h-8 w-8 text-blue-500" />;
    }
    return <File className="h-8 w-8 text-gray-500" />;
  };

  // Format file size
  const formatFileSize = (bytes) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + " " + sizes[i];
  };

  const displayFiles = multiple && Array.isArray(files) 
    ? (files || []) 
    : (files ? [files] : []);

  return (
    <div className={cn("space-y-2", className)}>
      {label && (
        <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}
      
      <div
        className={cn(
          "border-2 border-dashed rounded-lg p-4 transition-colors cursor-pointer",
          isDragging
            ? "border-primary bg-primary/5"
            : error
            ? "border-red-500"
            : "border-gray-300 hover:border-gray-400",
          "relative"
        )}
        onDragEnter={handleDragEnter}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => !multiple && fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          accept={acceptedExtensions.join(",")}
          multiple={multiple}
          onChange={handleFileInputChange}
        />

        {displayFiles.length === 0 ? (
          <div className="text-center py-4">
            <Upload className={cn(
              "h-8 w-8 mx-auto mb-2",
              isDragging ? "text-primary" : "text-gray-400"
            )} />
            <p className={cn(
              "text-sm",
              isDragging ? "text-primary font-medium" : "text-gray-500"
            )}>
              {placeholder}
            </p>
            {!multiple && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="mt-2"
                onClick={(e) => {
                  e.stopPropagation();
                  fileInputRef.current?.click();
                }}
              >
                Choose File
              </Button>
            )}
          </div>
        ) : (
          <div className="space-y-2">
            {displayFiles.map((file, index) => {
              const preview = getFilePreview(file);
              const isUploading = uploading[index];
              const progress = uploadProgress[index] || 0;
              const uploadedUrl = uploadedUrls[index];

              return (
                <div
                  key={index}
                  className="flex items-center gap-3 p-2 border rounded-lg bg-gray-50"
                >
                  {preview ? (
                    <img
                      src={preview}
                      alt={file.name}
                      className="h-16 w-16 object-cover rounded"
                    />
                  ) : (
                    <div className="h-16 w-16 flex items-center justify-center bg-gray-100 rounded">
                      {getFileIcon(file)}
                    </div>
                  )}
                  
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{file.name}</p>
                    <p className="text-xs text-gray-500">
                      {formatFileSize(file.size)}
                    </p>
                    {isUploading && (
                      <div className="mt-1">
                        <Progress value={progress} className="h-1" />
                        <p className="text-xs text-gray-500 mt-1">
                          Uploading... {Math.round(progress)}%
                        </p>
                      </div>
                    )}
                    {uploadedUrl && !isUploading && (
                      <p className="text-xs text-green-600 mt-1">
                        ✓ Uploaded successfully
                      </p>
                    )}
                  </div>

                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRemove(index);
                    }}
                    disabled={isUploading}
                  >
                    {isUploading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <X className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              );
            })}

            {multiple && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="w-full"
                onClick={(e) => {
                  e.stopPropagation();
                  fileInputRef.current?.click();
                }}
              >
                <Upload className="h-4 w-4 mr-2" />
                Add More Files
              </Button>
            )}
          </div>
        )}
      </div>

      {error && (
        <p className="text-sm text-red-500">{error}</p>
      )}
    </div>
  );
}

