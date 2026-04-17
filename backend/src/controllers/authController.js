const jwt = require('jsonwebtoken');
const { User, City, ValidatorCity } = require('../models');
require('dotenv').config();

const generateToken = (id, role, city_id) => {
  return jwt.sign({ id, role, city_id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN
  });
};

const isValidCPF = (cpf) => {
  const cleaned = cpf.replace(/\D/g, '');
  if (cleaned.length !== 11) return false;
  if (/^(\d)\1{10}$/.test(cleaned)) return false;

  let sum = 0;
  for (let i = 0; i < 9; i++) sum += parseInt(cleaned[i]) * (10 - i);
  let rest = (sum * 10) % 11;
  if (rest === 10 || rest === 11) rest = 0;
  if (rest !== parseInt(cleaned[9])) return false;

  sum = 0;
  for (let i = 0; i < 10; i++) sum += parseInt(cleaned[i]) * (11 - i);
  rest = (sum * 10) % 11;
  if (rest === 10 || rest === 11) rest = 0;
  if (rest !== parseInt(cleaned[10])) return false;

  return true;
};

const getTwilioClient = () => {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  if (!accountSid || !authToken) throw new Error('Twilio não configurado.');
  return require('twilio')(accountSid, authToken);
};

const register = async (req, res) => {
  try {
    const { name, email, password, phone, cpf, city_id, city_name, whatsapp } = req.body;

    if (!cpf || !cpf.trim()) {
      return res.status(400).json({ success: false, message: 'CPF é obrigatório.' });
    }

    const cpfClean = cpf.replace(/\D/g, '');

    if (!isValidCPF(cpfClean)) {
      return res.status(400).json({ success: false, message: 'CPF inválido. Verifique o número digitado.' });
    }

    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'Email já cadastrado' });
    }

    const existingCpf = await User.findOne({ where: { cpf: cpfClean } });
    if (existingCpf) {
      return res.status(400).json({ success: false, message: 'CPF já cadastrado' });
    }

    if (city_id) {
      const city = await City.findByPk(city_id);
      if (!city || !city.is_active) {
        return res.status(400).json({ success: false, message: 'Cidade não encontrada ou não ativa na plataforma' });
      }
    }

    const user = await User.create({
      name, email, password, phone,
      cpf: cpfClean,
      city_id: city_id || null,
      city_name: city_name || null,
      whatsapp: whatsapp || phone,
      role: 'citizen',
      phone_verified: false
    });

    const token = generateToken(user.id, user.role, user.city_id);
    return res.status(201).json({
      success: true,
      message: 'Cadastro realizado com sucesso!',
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        city_id: user.city_id,
        city_name: user.city_name,
        phone_verified: false
      }
    });
  } catch (error) {
    console.error('Erro no registro:', error);
    return res.status(500).json({ success: false, message: 'Erro interno do servidor' });
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({
      where: { email },
      include: [{ association: 'city' }]
    });

    if (!user) {
      return res.status(401).json({ success: false, message: 'Email ou senha incorretos' });
    }

    if (!user.is_active) {
      return res.status(401).json({ success: false, message: 'Conta desativada, entre em contato com o suporte' });
    }

    const isPasswordValid = await user.checkPassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({ success: false, message: 'Email ou senha incorretos' });
    }

    await user.update({ last_login: new Date() });

    const token = generateToken(user.id, user.role, user.city_id);

    let validatorCities = [];
    if (user.role === 'validator') {
      const vcEntries = await ValidatorCity.findAll({
        where: { validator_id: user.id },
        include: [{ model: City, as: 'city', attributes: ['id', 'name', 'state'] }]
      });
      validatorCities = vcEntries.map(vc => vc.city).filter(Boolean);
    }

    if (user.role === 'citizen' && !user.phone_verified) {
      return res.status(200).json({
        success: true,
        phone_verification_required: true,
        message: 'Verificação de telefone necessária.',
        token,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          phone: user.phone,
          role: user.role,
          city_id: user.city_id,
          phone_verified: false
        }
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Login realizado com sucesso!',
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        city_id: user.city_id,
        city: user.city,
        avatar_url: user.avatar_url,
        whatsapp: user.whatsapp,
        phone_verified: user.phone_verified,
        validatorCities
      }
    });
  } catch (error) {
    console.error('Erro no login:', error);
    return res.status(500).json({ success: false, message: 'Erro interno do servidor' });
  }
};

