import { useState, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Upload } from 'lucide-react';

interface CsvImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  expectedColumns: string[];
  onImport: (rows: Record<string, string>[]) => void;
  loading?: boolean;
}

function parseCsv(text: string): Record<string, string>[] {
  const lines = text.trim().split(/\r?\n/);
  if (lines.length < 2) return [];
  const headers = lines[0].split(',').map(h => h.trim().toLowerCase().replace(/[^a-z0-9_]/g, '_'));
  return lines.slice(1).filter(l => l.trim()).map(line => {
    const values = line.split(',').map(v => v.trim().replace(/^"|"$/g, ''));
    const row: Record<string, string> = {};
    headers.forEach((h, i) => { row[h] = values[i] || ''; });
    return row;
  });
}

export function CsvImportDialog({ open, onOpenChange, title, expectedColumns, onImport, loading }: CsvImportDialogProps) {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<Record<string, string>[]>([]);
  const [error, setError] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setFile(f);
    setError('');
    try {
      const text = await f.text();
      const rows = parseCsv(text);
      if (rows.length === 0) { setError('No data rows found'); return; }
      setPreview(rows.slice(0, 5));
    } catch {
      setError('Failed to parse CSV');
    }
  };

  const handleImport = () => {
    if (!file) return;
    file.text().then(text => {
      const rows = parseCsv(text);
      onImport(rows);
    });
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) { setFile(null); setPreview([]); setError(''); } onOpenChange(v); }}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div
            className="border-2 border-dashed border-border rounded-lg p-6 text-center cursor-pointer hover:border-primary/50 transition-colors"
            onClick={() => fileRef.current?.click()}
          >
            <Upload className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
            <p className="text-sm text-muted-foreground">{file ? file.name : 'Click to select CSV file'}</p>
          </div>
          <input ref={fileRef} type="file" className="hidden" accept=".csv" onChange={handleFile} />

          <p className="text-xs text-muted-foreground">
            Expected columns: <code className="text-foreground">{expectedColumns.join(', ')}</code>
          </p>

          {error && <p className="text-xs text-destructive">{error}</p>}

          {preview.length > 0 && (
            <div className="overflow-x-auto">
              <table className="w-full text-xs border border-border rounded">
                <thead>
                  <tr className="bg-muted">
                    {Object.keys(preview[0]).map(h => <th key={h} className="px-2 py-1 text-left font-medium">{h}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {preview.map((row, i) => (
                    <tr key={i} className="border-t border-border">
                      {Object.values(row).map((v, j) => <td key={j} className="px-2 py-1">{v}</td>)}
                    </tr>
                  ))}
                </tbody>
              </table>
              <p className="text-xs text-muted-foreground mt-1">Showing first {preview.length} rows</p>
            </div>
          )}
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleImport} disabled={loading || !file || preview.length === 0}>
            {loading ? 'Importing...' : 'Import'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
