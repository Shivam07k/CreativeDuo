import { Router, Request, Response } from 'express';
import { supabase } from '../supabase';

const router = Router();

router.get('/settings', async (_req: Request, res: Response): Promise<void> => {
  try {
    const { data, error } = await supabase
      .from('site_settings')
      .select('key, value');

    if (error) {
      res.status(500).json({ error: error.message });
      return;
    }

    const settings: Record<string, string> = {};
    (data || []).forEach((item: any) => {
      settings[item.key] = item.value;
    });

    res.json({ data: settings });
  } catch (err) {
    console.error('Get settings error:', err);
    res.status(500).json({ error: 'Failed to fetch settings' });
  }
});

router.get('/design-tokens', async (_req: Request, res: Response): Promise<void> => {
  try {
    const { data, error } = await supabase
      .from('design_tokens')
      .select('*')
      .eq('is_active', true)
      .order('type')
      .order('key');

    if (error) {
      res.status(500).json({ error: error.message });
      return;
    }

    res.json({ data });
  } catch (err) {
    console.error('Get design tokens error:', err);
    res.status(500).json({ error: 'Failed to fetch design tokens' });
  }
});

router.get('/menus/:location', async (req: Request, res: Response): Promise<void> => {
  try {
    const { location } = req.params;

    const { data: menu, error: menuError } = await supabase
      .from('menus')
      .select('*')
      .eq('location', location)
      .single();

    if (menuError || !menu) {
      res.status(404).json({ error: 'Menu not found' });
      return;
    }

    const { data: items, error: itemsError } = await supabase
      .from('menu_items')
      .select('*')
      .eq('menu_id', menu.id)
      .eq('is_visible', true)
      .order('display_order');

    if (itemsError) {
      res.status(500).json({ error: itemsError.message });
      return;
    }

    const enrichedItems = await Promise.all(
      (items || []).map(async (item: any) => {
        let resolved_target = null;

        if (item.type === 'page' && item.page_id) {
          const { data: page } = await supabase
            .from('pages')
            .select('title, slug')
            .eq('id', item.page_id)
            .single();
          resolved_target = page;
        } else if (item.type === 'category' && item.category_id) {
          const { data: category } = await supabase
            .from('categories')
            .select('name, slug')
            .eq('id', item.category_id)
            .single();
          resolved_target = category;
        }

        return { ...item, resolved_target };
      })
    );

    const buildTree = (parentId: string | null): any[] => {
      return enrichedItems
        .filter((item) => item.parent_id === parentId)
        .map((item) => ({
          ...item,
          children: buildTree(item.id),
        }));
    };

    const tree = buildTree(null);

    res.json({
      data: {
        ...menu,
        items: tree,
      },
    });
  } catch (err) {
    console.error('Get menu error:', err);
    res.status(500).json({ error: 'Failed to fetch menu' });
  }
});

router.get('/pages/:slug', async (req: Request, res: Response): Promise<void> => {
  try {
    const { slug } = req.params;

    const { data: page, error } = await supabase
      .from('pages')
      .select('*')
      .eq('slug', slug)
      .eq('is_visible', true)
      .single();

    if (error || !page) {
      res.status(404).json({ error: 'Page not found' });
      return;
    }

    const { data: sections, error: sectionsError } = await supabase
      .from('page_sections')
      .select('*')
      .eq('page_id', page.id)
      .eq('is_visible', true)
      .order('display_order');

    if (sectionsError) {
      res.status(500).json({ error: sectionsError.message });
      return;
    }

    res.json({
      data: {
        ...page,
        sections: sections || [],
      },
    });
  } catch (err) {
    console.error('Get page error:', err);
    res.status(500).json({ error: 'Failed to fetch page' });
  }
});

router.get('/categories', async (_req: Request, res: Response): Promise<void> => {
  try {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .eq('is_visible', true)
      .order('display_order');

    if (error) {
      res.status(500).json({ error: error.message });
      return;
    }

    res.json({ data });
  } catch (err) {
    console.error('Get categories error:', err);
    res.status(500).json({ error: 'Failed to fetch categories' });
  }
});

router.get('/categories/:slug', async (req: Request, res: Response): Promise<void> => {
  try {
    const { slug } = req.params;

    const { data: category, error } = await supabase
      .from('categories')
      .select('*')
      .eq('slug', slug)
      .eq('is_visible', true)
      .single();

    if (error || !category) {
      res.status(404).json({ error: 'Category not found' });
      return;
    }

    const { data: products, error: productsError } = await supabase
      .from('products')
      .select('*')
      .eq('category_id', category.id)
      .eq('is_visible', true)
      .order('display_order');

    if (productsError) {
      res.status(500).json({ error: productsError.message });
      return;
    }

    res.json({
      data: {
        ...category,
        products: products || [],
      },
    });
  } catch (err) {
    console.error('Get category error:', err);
    res.status(500).json({ error: 'Failed to fetch category' });
  }
});

router.get('/products', async (req: Request, res: Response): Promise<void> => {
  try {
    const { category, featured, limit, ids } = req.query;

    let query = supabase
      .from('products')
      .select('*, categories!inner(slug, name)')
      .eq('is_visible', true)
      .order('display_order');

    if (category) {
      query = query.eq('categories.slug', category as string);
    }

    if (featured === 'true') {
      query = query.eq('is_featured', true);
    }

    let data: any;
    let error: any;

    if (ids) {
      const idList = (ids as string)
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);
      if (idList.length > 0) {
        const result = await query.in('id', idList);
        data = result.data;
        error = result.error;
      } else {
        data = [];
        error = null;
      }
    } else if (limit !== undefined && limit !== '') {
      const count = Math.max(0, Number(limit) || 0);
      const result = await query.range(0, Math.max(0, count - 1));
      data = result.data;
      error = result.error;
    } else {
      const result = await query;
      data = result.data;
      error = result.error;
    }

    if (error) {
      res.status(500).json({ error: error.message });
      return;
    }

    const enriched = (data || []).map((p: any) => {
      const { categories, ...product } = p;
      return {
        ...product,
        category_slug: categories?.slug || null,
        category_name: categories?.name || null,
      };
    });

    res.json({ data: enriched });
  } catch (err) {
    console.error('Get products error:', err);
    res.status(500).json({ error: 'Failed to fetch products' });
  }
});

router.get('/products/:slug', async (req: Request, res: Response): Promise<void> => {
  try {
    const { slug } = req.params;

    const { data, error } = await supabase
      .from('products')
      .select('*, categories(slug, name)')
      .eq('slug', slug)
      .eq('is_visible', true)
      .single();

    if (error || !data) {
      res.status(404).json({ error: 'Product not found' });
      return;
    }

    const { categories, ...product } = data as any;

    res.json({
      data: {
        ...product,
        category: categories || null,
      },
    });
  } catch (err) {
    console.error('Get product error:', err);
    res.status(500).json({ error: 'Failed to fetch product' });
  }
});

export default router;