const sendVerificationCode = async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id);
    if (!user) return res.status(404).json({ success: false, message: 'Usuário não encontrado.' });

    if (user.phone_verified) {
      return res.status(400).json({ success: false, message: 'Telefone já verificado.' });
    }

    if (!user.phone) {
      return res.status(400).json({ success: false, message: 'Nenhum telefone cadastrado.' });
    }

    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    await user.update({
      verification_code: code,
      verification_code_expires: expiresAt
    });

    const phoneRaw = user.phone.replace(/\D/g, '');
    const phoneE164 = phoneRaw.startsWith('55') ? `+${phoneRaw}` : `+55${phoneRaw}`;

    const client = getTwilioClient();
    await client.messages.create({
      body: `Seu código de verificação Participa Cidade: ${code}. Válido por 10 minutos.`,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: phoneE164
    });

    return res.status(200).json({
      success: true,
      message: `Código enviado para ${user.phone}`
    });
  } catch (error) {
    console.error('Erro ao enviar SMS:', error);
    return res.status(500).json({ success: false, message: 'Erro ao enviar SMS. Verifique o número cadastrado.' });
  }
};

const verifyPhone = async (req, res) => {
  try {
    const { code } = req.body;
    const user = await User.findByPk(req.user.id);

    if (!user) return res.status(404).json({ success: false, message: 'Usuário não encontrado.' });

    if (user.phone_verified) {
      return res.status(400).json({ success: false, message: 'Telefone já verificado.' });
    }

    if (!user.verification_code || !user.verification_code_expires) {
      return res.status(400).json({ success: false, message: 'Nenhum código enviado. Solicite um novo.' });
    }

    if (new Date() > new Date(user.verification_code_expires)) {
      return res.status(400).json({ success: false, message: 'Código expirado. Solicite um novo.' });
    }

    if (user.verification_code !== code.trim()) {
      return res.status(400).json({ success: false, message: 'Código incorreto. Tente novamente.' });
    }

    await user.update({
      phone_verified: true,
      verification_code: null,
      verification_code_expires: null
    });

    return res.status(200).json({
      success: true,
      message: 'Telefone verificado com sucesso!'
    });
  } catch (error) {
    console.error('Erro ao verificar código:', error);
    return res.status(500).json({ success: false, message: 'Erro interno do servidor' });
  }
};

const getProfile = async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id, {
      attributes: { exclude: ['password', 'verification_code', 'verification_code_expires'] },
      include: [{ association: 'city' }]
    });
    return res.status(200).json({ success: true, user });
  } catch (error) {
    console.error('Erro ao buscar perfil:', error);
    return res.status(500).json({ success: false, message: 'Erro interno do servidor' });
  }
};

const updateProfile = async (req, res) => {
  try {
    const { name, phone, whatsapp, avatar_url } = req.body;
    await User.update({ name, phone, whatsapp, avatar_url }, { where: { id: req.user.id } });
    return res.status(200).json({ success: true, message: 'Perfil atualizado com sucesso!' });
  } catch (error) {
    console.error('Erro ao atualizar perfil:', error);
    return res.status(500).json({ success: false, message: 'Erro interno do servidor' });
  }
};

const changePassword = async (req, res) => {
  try {
    const { current_password, new_password } = req.body;
    const user = await User.findByPk(req.user.id);
    const isValid = await user.checkPassword(current_password);

    if (!isValid) {
      return res.status(400).json({ success: false, message: 'Senha atual incorreta' });
    }

    await user.update({ password: new_password });
    return res.status(200).json({ success: true, message: 'Senha alterada com sucesso!' });
  } catch (error) {
    console.error('Erro ao alterar senha:', error);
    return res.status(500).json({ success: false, message: 'Erro interno do servidor' });
  }
};

// ✅ NOVO: Salva o push token do dispositivo
const savePushToken = async (req, res) => {
  try {
    const { push_token } = req.body;
    if (!push_token) {
      return res.status(400).json({ success: false, message: 'push_token é obrigatório.' });
    }
    await User.update({ push_token }, { where: { id: req.user.id } });
    return res.status(200).json({ success: true, message: 'Push token salvo com sucesso.' });
  } catch (error) {
    console.error('Erro ao salvar push token:', error);
    return res.status(500).json({ success: false, message: 'Erro interno do servidor' });
  }
};

module.exports = {
  register,
  login,
  getProfile,
  updateProfile,
  changePassword,
  sendVerificationCode,
  verifyPhone,
  savePushToken
};