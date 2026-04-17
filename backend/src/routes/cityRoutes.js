const express = require('express');
const router = express.Router();
const { City, Department, Complaint, User } = require('../models');
const { Op, QueryTypes, fn, col, literal } = require('sequelize');
const { authenticate, authorize } = require('../middlewares/auth');

// Rota pública para cadastro de cidadãos
router.get('/public', async (req, res) => {
  try {
    const cities = await City.findAll({
      where: { is_active: true },
      attributes: ['id', 'name', 'state'],
      order: [['name', 'ASC']]
    });
    return res.status(200).json({ success: true, cities });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Erro interno do servidor' });
  }
});

// Ranking público das cidades por taxa de resolução
router.get('/ranking', async (req, res) => {
  try {

    const cities = await City.findAll({
      where: { is_active: true },
      attributes: ['id', 'name', 'state'],
      order: [['name', 'ASC']]
    });

    const ranking = await Promise.all(cities.map(async (city) => {
      const total = await Complaint.count({
        where: {
          city_id: city.id,
          status: { [Op.notIn]: ['pending', 'rejected'] }
        }
      });

      const resolved = await Complaint.count({
        where: {
          city_id: city.id,
          status: { [Op.in]: ['resolved', 'closed'] }
        }
      });

      return {
        id: city.id,
        name: city.name,
        state: city.state,
        total_complaints: total,
        resolved_complaints: resolved,
        resolution_rate: total > 0 ? parseFloat(((resolved / total) * 100).toFixed(1)) : 0
      };
    }));

    ranking.sort((a, b) => {
      if (b.resolution_rate !== a.resolution_rate) return b.resolution_rate - a.resolution_rate;
      return b.resolved_complaints - a.resolved_complaints;
    });

    return res.status(200).json({ success: true, ranking });
  } catch (error) {
    console.error('Erro no ranking:', error);
    return res.status(500).json({ success: false, message: 'Erro interno do servidor' });
  }
});

// Listar todas as cidades ativas
router.get('/', authenticate, async (req, res) => {
  try {
    const where = {};

    if (req.user && req.user.city_id && req.user.role === 'citizen') {
      where.id = req.user.city_id;
    }

    const cities = await City.findAll({
      where,
      attributes: ['id', 'name', 'state', 'logo_url', 'is_active', 'mayor_name', 'contact_email', 'contact_phone', 'ibge_code', 'city_type', 'createdAt'],
      order: [['name', 'ASC']]
    });

    return res.status(200).json({ success: true, cities });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Erro interno do servidor' });
  }
});

// Detalhes de uma cidade (público)
router.get('/:id', async (req, res) => {
  try {
    const city = await City.findByPk(req.params.id, {
      include: [
        {
          association: 'departments',
          where: { is_active: true },
          required: false,
          attributes: ['id', 'name', 'description']
        }
      ]
    });

    if (!city || !city.is_active) {
      return res.status(404).json({ success: false, message: 'Cidade não encontrada' });
    }

    return res.status(200).json({ success: true, city });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Erro interno do servidor' });
  }
});

// Criar cidade (apenas admin)
router.post('/', authenticate, authorize('admin'), async (req, res) => {
  try {
    const city = await City.create(req.body);
    return res.status(201).json({ success: true, message: 'Cidade cadastrada com sucesso!', city });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Erro interno do servidor' });
  }
});

