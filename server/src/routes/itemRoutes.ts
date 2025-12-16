import { Router } from 'express';
import { getItems, createItem, updateItem, updatePrice, restockItem } from '../controllers/itemController';

const router = Router();

router.get('/', getItems);
router.post('/', createItem);
router.put('/:id', updateItem);
router.put('/:id/price', updatePrice);
router.post('/restock', restockItem);

export default router;
