import { Router, Response } from 'express';
import { supabase } from '../../supabase';
import { verifyAdmin, AdminRequest } from '../../middleware/auth';

const router = Router();

router.use(verifyAdmin);

router.get('/', async (_req: AdminRequest, res: Response): Promise<void> => {
  try {
    const { data, error } = await supabase
      .from('design_tokens')
      .select('*')
      .order('type')
      .order('key');

    if (error) {
      res.status(500).json({ error: error.message });
      return;
    }

    res.json({ data });
  } catch (err) {
    console.error('List design tokens error:', err);
    res.status(500).json({ error: 'Failed to list design tokens' });
  }
});

router.post('/', async (req: AdminRequest, res: Response): Promise<void> => {
  try {
    const { type, key, value, description, is_active } = req.body;

    if (!type || !key || !value) {
      res.status(400).json({ error: 'type, key, and value are required' });
      return;
    }

    const { data, error } = await supabase
      .from('design_tokens')
      .insert({ type, key, value, description, is_active: is_active ?? true })
      .select()
      .single();

    if (error) {
      res.status(500).json({ error: error.message });
      return;
    }

    res.status(201).json({ data });
  } catch (err) {
    console.error('Create design token error:', err);
    res.status(500).json({ error: 'Failed to create design token' });
  }
});

router.put('/:id', async (req: AdminRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const { data, error } = await supabase
      .from('design_tokens')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      res.status(500).json({ error: error.message });
      return;
    }

    if (!data) {
      res.status(404).json({ error: 'Design token not found' });
      return;
    }

    res.json({ data });
  } catch (err) {
    console.error('Update design token error:', err);
    res.status(500).json({ error: 'Failed to update design token' });
  }
});

router.delete('/:id', async (req: AdminRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const { error } = await supabase
      .from('design_tokens')
      .delete()
      .eq('id', id);

    if (error) {
      res.status(500).json({ error: error.message });
      return;
    }

    res.json({ data: { deleted: true } });
  } catch (err) {
    console.error('Delete design token error:', err);
    res.status(500).json({ error: 'Failed to delete design token' });
  }
});

export default router;
