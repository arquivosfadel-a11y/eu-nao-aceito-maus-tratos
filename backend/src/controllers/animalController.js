const { Animal, User, City } = require('../models');
const { uploadMultipleImages } = require('../services/cloudinary');
const { Op } = require('sequelize');
const fs = require('fs');

const listAnimals = async (req, res) => {
  try {
    const { species, city_id, status = 'available', page = 1, limit = 20 } = req.query;

    const where = {};
    if (species) where.species = species;
    if (city_id) where.city_id = city_id;
    if (status) where.status = status;

    const offset = (parseInt(page) - 1) * parseInt(limit);

    const { count, rows } = await Animal.findAndCountAll({
      where,
      include: [
        { association: 'city', attributes: ['id', 'name', 'state'], required: false }
      ],
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset
    });

    return res.status(200).json({
      success: true,
      total: count,
      pages: Math.ceil(count / parseInt(limit)),
      current_page: parseInt(page),
      animals: rows
    });
  } catch (error) {
    console.error('Erro ao listar animais:', error);
    return res.status(500).json({ success: false, message: 'Erro interno do servidor' });
  }
};

const getAnimalById = async (req, res) => {
  try {
    const { id } = req.params;

    const animal = await Animal.findByPk(id, {
      include: [
        { association: 'city', attributes: ['id', 'name', 'state'], required: false },
        { association: 'registeredBy', attributes: ['id', 'name'], required: false }
      ]
    });

    if (!animal) {
      return res.status(404).json({ success: false, message: 'Animal não encontrado' });
    }

    return res.status(200).json({ success: true, animal });
  } catch (error) {
    console.error('Erro ao buscar animal:', error);
    return res.status(500).json({ success: false, message: 'Erro interno do servidor' });
  }
};

const createAnimal = async (req, res) => {
  try {
    const {
      name, species, breed, age, gender, description,
      city_id, city_name, contact_name, contact_phone, contact_whatsapp
    } = req.body;

    if (!name || !species) {
      return res.status(400).json({ success: false, message: 'Nome e espécie são obrigatórios.' });
    }

    let images = [];
    if (req.files && req.files.length > 0) {
      images = await uploadMultipleImages(req.files);
      req.files.forEach(file => { if (fs.existsSync(file.path)) fs.unlinkSync(file.path); });
    }

    const animal = await Animal.create({
      name, species, breed, age, gender, description,
      images,
      city_id: city_id || req.user.city_id,
      city_name,
      contact_name,
      contact_phone,
      contact_whatsapp,
      registered_by: req.user.id,
      status: 'available'
    });

    return res.status(201).json({
      success: true,
      message: 'Animal cadastrado para adoção com sucesso!',
      animal: { id: animal.id, name: animal.name, species: animal.species, status: animal.status }
    });
  } catch (error) {
    console.error('Erro ao cadastrar animal:', error);
    return res.status(500).json({ success: false, message: 'Erro interno do servidor' });
  }
};

const updateAnimal = async (req, res) => {
  try {
    const { id } = req.params;

    const animal = await Animal.findByPk(id);
    if (!animal) {
      return res.status(404).json({ success: false, message: 'Animal não encontrado' });
    }

    const isOwner = animal.registered_by === req.user.id;
    const isAdmin = req.user.role === 'admin';
    if (!isOwner && !isAdmin) {
      return res.status(403).json({ success: false, message: 'Você não tem permissão para editar este animal' });
    }

    const {
      name, species, breed, age, gender, description,
      city_id, city_name, contact_name, contact_phone, contact_whatsapp
    } = req.body;

    let images = animal.images;
    if (req.files && req.files.length > 0) {
      images = await uploadMultipleImages(req.files);
      req.files.forEach(file => { if (fs.existsSync(file.path)) fs.unlinkSync(file.path); });
    }

    await animal.update({
      name, species, breed, age, gender, description,
      images, city_id, city_name,
      contact_name, contact_phone, contact_whatsapp
    });

    return res.status(200).json({ success: true, message: 'Animal atualizado com sucesso!' });
  } catch (error) {
    console.error('Erro ao atualizar animal:', error);
    return res.status(500).json({ success: false, message: 'Erro interno do servidor' });
  }
};

const deleteAnimal = async (req, res) => {
  try {
    const { id } = req.params;

    const animal = await Animal.findByPk(id);
    if (!animal) {
      return res.status(404).json({ success: false, message: 'Animal não encontrado' });
    }

    const isOwner = animal.registered_by === req.user.id;
    const isAdmin = req.user.role === 'admin';
    if (!isOwner && !isAdmin) {
      return res.status(403).json({ success: false, message: 'Você não tem permissão para remover este animal' });
    }

    await animal.destroy();

    return res.status(200).json({ success: true, message: 'Animal removido com sucesso!' });
  } catch (error) {
    console.error('Erro ao remover animal:', error);
    return res.status(500).json({ success: false, message: 'Erro interno do servidor' });
  }
};

const updateAnimalStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!['available', 'adopted'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Status inválido. Use "available" ou "adopted".' });
    }

    const animal = await Animal.findByPk(id);
    if (!animal) {
      return res.status(404).json({ success: false, message: 'Animal não encontrado' });
    }

    const isOwner = animal.registered_by === req.user.id;
    const isAdmin = req.user.role === 'admin';
    if (!isOwner && !isAdmin) {
      return res.status(403).json({ success: false, message: 'Você não tem permissão para alterar o status deste animal' });
    }

    await animal.update({ status });

    return res.status(200).json({ success: true, message: `Status atualizado para "${status}".` });
  } catch (error) {
    console.error('Erro ao atualizar status do animal:', error);
    return res.status(500).json({ success: false, message: 'Erro interno do servidor' });
  }
};

module.exports = {
  listAnimals,
  getAnimalById,
  createAnimal,
  updateAnimal,
  deleteAnimal,
  updateAnimalStatus
};
