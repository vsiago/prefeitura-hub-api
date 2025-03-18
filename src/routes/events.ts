import express from 'express';
import { check } from 'express-validator';
import {
  getEvents,
  getEvent,
  createEvent,
  updateEvent,
  deleteEvent,
  attendEvent,
  unattendEvent,
  getCalendar
} from '../controllers/eventController';
import { protect, authorize } from '../middleware/auth';

const router = express.Router();

// Aplicar middleware de proteção a todas as rotas
router.use(protect);

// @route   GET /api/events
// @desc    Obter todos os eventos
// @access  Private
router.get('/', getEvents);

// @route   GET /api/events/:id
// @desc    Obter evento por ID
// @access  Private
router.get('/:id', getEvent);

// @route   POST /api/events
// @desc    Criar um novo evento
// @access  Private
router.post(
  '/',
  [
    check('title', 'Título é obrigatório').not().isEmpty(),
    check('description', 'Descrição é obrigatória').not().isEmpty(),
    check('location', 'Local é obrigatório').not().isEmpty(),
    check('startDate', 'Data de início é obrigatória').isISO8601(),
    check('endDate', 'Data de término é obrigatória').isISO8601()
  ],
  createEvent
);

// @route   PUT /api/events/:id
// @desc    Atualizar evento
// @access  Private
router.put(
  '/:id',
  [
    check('title', 'Título é obrigatório').optional().not().isEmpty(),
    check('description', 'Descrição é obrigatória').optional().not().isEmpty(),
    check('location', 'Local é obrigatório').optional().not().isEmpty(),
    check('startDate', 'Data de início é obrigatória').optional().isISO8601(),
    check('endDate', 'Data de término é obrigatória').optional().isISO8601()
  ],
  updateEvent
);

// @route   DELETE /api/events/:id
// @desc    Excluir evento
// @access  Private
router.delete('/:id', deleteEvent);

// @route   POST /api/events/:id/attend
// @desc    Confirmar presença em evento
// @access  Private
router.post('/:id/attend', attendEvent);

// @route   DELETE /api/events/:id/attend
// @desc    Cancelar presença em evento
// @access  Private
router.delete('/:id/attend', unattendEvent);

// @route   GET /api/events/calendar
// @desc    Obter calendário de eventos
// @access  Private
router.get('/calendar', getCalendar);

export default router;