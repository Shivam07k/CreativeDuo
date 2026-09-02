import { Router, Response } from 'express';
import { supabase } from '../../supabase';
import { verifyAdmin, AdminRequest } from '../../middleware/auth';

const router = Router();

router.use(verifyAdmin);

router.get('/', async (_req: AdminRequest, res: Response): Promise<void> => {
  try {
    const { data, error } = await supabase
      .from('site_settings').select('key, value').order('key');
    if (error) { res.status(500).json({ error: error.message }); return; }

    const map: Record<string, string> = {};
    (data || []).forEach((row: any) => { map[row.key] = row.value; });
    res.json({ data: map });
  } catch {
    res.status(500).json({ error: 'Failed to list settings' });
  }
});

router.put('/', async (req: AdminRequest, res: Response): Promise<void> => {
  try {
    const settings = req.body;
    if (!settings || typeof settings !== 'object') {
      res.status(400).json({ error: 'Body must be a { key: value } object' });
      return;
    }

    const upserts = Object.entries(settings).map(([key, value]) =>
      supabase.from('site_settings')
        .upsert({ key, value: String(value), updated_at: new Date().toISOString() }, { onConflict: 'key' })
        .select()
        .single()
    );

    const results = await Promise.all(upserts);
    const errors = results.filter((r) => r.error);
    if (errors.length > 0) {
      res.status(500).json({ error: 'Failed to update some settings' });
      return;
    }

    res.json({ data: results.map((r) => r.data) });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update settings' });
  }
});

router.put('/:key', async (req: AdminRequest, res: Response): Promise<void> => {
  try {
    const { key } = req.params;
    const { value } = req.body;

    if (value === undefined) {
      res.status(400).json({ error: 'Value is required' });
      return;
    }

    const { data, error } = await supabase
      .from('site_settings')
      .upsert({ key, value: String(value), updated_at: new Date().toISOString() }, { onConflict: 'key' })
      .select()
      .single();

    if (error) { res.status(500).json({ error: error.message }); return; }
    res.json({ data });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update setting' });
  }
});

export default router;
