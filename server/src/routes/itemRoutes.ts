import { Router } from 'express';
import { getItems, createItem, updateItem, updatePrice, restockItem, deleteItem } from '../controllers/itemController';

const router = Router();

router.get('/', getItems);
router.post('/', createItem);
router.put('/:id', updateItem);
router.put('/:id/price', updatePrice);
router.post('/restock', restockItem);
router.delete('/:id', deleteItem);

export default router;
