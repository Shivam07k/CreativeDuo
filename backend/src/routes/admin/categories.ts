import { Router, Response } from 'express';
import { supabase } from '../../supabase';
import { verifyAdmin, AdminRequest } from '../../middleware/auth';

const router = Router();

router.use(verifyAdmin);

router.get('/', async (_req: AdminRequest, res: Response): Promise<void> => {
  try {
    const { data, error } = await supabase
      .from('categories').select('*').order('display_order');
    if (error) { res.status(500).json({ error: error.message }); return; }
    res.json({ data });
  } catch (err) {
    res.status(500).json({ error: 'Failed to list categories' });
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
      supabase.from('categories')
        .update({ display_order: item.display_order, updated_at: new Date().toISOString() })
        .eq('id', item.id)
    );

    const results = await Promise.all(updates);
    const errors = results.filter((r) => r.error);
    if (errors.length > 0) { res.status(500).json({ error: 'Failed to reorder some categories' }); return; }

    res.json({ data: { reordered: items.length } });
  } catch (err) {
    res.status(500).json({ error: 'Failed to reorder categories' });
  }
});

router.get('/:id', async (req: AdminRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { data, error } = await supabase
      .from('categories').select('*').eq('id', id).single();
    if (error || !data) { res.status(404).json({ error: 'Category not found' }); return; }
    res.json({ data });
  } catch (err) {
    res.status(500).json({ error: 'Failed to get category' });
  }
});

router.post('/', async (req: AdminRequest, res: Response): Promise<void> => {
  try {
    const { name, slug, description, image_url, display_order, is_visible } = req.body;
    if (!name || !slug) { res.status(400).json({ error: 'Name and slug are required' }); return; }

    const { data, error } = await supabase
      .from('categories')
      .insert({
        name, slug, description: description || null, image_url: image_url || null,
        display_order: display_order ?? 0, is_visible: is_visible ?? true,
      })
      .select().single();

    if (error) { res.status(500).json({ error: error.message }); return; }
    res.status(201).json({ data });
  } catch (err) {
    res.status(500).json({ error: 'Failed to create category' });
  }
});

router.put('/:id', async (req: AdminRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { data, error } = await supabase
      .from('categories')
      .update({ ...req.body, updated_at: new Date().toISOString() })
      .eq('id', id).select().single();
    if (error) { res.status(500).json({ error: error.message }); return; }
    if (!data) { res.status(404).json({ error: 'Category not found' }); return; }
    res.json({ data });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update category' });
  }
});

router.delete('/:id', async (req: AdminRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { error } = await supabase.from('categories').delete().eq('id', id);
    if (error) { res.status(500).json({ error: error.message }); return; }
    res.json({ data: { deleted: true } });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete category' });
  }
});

export default router;
