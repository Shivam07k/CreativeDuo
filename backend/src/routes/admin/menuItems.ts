import { Router, Response } from 'express';
import { supabase } from '../../supabase';
import { verifyAdmin, AdminRequest } from '../../middleware/auth';

const router = Router();

router.use(verifyAdmin);

router.get('/', async (req: AdminRequest, res: Response): Promise<void> => {
  try {
    const { menuId } = req.query;

    let query = supabase
      .from('menu_items')
      .select('*')
      .order('display_order');

    if (menuId) {
      query = query.eq('menu_id', menuId as string);
    }

    const { data, error } = await query;

    if (error) {
      res.status(500).json({ error: error.message });
      return;
    }

    const enriched = await Promise.all(
      (data || []).map(async (item: any) => {
        let page_title: string | null = null;
        let category_slug: string | null = null;

        if (item.type === 'page' && item.page_id) {
          const { data: page } = await supabase
            .from('pages').select('title').eq('id', item.page_id).single();
          page_title = page?.title || null;
        } else if (item.type === 'category' && item.category_id) {
          const { data: category } = await supabase
            .from('categories').select('slug').eq('id', item.category_id).single();
          category_slug = category?.slug || null;
        }

        return { ...item, page_title, category_slug };
      })
    );

    res.json({ data: enriched });
  } catch (err) {
    console.error('List menu items error:', err);
    res.status(500).json({ error: 'Failed to list menu items' });
  }
});

router.post('/', async (req: AdminRequest, res: Response): Promise<void> => {
  try {
    const { menu_id, parent_id, label, type, page_id, category_id, url, display_order, is_visible } = req.body;

    if (!menu_id || !label || !type) {
      res.status(400).json({ error: 'menu_id, label, and type are required' });
      return;
    }

    const insertPayload: Record<string, any> = {
      menu_id,
      parent_id: parent_id || null,
      label,
      type,
      url: url || null,
      display_order: display_order ?? 0,
      is_visible: is_visible ?? true,
    };

    if (type === 'page') insertPayload.page_id = page_id || null;
    if (type === 'category') insertPayload.category_id = category_id || null;

    const { data, error } = await supabase
      .from('menu_items')
      .insert(insertPayload)
      .select()
      .single();

    if (error) {
      res.status(500).json({ error: error.message });
      return;
    }

    res.status(201).json({ data });
  } catch (err) {
    console.error('Create menu item error:', err);
    res.status(500).json({ error: 'Failed to create menu item' });
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
      supabase
        .from('menu_items')
        .update({ display_order: item.display_order, updated_at: new Date().toISOString() })
        .eq('id', item.id)
    );

    const results = await Promise.all(updates);

    const errors = results.filter((r) => r.error);
    if (errors.length > 0) {
      res.status(500).json({ error: 'Failed to reorder some menu items' });
      return;
    }

    res.json({ data: { reordered: items.length } });
  } catch (err) {
    console.error('Reorder menu items error:', err);
    res.status(500).json({ error: 'Failed to reorder menu items' });
  }
});

router.put('/:id', async (req: AdminRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const { data, error } = await supabase
      .from('menu_items')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      res.status(500).json({ error: error.message });
      return;
    }

    if (!data) {
      res.status(404).json({ error: 'Menu item not found' });
      return;
    }

    res.json({ data });
  } catch (err) {
    console.error('Update menu item error:', err);
    res.status(500).json({ error: 'Failed to update menu item' });
  }
});

router.delete('/:id', async (req: AdminRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const { error } = await supabase
      .from('menu_items')
      .delete()
      .eq('id', id);

    if (error) {
      res.status(500).json({ error: error.message });
      return;
    }

    res.json({ data: { deleted: true } });
  } catch (err) {
    console.error('Delete menu item error:', err);
    res.status(500).json({ error: 'Failed to delete menu item' });
  }
});

export default router;
