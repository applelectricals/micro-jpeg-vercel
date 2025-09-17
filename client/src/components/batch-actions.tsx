import { RefreshCw, Trash2, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

interface BatchActionsProps {
  totalFiles: number;
  completedFiles: number;
  pendingFiles: number;
  failedFiles: number;
  onClearAll: () => void;
  onRetryFailed: () => void;
  onDownloadAll: () => void;
}

export default function BatchActions({
  totalFiles,
  completedFiles,
  pendingFiles,
  failedFiles,
  onClearAll,
  onRetryFailed,
  onDownloadAll,
}: BatchActionsProps) {
  const { toast } = useToast();
  
  const getStatusText = () => {
    if (pendingFiles > 0) {
      return `${completedFiles} of ${totalFiles} files processed • ${pendingFiles} pending`;
    }
    if (failedFiles > 0) {
      return `${completedFiles} completed • ${failedFiles} failed`;
    }
    return `${completedFiles} files processed successfully`;
  };

  return (
    <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6 mt-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Batch Operations</h3>
          <p className="text-sm text-gray-500">{getStatusText()}</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Button
            variant="outline"
            onClick={() => {
              toast({
                title: "Clear All Files?",
                description: "This will delete all compressed images and cannot be undone.",
                action: (
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => onClearAll()}
                  >
                    Clear
                  </Button>
                ),
              });
            }}
          >
            <Trash2 className="mr-2" size={16} />
            Clear All
          </Button>
          {failedFiles > 0 && (
            <Button
              onClick={onRetryFailed}
              variant="secondary"
            >
              <RefreshCw className="mr-2" size={16} />
              Retry Failed
            </Button>
          )}
          {completedFiles > 0 && (
            <Button
              onClick={onDownloadAll}
              variant="default"
            >
              <Download className="mr-2" size={16} />
              Download All (ZIP)
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
