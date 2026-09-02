import { Router, Response } from 'express';
import { supabase } from '../../supabase';
import { verifyAdmin, AdminRequest } from '../../middleware/auth';

const router = Router();

router.use(verifyAdmin);

router.get('/', async (_req: AdminRequest, res: Response): Promise<void> => {
  try {
    const { data, error } = await supabase
      .from('products').select('*, categories(name, slug)').order('display_order');
    if (error) { res.status(500).json({ error: error.message }); return; }

    const enriched = (data || []).map((p: any) => {
      const { categories, ...product } = p;
      return {
        ...product,
        category_name: categories?.name || null,
        category_slug: categories?.slug || null,
      };
    });

    res.json({ data: enriched });
  } catch (err) {
    res.status(500).json({ error: 'Failed to list products' });
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
      supabase.from('products')
        .update({ display_order: item.display_order, updated_at: new Date().toISOString() })
        .eq('id', item.id)
    );

    const results = await Promise.all(updates);
    const errors = results.filter((r) => r.error);
    if (errors.length > 0) { res.status(500).json({ error: 'Failed to reorder some products' }); return; }

    res.json({ data: { reordered: items.length } });
  } catch (err) {
    res.status(500).json({ error: 'Failed to reorder products' });
  }
});

router.get('/:id', async (req: AdminRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { data, error } = await supabase
      .from('products').select('*, categories(name, slug)').eq('id', id).single();
    if (error || !data) { res.status(404).json({ error: 'Product not found' }); return; }

    const { categories, ...product } = data as any;
    res.json({ data: { ...product, category_name: categories?.name || null, category_slug: categories?.slug || null } });
  } catch (err) {
    res.status(500).json({ error: 'Failed to get product' });
  }
});

router.post('/', async (req: AdminRequest, res: Response): Promise<void> => {
  try {
    const {
      name, slug, description, short_description, price, currency, category_id,
      images, metadata, is_visible, is_featured, display_order,
    } = req.body;

    if (!name || !slug || price === undefined) {
      res.status(400).json({ error: 'Name, slug, and price are required' });
      return;
    }

    const { data, error } = await supabase
      .from('products')
      .insert({
        name, slug, description: description || '', short_description: short_description || null,
        price, currency: currency || 'INR', category_id: category_id || null,
        images: images || [], metadata: metadata || {},
        is_visible: is_visible ?? true, is_featured: is_featured ?? false,
        display_order: display_order ?? 0,
      })
      .select().single();

    if (error) { res.status(500).json({ error: error.message }); return; }
    res.status(201).json({ data });
  } catch (err) {
    res.status(500).json({ error: 'Failed to create product' });
  }
});

router.put('/:id', async (req: AdminRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { data, error } = await supabase
      .from('products')
      .update({ ...req.body, updated_at: new Date().toISOString() })
      .eq('id', id).select().single();
    if (error) { res.status(500).json({ error: error.message }); return; }
    if (!data) { res.status(404).json({ error: 'Product not found' }); return; }
    res.json({ data });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update product' });
  }
});

router.delete('/:id', async (req: AdminRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { error } = await supabase.from('products').delete().eq('id', id);
    if (error) { res.status(500).json({ error: error.message }); return; }
    res.json({ data: { deleted: true } });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete product' });
  }
});

export default router;
