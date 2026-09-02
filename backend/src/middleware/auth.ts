import { Response, NextFunction } from 'express';
import { createClient } from '@supabase/supabase-js';
import { AdminRequest, AdminUser } from '../types';
export { AdminRequest };

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const getAuthClient = () =>
  createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

export const verifyAdmin = async (
  req: AdminRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({ error: 'No token provided' });
      return;
    }

    const token = authHeader.split(' ')[1];

    const authClient = getAuthClient();
    const { data, error } = await authClient.auth.getUser(token);

    if (error || !data.user) {
      res.status(401).json({ error: 'Invalid token' });
      return;
    }

    const userId = data.user.id;

    const { data: profile, error: profileError } = await authClient
      .from('admin_profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (profileError || !profile) {
      res.status(403).json({ error: 'Not an admin' });
      return;
    }

    if (profile.role !== 'admin' && profile.role !== 'super_admin') {
      res.status(403).json({ error: 'Insufficient permissions' });
      return;
    }

    req.user = {
      id: userId,
      email: data.user.email || '',
      role: profile.role,
    } as AdminUser;

    next();
  } catch (err) {
    console.error('Auth middleware error:', err);
    res.status(500).json({ error: 'Authentication error' });
  }
};
