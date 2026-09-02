import { Router, Response } from 'express';
import { supabase } from '../../supabase';
import { verifyAdmin, AdminRequest } from '../../middleware/auth';

const router = Router();

router.use(verifyAdmin);

router.get('/', async (req: AdminRequest, res: Response): Promise<void> => {
  try {
    const { pageId } = req.query;

    let query = supabase
      .from('page_sections')
      .select('*')
      .order('display_order');

    if (pageId) {
      query = query.eq('page_id', pageId as string);
    }

    const { data, error } = await query;
    if (error) { res.status(500).json({ error: error.message }); return; }
    res.json({ data });
  } catch (err) {
    res.status(500).json({ error: 'Failed to list page sections' });
  }
});

router.post('/', async (req: AdminRequest, res: Response): Promise<void> => {
  try {
    const { page_id, section_type, title, subtitle, content, image_url, background_color, text_color, display_order, is_visible } = req.body;
    if (!page_id || !section_type) { res.status(400).json({ error: 'page_id and section_type are required' }); return; }

    let parsedContent = content;
    if (typeof parsedContent === 'string') {
      try { parsedContent = JSON.parse(parsedContent); } catch { parsedContent = {}; }
    }

    const { data, error } = await supabase
      .from('page_sections')
      .insert({
        page_id,
        section_type,
        title: title || null,
        subtitle: subtitle || null,
        content: parsedContent || {},
        image_url: image_url || null,
        background_color: background_color || null,
        text_color: text_color || null,
        display_order: display_order ?? 0,
        is_visible: is_visible ?? true,
      })
      .select().single();

    if (error) { res.status(500).json({ error: error.message }); return; }
    res.status(201).json({ data });
  } catch (err) {
    res.status(500).json({ error: 'Failed to create page section' });
  }
});

router.put('/reorder', async (req: AdminRequest, res: Response): Promise<void> => {
  try {
    const { items } = req.body;
    if (!Array.isArray(items)) {
      res.status(400).json({ error: 'Items must be an array of { id, display_order }' });
      return;
    }

    const updates = items.map((item: { id: string; display_order: number }) =>
      supabase.from('page_sections')
        .update({ display_order: item.display_order, updated_at: new Date().toISOString() })
        .eq('id', item.id)
    );

    const results = await Promise.all(updates);
    const errors = results.filter((r) => r.error);
    if (errors.length > 0) { res.status(500).json({ error: 'Failed to reorder some sections' }); return; }

    res.json({ data: { reordered: items.length } });
  } catch (err) {
    res.status(500).json({ error: 'Failed to reorder sections' });
  }
});

router.put('/:id', async (req: AdminRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const body = { ...req.body };
    if (typeof body.content === 'string') {
      try { body.content = JSON.parse(body.content); } catch { /* keep original */ }
    }
    const { data, error } = await supabase
      .from('page_sections')
      .update({ ...body, updated_at: new Date().toISOString() })
      .eq('id', id).select().single();

    if (error) { res.status(500).json({ error: error.message }); return; }
    if (!data) { res.status(404).json({ error: 'Page section not found' }); return; }
    res.json({ data });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update page section' });
  }
});

router.delete('/:id', async (req: AdminRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { error } = await supabase.from('page_sections').delete().eq('id', id);
    if (error) { res.status(500).json({ error: error.message }); return; }
    res.json({ data: { deleted: true } });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete page section' });
  }
});

export default router;
