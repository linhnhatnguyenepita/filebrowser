import { ArrowDown, ArrowUp } from "lucide-react";
import type { FileInfo } from "@/lib/api/resources";
import { useFileStore } from "@/lib/stores/file-store";
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
} from "@/components/ui/table";
import FileRow from "./FileRow";
import FileContextMenu from "./FileContextMenu";

interface FileListProps {
  items: FileInfo[];
  onNavigate: (path: string) => void;
}

type SortField = "name" | "size" | "modified";

export default function FileList({ items, onNavigate }: FileListProps) {
  const { sortBy, sortAsc, setSorting } = useFileStore();

  const handleSort = (field: SortField) => {
    if (sortBy === field) {
      setSorting(field, !sortAsc);
    } else {
      setSorting(field, true);
    }
  };

  const SortIndicator = ({ field }: { field: SortField }) => {
    if (sortBy !== field) return null;
    return sortAsc ? <ArrowUp size={12} /> : <ArrowDown size={12} />;
  };

  if (items.length === 0) {
    return (
      <div
        className="flex items-center justify-center h-full text-sm text-muted-foreground"
      >
        This folder is empty
      </div>
    );
  }

  return (
    <Table className="table-fixed">
      <TableHeader>
        <TableRow>
          <TableHead className="w-10 pr-0">
            <span className="sr-only">Select</span>
          </TableHead>
          <TableHead className="w-10 pr-0">
            <span className="sr-only">Icon</span>
          </TableHead>
          <TableHead
            onClick={() => handleSort("name")}
            className="cursor-pointer select-none"
          >
            <span className="flex items-center gap-1">
              Name <SortIndicator field="name" />
            </span>
          </TableHead>
          <TableHead
            onClick={() => handleSort("size")}
            className="w-24 cursor-pointer select-none"
          >
            <span className="flex items-center gap-1">
              Size <SortIndicator field="size" />
            </span>
          </TableHead>
          <TableHead
            onClick={() => handleSort("modified")}
            className="w-44 cursor-pointer select-none"
          >
            <span className="flex items-center gap-1">
              Modified <SortIndicator field="modified" />
            </span>
          </TableHead>
          <TableHead className="w-24">Type</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {items.map((item) => (
          <FileContextMenu key={item.name} item={item}>
            <FileRow item={item} onNavigate={onNavigate} />
          </FileContextMenu>
        ))}
      </TableBody>
    </Table>
  );
}
