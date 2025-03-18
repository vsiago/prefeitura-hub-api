import { Request, Response, NextFunction } from 'express';
import { validationResult } from 'express-validator';
import Event from '../models/Event';
import User from '../models/User';
import Notification from '../models/Notification';
import ErrorResponse from '../utils/errorResponse';
import asyncHandler from 'express-async-handler';

// @desc    Obter todos os eventos
// @route   GET /api/events
// @access  Private
export const getEvents = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  res.status(200).json(res.advancedResults);
});

// @desc    Obter evento por ID
// @route   GET /api/events/:id
// @access  Private
export const getEvent = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const event = await Event.findById(req.params.id)
    .populate('creator', 'name avatar')
    .populate('attendees', 'name avatar')
    .populate('department', 'name')
    .populate('group', 'name');

  if (!event) {
    return next(new ErrorResponse(`Evento não encontrado com id ${req.params.id}`, 404));
  }

  res.status(200).json({
    success: true,
    data: event
  });
});

// @desc    Criar novo evento
// @route   POST /api/events
// @access  Private
export const createEvent = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  // Adicionar criador ao corpo da requisição
  req.body.creator = req.user.id;

  const event = await Event.create(req.body);

  // Adicionar criador como participante
  event.attendees.push(req.user.id);
  await event.save();

  // Criar notificações para usuários do departamento ou grupo
  if (event.department) {
    const users = await User.find({ department: event.department });
    for (const user of users) {
      if (user._id.toString() !== req.user.id) {
        await Notification.create({
          recipient: user._id,
          type: 'event',
          content: `Novo evento: ${event.title}`,
          relatedTo: {
            type: 'event',
            id: event._id
          }
        });
      }
    }
  }

  res.status(201).json({
    success: true,
    data: event
  });
});

// @desc    Atualizar evento
// @route   PUT /api/events/:id
// @access  Private
export const updateEvent = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  let event = await Event.findById(req.params.id);

  if (!event) {
    return next(new ErrorResponse(`Evento não encontrado com id ${req.params.id}`, 404));
  }

  // Verificar se o usuário é o criador do evento
  if (event.creator.toString() !== req.user.id && req.user.role !== 'admin') {
    return next(new ErrorResponse(`Usuário ${req.user.id} não está autorizado a atualizar este evento`, 401));
  }

  event = await Event.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true
  });

  // Notificar participantes sobre a atualização
  for (const attendeeId of event.attendees) {
    if (attendeeId.toString() !== req.user.id) {
      await Notification.create({
        recipient: attendeeId,
        type: 'event',
        content: `Evento atualizado: ${event.title}`,
        relatedTo: {
          type: 'event',
          id: event._id
        }
      });
    }
  }

  res.status(200).json({
    success: true,
    data: event
  });
});

// @desc    Excluir evento
// @route   DELETE /api/events/:id
// @access  Private
export const deleteEvent = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const event = await Event.findById(req.params.id);

  if (!event) {
    return next(new ErrorResponse(`Evento não encontrado com id ${req.params.id}`, 404));
  }

  // Verificar se o usuário é o criador do evento
  if (event.creator.toString() !== req.user.id && req.user.role !== 'admin') {
    return next(new ErrorResponse(`Usuário ${req.user.id} não está autorizado a excluir este evento`, 401));
  }

  // Notificar participantes sobre o cancelamento
  for (const attendeeId of event.attendees) {
    if (attendeeId.toString() !== req.user.id) {
      await Notification.create({
        recipient: attendeeId,
        type: 'event',
        content: `Evento cancelado: ${event.title}`,
        relatedTo: {
          type: 'event',
          id: event._id
        }
      });
    }
  }

  await event.remove();

  res.status(200).json({
    success: true,
    data: {}
  });
});

// @desc    Confirmar presença em evento
// @route   POST /api/events/:id/attend
// @access  Private
export const attendEvent = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const event = await Event.findById(req.params.id);

  if (!event) {
    return next(new ErrorResponse(`Evento não encontrado com id ${req.params.id}`, 404));
  }

  // Verificar se o usuário já confirmou presença
  if (event.attendees.includes(req.user.id)) {
    return next(new ErrorResponse(`Usuário já confirmou presença neste evento`, 400));
  }

  // Adicionar usuário à lista de participantes
  event.attendees.push(req.user.id);
  await event.save();

  // Notificar criador do evento
  if (event.creator.toString() !== req.user.id) {
    await Notification.create({
      recipient: event.creator,
      type: 'event',
      content: `${req.user.name} confirmou presença no evento: ${event.title}`,
      relatedTo: {
        type: 'event',
        id: event._id
      }
    });
  }

  res.status(200).json({
    success: true,
    data: event
  });
});

// @desc    Cancelar presença em evento
// @route   DELETE /api/events/:id/attend
// @access  Private
export const unattendEvent = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const event = await Event.findById(req.params.id);

  if (!event) {
    return next(new ErrorResponse(`Evento não encontrado com id ${req.params.id}`, 404));
  }

  // Verificar se o usuário confirmou presença
  if (!event.attendees.includes(req.user.id)) {
    return next(new ErrorResponse(`Usuário não confirmou presença neste evento`, 400));
  }

  // Remover usuário da lista de participantes
  event.attendees = event.attendees.filter(
    (attendee) => attendee.toString() !== req.user.id
  );
  await event.save();

  // Notificar criador do evento
  if (event.creator.toString() !== req.user.id) {
    await Notification.create({
      recipient: event.creator,
      type: 'event',
      content: `${req.user.name} cancelou presença no evento: ${event.title}`,
      relatedTo: {
        type: 'event',
        id: event._id
      }
    });
  }

  res.status(200).json({
    success: true,
    data: event
  });
});

// @desc    Obter calendário de eventos
// @route   GET /api/events/calendar
// @access  Private
export const getCalendar = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  // Obter eventos do usuário (criados ou confirmados)
  const events = await Event.find({
    $or: [
      { creator: req.user.id },
      { attendees: req.user.id }
    ]
  }).sort({ startDate: 1 });

  // Agrupar eventos por mês/ano
  const calendar = {};
  
  for (const event of events) {
    const date = new Date(event.startDate);
    const yearMonth = `${date.getFullYear()}-${date.getMonth() + 1}`;
    
    if (!calendar[yearMonth]) {
      calendar[yearMonth] = [];
    }
    
    calendar[yearMonth].push(event);
  }

  res.status(200).json({
    success: true,
    data: calendar
  });
});