import { Router, Response } from 'express';
import { supabase } from '../supabase';
import { verifyAdmin, AdminRequest } from '../middleware/auth';

const router = Router();

router.post('/login', async (req: AdminRequest, res: Response): Promise<void> => {
  try {
    const { email, username, password } = req.body;

    if ((!email && !username) || !password) {
      res.status(400).json({ error: 'Username/email and password are required' });
      return;
    }

    // Resolve username -> email (Supabase Auth signs in with email)
    let loginEmail: string = email || '';
    if (!loginEmail) {
      const { data: profile } = await supabase
        .from('admin_profiles')
        .select('email')
        .eq('username', username)
        .maybeSingle();

      if (!profile?.email) {
        res.status(401).json({ error: 'Invalid username or password' });
        return;
      }
      loginEmail = profile.email;
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email: loginEmail,
      password,
    });

    if (error) {
      res.status(401).json({ error: error.message });
      return;
    }

    const token = data.session?.access_token;
    if (!token) {
      res.status(500).json({ error: 'Failed to obtain access token' });
      return;
    }

    const userId = data.user.id;

    const { data: profile, error: profileError } = await supabase
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

    res.json({
      token,
      user: {
        id: data.user.id,
        email: data.user.email || '',
        role: profile.role,
      },
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Login failed' });
  }
});

router.get('/me', verifyAdmin, async (req: AdminRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Not authenticated' });
      return;
    }

    const { data: profile, error } = await supabase
      .from('admin_profiles')
      .select('*')
      .eq('id', req.user.id)
      .single();

    if (error) {
      res.status(404).json({ error: 'Profile not found' });
      return;
    }

    res.json({
      data: {
        id: req.user.id,
        email: req.user.email,
        ...profile,
      },
    });
  } catch (err) {
    console.error('Get profile error:', err);
    res.status(500).json({ error: 'Failed to get profile' });
  }
});

export default router;
