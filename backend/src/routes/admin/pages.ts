import { Router, Response } from 'express';
import { supabase } from '../../supabase';
import { verifyAdmin, AdminRequest } from '../../middleware/auth';

const router = Router();

router.use(verifyAdmin);

router.get('/', async (_req: AdminRequest, res: Response): Promise<void> => {
  try {
    const { data, error } = await supabase
      .from('pages')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) { res.status(500).json({ error: error.message }); return; }
    res.json({ data });
  } catch {
    res.status(500).json({ error: 'Failed to list pages' });
  }
});

router.post('/', async (req: AdminRequest, res: Response): Promise<void> => {
  try {
    const { title, slug, meta_title, meta_description, is_visible } = req.body;
    if (!title || !slug) { res.status(400).json({ error: 'Title and slug are required' }); return; }

    const { data, error } = await supabase
      .from('pages')
      .insert({
        title,
        slug,
        meta_title: meta_title || null,
        meta_description: meta_description || null,
        is_visible: is_visible ?? true,
      })
      .select().single();

    if (error) { console.error('Create page error:', error.message); res.status(500).json({ error: error.message }); return; }
    res.status(201).json({ data });
  } catch {
    res.status(500).json({ error: 'Failed to create page' });
  }
});

router.get('/:id', async (req: AdminRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { data: page, error } = await supabase
      .from('pages').select('*').eq('id', id).single();

    if (error || !page) { res.status(404).json({ error: 'Page not found' }); return; }

    const { data: sections } = await supabase
      .from('page_sections').select('*').eq('page_id', id).order('display_order');

    res.json({ data: { ...page, sections: sections || [] } });
  } catch {
    res.status(500).json({ error: 'Failed to get page' });
  }
});

router.put('/:id', async (req: AdminRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { data, error } = await supabase
      .from('pages')
      .update({ ...req.body, updated_at: new Date().toISOString() })
      .eq('id', id).select().single();

    if (error) { res.status(500).json({ error: error.message }); return; }
    if (!data) { res.status(404).json({ error: 'Page not found' }); return; }
    res.json({ data });
  } catch {
    res.status(500).json({ error: 'Failed to update page' });
  }
});

router.delete('/:id', async (req: AdminRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    await supabase.from('page_sections').delete().eq('page_id', id);
    const { error } = await supabase.from('pages').delete().eq('id', id);
    if (error) { res.status(500).json({ error: error.message }); return; }
    res.json({ data: { deleted: true } });
  } catch {
    res.status(500).json({ error: 'Failed to delete page' });
  }
});

export default router;