// Ativar/desativar cidade (apenas admin)
router.put('/:id/toggle', authenticate, authorize('admin'), async (req, res) => {
  try {
    const city = await City.findByPk(req.params.id);
    if (!city) {
      return res.status(404).json({ success: false, message: 'Cidade não encontrada' });
    }

    await city.update({ is_active: !city.is_active });

    return res.status(200).json({
      success: true,
      message: `Cidade ${city.is_active ? 'ativada' : 'desativada'} com sucesso!`,
      city
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Erro interno do servidor' });
  }
});

// Atualizar cidade (apenas admin)
router.put('/:id', authenticate, authorize('admin'), async (req, res) => {
  try {
    const city = await City.findByPk(req.params.id);
    if (!city) {
      return res.status(404).json({ success: false, message: 'Cidade não encontrada' });
    }

    await city.update(req.body);

    return res.status(200).json({ success: true, message: 'Cidade atualizada com sucesso!', city });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Erro interno do servidor' });
  }
});

// Listar departamentos de uma cidade (público)
router.get('/:id/departments', async (req, res) => {
  try {
    const departments = await Department.findAll({
      where: { city_id: req.params.id, is_active: true },
      attributes: ['id', 'name', 'description', 'responsible_name', 'responsible_email', 'responsible_whatsapp', 'total_complaints', 'resolved_complaints']
    });

    const result = await Promise.all(departments.map(async (d) => {
      const plain = d.toJSON();
      const secretary = await User.findOne({
        where: { department_id: plain.id, role: 'secretary', is_active: true },
        attributes: ['id', 'name', 'email', 'whatsapp']
      });
      return {
        ...plain,
        responsible_email: secretary?.email || plain.responsible_email || '',
        responsible_whatsapp: secretary?.whatsapp || plain.responsible_whatsapp || '',
        responsible_name: secretary?.name || plain.responsible_name || '',
      };
    }));

    return res.status(200).json({ success: true, departments: result });
  } catch (error) {
    console.error('Erro ao listar departamentos:', error);
    return res.status(500).json({ success: false, message: 'Erro interno do servidor' });
  }
});

// Dashboard do prefeito (mapa)
router.get('/:id/dashboard', authenticate, authorize('mayor', 'admin'), async (req, res) => {
  try {
    const city_id = req.params.id;

    const city = await City.findByPk(city_id, {
      attributes: ['id', 'name', 'latitude', 'longitude', 'city_type']
    });


    const totalComplaints = await Complaint.count({
      where: { city_id, status: { [Op.notIn]: ['pending', 'rejected'] } }
    });
    const resolvedComplaints = await Complaint.count({
      where: { city_id, status: { [Op.in]: ['resolved', 'closed'] } }
    });
    const inProgressComplaints = await Complaint.count({ where: { city_id, status: 'in_progress' } });
    const pendingComplaints = await Complaint.count({ where: { city_id, status: 'validated' } });

    const departments = await Department.findAll({
      where: { city_id, is_active: true },
      attributes: ['id', 'name', 'total_complaints', 'resolved_complaints']
    });

    // Recalcula stats reais por departamento (inclui validated)
    const deptStatsLive = await Promise.all(departments.map(async (dept) => {
      const dTotal = await Complaint.count({
        where: { city_id, department_id: dept.id, status: { [Op.notIn]: ['pending', 'rejected'] } }
      });
      const dResolved = await Complaint.count({
        where: { city_id, department_id: dept.id, status: { [Op.in]: ['resolved', 'closed'] } }
      });
      return {
        id: dept.id,
        name: dept.name,
        total_complaints: dTotal,
        resolved_complaints: dResolved
      };
    }));

    const complaintsOnMap = await Complaint.findAll({
      where: {
        city_id,
        is_public: true,
        latitude: { [Op.ne]: null },
        longitude: { [Op.ne]: null }
      },
      attributes: ['id', 'protocol', 'status', 'latitude', 'longitude', 'category', 'title', 'description', 'images', 'createdAt'],
      include: [
        {
          association: 'department',
          attributes: ['id', 'name'],
          required: false
        }
      ]
    });

    return res.status(200).json({
      success: true,
      dashboard: {
        stats: {
          total: totalComplaints,
          resolved: resolvedComplaints,
          in_progress: inProgressComplaints,
          pending: pendingComplaints,
          resolution_rate: totalComplaints > 0
            ? ((resolvedComplaints / totalComplaints) * 100).toFixed(1)
            : 0
        },
        city: {
          id: city?.id,
          name: city?.name,
          latitude: city?.latitude ? parseFloat(city.latitude) : null,
          longitude: city?.longitude ? parseFloat(city.longitude) : null,
          city_type: city?.city_type || 'prefeitura',
        },
        departments: deptStatsLive,
        map_data: complaintsOnMap
      }
    });
  } catch (error) {
    console.error('Erro no dashboard:', error);
    return res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: error.message
    });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// DASHBOARD ANALÍTICO
// ─────────────────────────────────────────────────────────────────────────────
router.get('/:id/analytics', authenticate, authorize('mayor', 'admin'), async (req, res) => {
  try {
    const city_id = req.params.id;

    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const complaintsByMonth = await Complaint.findAll({
      where: { city_id, createdAt: { [Op.gte]: sixMonthsAgo } },
      attributes: [
        [fn('DATE_TRUNC', 'month', col('createdAt')), 'month'],
        [fn('COUNT', col('id')), 'total'],
        [fn('SUM', literal("CASE WHEN status IN ('resolved','closed') THEN 1 ELSE 0 END")), 'resolved']
      ],
      group: [fn('DATE_TRUNC', 'month', col('createdAt'))],
      order: [[fn('DATE_TRUNC', 'month', col('createdAt')), 'ASC']],
      raw: true
    });

    const depts = await Department.findAll({
      where: { city_id, is_active: true },
      attributes: ['id', 'name']
    });

    const departmentStats = await Promise.all(depts.map(async (dept) => {
      const total = await Complaint.count({ where: { city_id, department_id: dept.id } });
      const resolved = await Complaint.count({
        where: { city_id, department_id: dept.id, status: { [Op.in]: ['resolved', 'closed'] } }
      });
      const in_progress = await Complaint.count({
        where: { city_id, department_id: dept.id, status: 'in_progress' }
      });
      const avgResult = await Complaint.sequelize.query(
        `SELECT ROUND(AVG(rating)::numeric, 1) as avg
         FROM complaint_ratings
         WHERE complaint_id IN (
           SELECT id FROM complaints WHERE city_id = :city_id AND department_id = :dept_id
         )`,
        { replacements: { city_id, dept_id: dept.id }, type: QueryTypes.SELECT }
      );
      return {
        id: dept.id,
        name: dept.name,
        total,
        resolved,
        in_progress,
        resolution_rate: total > 0 ? parseFloat(((resolved / total) * 100).toFixed(1)) : 0,
        avg_rating: avgResult[0]?.avg ? parseFloat(avgResult[0].avg) : null
      };
    }));

    const heatmapData = await Complaint.findAll({
      where: {
        city_id,
        latitude: { [Op.ne]: null },
        longitude: { [Op.ne]: null }
      },
      attributes: ['id', 'latitude', 'longitude', 'status'],
      raw: true
    });

    const ratingStats = await Complaint.sequelize.query(
      `SELECT
        COUNT(*)::int                                             AS total,
        ROUND(AVG(rating)::numeric, 1)                          AS average,
        SUM(CASE WHEN rating = 5 THEN 1 ELSE 0 END)::int        AS five_stars,
        SUM(CASE WHEN rating = 4 THEN 1 ELSE 0 END)::int        AS four_stars,
        SUM(CASE WHEN rating = 3 THEN 1 ELSE 0 END)::int        AS three_stars,
        SUM(CASE WHEN rating = 2 THEN 1 ELSE 0 END)::int        AS two_stars,
        SUM(CASE WHEN rating = 1 THEN 1 ELSE 0 END)::int        AS one_star
       FROM complaint_ratings cr
       JOIN complaints c ON c.id = cr.complaint_id
       WHERE c.city_id = :city_id`,
      { replacements: { city_id }, type: QueryTypes.SELECT }
    );

    const topCategories = await Complaint.findAll({
      where: { city_id },
      attributes: ['category', [fn('COUNT', col('id')), 'total']],
      group: ['category'],
      order: [[fn('COUNT', col('id')), 'DESC']],
      limit: 5,
      raw: true
    });

    return res.status(200).json({
      success: true,
      analytics: {
        complaints_by_month: complaintsByMonth,
        department_stats: departmentStats,
        heatmap_data: heatmapData,
        satisfaction: ratingStats[0] || {
          total: 0, average: null,
          five_stars: 0, four_stars: 0, three_stars: 0, two_stars: 0, one_star: 0
        },
        top_categories: topCategories
      }
    });
  } catch (error) {
    console.error('Erro no analytics:', error);
    return res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: error.message
    });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// CÂMARA — lista de vereadores da cidade
// ─────────────────────────────────────────────────────────────────────────────
router.get('/:id/councilmen', authenticate, async (req, res) => {
  try {
    const councilmen = await User.findAll({
      where: { city_id: req.params.id, role: 'councilman', is_active: true },
      attributes: ['id', 'name', 'avatar_url', 'email', 'whatsapp'],
      order: [['name', 'ASC']]
    });
    return res.status(200).json({ success: true, councilmen });
  } catch (error) {
    console.error('Erro ao listar vereadores:', error);
    return res.status(500).json({ success: false, message: 'Erro interno do servidor' });
  }
});

// CÂMARA — ranking de vereadores por taxa de resolução
router.get('/:id/councilmen/ranking', authenticate, async (req, res) => {
  try {
    const councilmen = await User.findAll({
      where: { city_id: req.params.id, role: 'councilman', is_active: true },
      attributes: ['id', 'name', 'avatar_url'],
      order: [['name', 'ASC']]
    });

    const ranking = await Promise.all(councilmen.map(async (c) => {
      const total = await Complaint.count({
        where: { councilman_id: c.id }
      });
      const resolved = await Complaint.count({
        where: { councilman_id: c.id, status: { [Op.in]: ['resolved', 'closed'] } }
      });
      return {
        id: c.id,
        name: c.name,
        avatar_url: c.avatar_url,
        total_complaints: total,
        resolved_complaints: resolved,
        resolution_rate: total > 0 ? parseFloat(((resolved / total) * 100).toFixed(1)) : 0
      };
    }));

    ranking.sort((a, b) => {
      if (b.resolution_rate !== a.resolution_rate) return b.resolution_rate - a.resolution_rate;
      return b.resolved_complaints - a.resolved_complaints;
    });

    return res.status(200).json({ success: true, ranking });
  } catch (error) {
    console.error('Erro no ranking de vereadores:', error);
    return res.status(500).json({ success: false, message: 'Erro interno do servidor' });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// CÂMARA — dashboard do vereador (filtrado por councilman_id = req.user.id)
// ─────────────────────────────────────────────────────────────────────────────
router.get('/:id/councilman-dashboard', authenticate, authorize('councilman', 'admin'), async (req, res) => {
  try {
    const city_id = req.params.id;
    const councilman_id = req.user.id;

    const city = await City.findByPk(city_id, {
      attributes: ['id', 'name', 'latitude', 'longitude']
    });

    const baseWhere = { city_id, councilman_id };
    const resolvedStatuses = { [Op.in]: ['resolved', 'closed'] };

    const [total, resolved, in_progress, pending] = await Promise.all([
      Complaint.count({ where: { ...baseWhere, status: { [Op.notIn]: ['pending', 'rejected'] } } }),
      Complaint.count({ where: { ...baseWhere, status: resolvedStatuses } }),
      Complaint.count({ where: { ...baseWhere, status: 'in_progress' } }),
      Complaint.count({ where: { ...baseWhere, status: 'validated' } }),
    ]);

    const complaints = await Complaint.findAll({
      where: baseWhere,
      order: [['createdAt', 'DESC']],
      limit: 100,
      include: [
        { association: 'citizen', attributes: ['id', 'name', 'email'], required: false },
        { association: 'city',    attributes: ['id', 'name'],           required: false },
      ]
    });

    const map_data = complaints.filter(c => c.latitude && c.longitude).map(c => ({
      id: c.id, protocol: c.protocol, status: c.status,
      latitude: c.latitude, longitude: c.longitude,
      category: c.category, title: c.title,
      description: c.description, images: c.images,
      createdAt: c.createdAt,
    }));

    return res.status(200).json({
      success: true,
      dashboard: {
        stats: {
          total, resolved, in_progress, pending,
          resolution_rate: total > 0 ? ((resolved / total) * 100).toFixed(1) : 0
        },
        city: {
          id: city?.id, name: city?.name,
          latitude:  city?.latitude  ? parseFloat(city.latitude)  : null,
          longitude: city?.longitude ? parseFloat(city.longitude) : null,
        },
        complaints: complaints.map(c => c.toJSON()),
        map_data,
      }
    });
  } catch (error) {
    console.error('Erro no dashboard do vereador:', error);
    return res.status(500).json({ success: false, message: 'Erro interno do servidor', error: error.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// AVALIAÇÃO — cidadão avalia após resolução
// ─────────────────────────────────────────────────────────────────────────────
router.post('/:id/rate', authenticate, async (req, res) => {
  try {
    const { complaint_id, rating, comment } = req.body;

    if (!complaint_id || !rating || rating < 1 || rating > 5) {
      return res.status(400).json({ success: false, message: 'Rating deve ser entre 1 e 5.' });
    }

    const complaint = await Complaint.findOne({
      where: { id: complaint_id, city_id: req.params.id }
    });

    if (!complaint) {
      return res.status(404).json({ success: false, message: 'Reclamação não encontrada.' });
    }

    const ownerId = complaint.citizen_id || complaint.user_id;
    // Só bloqueia se tiver ownerId definido e for diferente
    if (ownerId && String(ownerId) !== String(req.user.id)) {
      return res.status(403).json({ success: false, message: 'Você não pode avaliar esta reclamação.' });
    }

    if (!['resolved', 'closed'].includes(complaint.status)) {
      return res.status(400).json({ success: false, message: 'Só é possível avaliar reclamações resolvidas.' });
    }

    // Garantir que a tabela existe
    await Complaint.sequelize.query(`
      CREATE TABLE IF NOT EXISTS complaint_ratings (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        complaint_id UUID NOT NULL,
        citizen_id UUID NOT NULL,
        rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
        comment TEXT,
        "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `, { type: QueryTypes.RAW });

    // DELETE + INSERT para evitar problema de constraint ausente
    await Complaint.sequelize.query(
      `DELETE FROM complaint_ratings WHERE complaint_id = :complaint_id`,
      { replacements: { complaint_id }, type: QueryTypes.DELETE }
    );

    await Complaint.sequelize.query(
      `INSERT INTO complaint_ratings (id, complaint_id, citizen_id, rating, comment, "createdAt", "updatedAt")
       VALUES (gen_random_uuid(), :complaint_id, :citizen_id, :rating, :comment, NOW(), NOW())`,
      {
        replacements: {
          complaint_id,
          citizen_id: req.user.id,
          rating: parseInt(rating),
          comment: comment || null
        },
        type: QueryTypes.INSERT
      }
    );

    return res.status(200).json({ success: true, message: 'Avaliação registrada com sucesso!' });
  } catch (error) {
    console.error('Erro ao salvar avaliação:', error);
    return res.status(500).json({ success: false, message: 'Erro interno do servidor', error: error.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// ✅ NOVO: Buscar avaliação de uma reclamação específica (para o secretário)
// ─────────────────────────────────────────────────────────────────────────────
router.get('/:id/rating/:complaint_id', authenticate, authorize('secretary', 'mayor', 'admin'), async (req, res) => {
  try {
    const { complaint_id } = req.params;

    const result = await Complaint.sequelize.query(
      `SELECT cr.id, cr.rating, cr.comment, cr."createdAt"
       FROM complaint_ratings cr
       WHERE cr.complaint_id = :complaint_id
       LIMIT 1`,
      { replacements: { complaint_id }, type: QueryTypes.SELECT }
    );

    if (!result.length) {
      return res.status(200).json({ success: true, rating: null });
    }

    return res.status(200).json({ success: true, rating: result[0] });
  } catch (error) {
    console.error('Erro ao buscar avaliação:', error);
    return res.status(500).json({ success: false, message: 'Erro interno do servidor' });
  }
});

module.exports = router;