import { useState, useCallback, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { invokeDataProxy } from '@/lib/dataProxy';

export interface ColumnMapping {
  sourceHeader: string;
  mappedField: string;
  confidence: number;
}

export interface ColumnTemplate {
  id: string;
  name: string;
  columnMapping: ColumnMapping[];
  sourceHeaders: string[];
  createdAt: string;
}

export function useColumnTemplates() {
  const { user } = useAuth();
  const [templates, setTemplates] = useState<ColumnTemplate[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) { setTemplates([]); setLoading(false); return; }

    const fetch = async () => {
      setLoading(true);
      const { data, error } = await invokeDataProxy<any[]>('column_templates', 'list');
      if (error) {
        console.error('Failed to load templates:', error);
      } else {
        setTemplates((data || []).map((row: any) => ({
          id: row.id,
          name: row.name,
          columnMapping: row.column_mapping as ColumnMapping[],
          sourceHeaders: row.source_headers as string[],
          createdAt: row.created_at,
        })));
      }
      setLoading(false);
    };

    fetch();
  }, [user]);

  const saveTemplate = useCallback(async (name: string, mapping: ColumnMapping[], sourceHeaders: string[]) => {
    if (!user) return null;
    const { data, error } = await invokeDataProxy<any>('column_templates', 'insert', {
      row: {
        name,
        column_mapping: mapping as any,
        source_headers: sourceHeaders as any,
      },
    });
    if (error || !data) { toast.error('Failed to save template'); return null; }
    const template: ColumnTemplate = {
      id: data.id,
      name: data.name,
      columnMapping: data.column_mapping as unknown as ColumnMapping[],
      sourceHeaders: data.source_headers as unknown as string[],
      createdAt: data.created_at,
    };
    setTemplates(prev => [template, ...prev]);
    toast.success(`Template "${name}" saved`);
    return template;
  }, [user]);

  const deleteTemplate = useCallback(async (id: string) => {
    if (!user) return;
    const { error } = await invokeDataProxy('column_templates', 'delete', { id });
    if (error) { toast.error('Failed to delete template'); return; }
    setTemplates(prev => prev.filter(t => t.id !== id));
    toast.success('Template deleted');
  }, [user]);

  return { templates, loading, saveTemplate, deleteTemplate };
}
