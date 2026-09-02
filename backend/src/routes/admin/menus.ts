import { Router, Response } from 'express';
import { supabase } from '../../supabase';
import { verifyAdmin, AdminRequest } from '../../middleware/auth';

const router = Router();

router.use(verifyAdmin);

router.get('/', async (req: AdminRequest, res: Response): Promise<void> => {
  try {
    const { data, error } = await supabase
      .from('menus')
      .select('*')
      .order('name');

    if (error) {
      res.status(500).json({ error: error.message });
      return;
    }

    res.json({ data });
  } catch (err) {
    console.error('List menus error:', err);
    res.status(500).json({ error: 'Failed to list menus' });
  }
});

router.post('/', async (req: AdminRequest, res: Response): Promise<void> => {
  try {
    const { name, location } = req.body;

    if (!name || !location) {
      res.status(400).json({ error: 'Name and location are required' });
      return;
    }

    const { data, error } = await supabase
      .from('menus')
      .insert({ name, location })
      .select()
      .single();

    if (error) {
      res.status(500).json({ error: error.message });
      return;
    }

    res.status(201).json({ data });
  } catch (err) {
    console.error('Create menu error:', err);
    res.status(500).json({ error: 'Failed to create menu' });
  }
});

router.put('/:id', async (req: AdminRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { name, location } = req.body;

    const { data, error } = await supabase
      .from('menus')
      .update({ name, location, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      res.status(500).json({ error: error.message });
      return;
    }

    if (!data) {
      res.status(404).json({ error: 'Menu not found' });
      return;
    }

    res.json({ data });
  } catch (err) {
    console.error('Update menu error:', err);
    res.status(500).json({ error: 'Failed to update menu' });
  }
});

router.delete('/:id', async (req: AdminRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    await supabase
      .from('menu_items')
      .delete()
      .eq('menu_id', id);

    const { error } = await supabase
      .from('menus')
      .delete()
      .eq('id', id);

    if (error) {
      res.status(500).json({ error: error.message });
      return;
    }

    res.json({ data: { deleted: true } });
  } catch (err) {
    console.error('Delete menu error:', err);
    res.status(500).json({ error: 'Failed to delete menu' });
  }
});

router.get('/:id', async (req: AdminRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { data, error } = await supabase
      .from('menus')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !data) {
      res.status(404).json({ error: 'Menu not found' });
      return;
    }

    res.json({ data });
  } catch (err) {
    res.status(500).json({ error: 'Failed to get menu' });
  }
});

export default router;
