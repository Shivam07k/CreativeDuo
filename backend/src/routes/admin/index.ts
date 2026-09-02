import { Router } from 'express';
import designTokensRouter from './designTokens';
import menusRouter from './menus';
import menuItemsRouter from './menuItems';
import pagesRouter from './pages';
import pageSectionsRouter from './pageSections';
import categoriesRouter from './categories';
import productsRouter from './products';
import settingsRouter from './settings';
import uploadRouter from './upload';

const router = Router();

router.use('/design-tokens', designTokensRouter);
router.use('/menus', menusRouter);
router.use('/menu-items', menuItemsRouter);
router.use('/pages', pagesRouter);
router.use('/page-sections', pageSectionsRouter);
router.use('/categories', categoriesRouter);
router.use('/products', productsRouter);
router.use('/settings', settingsRouter);
router.use('/upload', uploadRouter);

export default router;
